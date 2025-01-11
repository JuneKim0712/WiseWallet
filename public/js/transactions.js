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


let income, expense, transactions;

const listTransactions = () => {
  const tableBody = document.querySelector("#transactionTable tbody");
  const searchValue = document.getElementById("searchInput").value;
  const selectedRange = document.getElementById("filterSelect").value;
  tableBody.innerHTML = "";

  let filteredTransactions = process.applyFilterTransactions(transactions, selectedRange);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue);

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

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const transactionId = event.target.dataset.id;
      try {
        await ref.deleteDoc("transaction", transactionId, uid);
        transactions = transactions.filter((t) => t.id !== transactionId);  
        listTransactions();
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    });
  });
};

const listItems = (items, tableId, color) => {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  tableBody.innerHTML = "";

  items.forEach((data, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.period}</td>
      <td style="color: ${color}">${data.amount}</td>
      <td>${data.category}</td>
      <td>
      <button class=class="edit-btn2" data-id="${data.id}" data-table="${tableId}">edit</button>
      <button class="delete-btn2" data-id="${data.id}" data-table="${tableId}">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".delete-btn2").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const itemId = event.target.dataset.id;
      const tableType = event.target.dataset.table;

      try {
        const collection = tableType === "incomeTable" ? "income" : "expense";
        await ref.deleteDoc(collection, itemId, uid);
        const updatedItems = items.filter((item) => item.id !== itemId); 
        listItems(updatedItems, tableId, color); 
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    });
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