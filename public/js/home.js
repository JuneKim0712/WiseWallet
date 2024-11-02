import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"

const db = firebase.firestore();
const auth = firebase.auth();

const projectionChart = document.getElementById('projectedBalance');
const balanceSummary = document.getElementById('balanceSummary');
const uid = 12;

const incomeCategories = [
  "Salary",
  "Freelance/Contract Work",
  "Investments",
  "Gifts",
  "Rental Income",
  "Business Income",
  "Others"
];

const expenseCategories = [
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Education",
  "Personal Care",
  "Clothing",
  "Savings & Investments",
  "Debt Repayment",
  "Miscellaneous"
];

// Transaction categories (combining income and expense categories)
const transactionCategories = [
  "Salary",
  "Freelance/Contract Work",
  "Investments",
  "Gifts",
  "Rental Income",
  "Business Income",
  "Others",
  "Housing",
  "Utilities",
  "Groceries",
  "Transportation",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Education",
  "Personal Care",
  "Clothing",
  "Savings & Investments",
  "Debt Repayment",
  "Miscellaneous"
];


let income, expense, transactions;

const applyFilters = () => {
  const searchValue = document.getElementById("searchInput").value;
  const selectedRange = document.getElementById("filterSelect").value;

  let filteredTransactions = process.applyFilterTransactions(transactions, selectedRange);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue);

  listTransactions(filteredTransactions);
};

const handleHistoryChange = async (event) => {
  let transaction = transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
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
  plot.plotBalance(balanceCharts, balanceOverTimeData);
};

const handleProjectedChange = async (event) => {
  let transactions = process.sortTransactions(await ref.access(uid, 'transaction'))
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
  plot.plotProjection(projectCharts, projectedBalanceData, period);
};

const listTransactions = (transactions) => {
  const tableBody = document.querySelector("#transactionTable tbody");
  tableBody.innerHTML = "";

  transactions.forEach(transaction => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td style="color: ${transaction.type === "income" ? "red" : "blue"}">${transaction.amount}</td>
      <td>${transaction.category}</td>`;
    tableBody.appendChild(row);
  });
};

const listItems = (items, tableId, color) => {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  tableBody.innerHTML = "";

  items.forEach(data => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${data.period}</td>
    <td style="color: ${color}">${data.amount}</td>
    <td>${data.category}</td>`;
    tableBody.appendChild(row);
  });
};

const sortOrder = {
  date: true,
  amount: true,
  category: true
};

const sortTransactions = (transactions, key, order) => {
  return transactions.sort((a, b) => {
    let aValue, bValue;

    if (key === "date") {
      // Sorting by date
      aValue = a.date.seconds;
      bValue = b.date.seconds;
    } else if (key === "amount") {
      // Sorting by amount (income/expenses)
      aValue = a.type === "income" ? a.amount : -a.amount;
      bValue = b.type === "income" ? b.amount : -b.amount;
    } else if (key === "category") {
      aValue = a.category.toLowerCase(); 
      bValue = b.category.toLowerCase();
      return order ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return order ? aValue - bValue : bValue - aValue;
  });
};


const addSortingHandlers = () => {
  const headers = document.querySelectorAll("#transactionTable th");
  headers.forEach((header, index) => {
    const key = header.textContent.toLowerCase();
    header.dataset.sortDirection = 'asc';

    if (index === 0) {
      header.innerHTML = `${key.charAt(0).toUpperCase() + key.slice(1)} &uarr;`;
    } else {
      header.innerHTML = key.charAt(0).toUpperCase() + key.slice(1);
    }

    header.addEventListener("click", () => {
      headers.forEach(h => {
        if (h !== header) {
          h.innerHTML = h.textContent.split(' ')[0];
          h.dataset.sortDirection = 'asc';
        }
      });

      const currentSortDirection = header.dataset.sortDirection;
      const newSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      header.dataset.sortDirection = newSortDirection;

      const indicator = newSortDirection === 'asc' ? '&uarr;' : '&darr;';
      header.innerHTML = `${key.charAt(0).toUpperCase() + key.slice(1)} ${indicator}`;

      const sortedTransactions = sortTransactions(transactions, key, newSortDirection === 'asc');
      listTransactions(sortedTransactions);
    });
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

    document.getElementById("searchInput").addEventListener("input", applyFilters);
    document.getElementById("selectRangeHistory").addEventListener("change", handleHistoryChange);
    document.getElementById("selectRangeProjected").addEventListener("change", handleProjectedChange);
    document.getElementById("filterSelect").addEventListener("change", applyFilters);
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

const projectCharts = new Chart(projectionChart, {
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

const balanceCharts = new Chart(balanceSummary, {
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
  
  await ref.addExpense(100, expenseCategories[0], 2, uid);
  await ref.addIncome(50, incomeCategories[1], 1, uid);
  await ref.addIncome(150, incomeCategories[2], 4, uid);
  await ref.addIncome(1500, incomeCategories[3], 12, uid);
  await ref.addTransaction(22, transactionCategories[4], new Date(), "income", uid);

  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 28; j++) {
      await ref.addTransaction((i * j + 120) / 2, transactionCategories[i%5], new Date(2024, i, j), "expense", uid);
      if ((j + i) % 12 === 0) {
        await ref.addTransaction(i * j * 1000, transactionCategories[i%3], new Date(2024, i, j),"income", uid);
      }
    }
  }
};

initialize().then(() => {
  const projectedBalanceData = process.genProjectedBalance(income, expense, 0, 60);
  const balanceOverTimeData = process.genBalanceOverTime(transactions);

  plot.plotProjection(projectCharts, projectedBalanceData, 60);
  plot.plotBalance(balanceCharts, balanceOverTimeData);
});
