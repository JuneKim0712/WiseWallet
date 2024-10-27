import * as process from "./preprocess.js"
import * as ref from "./db.js"
const db = firebase.firestore()
const auth = firebase.auth()
const projectionChart = document.getElementById('projectedBalance');
const balanceSummary = document.getElementById('balanceSummary');
const uid = 12;

let projectChart, balanceChart;

const test = async () => {
  ref.addExpense(100, 2, uid)
  ref.addIncome(50, 1, uid)
  ref.addIncome(150, 4, uid)
  ref.addIncome(1500, 12, uid)
  ref.addTransaction(22, new Date(), "income", uid)
  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 28; j++) {
      ref.addTransaction((i * j + 120) / 2, new Date(2024, i, j), "expense", uid)
      if ((j + i) % 12 == 0) {
        ref.addTransaction(i * j * 1000, new Date(2024, i, j), "income", uid)
      }
    }
  }
}

const plotProjection = (chart, data, period) => {
  if (projectChart) {
    projectChart.destroy()
  }
  return new Chart(chart, {
    type: 'line',
    data: {
      labels: Array.from({ length: period }, (_, index) => index),
      datasets: [{
        label: 'Balance',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Balance Projected Over Time',
          font: { size: 18 }
        }
      },
      scales: {
        x: {
          type: 'category',
          title: { display: true, text: 'Month passed', font: { size: 14 } }
        },
        y: {
          title: { display: true, text: 'Balance ($)', font: { size: 14 } }
        }
      },
      devicePixelRatio: 3
    }
  });
}

const plotBalance = (chart, data) => {
  if (balanceChart) {
    balanceChart.destroy()
  }
  return new Chart(chart, {
    type: 'line',
    data: {
      labels: data.map(item => new Date(item.date.seconds * 1000)
        .toISOString().split('T')[0]),
      datasets: [{
        label: 'Balance',
        data: data.map(entry => entry.amount),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        borderWidth: 2,
        tension: 0.1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Balance Over Time',
          font: { size: 18 },
        }
      },
      scales: {
        x: {
          type: 'category',
          title: { display: true, text: 'Date', font: { size: 14 } }
        },
        y: {
          title: { display: true, text: 'Balance ($)', font: { size: 14 } }
        }
      },
      devicePixelRatio: 3
    }
  });
}

const handleFilterChange = (event) => {
  const selectedValue = event.target.value;
  let filteredTransactions;

  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (selectedValue) {
    case "all":
      filteredTransactions = transactions;
      break;

    case "week":
      startDate.setUTCDate(now.getUTCDate() - 7);
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    case "month":
      startDate.setMonth(now.getMonth() - 1);
      startDate.setDate(now.getDate());
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    case "year":
      startDate.setFullYear(now.getFullYear() - 1)
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    default:
      filteredTransactions = transactions;
      break;
  }

  listTransactions(filteredTransactions);
};

const handleHistoryChange = (event) => {
  const selectedValue = event.target.value;
  let filteredTransactions;

  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (selectedValue) {
    case "all":
      filteredTransactions = transactions;
      break;

    case "week":
      startDate.setUTCDate(now.getUTCDate() - 7);
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    case "month":
      startDate.setMonth(now.getMonth() - 1);
      startDate.setDate(now.getDate());
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    case "year":
      startDate.setFullYear(now.getFullYear() - 1)
      filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
      break;

    default:
      filteredTransactions = transactions;
      break;
  }
  const summary = process.genBalanceOverTime(filteredTransactions)
  balanceChart = plotBalance(balanceSummary, summary);
};

const handleProjectedChange = (event) => {
  const selectedValue = event.target.value;
  let period;
  let projectedBalanceData;

  switch (selectedValue) {
    case "month":
      projectedBalanceData = process.genProjectedBalance(income, expense, 0, 2)
      period = 2
      break;

    case "year":
      projectedBalanceData = process.genProjectedBalance(income, expense, 0, 13)
      period = 13
      break;

    default:
      projectedBalanceData = process.genProjectedBalance(income, expense, 0, 61);
      period = 61
      break;
  }
  projectChart = plotProjection(projectionChart, projectedBalanceData, period);
};

const listTransactions = (transactions) => {
  const tableBody = document.querySelector("#transactionTable tbody");
  tableBody.innerHTML = "";

  transactions.forEach(transaction => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");

    dateCell.textContent = new Date(transaction.date.seconds * 1000)
      .toISOString().split('T')[0];
    row.appendChild(dateCell);

    const amountCell = document.createElement("td");

    amountCell.textContent = transaction.amount;
    amountCell.style.color = transaction.category === "income" ? "red" : "blue";
    row.appendChild(amountCell);

    tableBody.appendChild(row);
  });
};

const listIncome = (income) => {
  const tableBody = document.querySelector("#incomeTable tbody");
  tableBody.innerHTML = "";

  income.forEach(data => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");

    dateCell.textContent = data.period;
    row.appendChild(dateCell);

    const amountCell = document.createElement("td");

    amountCell.textContent = data.amount;
    amountCell.style.color = "red";
    row.appendChild(amountCell);

    tableBody.appendChild(row);
  });
};

const listExpense = (expense) => {
  const tableBody = document.querySelector("#expenseTable tbody");
  tableBody.innerHTML = "";

  expense.forEach(data => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");

    dateCell.textContent = data.period;
    row.appendChild(dateCell);

    const amountCell = document.createElement("td");

    amountCell.textContent = data.amount;
    amountCell.style.color = "blue";
    row.appendChild(amountCell);

    tableBody.appendChild(row);
  });
};

const initialize = () => {
  listTransactions(transactions);
  listIncome(income)
  listExpense(expense)
  document.getElementById("selectRangeHistory").addEventListener("change", handleHistoryChange);
  document.getElementById("selectRangeProjected").addEventListener("change", handleProjectedChange);
  document.getElementById("filterSelect").addEventListener("change", handleFilterChange);
  document.getElementById("signOutBtn").onclick = () => auth.signOut().then(window.location.href = '/index.html')
}


let expense = await ref.access(uid, 'expense')
let income = process.sortIncome(await ref.access(uid, 'income'))
let transactions = process.sortTransactions(await ref.access(uid, 'transaction'))

const projectedBalanceData = process.genProjectedBalance(income, expense, 0, 60)
const balanceOverTimeData = process.genBalanceOverTime(transactions);

projectChart = plotProjection(projectionChart, projectedBalanceData, 60)
balanceChart = plotBalance(balanceSummary, balanceOverTimeData);

initialize()