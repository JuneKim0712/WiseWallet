import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"

const db = firebase.firestore();
const auth = firebase.auth();
let uid;

const balanceSummary = document.getElementById('balanceSummary');



firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
  } else {
  }
});

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

const transactionCategories = [
  "Salary",
  "Freelance/Contract",
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


const listTransactions = () => {
  const tableBody = document.querySelector("#transactionTable tbody");
  const searchValue = document.getElementById("searchInput").value;
  const selectedRange = document.getElementById("filterSelect").value;
  tableBody.innerHTML = "";

  let filteredTransactions = process.applyFilterTransactions(transactions, selectedRange);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue).slice(0, 10);

  // Transactions will be listed here
  filteredTransactions.forEach((transaction, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-4 border-b border-blue-gray-50">${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td class="p-4 border-b border-blue-gray-50" style="color: ${transaction.type === "income" ? "red" : "blue"}">${transaction.amount}</td>
      <td class="p-4 border-b border-blue-gray-50">${transaction.category}</td>
      <td class="p-4 border-b border-blue-gray-50">
      <button class="edit-btn px-4 py-2 text-white bg-blue-500 rounded-md transition-all duration-200 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300">
      Edit
      </button>
      <button class="delete-btn px-4 py-2 text-white bg-red-500 rounded-md transition-all duration-200 hover:bg-red-600 focus:ring-2 focus:ring-red-300 ml-2" data-id="${transaction.id}">
      Delete
      </button>
</td>

    `;
    tableBody.appendChild(row);
  });

  const modal = document.getElementById("deleteModal");
  const cancelBtn = document.getElementById("cancelDelete");
  const confirmBtn = document.getElementById("confirmDelete");
  const closeBtn = document.getElementById("closeBtn");
  let transactionIdToDelete;

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      transactionIdToDelete = event.target.dataset.id;
      modal.classList.remove("hidden");
    });
  });

  cancelBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    transactionIdToDelete = null;
  });
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    transactionIdToDelete = null;
  });

  confirmBtn.addEventListener("click", async () => {
    if (transactionIdToDelete) {
      try {
        await ref.deleteDoc("transaction", transactionIdToDelete, uid);
        transactions = transactions.filter((t) => t.id !== transactionIdToDelete);
        listTransactions();
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
      modal.classList.add("hidden");
    }
  });
};




const sortTransactions = (transactions, key, order) => {
  return transactions.sort((a, b) => {
    let aValue, bValue;

    if (key === "date") {
      aValue = a.date.seconds;
      bValue = b.date.seconds;
    } else if (key === "amount") {
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
  let headers = Array.from(document.querySelectorAll("#transactionTable th"))
    .filter(th => th.textContent.trim() !== "Action");
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
    income = process.sortIncome(await ref.access(uid, 'income'));
    expense = process.sortIncome(await ref.access(uid, 'expense')).reverse();
    transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
    transactions = sortTransactions(transactions, "date", true)

    listTransactions(transactions);

    document.getElementById("searchInput").addEventListener("input", listTransactions);
    document.getElementById("selectRangeHistory").addEventListener("change", handleHistoryChange);
    document.getElementById("filterSelect").addEventListener("change", listTransactions);
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();
    //test()
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};





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



initialize().then(() => {
  const balanceOverTimeData = process.genBalanceOverTime(transactions);
  plot.plotBalance(balanceCharts, balanceOverTimeData);
});

const test = async () => {

  await ref.addExpense(100, expenseCategories[0], 2, uid);
  await ref.addIncome(50, incomeCategories[1], 1, uid);
  await ref.addIncome(150, incomeCategories[2], 4, uid);
  await ref.addIncome(1500, incomeCategories[3], 12, uid);
  await ref.addTransaction(22, transactionCategories[4], new Date(), "income", uid);

  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 28; j++) {
      await ref.addTransaction((i * j + 120) / 2, transactionCategories[i % 5], new Date(2024, i, j), "expense", uid);
      if ((j + i) % 12 === 0) {
        await ref.addTransaction(i * j * 1000, transactionCategories[i % 3], new Date(2024, i, j), "income", uid);
      }
    }
  }
};