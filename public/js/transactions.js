import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"

const db = firebase.firestore();
const auth = firebase.auth();
let uid;
let filterValue = "all";

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
  } else {
    // User is signed out
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


let allTransactionsData = [];
let incomeData = [];
let expenseData = [];

// Pagination variables
let incomeCurrentPage = 1;
let expenseCurrentPage = 1;
const itemsPerPage = 6; // You can adjust this value

const filterTransactionsByType = (transactions) => {
  return {
    income: transactions.filter(transaction => transaction.type == 'income'),
    expense: transactions.filter(transaction => transaction.type == 'expense')
  };
};


const handleHistoryChange = async (event) => {
  const selectedValue = event.target.value;
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
      // For "all" and default, no filtering by date range
      break;
  }

  let filteredTransactions = allTransactionsData;

  if (selectedValue !== "all") {
    filteredTransactions = process.filterTransactions(allTransactionsData, startDate, endDate);
  }

  const { income, expense } = filterTransactionsByType(filteredTransactions);
  incomeData = income;
  expenseData = expense;

  incomeCurrentPage = 1; // Reset pagination on filter change
  expenseCurrentPage = 1; // Reset pagination on filter change

  listIncome(incomeData, incomeCurrentPage);
  listExpense(expenseData, expenseCurrentPage);
};


const listIncome = (currentIncomeData, page) => { // Added page parameter
  const tableBody = document.querySelector("#incomeTableBody");
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  tableBody.innerHTML = "";

  let filteredIncome = currentIncomeData.filter(item => {
    const date = new Date(item.date.seconds * 1000).toLocaleDateString();
    const amount = item.amount.toString();
    const category = item.category.toLowerCase();
    return date.includes(searchValue) || amount.includes(searchValue) || category.includes(searchValue);
  });

  // Pagination logic
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedIncome = filteredIncome.slice(startIndex, endIndex);

  paginatedIncome.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="p-4 border border-gray-300">${new Date(item.date.seconds * 1000).toISOString().split('T')[0]}</td>
            <td class="p-4 border border-gray-300" style="color: green;">${item.amount}</td>
            <td class="p-4 border border-gray-300 border-r-0">${item.category}</td>
            <td class="p-4 border border-gray-300 border-l-0">
            <button id="edit-btn" class="cursor-pointer mr-3"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
      </button>
                <button class="delete-btn cursor-pointer" data-type="income" data-id="${item.id}"><svg data-id="${item.id}" data-type="income" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </td>
        `;
    tableBody.appendChild(row);
  });
  updateIncomePaginationControls(filteredIncome.length, page); // Update pagination controls
};

const listExpense = (currentExpenseData, page) => { // Added page parameter
  const tableBody = document.querySelector("#expenseTableBody");
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  tableBody.innerHTML = "";

  let filteredExpenses = currentExpenseData.filter(item => {
    const date = new Date(item.date.seconds * 1000).toLocaleDateString();
    const amount = item.amount.toString();
    const category = item.category.toLowerCase();
    return date.includes(searchValue) || amount.includes(searchValue) || category.includes(searchValue);
  });

  // Pagination logic
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);


  paginatedExpenses.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="p-4 border border-gray-300">${new Date(item.date.seconds * 1000).toISOString().split('T')[0]}</td>
            <td class="p-4 border border-gray-300" style="color: red;">${item.amount}</td>
            <td class="p-4 border border-gray-300 border-r-0">${item.category}</td>
            <td class="p-4 border border-gray-300 border-l-0">
            <button id="edit-btn" class="cursor-pointer mr-3"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
      </button>
                <button class="delete-btn cursor-pointer" data-type="expense" data-id="${item.id}"><svg data-id="${item.id}" data-type="expense" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </td>
        `;
    tableBody.appendChild(row);
  });
  updateExpensePaginationControls(filteredExpenses.length, page); // Update pagination controls
};


const sortTable = (data, tableId, key, order) => {
  const sortedData = [...data].sort((a, b) => { // Sort a copy to avoid modifying original data
    let aValue, bValue;

    if (key === "date") {
      aValue = a.date.seconds;
      bValue = b.date.seconds;
    } else if (key === "amount") {
      aValue = a.type === "income" ? a.amount : -a.amount; // Use income/expense logic
      bValue = b.type === "income" ? b.amount : -b.amount; // Use income/expense logic
    } else if (key === "category") {
      aValue = a.category.toLowerCase();
      bValue = b.category.toLowerCase();
      return order ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return order ? aValue - bValue : bValue - aValue;
  });

  return sortedData; // return sorted data
};


const addSortingHandlers = () => {
  const incomeTableHeaders = Array.from(document.querySelectorAll("#incomeTable th"))
    .filter(th => th.textContent.trim() !== "Action");
  setupSortableHeaders(incomeTableHeaders, "incomeTable", listIncome); // Pass listIncome

  const expenseTableHeaders = Array.from(document.querySelectorAll("#expenseTable th"))
    .filter(th => th.textContent.trim() !== "Action");
  setupSortableHeaders(expenseTableHeaders, "expenseTable", listExpense); // Pass listExpense
};

const setupSortableHeaders = (headers, tableId, listFunction) => { //listFunction now as argument
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

      let currentData;
      if (tableId === "incomeTable") {
        currentData = incomeData; // Use incomeData directly
        incomeCurrentPage = 1; // Reset page on sort
      } else if (tableId === "expenseTable") {
        currentData = expenseData; // Use expenseData directly
        expenseCurrentPage = 1; // Reset page on sort
      }

      const sortedData = sortTable(currentData, tableId, key, newSortDirection === 'asc');


      if (tableId === "incomeTable") {
        incomeData = sortedData; // Update incomeData
      } else if (tableId === "expenseTable") {
        expenseData = sortedData; // Update expenseData
      }
      listFunction(sortedData, 1); // Use the provided listFunction to list sorted data, reset to page 1
    });
  });
};


const initialize = async () => {
  try {
    allTransactionsData = process.sortTransactions(await ref.access(uid, 'transaction'));
    allTransactionsData = process.sortTransactions(await ref.access(uid, 'transaction'));
    const { income, expense } = filterTransactionsByType(allTransactionsData);
    incomeData = income;
    expenseData = expense;

    listIncome(incomeData, incomeCurrentPage); // Pass initial page number
    listExpense(expenseData, expenseCurrentPage); // Pass initial page number


    document.getElementById("searchInput").addEventListener("input", () => {
      const { income, expense } = filterTransactionsByType(allTransactionsData);
      incomeData = income;
      expenseData = expense;

      incomeCurrentPage = 1; // Reset pagination on search
      expenseCurrentPage = 1; // Reset pagination on search

      listIncome(incomeData, incomeCurrentPage);
      listExpense(expenseData, expenseCurrentPage);
    });
    document.querySelectorAll("#filterSelect").forEach(button => {
      button.addEventListener("click", function () {
        filterValue = this.getAttribute("data-value");
        handleHistoryChange({ target: { value: filterValue } });
      });
    });
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();
    const modal = document.getElementById("deleteModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const confirmBtn = document.getElementById("confirmDelete");
    const closeBtn = document.getElementById("closeBtn");
    let itemToDelete = { id: null, type: null };


    const handleTableClick = (event) => {
      if (event.target.closest('.delete-btn')) {
        const deleteButton = event.target.closest('.delete-btn');
        itemToDelete.id = deleteButton.dataset.id;
        itemToDelete.type = deleteButton.dataset.type;
        modal.classList.remove("hidden");
      }
    };

    document.querySelector("#incomeTableBody").addEventListener("click", handleTableClick);
    document.querySelector("#expenseTableBody").addEventListener("click", handleTableClick);


    cancelBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      itemToDelete = { id: null, type: null };
    });
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      itemToDelete = { id: null, type: null };
    });

    confirmBtn.addEventListener("click", async () => {
      if (itemToDelete.id && itemToDelete.type) {
        try {
          await ref.deleteDoc("transaction", itemToDelete.id, uid);
          allTransactionsData = allTransactionsData.filter((item) => item.id !== itemToDelete.id);
          const { income, expense } = filterTransactionsByType(allTransactionsData);
          incomeData = income;
          expenseData = expense;
          if (itemToDelete.type === 'income') {
            listIncome(incomeData, incomeCurrentPage);
          } else if (itemToDelete.type === 'expense') {
            listExpense(expenseData, expenseCurrentPage);
          }
        } catch (error) {
          console.error("Error deleting item:", error);
        }
        modal.classList.add("hidden");
        itemToDelete = { id: null, type: null };
      }
    });


  } catch (error) {
    console.error("Error initializing data:", error);
  }
};


initialize().then(() => {
});

// Pagination control functions
const updateIncomePaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `<button id="incomePrevPage" class="pagination-button ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Previous</button>`;
    paginationHTML += `<span>Page ${currentPage} of ${totalPages}</span>`;
    paginationHTML += `<button id="incomeNextPage" class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
  }

  const paginationDiv = document.getElementById('incomePagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

    // Add event listeners to the new buttons AFTER they are added to the DOM
    const prevButton = document.getElementById('incomePrevPage');
    const nextButton = document.getElementById('incomeNextPage');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (incomeCurrentPage > 1) {
          incomeCurrentPage--;
          listIncome(incomeData, incomeCurrentPage);
        }
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (incomeCurrentPage < totalPages) {
          incomeCurrentPage++;
          listIncome(incomeData, incomeCurrentPage);
        }
      });
    }
  }
};

const updateExpensePaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `<button id="expensePrevPage" class="pagination-button ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Previous</button>`;
    paginationHTML += `<span>Page ${currentPage} of ${totalPages}</span>`;
    paginationHTML += `<button id="expenseNextPage" class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
  }


  const paginationDiv = document.getElementById('expensePagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

    // Add event listeners
    const prevButton = document.getElementById('expensePrevPage');
    const nextButton = document.getElementById('expenseNextPage');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (expenseCurrentPage > 1) {
          expenseCurrentPage--;
          listExpense(expenseData, expenseCurrentPage);
        }
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (expenseCurrentPage < totalPages) {
          expenseCurrentPage++;
          listExpense(expenseData, expenseCurrentPage);
        }
      });
    }
  }
};