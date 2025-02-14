import * as process from "./preprocess.js";
import * as ref from "./db.js";

const db = firebase.firestore();
const auth = firebase.auth();
let uid;

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

const listTransactions = () => {
  const tableBody = document.querySelector("#transactionTable tbody");
  const searchValue = document.getElementById("searchInput").value;
  const selectedRange = document.getElementById("filterSelect").value;
  tableBody.innerHTML = "";

  let filteredTransactions = process.applyFilterTransactions(transactions, selectedRange);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue).slice(0, 15);

  // Transactions will be listed here
  filteredTransactions.forEach((transaction, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td style="color: ${transaction.type === "income" ? "red" : "blue"}">${transaction.amount}</td>
      <td>${transaction.category}</td>
      <td>
      <button class="edit-btn">edit</button>
      <button class="delete-btn" data-id="${transaction.id}">Delete</button>
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

const listItems = (items, tableId, color) => {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  tableBody.innerHTML = "";

  items.forEach((data) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.period}</td>
      <td style="color: ${color}">${data.amount}</td>
      <td>${data.category}</td>
      <td>
        <button class="edit-btn2" data-id="${data.id}" data-table="${tableId}">Edit</button>
        <button class="delete-btn2" data-id="${data.id}" data-table="${tableId}">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Modal elements
  const modal = document.getElementById("deleteModal");
  const cancelBtn = document.getElementById("cancelDelete");
  const confirmBtn = document.getElementById("confirmDelete");
  const closeBtn = document.getElementById("closeBtn");
  let itemIdToDelete, tableTypeToDelete;

  // Add event listeners for delete buttons
  document.querySelectorAll(".delete-btn2").forEach((button) => {
    button.addEventListener("click", (event) => {
      itemIdToDelete = event.target.dataset.id;
      tableTypeToDelete = event.target.dataset.table;
      modal.classList.remove("hidden");
    });
  });

  // Cancel and close modal
  const closeModal = () => {
    modal.classList.add("hidden");
    itemIdToDelete = null;
    tableTypeToDelete = null;
  };

  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);

  // Confirm delete action
  confirmBtn.addEventListener("click", async () => {
    if (itemIdToDelete) {
      try {
        const collection = tableTypeToDelete === "incomeTable" ? "income" : "expense";
        await ref.deleteDoc(collection, itemIdToDelete, uid);
        const updatedItems = items.filter((item) => item.id !== itemIdToDelete);
        listItems(updatedItems, tableId, color);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
      closeModal();
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
    listItems(income, 'incomeTable', 'red');
    listItems(expense, 'expenseTable', 'blue');

    document.getElementById("searchInput").addEventListener("input", listTransactions);
    document.getElementById("filterSelect").addEventListener("change", listTransactions);
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();

  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

initialize();