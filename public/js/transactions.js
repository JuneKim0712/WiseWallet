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


const listIncome = (currentIncomeData, page) => {
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

  paginatedIncome.forEach((item, index) => {
    const row = document.createElement("tr");
    row.className = 'text-green-600';

    row.innerHTML = `
      <td class="p-4">${new Date(item.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td class="p-4 font-medium">${item.type === 'income' ? '+' : '-'}${item.amount}</td>
      <td class="p-4">${item.category}</td>
      <td class="p-4 flex gap-2 text-gray-600">
        <button class="edit-btn" data-id="${item.id}" data-tooltip="Edit ${item.type}">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="delete-btn" data-id="${item.id}" data-type="${item.type}" data-tooltip="Delete ${item.type}">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  updateIncomePaginationControls(filteredIncome.length, page); // Update pagination controls
};

const listExpense = (currentExpenseData, page) => {
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

  paginatedExpenses.forEach((item, index) => {
    const row = document.createElement("tr");
    row.className = 'text-red-600';

    row.innerHTML = `
      <td class="p-4">${new Date(item.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td class="p-4 font-medium">${item.type === 'income' ? '+' : '-'}${item.amount}</td>
      <td class="p-4">${item.category}</td>
      <td class="p-4 flex gap-2 text-gray-600">
        <button class="edit-btn" data-id="${item.id}" data-tooltip="Edit ${item.type}">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="delete-btn" data-id="${item.id}" data-type="${item.type}" data-tooltip="Delete ${item.type}">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
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


const initializeCustomDropdown = () => {
  const selectedOption = document.querySelector('.selected-option');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const searchInput = document.querySelector('.category-search');
  const optionsContainer = document.querySelector('.category-options');
  
  // Toggle dropdown
  selectedOption.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden');
    if (!dropdownMenu.classList.contains('hidden')) {
      // Show all options
      optionsContainer.querySelectorAll('.category-option').forEach(option => {
        option.classList.remove('hidden');
      });
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select') && !e.target.closest('.add-category-group')) {
      dropdownMenu.classList.add('hidden');
    }
  });

};

const updateCategoryOptions = async (type) => {
  try {
    const allCategories = await ref.getAllCategories(uid);
    const categories = allCategories[type];
    
    const optionsContainer = document.querySelector('.category-options');
    optionsContainer.innerHTML = '';
    
    // Add the search and add button group at the top
    const searchGroup = document.createElement('div');
    searchGroup.className = 'sticky top-0 bg-white p-2 border-b z-10';
    searchGroup.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <input type="text" class="category-search w-full p-2 border rounded text-sm" placeholder="Search categories">
        </div>
        <button class="add-new-category-btn p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>
      <div class="add-category-input hidden mt-2">
        <div class="flex items-center gap-2">
          <input type="text" class="new-category-input flex-1 p-2 border rounded text-sm" placeholder="New category name">
          <button class="add-category-btn px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm">
            Add
          </button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const addNewBtn = searchGroup.querySelector('.add-new-category-btn');
    const addCategoryInput = searchGroup.querySelector('.add-category-input');
    const newCategoryInput = searchGroup.querySelector('.new-category-input');
    const addButton = searchGroup.querySelector('.add-category-btn');
    const searchInput = searchGroup.querySelector('.category-search');
    
    addNewBtn.addEventListener('click', () => {
      addCategoryInput.classList.toggle('hidden');
      if (!addCategoryInput.classList.contains('hidden')) {
        newCategoryInput.focus();
      }
    });
    
    const handleAddCategory = async () => {
      const newCategory = newCategoryInput.value.trim();
      if (!newCategory) {
        alert("Please enter a category name");
        return;
      }
      
      try {
        if (categories.includes(newCategory)) {
          alert("This category already exists");
          return;
        }
        
        // Add to database
        await ref.addCustomCategory(uid, type, newCategory);
        
        // Clear input and hide the input group
        newCategoryInput.value = '';
        addCategoryInput.classList.add('hidden');
        
        // Update dropdown with new sorted list
        await updateCategoryOptions(type);
        
        // Select the new category
        document.getElementById('selectedCategory').textContent = newCategory;
        document.getElementById('transactionCategory').value = newCategory;
      } catch (error) {
        console.error("Error adding custom category:", error);
        alert("Failed to add category");
      }
    };
    
    addButton.addEventListener('click', handleAddCategory);
    newCategoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleAddCategory();
      }
    });
    
    // Handle search
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = optionsContainer.querySelectorAll('.category-option');
      
      options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.classList.toggle('hidden', !text.includes(searchTerm));
      });
    });
    
    optionsContainer.appendChild(searchGroup);
    
    // Add all categories
    categories.forEach(category => {
      const option = document.createElement('div');
      option.className = 'category-option hover:bg-gray-100 px-4 py-2 cursor-pointer';
      option.textContent = category;
      
      option.addEventListener('click', () => {
        document.getElementById('selectedCategory').textContent = category;
        document.getElementById('transactionCategory').value = category;
        document.querySelector('.dropdown-menu').classList.add('hidden');
      });
      
      optionsContainer.appendChild(option);
    });
  } catch (error) {
    console.error("Error updating category options:", error);
  }
};

const initialize = async () => {
  try {
    while (!uid) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
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
    const deleteModal = document.getElementById("deleteModal");
    const transactionModal = document.getElementById("addTransactionModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const confirmBtn = document.getElementById("confirmDelete");
    const closeBtn = document.getElementById("closeBtn");
    let itemToDelete = { id: null, type: null };
    let transactionIdToEdit = null;



    document.getElementById("addTransactionBtn").addEventListener("click", async () => {
      const modal = document.getElementById("addTransactionModal");
      // Reset form
      document.getElementById("transactionAmount").value = '';
      document.getElementById("transactionCategory").value = '';
      document.getElementById('selectedCategory').textContent = 'Select category';
      document.getElementById("transactionDate").value = '';
      document.getElementById("transactionType").value = 'income';
      document.getElementById("transactionType").disabled = true;
      
      // Update modal title
      document.querySelector("#addTransactionModal h2").textContent = "Add Income";
      
      // Show modal with animation
      showModal(modal);
      
      // Load initial categories
      await updateCategoryOptions('income');
    });

    document.getElementById("addTransactionBtnExpense").addEventListener("click", async () => {
      const modal = document.getElementById("addTransactionModal");
      // Reset form
      document.getElementById("transactionAmount").value = '';
      document.getElementById("transactionCategory").value = '';
      document.getElementById('selectedCategory').textContent = 'Select category';
      document.getElementById("transactionDate").value = '';
      document.getElementById("transactionType").value = 'expense';
      document.getElementById("transactionType").disabled = true;
      
      // Update modal title
      document.querySelector("#addTransactionModal h2").textContent = "Add Expense";
      
      // Show modal with animation
      showModal(modal);
      
      // Load initial categories
      await updateCategoryOptions('expense');
    });

    document.getElementById("closeTransactionModal").addEventListener("click", () => {
      const modal = document.getElementById("addTransactionModal");
      hideModal(modal);
    });

    // Close modal when clicking outside
    document.getElementById("addTransactionModal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        hideModal(e.target);
      }
    });

    document.getElementById("saveTransaction").addEventListener("click", async () => {
      const amount = parseFloat(document.getElementById("transactionAmount").value);
      const category = document.getElementById("transactionCategory").value;
      const dateInput = document.getElementById("transactionDate").value;
      const date = new Date(dateInput);
      const type = document.getElementById("transactionType").value;

      if (!amount || !category || !dateInput || !type) {
        alert("Please fill out all fields.");
        return;
      }

      hideModal(transactionModal);

      if (transactionIdToEdit) {
        await ref.updateTransaction(amount, category, date, type, transactionIdToEdit, uid);
      } else {
        await ref.addTransaction(amount, category, date, type, uid);
      }

      // Refresh data and update tables
      allTransactionsData = process.sortTransactions(await ref.access(uid, 'transaction'));
      const { income, expense } = filterTransactionsByType(allTransactionsData);
      incomeData = income;
      expenseData = expense;

      listIncome(incomeData, incomeCurrentPage);
      listExpense(expenseData, expenseCurrentPage);

      transactionIdToEdit = null;
    });

    document.getElementById("cancelTransaction").addEventListener("click", () => {
      hideModal(transactionModal);
      transactionIdToEdit = null;
    });


    const handleTableClick = async (event) => {
      if (event.target.closest('.delete-btn')) {
        const deleteButton = event.target.closest('.delete-btn');
        itemToDelete.id = deleteButton.dataset.id;
        itemToDelete.type = deleteButton.dataset.type;
        deleteModal.classList.remove("hidden");
      } else if (event.target.closest('.edit-btn')) {
        const editButton = event.target.closest('.edit-btn');
        const transactionId = editButton.dataset.id;
        transactionIdToEdit = transactionId;

        const transactionToEdit = allTransactionsData.find(transaction => transaction.id === transactionId);
        if (transactionToEdit) {
          const transactionModal = document.getElementById("addTransactionModal"); // Get the transaction modal
          
          // Load initial categories for income/expense based on transaction type
          await updateCategoryOptions(transactionToEdit.type);
          
          // Populate modal with transaction data
          document.getElementById("transactionAmount").value = transactionToEdit.amount;
          document.getElementById("transactionCategory").value = transactionToEdit.category;
          document.getElementById('selectedCategory').textContent = transactionToEdit.category;
          document.getElementById("transactionDate").value = new Date(transactionToEdit.date.seconds * 1000).toISOString().split('T')[0];
          document.getElementById("transactionType").value = transactionToEdit.type;
          document.getElementById("transactionType").disabled = true;
          
          document.querySelector("#addTransactionModal h2").textContent = "Edit Transaction";
          document.getElementById("saveTransaction").textContent = "Update";
          
          showModal(transactionModal); // Use the transaction modal reference
        }
      }
    };

    document.getElementById("incomeTableBody").addEventListener("click", handleTableClick);
    document.getElementById("expenseTableBody").addEventListener("click", handleTableClick);


    cancelBtn.addEventListener("click", () => {
      deleteModal.classList.add("hidden");
      itemToDelete = { id: null, type: null };
    });
    closeBtn.addEventListener("click", () => {
      deleteModal.classList.add("hidden");
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
        deleteModal.classList.add("hidden");
        itemToDelete = { id: null, type: null };
      }
    });

    // Initialize the custom dropdown
    initializeCustomDropdown();

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

// Add these functions to handle modal transitions
const showModal = (modal) => {
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.bg-white').classList.remove('scale-95');
  modal.querySelector('.bg-white').classList.add('scale-100');
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
};

const hideModal = (modal) => {
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.bg-white').classList.remove('scale-100');
  modal.querySelector('.bg-white').classList.add('scale-95');
  document.body.style.overflow = ''; // Restore scrolling
};