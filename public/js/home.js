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
      <td class="p-4" data-date="${transaction.date.seconds}">${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
      <td class="p-4 font-medium" data-amount="${transaction.type === 'income' ? transaction.amount : -transaction.amount}">${transaction.type === 'income' ? '+' : '-'}$${transaction.amount}</td>
      <td class="p-4" data-category="${transaction.category}">${transaction.category}</td>
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
  
  // Add event listeners for edit and delete buttons
  setupTransactionActionButtons();
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
      // Handle date sorting
      aValue = a.date.seconds;
      bValue = b.date.seconds;
    } else if (key === "amount") {
      // Handle amount sorting, considering transaction type
      aValue = a.type === "income" ? a.amount : -a.amount;
      bValue = b.type === "income" ? b.amount : -b.amount;
    } else if (key === "category") {
      // Handle category sorting (case-insensitive)
      aValue = a.category.toLowerCase();
      bValue = b.category.toLowerCase();
      return order ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      // Default case for any other fields
      aValue = a[key];
      bValue = b[key];
    }
    
    // Numeric comparison for date and amount
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
  console.log("Setting up sorting handlers");
  const headers = document.querySelectorAll('th[data-sort]');
  console.log("Found headers:", headers.length);
  
  let currentSort = {
    column: 'date',
    direction: 'desc'
  };

  headers.forEach(header => {
    header.style.cursor = 'pointer';
    
    // Add sort indicator
    const indicator = document.createElement('span');
    indicator.className = 'sort-indicator';
    header.appendChild(indicator);

    header.addEventListener('click', () => {
      console.log("Header clicked:", header.getAttribute('data-sort'));
      const column = header.getAttribute('data-sort');
      
      // Toggle sort direction if clicking the same column
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
      }

      console.log("Sorting by:", column, "direction:", currentSort.direction);

      // Update sort indicators
      headers.forEach(h => {
        const indicator = h.querySelector('.sort-indicator');
        if (h.getAttribute('data-sort') === currentSort.column) {
          indicator.textContent = currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        } else {
          indicator.textContent = '';
        }
      });

      // Sort the transactions array
      transactions.sort((a, b) => {
        let aValue, bValue;

        if (column === 'date') {
          aValue = a.date.seconds;
          bValue = b.date.seconds;
        } else if (column === 'amount') {
          aValue = a.type === 'income' ? a.amount : -a.amount;
          bValue = b.type === 'income' ? b.amount : -b.amount;
        } else if (column === 'category') {
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
        } else {
          aValue = a[column]?.toLowerCase() || '';
          bValue = b[column]?.toLowerCase() || '';
        }

        if (currentSort.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      console.log("Transactions sorted, updating table");
      // Update the transaction list with sorted data
      listTransactions(transactions, transactionCurrentPage);
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

    // Add event listener for report generation
    document.getElementById("generateReportBtn").addEventListener("click", async () => {
      try {
        await generatePDFReport();
      } catch (error) {
        console.error("Error generating report:", error);
        alert("Failed to generate report. Please try again.");
      }
    });

    // Add event listener for Add Transaction button
    document.getElementById("addTransactionBtn").addEventListener("click", () => {
      const modal = document.getElementById("addTransactionModal");
      document.getElementById("transactionAmount").value = "";
      document.getElementById("transactionType").value = "income";
      document.getElementById("transactionType").disabled = false;
      document.getElementById("transactionCategory").value = "";
      document.getElementById('selectedCategory').textContent = "Select category";
      document.getElementById("transactionDate").value = new Date().toISOString().split('T')[0];
      document.querySelector("#addTransactionModal h2").textContent = "Add New Transaction";
      document.getElementById("saveTransaction").textContent = "Save";
      // Clear any stored transaction ID for editing
      document.getElementById("saveTransaction").dataset.transactionId = "";
      showModal(modal);
    });

    // Add event listener for Cancel button
    document.getElementById("cancelTransaction").addEventListener("click", () => {
      const modal = document.getElementById("addTransactionModal");
      hideModal(modal);
    });

    // Add event listener for Save button
    document.getElementById("saveTransaction").addEventListener("click", async () => {
      const amount = parseFloat(document.getElementById("transactionAmount").value);
      const type = document.getElementById("transactionType").value;
      const category = document.getElementById("transactionCategory").value;
      const date = document.getElementById("transactionDate").value;
      const transactionId = document.getElementById("saveTransaction").dataset.transactionId;

      // Validate inputs
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
      }
      if (!category) {
        alert("Please select a category");
        return;
      }
      if (!date) {
        alert("Please select a date");
        return;
      }

      try {
        if (transactionId) {
          // Update existing transaction
          await ref.updateTransaction(
            amount,
            category,
            new Date(date),
            type,
            transactionId,
            uid
          );
        } else {
          // Add new transaction
          await ref.addTransaction(
            amount,
            category,
            new Date(date),
            type,
            uid
          );
        }

        // Hide modal and refresh transaction list
        const modal = document.getElementById("addTransactionModal");
        hideModal(modal);
        
        // Refresh transactions
        transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
        listTransactions(transactions, transactionCurrentPage);
        
        // Update dashboard cards
        await updateDashboardCards();
        
        // Update balance chart
        await plotBalanceChart();
      } catch (error) {
        console.error("Error saving transaction:", error);
        alert("Failed to save transaction. Please try again.");
      }
    });

    // test();
    // testGoals();

    // Add event listener for transaction type change
    document.getElementById("transactionType").addEventListener("change", (e) => {
      updateCategoryOptions(e.target.value);
    });

    // Initialize with a slight delay to allow for smooth animations
    await new Promise(resolve => setTimeout(resolve, 100));

    await updateCategoryOptions('income');
    transactions = await ref.access(uid, 'transaction')
    transactions = process.sortTransactions(transactions);
    transactions = sortTransactions(transactions, "date", false)

    // Update UI elements with a staggered delay
    setTimeout(() => {
      listTransactions(transactions, transactionCurrentPage);
      // Add sorting handlers after the table is populated
      addSortingHandlers();
    }, 200);

    document.getElementById("searchInput").addEventListener("input", () => {
      transactionCurrentPage = 1;
      listTransactions(transactions, transactionCurrentPage);
    });

    // Setup filter buttons with a slight delay
    setTimeout(() => {
      setupFilterButtons();
    }, 300);

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

    // Animate the initial values with a staggered delay
    setTimeout(() => {
      const finalBalance = balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;
      animateNumber(document.getElementById("balance"), 0, finalBalance);
    }, 400);

    setTimeout(() => {
      animateNumber(document.getElementById("income"), 0, totalIncome);
    }, 500);

    setTimeout(() => {
      animateNumber(document.getElementById("expenses"), 0, totalExpense);
    }, 600);

    // Plot the initial chart with a slight delay
    setTimeout(async () => {
      await plotBalanceChart();
    }, 700);

    // Initialize modals and other UI elements
    setTimeout(() => {
      initializeCustomDropdown();
      progressCarousel();
    }, 800);

    // Set initial active state with a delay
    setTimeout(() => {
      document.querySelector('[data-value="all"]').classList.add("active");
      setDefaultFilter();
    }, 900);

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
 * Test function to generate sample student transaction data
 * Creates 2 years of realistic student financial data including:
 * - Part-time job income
 * - Student loan disbursements
 * - Rent and utilities
 * - Groceries and food
 * - School supplies and textbooks
 * - Transportation costs
 * - Entertainment and personal expenses
 */
window.test = async () => {
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);

  // Base monthly income and expenses
  const partTimeJob = 500; // Monthly part-time job income
  const studentLoan = 2000; // Student loan disbursement (every semester)
  const rent = 450; // Monthly rent
  const utilities = 50; // Monthly utilities
  const groceries = 100; // Monthly groceries
  const transportation = 50; // Monthly transportation
  const entertainment = 60; // Monthly entertainment
  const schoolSupplies = 120; // School supplies per semester

  // Helper function to create pseudo-random variations
  const createVariation = (base, month, maxVariation) => {
    // Use month number to create a predictable but seemingly random pattern
    const monthFactor = (month % 12) + 1;
    const dayFactor = new Date().getDate();
    const variation = Math.sin(monthFactor * dayFactor) * maxVariation;
    return Math.round(base + variation);
  };

  // Loop through each month from 2 years ago until today
  for (let d = new Date(twoYearsAgo); d <= today; d.setMonth(d.getMonth() + 1)) {
    const month = d.getMonth();
    const year = d.getFullYear();

    // Part-time job income with controlled variations
    const jobAmount = createVariation(partTimeJob, month, 30);
    await ref.addTransaction(
      jobAmount,
      "Part-time Job",
      new Date(d),
      "income",
      uid
    );

    // Student loan disbursement (every 4 months)
    if (month % 4 === 0) {
      const loanAmount = createVariation(studentLoan, month, 80);
      await ref.addTransaction(
        loanAmount,
        "Student scholarship",
        new Date(d),
        "income",
        uid
      );
    }

    // Regular monthly expenses with controlled variations
    const rentAmount = createVariation(rent, month, 20);
    await ref.addTransaction(rentAmount, "Rent", new Date(d), "expense", uid);
    
    // Utilities with seasonal variation
    const seasonalFactor = month >= 5 && month <= 8 ? 1.15 : month >= 11 || month <= 2 ? 1.2 : 1;
    const utilitiesAmount = Math.round(utilities * seasonalFactor);
    await ref.addTransaction(utilitiesAmount, "Utilities", new Date(d), "expense", uid);
    
    // Weekly grocery trips with controlled variations
    for (let week = 0; week < 4; week++) {
      const groceryDate = new Date(d);
      groceryDate.setDate(d.getDate() + (week * 7));
      const groceryAmount = createVariation(groceries/4, month + week, 5);
      await ref.addTransaction(
        groceryAmount,
        "Groceries",
        groceryDate,
        "expense",
        uid
      );
    }

    // Transportation costs with controlled variations
    for (let week = 0; week < 4; week++) {
      const transportDate = new Date(d);
      transportDate.setDate(d.getDate() + (week * 7));
      const transportAmount = createVariation(transportation/4, month + week, 3);
      await ref.addTransaction(
        transportAmount,
        "Transportation",
        transportDate,
        "expense",
        uid
      );
    }

    // Monthly entertainment expenses with controlled variations
    const entertainmentAmount = createVariation(entertainment, month, 10);
    await ref.addTransaction(
      entertainmentAmount,
      "Entertainment",
      new Date(d),
      "expense",
      uid
    );

    // School supplies (every 4 months)
    if (month % 4 === 0) {
      const suppliesAmount = createVariation(schoolSupplies, month, 20);
      await ref.addTransaction(
        suppliesAmount,
        "School Supplies",
        new Date(d),
        "expense",
        uid
      );
    }

    // Random personal expenses (1-2 times per month)
    const numPersonalExpenses = 1 + (month % 2); // Alternates between 1 and 2
    for (let i = 0; i < numPersonalExpenses; i++) {
      const expenseDate = new Date(d);
      expenseDate.setDate(d.getDate() + (i * 14 + 7)); // Spreads expenses evenly
      const personalAmount = createVariation(30, month + i, 15);
      await ref.addTransaction(
        personalAmount,
        "Personal expenses",
        expenseDate,
        "expense",
        uid
      );
    }
  }
};

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
    
    // Store the transaction ID for updating
    document.getElementById("saveTransaction").dataset.transactionId = transactionToEdit.id;
    
    showModal(modal);
  }
};

// Update the progressCarousel function
const progressCarousel = async () => {
  try {
    // Wait for DOM elements to be available
    const checkElements = () => {
      const slides = document.querySelector('.progress-slides');
      const dots = document.querySelector('.progress-dots');
      const prevBtn = document.getElementById('prevProgress');
      const nextBtn = document.getElementById('nextProgress');
      const carousel = document.querySelector('.progress-carousel');
      
      if (!slides || !dots || !prevBtn || !nextBtn || !carousel) {
        return null;
      }
      
      return { slides, dots, prevBtn, nextBtn, carousel };
    };

    const elements = checkElements();
    if (!elements) {
      console.log('Carousel elements not found, retrying in 100ms...');
      setTimeout(progressCarousel, 100);
      return;
    }

    const { slides, dots, prevBtn, nextBtn, carousel } = elements;
    
    let currentSlide = 0;
    let autoAdvanceInterval = null;
    let isTransitioning = false;
    let slideCount = 0;

    // Update slide position and active state
    const updateSlide = () => {
      if (isTransitioning) return;
      isTransitioning = true;
      
      slides.style.transform = `translateX(-${currentSlide * 100}%)`;
      
      // Update active state for slides
      const slideElements = document.querySelectorAll('.progress-slide');
      slideElements.forEach((slide, index) => {
        if (index === currentSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
      
      // Update dots
      const dotElements = document.querySelectorAll('.progress-dot');
      dotElements.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
      });

      // Reset transition flag after animation
      setTimeout(() => {
        isTransitioning = false;
      }, 500);
    };

    // Update progress bars with actual balance data
    const updateProgressBars = async () => {
      try {
        // Check if elements still exist
        const elements = checkElements();
        if (!elements) {
          console.log('Carousel elements not found during update');
          return;
        }

        const { slides, dots } = elements;
        const balance = parseInt(document.getElementById("balance").innerHTML.replace(/[^0-9-]/g, '')) || 0;
        
        // Fetch goals from Firestore
        const goalsSnapshot = await db.collection('users').doc(uid).collection('goals').get();
        const goals = goalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (goals.length === 0) {
          console.log('No goals found');
          return;
        }

        // Sort goals by creation date
        goals.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);

        // Clear existing slides and dots
        slides.innerHTML = '';
        dots.innerHTML = '';

        // Create slides for each goal
        goals.forEach((goal, index) => {
          const progress = Math.min((balance / goal.target) * 100, 100);
          const isCompleted = balance >= goal.target;

          const slide = document.createElement('div');
          slide.className = 'progress-slide min-w-full bg-[#f8fafc] rounded-xl p-6';
          slide.innerHTML = `
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-xl font-semibold text-gray-800">${goal.name}</h3>
              <span class="text-xl font-semibold text-blue-600 progress-percent">
                ${isCompleted ? '✓' : `${Math.round(progress)}%`}
              </span>
            </div>
            <div class="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full progress-gradient" style="width: ${progress}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-4 text-sm">
              <span class="text-gray-600 progress-current">$${formatNumberWithCommas(balance)}</span>
              <span class="text-gray-600 progress-goal">Goal: $${formatNumberWithCommas(goal.target)}</span>
            </div>
          `;
          slides.appendChild(slide);

          // Create dot for this slide
          const dot = document.createElement('button');
          dot.className = `progress-dot w-2 h-2 rounded-full bg-gray-300 transition-colors ${index === currentSlide ? 'bg-blue-500' : ''}`;
          dot.addEventListener('click', () => {
            if (isTransitioning) return;
            clearInterval(autoAdvanceInterval);
            currentSlide = index;
            updateSlide();
            startAutoAdvance();
          });
          dots.appendChild(dot);
        });

        // Update slide count
        slideCount = goals.length;
        if (currentSlide >= slideCount) {
          currentSlide = 0;
        }

        updateSlide();

      } catch (error) {
        console.error('Error updating progress bars:', error);
      }
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

    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', () => {
      clearInterval(autoAdvanceInterval);
    });

    carousel.addEventListener('mouseleave', () => {
      startAutoAdvance();
    });

    // Initialize first slide and start auto-advance
    await updateProgressBars();
    startAutoAdvance();

    // Update progress bars whenever balance changes
    const balanceElement = document.getElementById("balance");
    if (balanceElement) {
      const observer = new MutationObserver(updateProgressBars);
      observer.observe(balanceElement, { characterData: true, childList: true, subtree: true });
    }

  } catch (error) {
    console.error('Error initializing carousel:', error);
  }
};

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  progressCarousel();
});

// Initialize chatbot functionality
const initializeChatbot = () => {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbox = document.getElementById('chatbox');
  const chatboxClose = document.getElementById('chatboxClose');

  if (!chatbotToggle || !chatbox || !chatboxClose) {
    console.error('Chatbot elements not found');
    return;
  }

  // Toggle chatbox visibility
  const toggleChatbox = () => {
    if (chatbox.classList.contains('hidden')) {
      // Opening animation
      chatbox.classList.remove('hidden');
      // Small delay to allow display to be set before animation
      setTimeout(() => {
        chatbox.classList.add('opacity-0', 'scale-95');
        // Trigger reflow
        chatbox.offsetHeight;
        chatbox.classList.remove('opacity-0', 'scale-95');
      }, 50);
    } else {
      // Closing animation
      chatbox.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        chatbox.classList.add('hidden');
      }, 300); // Match the transition duration
    }
  };

  // Add click event to toggle button
  chatbotToggle.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    toggleChatbox();
  });

  // Add click event to close button
  chatboxClose.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event bubbling
    toggleChatbox();
  });

  // Close chatbox when clicking outside
  document.addEventListener('click', (e) => {
    if (!chatbox.contains(e.target) && !chatbotToggle.contains(e.target) && !chatbox.classList.contains('hidden')) {
      toggleChatbox();
    }
  });
};

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeChatbot();
});

// Function to set default filter state
const setDefaultFilter = () => {
    // Set default filter value
    filterValue = "all";
    
    // Update UI to reflect default filter
    document.querySelectorAll("#tableFilterSelect").forEach(button => {
        if (button.getAttribute("data-value") === "all") {
            button.classList.add("active", "bg-white", "shadow-sm");
            button.style.color = '#1a1a1a';
        } else {
            button.classList.remove("active", "bg-white", "shadow-sm");
            button.style.color = '';
        }
    });
    
    // Update plot filters to match
    document.querySelectorAll("#plotFilterSelect").forEach(button => {
        if (button.getAttribute("data-value") === "all") {
            button.classList.add("active", "bg-white", "shadow-sm");
            button.style.color = '#1a1a1a';
        } else {
            button.classList.remove("active", "bg-white", "shadow-sm");
            button.style.color = '';
        }
    });
    
    // Trigger filter update
    handleHistoryChange({ target: { value: "all" } });
    handlePlotHistoryChange({ target: { value: "all" } });
};

window.testGoals = async () => {
  try {
    // Get the current user's ID
    while (!uid) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Define test goals based on typical student financial needs
    const testGoals = [
      {
        name: "Emergency Fund",
        target: 5000, // 5 months of basic expenses
        current: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        name: "College Fund",
        target: 10000, // Semester abroad expenses
        current: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        name: "Spring Break Trip",
        target: 4000, // Enhanced spring break experience
        current: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        name: "New Laptop",
        target: 2500, // High-end laptop and accessories
        current: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      },
      {
        name: "Car",
        target: 25000, // Graduation expenses and job search costs
        current: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }
    ];

    // Add goals to Firestore
    const batch = db.batch();
    const goalsRef = db.collection('users').doc(uid).collection('goals');

    for (const goal of testGoals) {
      const newGoalRef = goalsRef.doc();
      batch.set(newGoalRef, goal);
    }

    await batch.commit();
    console.log('Test goals added successfully');

  } catch (error) {
    console.error('Error adding test goals:', error);
  }
};

// Chatbot functionality
const chatResponses = {
  transactions: {
    message: "📝 Transaction Management Guide:\n\n" +
             "1. Adding Transactions:\n" +
             "   - Click 'Add Transaction' button\n" +
             "   - Enter amount, select type (income/expense)\n" +
             "   - Choose category and date\n" +
             "   - Click 'Save' to record\n\n" +
             "2. Managing Transactions:\n" +
             "   - Use filter buttons to view by time period\n" +
             "   - Search specific transactions in the search bar\n" +
             "   - Sort by clicking column headers\n" +
             "   - Edit/Delete using the action buttons\n\n" +
             "3. Tips:\n" +
             "   - Regular updates help track spending\n" +
             "   - Categorize accurately for better insights\n" +
             "   - Review transactions weekly\n\n" +
             "Need help with a specific transaction task?",
    action: () => {
      document.querySelector('.transaction-table').scrollIntoView({ behavior: 'smooth' });
    }
  },
  goals: {
    message: "🎯 Financial Goals Guide:\n\n" +
             "1. Setting Up Goals:\n" +
             "   - Click 'Add New Goal' button\n" +
             "   - Name your goal (e.g., 'New Laptop')\n" +
             "   - Set target amount\n" +
             "   - Optional: Set deadline\n" +
             "   - Click 'Save' to create\n\n" +
             "2. Tracking Progress:\n" +
             "   - View goals in the carousel above\n" +
             "   - See percentage completion\n" +
             "   - Monitor remaining amount\n" +
             "   - Track multiple goals\n\n" +
             "3. Tips:\n" +
             "   - Set realistic targets\n" +
             "   - Break large goals into smaller ones\n" +
             "   - Review progress monthly\n\n" +
             "Want to learn more about goal strategies?",
    action: () => {
      document.querySelector('.progress-carousel').scrollIntoView({ behavior: 'smooth' });
    }
  },
  reports: {
    message: "📊 Financial Reports Guide:\n\n" +
             "1. Generating Reports:\n" +
             "   - Select time period using filter buttons\n" +
             "   - Click 'Create Report' button\n" +
             "   - Report includes:\n" +
             "     • Transaction history\n" +
             "     • Balance trends\n" +
             "     • Income vs expenses\n" +
             "     • Goal progress\n\n" +
             "2. Customizing Reports:\n" +
             "   - Filter by specific date ranges\n" +
             "   - Include/exclude categories\n" +
             "   - Add custom notes\n" +
             "   - Export as PDF\n\n" +
             "3. Tips:\n" +
             "   - Generate monthly reports\n" +
             "   - Compare periods for trends\n" +
             "   - Use reports for budgeting\n\n" +
             "Need help customizing your report?",
    action: () => {
      document.querySelector('.transaction-table').scrollIntoView({ behavior: 'smooth' });
    }
  },
  other: {
    message: "💡 Wise Wallet Features Guide:\n\n" +
             "1. Dashboard Overview:\n" +
             "   - View current balance\n" +
             "   - Track income and expenses\n" +
             "   - Monitor goal progress\n" +
             "   - Access transaction history\n\n" +
             "2. Key Features:\n" +
             "   - Transaction management\n" +
             "   - Goal tracking\n" +
             "   - Financial reports\n" +
             "   - Data visualization\n\n" +
             "3. Tips:\n" +
             "   - Regular updates improve accuracy\n" +
             "   - Use filters for better insights\n" +
             "   - Set reminders for updates\n\n" +
             "What specific feature would you like to know more about?",
    action: () => {
      document.getElementById('userInput').focus();
    }
  }
};

// Show loading indicator
const showLoading = () => {
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.classList.remove('hidden');
};

// Hide loading indicator
const hideLoading = () => {
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.classList.add('hidden');
};

// Handle chat action buttons with visual feedback
document.querySelectorAll('.chat-action-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Remove active state from all buttons
    document.querySelectorAll('.chat-action-btn').forEach(btn => {
      btn.classList.remove('bg-blue-50', 'scale-105');
    });
    
    // Add active state to clicked button
    button.classList.add('bg-blue-50', 'scale-105');
    
    const action = button.getAttribute('data-action');
    const response = chatResponses[action];
    
    // Show user's choice as a question
    let question = "";
    switch(action) {
      case 'transactions':
        question = "How do I manage my transactions?";
        break;
      case 'goals':
        question = "How do I set up financial goals?";
        break;
      case 'reports':
        question = "How do I generate financial reports?";
        break;
      case 'other':
        question = "What can you help me with?";
        break;
    }
    addMessage(question, true);
    
    if (response) {
      // Show loading indicator
      showLoading();
      
      // Wait 1.5 seconds before showing response
      setTimeout(() => {
        hideLoading();
        addMessage(response.message);
        if (response.action) {
          response.action();
        }
      }, 1500);
    }
  });
});

// Handle user input with loading animation
document.getElementById('sendMessage').addEventListener('click', () => {
  const userInput = document.getElementById('userInput');
  const message = userInput.value.trim().toLowerCase();
  if (message) {
    addMessage(message, true);
    userInput.value = '';
    
    showLoading();
    
    setTimeout(() => {
      hideLoading();
      addMessage("📊 Graph Filters:\n" +
                "Use buttons above graph:\n" +
                "- All time\n" +
                "- Last year\n" +
                "- Last month\n" +
                "- Last week\n\n" +
                "Hover over points for details.");
      
      // Highlight filter buttons
      setTimeout(() => {
        const filterButtons = document.querySelectorAll('#plotFilterSelect');
        filterButtons.forEach(btn => {
          btn.classList.add('animate-pulse', 'bg-blue-50');
          setTimeout(() => {
            btn.classList.remove('animate-pulse', 'bg-blue-50');
          }, 2000);
        });
      }, 100);
    }, 1500);
  }
});

// Handle Enter key in input
document.getElementById('userInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('sendMessage').click();
  }
});

// Add message to chat with animation and formatting
const addMessage = (message, isUser = false) => {
  const chatMessages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `p-4 rounded-lg ${isUser ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'} transform transition-all duration-300 opacity-0 translate-y-2 whitespace-pre-line`;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  
  // Trigger animation
  setTimeout(() => {
    messageDiv.classList.remove('opacity-0', 'translate-y-2');
  }, 10);
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Add this new function to handle edit and delete button clicks
const setupTransactionActionButtons = () => {
  const tableBody = document.querySelector("#transactionTable tbody");
  
  // Add click event listener to the table body for event delegation
  tableBody.addEventListener("click", async (event) => {
    if (event.target.closest('.delete-btn')) {
      const deleteButton = event.target.closest('.delete-btn');
      const transactionId = deleteButton.dataset.id;
      
      // Show delete confirmation modal
      const deleteModal = document.getElementById("deleteModal");
      deleteModal.classList.remove("hidden");
      
      // Set up event listeners for the delete modal buttons
      const confirmDeleteBtn = document.getElementById("confirmDelete");
      const cancelDeleteBtn = document.getElementById("cancelDelete");
      const closeBtn = document.getElementById("closeBtn");
      
      // Remove any existing event listeners to prevent duplicates
      const newConfirmBtn = confirmDeleteBtn.cloneNode(true);
      const newCancelBtn = cancelDeleteBtn.cloneNode(true);
      const newCloseBtn = closeBtn.cloneNode(true);
      
      confirmDeleteBtn.parentNode.replaceChild(newConfirmBtn, confirmDeleteBtn);
      cancelDeleteBtn.parentNode.replaceChild(newCancelBtn, cancelDeleteBtn);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      
      // Add new event listeners
      newConfirmBtn.addEventListener("click", async () => {
        try {
          // Delete the transaction
          await ref.deleteTransaction(transactionId, uid);
          
          // Hide the modal
          deleteModal.classList.add("hidden");
          
          // Refresh transactions
          transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
          listTransactions(transactions, transactionCurrentPage);
          
          // Update dashboard cards
          await updateDashboardCards();
          
          // Update balance chart
          await plotBalanceChart();
        } catch (error) {
          console.error("Error deleting transaction:", error);
          alert("Failed to delete transaction. Please try again.");
        }
      });
      
      newCancelBtn.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
      });
      
      newCloseBtn.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
      });
      
    } else if (event.target.closest('.edit-btn')) {
      const editButton = event.target.closest('.edit-btn');
      const transactionId = editButton.dataset.id;
      
      // Find the transaction to edit
      const transactionToEdit = transactions.find(transaction => transaction.id === transactionId);
      
      if (transactionToEdit) {
        // Call the handleEdit function to edit the transaction
        await handleEdit(transactionToEdit);
      }
    }
  });
};

