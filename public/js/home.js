import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"

const db = firebase.firestore();
const auth = firebase.auth();

const projectionChart = document.getElementById('projectedBalance');
const balanceSummary = document.getElementById('balanceSummary');
const uid = 12;

let income, expense, transactions;

const handleFilterChange = (event) => {
  const now = new Date();
  let startDate = new Date();
  const endDate = new Date();
  const selectedValue = event.target.value;

  switch (selectedValue) {
    case "week":
      startDate.setUTCDate(now.getUTCDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      listTransactions(transactions);
      return;
  }

  const filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
  listTransactions(filteredTransactions);
};

const handleHistoryChange = (event) => {
  const selectedValue = event.target.value;
  let filteredTransactions;
  const now = new Date();
  const startDate = new Date();
  const endDate = now;

  switch (selectedValue) {
    case "week":
      startDate.setUTCDate(now.getUTCDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      filteredTransactions = transactions;
      break;
  }

  if (selectedValue !== "all") {
    filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
  }

  const balanceOverTimeData = process.genBalanceOverTime(filteredTransactions);
  plot.plotBalance(chart2, balanceOverTimeData);
};

const handleProjectedChange = (event) => {
  const selectedValue = event.target.value;
  let period;
  let projectedBalanceData;

  switch (selectedValue) {
    case "month":
      period = 2;
      break;
    case "year":
      period = 13;
      break;
    default:
      period = 61;
  }

  projectedBalanceData = process.genProjectedBalance(income, expense, 0, period);
  plot.plotProjection(chart1, projectedBalanceData, period);
};

const listTransactions = (transactions) => {
  const tableBody = document.querySelector("#transactionTable tbody");
  tableBody.innerHTML = "";

  transactions.forEach(transaction => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td style="color: ${transaction.category === "income" ? "red" : "blue"}">${transaction.amount}</td>`;
    tableBody.appendChild(row);
  });
};

const listItems = (items, tableId, color) => {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  tableBody.innerHTML = "";

  items.forEach(data => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${data.period}</td><td style="color: ${color}">${data.amount}</td>`;
    tableBody.appendChild(row);
  });
};

const initialize = async () => {
  try {
    income = process.sortIncome(await ref.access(uid, 'income'));
    expense = await ref.access(uid, 'expense');
    transactions = process.sortTransactions(await ref.access(uid, 'transaction'));

    listTransactions(transactions);
    listItems(income, 'incomeTable', 'red');
    listItems(expense, 'expenseTable', 'blue');

    document.getElementById("selectRangeHistory").addEventListener("change", handleHistoryChange);
    document.getElementById("selectRangeProjected").addEventListener("change", handleProjectedChange);
    document.getElementById("filterSelect").addEventListener("change", handleFilterChange);
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

const chart1 = new Chart(projectionChart, {
  type: 'line',
  data: {},
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
    devicePixelRatio: 2
  }
});

const chart2 = new Chart(balanceSummary, {
  type: 'line',
  data: {},
  options: {
    plugins: {
      title: {
        display: true,
        text: 'Balance Over Time',
        font: { size: 18 }
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
    devicePixelRatio: 2
  }
});

const test = async () => {
  await ref.addExpense(100, 2, uid);
  await ref.addIncome(50, 1, uid);
  await ref.addIncome(150, 4, uid);
  await ref.addIncome(1500, 12, uid);
  await ref.addTransaction(22, new Date(), "income", uid);

  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 28; j++) {
      await ref.addTransaction((i * j + 120) / 2, new Date(2024, i, j), "expense", uid);
      if ((j + i) % 12 === 0) {
        await ref.addTransaction(i * j * 1000, new Date(2024, i, j), "income", uid);
      }
    }
  }
};

initialize().then(() => {
  const projectedBalanceData = process.genProjectedBalance(income, expense, 0, 60);
  const balanceOverTimeData = process.genBalanceOverTime(transactions);

  plot.plotProjection(chart1, projectedBalanceData, 60);
  plot.plotBalance(chart2, balanceOverTimeData);
});
