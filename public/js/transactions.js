/**
 * Transaction management module
 * Handles transaction listing, filtering, sorting, and CRUD operations
 */

import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"
import { validateTransactionDate } from "./preprocess.js";

// Initialize Firebase services
const db = firebase.firestore();
const auth = firebase.auth();
let uid;
let filterValue = "all";

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
  } else {
    // Redirect unauthenticated users
    window.location.href = '/index.html';
  }
});

// Data storage
let allTransactionsData = [];
let incomeData = [];
let expenseData = [];

// Pagination configuration
let incomeCurrentPage = 1;
let expenseCurrentPage = 1;
const itemsPerPage = 6;

/**
 * Separates transactions by type
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Object containing income and expense arrays
 */
const filterTransactionsByType = (transactions) => {
  return {
    income: transactions.filter(transaction => transaction.type == 'income'),
    expense: transactions.filter(transaction => transaction.type == 'expense')
  };
};

/**
 * Updates income table with pagination
 * @param {Array} currentIncomeData - Array of income transactions
 * @param {number} page - Current page number
 */
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
      <td class="p-4 font-medium">${item.type === 'income' ? '+' : '-'}$${item.amount}</td>
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

/**
 * Updates expense table with pagination
 * @param {Array} currentExpenseData - Array of expense transactions
 * @param {number} page - Current page number
 */
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
      <td class="p-4 font-medium">${item.type === 'income' ? '+' : '-'}$${item.amount}</td>
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

/**
 * Updates pagination controls for income table
 * @param {number} totalItems - Total number of income items
 * @param {number} currentPage - Current page number
 */
const updateIncomePaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `
      <button id="incomePrevPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      <span class="text-sm text-gray-700">Page ${currentPage} of ${totalPages}</span>
      <button id="incomeNextPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    `;
  }

  const paginationDiv = document.getElementById('incomePagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

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

/**
 * Updates pagination controls for expense table
 * @param {number} totalItems - Total number of expense items
 * @param {number} currentPage - Current page number
 */
const updateExpensePaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `
      <button id="expensePrevPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      <span class="text-sm text-gray-700">Page ${currentPage} of ${totalPages}</span>
      <button id="expenseNextPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    `;
  }

  const paginationDiv = document.getElementById('expensePagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

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

const sortTable = (data, key, order) => {
  return [...data].sort((a, b) => {
    let aValue, bValue;

    if (key === "date") {
      aValue = a.date.seconds;
      bValue = b.date.seconds;
    } else if (key === "amount") {
      aValue = parseFloat(a.amount);
      bValue = parseFloat(b.amount);
    } else if (key === "category") {
      aValue = a.category.toLowerCase();
      bValue = b.category.toLowerCase();
      return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });
};

const addSortingHandlers = () => {
  const incomeTableHeaders = Array.from(document.querySelectorAll("#incomeTable th"));
  const expenseTableHeaders = Array.from(document.querySelectorAll("#expenseTable th"));

  setupSortableHeaders(incomeTableHeaders, "incomeTable", listIncome);
  setupSortableHeaders(expenseTableHeaders, "expenseTable", listExpense);
};

const setupSortableHeaders = (headers, tableId, listFunction) => {
  headers.forEach((header, index) => {
    const key = header.textContent.toLowerCase().trim();
    if (key === 'action') return; // Skip the action column

    // Add sort direction indicator
    header.innerHTML = `
      <div class="flex items-center gap-1">
        <span>${header.textContent}</span>
        <span class="sort-indicator text-gray-400">↕</span>
      </div>
    `;
    
    header.dataset.sortDirection = 'none';

    header.addEventListener("click", () => {
      // Remove active sort from other headers
      headers.forEach(h => {
        if (h !== header) {
          h.dataset.sortDirection = 'none';
          const indicator = h.querySelector('.sort-indicator');
          if (indicator) indicator.textContent = '↕';
        }
      });

      // Update sort direction
      const currentDirection = header.dataset.sortDirection;
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      header.dataset.sortDirection = newDirection;

      // Update sort indicator
      const indicator = header.querySelector('.sort-indicator');
      indicator.textContent = newDirection === 'asc' ? '↑' : '↓';
      indicator.classList.remove('text-gray-400');
      indicator.classList.add('text-gray-700');

      // Sort the data
      let dataToSort;
      if (tableId === "incomeTable") {
        dataToSort = incomeData;
        incomeCurrentPage = 1;
      } else {
        dataToSort = expenseData;
        expenseCurrentPage = 1;
      }

      const sortedData = sortTable(dataToSort, key, newDirection);

      // Update the data and display
      if (tableId === "incomeTable") {
        incomeData = sortedData;
        listIncome(sortedData, 1);
      } else {
        expenseData = sortedData;
        listExpense(sortedData, 1);
      }
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

// Update the filter button handlers
const setupFilterButtons = () => {
  document.querySelectorAll("#filterSelect").forEach(button => {
    button.addEventListener("click", function() {
      // Remove active class and background from all buttons
      document.querySelectorAll("#filterSelect").forEach(btn => {
        btn.classList.remove("active", "bg-white", "shadow-sm");
        btn.style.color = ''; // Reset text color
      });
      
      // Add active styling to clicked button
      this.classList.add("active", "bg-white", "shadow-sm");
      this.style.color = '#1a1a1a'; // Darker text for active state
      
      filterValue = this.getAttribute("data-value");
      handleHistoryChange({ target: { value: filterValue } });
    });

    // Set initial active state for "All time" button
    if (button.getAttribute("data-value") === "all") {
      button.classList.add("active", "bg-white", "shadow-sm");
      button.style.color = '#1a1a1a';
    }
  });
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

    listIncome(incomeData, incomeCurrentPage);
    listExpense(expenseData, expenseCurrentPage);

    document.getElementById("searchInput").addEventListener("input", () => {
      const { income, expense } = filterTransactionsByType(allTransactionsData);
      incomeData = income;
      expenseData = expense;

      incomeCurrentPage = 1;
      expenseCurrentPage = 1;

      listIncome(incomeData, incomeCurrentPage);
      listExpense(expenseData, expenseCurrentPage);
    });

    // Replace the old filter setup with the new one
    setupFilterButtons();

    // Rest of the initialize function remains unchanged
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

      // Validate required fields
      if (!amount || !category || !dateInput || !type) {
        alert("Please fill out all fields.");
        return;
      }

      // Validate amount
      if (amount <= 0) {
        alert("Amount must be greater than 0");
        return;
      }

      // Validate date
      const dateValidation = validateTransactionDate(date, {
        allowFuture: false,
        minDate: new Date('2020-01-01') // Arbitrary minimum date
      });

      if (!dateValidation.isValid) {
        alert(dateValidation.message);
        return;
      }

      hideModal(transactionModal);

      try {
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
      } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Failed to save transaction. Please try again.");
      }
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

// Add CSS styles for the active filter button
const style = document.createElement('style');
style.textContent = `
  #filterSelect.active {
    position: relative;
  }
  #filterSelect.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #2563eb;
  }
`;
document.head.appendChild(style);