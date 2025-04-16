/**
 * Home page functionality module
 * Handles:
 * - Dashboard display and updates
 * - Transaction management
 * - Chart visualization
 * - Filter controls
 * - Modal interactions
 * - PDF report generation
 */

import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"
import { generatePDFReport } from "./report.js";
import { validateTransactionDate } from "./preprocess.js";

const db = firebase.firestore();
const auth = firebase.auth();
let uid;
let filterValue = "all";

const balanceSummary = document.getElementById('balanceSummary');

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    uid = user.uid;
  } else {
  }
});

let transactions;

// Pagination variables for Transaction Table
let transactionCurrentPage = 1;
const transactionItemsPerPage = 4; // You can adjust this value

const handleHistoryChange = async (event) => {
  transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
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

  // Only update the transaction list, not the balance chart
  transactionCurrentPage = 1;
  listTransactions(filteredTransactions, transactionCurrentPage);
};


const listTransactions = (currentTransactionData, page) => {
  const tableBody = document.querySelector("#transactionTable tbody");
  const searchValue = document.getElementById("searchInput").value;
  tableBody.innerHTML = "";

  let filteredTransactions = process.applyFilterTransactions(currentTransactionData, filterValue);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue);

  // Pagination logic 
  const startIndex = (page - 1) * transactionItemsPerPage;
  const endIndex = startIndex + transactionItemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalTransactions = filteredTransactions.length;

  paginatedTransactions.forEach((transaction) => {
    const row = document.createElement("tr");
    row.className = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
    
    row.innerHTML = `
      <td class="p-4">${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td class="p-4 font-medium">${transaction.type === 'income' ? '+' : '-'}$${transaction.amount}</td>
      <td class="p-4">${transaction.category}</td>
      <td class="p-4 flex gap-2 text-gray-600">
        <button class="edit-btn" data-id="${transaction.id}" data-tooltip="Edit transaction">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button class="delete-btn" data-id="${transaction.id}" data-tooltip="Delete transaction">
          <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update pagination controls
  updateTransactionPaginationControls(totalTransactions, page);
};

// New pagination control function for Transaction Table
const updateTransactionPaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / transactionItemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `
      <button id="transactionPrevPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
      <span class="text-sm text-gray-700">Page ${currentPage} of ${totalPages}</span>
      <button id="transactionNextPage" 
        class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" 
        ${currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    `;
  }

  const paginationDiv = document.getElementById('transactionPagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

    const prevButton = document.getElementById('transactionPrevPage');
    const nextButton = document.getElementById('transactionNextPage');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (transactionCurrentPage > 1) {
          transactionCurrentPage--;
          listTransactions(transactions, transactionCurrentPage);
        }
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (transactionCurrentPage < totalPages) {
          transactionCurrentPage++;
          listTransactions(transactions, transactionCurrentPage);
        }
      });
    }
  }
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

let sortType;
let sortDirection;
/**
 * Adds sorting functionality to transaction table headers
 * Handles click events and updates sort indicators
 */
const addSortingHandlers = () => {
  let headers = Array.from(document.querySelectorAll("#transactionTable th"))
    .filter(th => th.textContent.trim() !== "Action");
  headers.forEach((header, index) => {
    const key = header.textContent.toLowerCase();
    // Set default sort direction to descending for Date column (index 0)
    header.dataset.sortDirection = (index === 0) ? 'desc' : 'asc';

    if (index === 0) {
      // Set initial indicator to descending for Date column
      header.innerHTML = `${key.charAt(0).toUpperCase() + key.slice(1)} &darr;`;
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
      sortType = key;
      sortDirection = newSortDirection;

      listTransactions(sortedTransactions, transactionCurrentPage); // Keep current page after sort
    });
  });
};

/**
 * Formats a number with commas for better readability
 * @param {number} number - The number to format
 * @returns {string} Formatted number with commas
 */
const formatNumberWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Updates category options in the transaction modal based on transaction type
 * @param {string} type - Transaction type ('income' or 'expense')
 */
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

// Update the initializeCustomDropdown function
const initializeCustomDropdown = () => {
  const selectedOption = document.querySelector('.selected-option');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const searchInput = document.querySelector('.category-search');
  const optionsContainer = document.querySelector('.category-options');
  
  // Toggle dropdown
  selectedOption.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden');
    if (!dropdownMenu.classList.contains('hidden')) {
      searchInput.focus();
      searchInput.value = ''; // Clear search when opening
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

  // Handle search
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const options = optionsContainer.querySelectorAll('.category-option');
    
    options.forEach(option => {
      const text = option.textContent.toLowerCase();
      option.classList.toggle('hidden', !text.includes(searchTerm));
    });
  });
};

// Update the event listener for transaction type change
document.getElementById("transactionType").addEventListener("change", (e) => {
  updateCategoryOptions(e.target.value);
});

// Add a new function for handling plot filter changes
const handlePlotHistoryChange = async (event) => {
  const selectedValue = event.target.value;
  const now = new Date();
  const startDate = new Date();
  const endDate = now;

  // Get all transactions first
  const allTransactions = process.sortTransactions(await ref.access(uid, 'transaction'));
  let filteredTransactions = allTransactions;

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
      break;
  }

  if (selectedValue !== "all") {
    filteredTransactions = process.filterTransactions(allTransactions, startDate, endDate);
  }

  // Generate balance data for the filtered transactions
  const balanceOverTimeData = process.genBalanceOverTime(filteredTransactions);
    
  // Process monthly balances
  const monthlyBalances = {};
  balanceOverTimeData.forEach(item => {
    const date = new Date(item.date.seconds * 1000);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyBalances[monthYear] || 
        new Date(monthlyBalances[monthYear].date.seconds * 1000).getDate() < date.getDate()) {
        monthlyBalances[monthYear] = {
            ...item,
            monthLabel: date.toLocaleString('default', { month: 'short', year: '2-digit' })
        };
    }
  });

  // Convert to array and sort by date
  const monthlyBalanceData = Object.values(monthlyBalances)
    .sort((a, b) => a.date.seconds - b.date.seconds);

  // Update the chart
  plot.plotBalance(balanceCharts, monthlyBalanceData);
};

// Update the setupFilterButtons function to handle both sets of filters
const setupFilterButtons = () => {
  // Setup plot filters (above the plot)
  document.querySelectorAll("#plotFilterSelect").forEach(button => {
    button.addEventListener("click", function() {
      // Remove active class from all plot filter buttons
      document.querySelectorAll("#plotFilterSelect").forEach(btn => {
        btn.classList.remove("active", "bg-white", "shadow-sm");
        btn.style.color = '';
      });
      
      // Add active styling to clicked button
      this.classList.add("active", "bg-white", "shadow-sm");
      this.style.color = '#1a1a1a';
      
      const value = this.getAttribute("data-value");
      handlePlotHistoryChange({ target: { value } });
    });

    // Set initial active state for "All time" button
    if (button.getAttribute("data-value") === "all") {
      button.classList.add("active", "bg-white", "shadow-sm");
      button.style.color = '#1a1a1a';
    }
  });

  // Setup table filters (above the table)
  document.querySelectorAll("#tableFilterSelect").forEach(button => {
    button.addEventListener("click", function() {
      // Remove active class from all table filter buttons
      document.querySelectorAll("#tableFilterSelect").forEach(btn => {
        btn.classList.remove("active", "bg-white", "shadow-sm");
        btn.style.color = '';
      });
      
      // Add active styling to clicked button
      this.classList.add("active", "bg-white", "shadow-sm");
      this.style.color = '#1a1a1a';
      
      const value = this.getAttribute("data-value");
      handleHistoryChange({ target: { value } });
    });

    // Set initial active state for "All time" button
    if (button.getAttribute("data-value") === "all") {
      button.classList.add("active", "bg-white", "shadow-sm");
      button.style.color = '#1a1a1a';
    }
  });
};

// Add the CSS styles for the active filter button
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

const initialize = async () => {
  try {
    while (!uid) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    //test()

    // Add event listener for transaction type change
    document.getElementById("transactionType").addEventListener("change", (e) => {
      updateCategoryOptions(e.target.value);
    });

    await updateCategoryOptions('income');
    transactions = await ref.access(uid, 'transaction')
    transactions = process.sortTransactions(transactions);
    transactions = sortTransactions(transactions, "date", false)

    listTransactions(transactions, transactionCurrentPage);

    document.getElementById("searchInput").addEventListener("input", () => {
      transactionCurrentPage = 1; // Reset pagination on search
      listTransactions(transactions, transactionCurrentPage);
    });

    // Setup filter buttons
    setupFilterButtons();

    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();

    const balanceOverTimeData = process.genBalanceOverTime(transactions)
    let totalIncome = 0;
    let totalExpense = 0;

    // Calculate total income and expenses across all time
    transactions.forEach(transaction => {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        totalExpense += transaction.amount;
      }
    });

    // Animate the initial values from 0
    const finalBalance = balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;
    animateNumber(document.getElementById("balance"), 0, finalBalance);
    animateNumber(document.getElementById("income"), 0, totalIncome);
    animateNumber(document.getElementById("expenses"), 0, totalExpense);

    // Add this line to plot the initial chart
    await plotBalanceChart();

    // Modal setup (moved here to initialize)
    const modal = document.getElementById("deleteModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const confirmBtn = document.getElementById("confirmDelete");
    const closeBtn = document.getElementById("closeBtn");
    const addModal = document.getElementById("addTransactionModal")
    let transactionIdToDelete;
    let transactionIdToEdit = null; // Variable to store transaction ID for editing

    document.getElementById("addTransactionBtn").addEventListener("click", async () => {
      const modal = document.getElementById("addTransactionModal");
      // Reset form
      document.getElementById("transactionAmount").value = '';
      document.getElementById("transactionCategory").value = '';
      document.getElementById('selectedCategory').textContent = 'Select category';
      document.getElementById("transactionDate").value = '';
      document.getElementById("transactionType").value = 'income';
      
      // Show modal with animation
      showModal(modal);
    })

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

      const modal = document.getElementById("addTransactionModal");
      hideModal(modal);

      try {
        if (transactionIdToEdit) {
          await ref.updateTransaction(amount, category, date, type, transactionIdToEdit, uid);
        } else {
          await ref.addTransaction(amount, category, date, type, uid);
        }

        transactions = await ref.access(uid, 'transaction');
        transactions = sortTransactions(transactions, sortType, sortDirection === 'asc')
        listTransactions(transactions, transactionCurrentPage);

        updateDashboardCards();
        await plotBalanceChart();

        transactionIdToEdit = null;
      } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Failed to save transaction. Please try again.");
      }
    });

    document.getElementById("cancelTransaction").addEventListener("click", () => {
      const modal = document.getElementById("addTransactionModal");
      hideModal(modal);
      transactionIdToEdit = null; // Clear edit ID when cancelling
    });

    document.getElementById("transactionTableBody").addEventListener("click", async (event) => {
      if (event.target.closest('.delete-btn')) {
        const deleteButton = event.target.closest('.delete-btn');
        transactionIdToDelete = deleteButton.dataset.id;
        modal.classList.remove("hidden");
      } else if (event.target.closest('.edit-btn')) {
        const editButton = event.target.closest('.edit-btn');
        const transactionId = editButton.dataset.id;
        transactionIdToEdit = transactionId;

        const transactionToEdit = transactions.find(transaction => transaction.id === transactionId);
        if (transactionToEdit) {
          const modal = document.getElementById("addTransactionModal");
          document.getElementById("transactionAmount").value = transactionToEdit.amount;
          document.getElementById("transactionType").value = transactionToEdit.type;
          document.getElementById("transactionType").disabled = true;
          
          // Update categories before setting the value
          await updateCategoryOptions(transactionToEdit.type);
          document.getElementById("transactionCategory").value = transactionToEdit.category;
          document.getElementById('selectedCategory').textContent = transactionToEdit.category;
          
          document.getElementById("transactionDate").value = new Date(transactionToEdit.date.seconds * 1000)
            .toISOString().split('T')[0];
          
          document.querySelector("#addTransactionModal h2").textContent = "Edit Transaction";
          document.getElementById("saveTransaction").textContent = "Update";
          
          showModal(modal);
        }
      }
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
          listTransactions(transactions, transactionCurrentPage);
          updateDashboardCards();
          await plotBalanceChart();
        } catch (error) {
          console.error("Error deleting transaction:", error);
        }
        modal.classList.add("hidden");
        transactionIdToDelete = null;
      }
    });

    // Add report generation handler
    document.getElementById("generateReportBtn").addEventListener("click", generatePDFReport);

    initializeCustomDropdown();

    // Set initial active state
    document.querySelector('[data-value="all"]').classList.add("active");

    // Make sure "All time" is selected by default
    const setDefaultFilter = () => {
      // Remove active class from all buttons
      document.querySelectorAll("#filterSelect").forEach(btn => {
        btn.classList.remove("active");
      });
      // Add active class to "All time" button
      const allTimeButton = document.querySelector('[data-value="all"]');
      if (allTimeButton) {
        allTimeButton.classList.add("active");
      }
    };

    // Add this to your initialize function after the filter button setup
    setDefaultFilter();

    // Also call setDefaultFilter when the page loads
    document.addEventListener('DOMContentLoaded', setDefaultFilter);

  } catch (error) {
    console.error("Error initializing data:", error);
  }
};


initialize().then(() => {
});

/**
 * Initializes the balance chart with configuration
 */
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
})

/**
 * Animates a number from start to end value
 * @param {HTMLElement} element - Target element to update
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} duration - Animation duration in milliseconds
 */
const animateNumber = (element, start, end, duration = 1000) => {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    const current = Math.floor(start + (end - start) * easeProgress);
    element.innerHTML = `$${formatNumberWithCommas(current)}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
};

// Update the dashboard cards with animation
const updateDashboardCards = async () => {
  transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
  const balanceOverTimeData = process.genBalanceOverTime(transactions)
  let totalIncome = 0;
  let totalExpense = 0;

  // Calculate total income and expenses across all time
  transactions.forEach(transaction => {
    if (transaction.type === "income") {
      totalIncome += transaction.amount;
    } else if (transaction.type === "expense") {
      totalExpense += transaction.amount;
    }
  });

  // Get current values from the elements
  const currentBalance = parseInt(document.getElementById("balance").innerHTML.replace(/[^0-9-]/g, '')) || 0;
  const currentIncome = parseInt(document.getElementById("income").innerHTML.replace(/[^0-9-]/g, '')) || 0;
  const currentExpenses = parseInt(document.getElementById("expenses").innerHTML.replace(/[^0-9-]/g, '')) || 0;

  // Animate to new values
  const finalBalance = balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;
  animateNumber(document.getElementById("balance"), currentBalance, finalBalance);
  animateNumber(document.getElementById("income"), currentIncome, totalIncome);
  animateNumber(document.getElementById("expenses"), currentExpenses, totalExpense);
};

const plotBalanceChart = async () => {
    // Get all transactions regardless of filter
    const allTransactions = process.sortTransactions(await ref.access(uid, 'transaction'));
    const balanceOverTimeData = process.genBalanceOverTime(allTransactions);
    
    // Process monthly balances - get last balance of each month
    const monthlyBalances = {};
    balanceOverTimeData.forEach(item => {
        const date = new Date(item.date.seconds * 1000);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Only update if this is a later date in the same month or if month not yet recorded
        if (!monthlyBalances[monthYear] || 
            new Date(monthlyBalances[monthYear].date.seconds * 1000).getDate() < date.getDate()) {
            monthlyBalances[monthYear] = {
                ...item,
                monthLabel: date.toLocaleString('default', { month: 'short', year: '2-digit' })
            };
        }
    });

    // Convert to array and sort by date
    const monthlyBalanceData = Object.values(monthlyBalances)
        .sort((a, b) => a.date.seconds - b.date.seconds);

    // Update the chart with the new data
    plot.plotBalance(balanceCharts, monthlyBalanceData);
};

/**
 * Test function to generate sample transaction data
 * Creates 2 years of realistic financial data including:
 * - Monthly salary with variations
 * - Regular rent payments
 * - Seasonal utility costs
 * - Weekly grocery expenses
 * - Monthly subscriptions
 * - Random personal expenses
 */
const test = async () => {
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  // Base monthly income and expenses
  const baseSalary = 5000;
  const baseRent = 1500;
  const baseUtilities = 200;
  const baseGroceries = 400;
  const baseSubscriptions = 50;

  // Loop through each month from 2 years ago until today
  for (let d = new Date(twoYearsAgo); d <= today; d.setMonth(d.getMonth() + 1)) {
    // Monthly salary (with small random variations)
    const salaryVariation = Math.round(Math.random() * 1000 - 500); // +/- $500
    await ref.addTransaction(
      Math.round(baseSalary + salaryVariation),
      "Salary",
      new Date(d),
      "income",
      uid
    );

    // Regular monthly expenses
    await ref.addTransaction(baseRent, "Rent", new Date(d), "expense", uid);
    
    // Utilities with seasonal variation
    const month = d.getMonth();
    const seasonalUtilities = Math.round(baseUtilities + (month >= 5 && month <= 8 ? 100 : month >= 11 || month <= 2 ? 150 : 0));
    await ref.addTransaction(seasonalUtilities, "Utilities", new Date(d), "expense", uid);
    
    // Weekly grocery trips
    for (let week = 0; week < 4; week++) {
      const groceryDate = new Date(d);
      groceryDate.setDate(d.getDate() + (week * 7));
      const groceryVariation = Math.round(Math.random() * 100 - 50); // +/- $50
      await ref.addTransaction(
        Math.round(baseGroceries/4 + groceryVariation),
        "Groceries",
        groceryDate,
        "expense",
        uid
      );
    }

    

    // Monthly subscriptions
    await ref.addTransaction(baseSubscriptions, "Subscription", new Date(d), "expense", uid);

    // Random personal expenses (2-4 times per month)
    const numPersonalExpenses = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numPersonalExpenses; i++) {
      const expenseDate = new Date(d);
      expenseDate.setDate(d.getDate() + Math.floor(Math.random() * 28));
      await ref.addTransaction(
        Math.round(50 + Math.random() * 200),
        "Personal expenses",
        expenseDate,
        "expense",
        uid
      );
    }
  }
}

/**
 * Shows a modal with animation
 * @param {HTMLElement} modal - Modal element to show
 */
const showModal = (modal) => {
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.bg-white').classList.remove('scale-95');
  modal.querySelector('.bg-white').classList.add('scale-100');
  document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
};

/**
 * Hides a modal with animation
 * @param {HTMLElement} modal - Modal element to hide
 */
const hideModal = (modal) => {
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.bg-white').classList.remove('scale-100');
  modal.querySelector('.bg-white').classList.add('scale-95');
  document.body.style.overflow = ''; // Restore scrolling
};

// Close modal when clicking outside
document.getElementById("addTransactionModal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    hideModal(e.target);
  }
});

/**
 * Handles editing of an existing transaction
 * Updates modal with transaction details and shows it
 * @param {Object} transactionToEdit - Transaction object to edit
 */
const handleEdit = async (transactionToEdit) => {
  if (transactionToEdit) {
    const modal = document.getElementById("addTransactionModal");
    document.getElementById("transactionAmount").value = transactionToEdit.amount;
    document.getElementById("transactionType").value = transactionToEdit.type;
    document.getElementById("transactionType").disabled = true;
    
    // Update categories before setting the value
    await updateCategoryOptions(transactionToEdit.type);
    document.getElementById("transactionCategory").value = transactionToEdit.category;
    document.getElementById('selectedCategory').textContent = transactionToEdit.category;
    
    document.getElementById("transactionDate").value = new Date(transactionToEdit.date.seconds * 1000)
      .toISOString().split('T')[0];
    
    document.querySelector("#addTransactionModal h2").textContent = "Edit Transaction";
    document.getElementById("saveTransaction").textContent = "Update";
    
    showModal(modal);
  }
};

// Progress Bar Carousel
const progressCarousel = () => {
  const slides = document.querySelector('.progress-slides');
  const slideElements = document.querySelectorAll('.progress-slide');
  const dots = document.querySelectorAll('.progress-dot');
  const prevBtn = document.getElementById('prevProgress');
  const nextBtn = document.getElementById('nextProgress');
  const carousel = document.querySelector('.progress-carousel');
  
  let currentSlide = 0;
  const slideCount = slideElements.length;
  let autoAdvanceInterval = null;
  let isTransitioning = false;

  // Update slide position and active state
  const updateSlide = () => {
    if (isTransitioning) return;
    isTransitioning = true;
    
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active state for slides
    slideElements.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
    
    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });

    // Reset transition flag after animation
    setTimeout(() => {
      isTransitioning = false;
    }, 500);
  };

  // Update progress bars with actual balance data
  const updateProgressBars = async () => {
    const balance = parseInt(document.getElementById("balance").innerHTML.replace(/[^0-9-]/g, '')) || 0;
    
    // Define goals
    const goals = [
      { name: "New Car Fund", target: 37000 },
      { name: "Vacation Fund", target: 5000 },
      { name: "Emergency Fund", target: 10000 }
    ];

    // Update each slide with current balance and progress
    slideElements.forEach((slide, index) => {
      const goal = goals[index];
      const progress = Math.min((balance / goal.target) * 100, 100);
      const isCompleted = balance >= goal.target;

      // Update title
      const titleElement = slide.querySelector('h3');
      titleElement.textContent = goal.name;

      // Update progress bar
      const progressBar = slide.querySelector('.progress-gradient');
      progressBar.style.width = `${progress}%`;

      // Update percentage or show checkmark
      const percentElement = slide.querySelector('.progress-percent');
      if (isCompleted) {
        percentElement.innerHTML = `
          <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        `;
      } else {
        percentElement.textContent = `${Math.round(progress)}%`;
      }

      // Update current amount
      const currentAmount = slide.querySelector('.progress-current');
      currentAmount.textContent = `$${formatNumberWithCommas(balance)}`;

      // Update goal amount
      const goalAmount = slide.querySelector('.progress-goal');
      goalAmount.textContent = `Goal: $${formatNumberWithCommas(goal.target)}`;
    });
  };

  // Next slide
  const nextSlide = () => {
    if (isTransitioning) return;
    currentSlide = (currentSlide + 1) % slideCount;
    updateSlide();
  };

  // Previous slide
  const prevSlide = () => {
    if (isTransitioning) return;
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    updateSlide();
  };

  const startAutoAdvance = () => {
    clearInterval(autoAdvanceInterval);
    autoAdvanceInterval = setInterval(() => {
      if (!isTransitioning) {
        nextSlide();
      }
    }, 8000);
  };

  // Add click handlers for arrows
  prevBtn.addEventListener('click', () => {
    clearInterval(autoAdvanceInterval);
    prevSlide();
    startAutoAdvance();
  });

  nextBtn.addEventListener('click', () => {
    clearInterval(autoAdvanceInterval);
    nextSlide();
    startAutoAdvance();
  });

  // Add dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      if (isTransitioning) return;
      clearInterval(autoAdvanceInterval);
      currentSlide = index;
      updateSlide();
      startAutoAdvance();
    });
  });

  // Pause auto-advance on hover
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoAdvanceInterval);
  });

  carousel.addEventListener('mouseleave', () => {
    startAutoAdvance();
  });

  // Initialize first slide and start auto-advance
  updateSlide();
  startAutoAdvance();

  // Update progress bars whenever balance changes
  const balanceElement = document.getElementById("balance");
  if (balanceElement) {
    const observer = new MutationObserver(updateProgressBars);
    observer.observe(balanceElement, { characterData: true, childList: true, subtree: true });
  }

  // Initial update of progress bars
  updateProgressBars();
};

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  progressCarousel();
});

// ChatBot Toggle
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("chatbotToggle");
  const chatbox = document.getElementById("chatbox");
  const closeBtn = document.getElementById("chatboxClose");

  if (toggle && chatbox && closeBtn) {
    toggle.addEventListener("click", () => {
      chatbox.classList.toggle("hidden");
    });

    closeBtn.addEventListener("click", () => {
      chatbox.classList.add("hidden");
    });
  } else {
    console.error("Chatbot elements not found");
  }
});

