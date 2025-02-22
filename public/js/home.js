import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js"
import { generatePDFReport } from "./report.js";

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
  "Rent",
  "Insurance/bills",
  "Utilities", "Subscription",
  "Groceries",
  "Personal expenses",
  "Other"
];


let transactions;

// Pagination variables for Transaction Table
let transactionCurrentPage = 1;
const transactionItemsPerPage = 6; // You can adjust this value


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

  const balanceOverTimeData = process.genBalanceOverTime(filteredTransactions, selectedValue);

  if (selectedValue === "month") {
    // For monthly view, show daily labels
    const dailyBalanceData = balanceOverTimeData.map(item => ({
      ...item,
      monthLabel: new Date(item.date.seconds * 1000)
        .toLocaleString('default', { day: '2-digit', month: 'short' })
    }));
    plot.plotBalance(balanceCharts, dailyBalanceData);
  } else if (selectedValue === "all" || selectedValue === "year") {
    // For year/all view, show monthly labels
    const monthlyBalances = {};
    balanceOverTimeData.forEach(item => {
      const date = new Date(item.date.seconds * 1000);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyBalances[monthYear] = {
        ...item,
        monthLabel: date.toLocaleString('default', { month: 'short', year: '2-digit' })
      };
    });
    let monthlyBalanceData = Object.values(monthlyBalances);

    if (selectedValue === "year") {
      const currentDate = new Date();
      const startOfYear = new Date(currentDate);
      startOfYear.setFullYear(currentDate.getFullYear() - 1);
      startOfYear.setMonth(currentDate.getMonth());
      startOfYear.setDate(1);

      monthlyBalanceData = monthlyBalanceData.filter(item => {
        const itemDate = new Date(item.date.seconds * 1000);
        return itemDate >= startOfYear && itemDate <= currentDate;
      });
    }
    plot.plotBalance(balanceCharts, monthlyBalanceData);
  } else {
    // For week view, use default balance data
    plot.plotBalance(balanceCharts, balanceOverTimeData);
  }
};


const listTransactions = (currentTransactionData, page) => { // Added page parameter
  const tableBody = document.querySelector("#transactionTable tbody");
  const searchValue = document.getElementById("searchInput").value;
  tableBody.innerHTML = "";

  let filteredTransactions = process.applyFilterTransactions(currentTransactionData, filterValue);
  filteredTransactions = process.searchTransactions(filteredTransactions, searchValue);

  // Pagination logic
  const startIndex = (page - 1) * transactionItemsPerPage;
  const endIndex = startIndex + transactionItemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalTransactions = filteredTransactions.length; // Total items for pagination

  // Transactions will be listed here
  paginatedTransactions.forEach((transaction, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td class="p-4 border border-gray-300">${new Date(transaction.date.seconds * 1000).toISOString().split('T')[0]}</td>
                    <td class="p-4 border border-gray-300" style="color: ${transaction.type === 'income' ? 'green' : 'red'}">${transaction.amount}</td>
                    <td class="p-4 border border-gray-300 border-r-0">${transaction.category}</td>
                    <td class="p-4 border border-gray-300 border-l-0">
                        <button class="edit-btn cursor-pointer mr-3" data-transaction-id="${transaction.id}"><svg xmlns="http://www.w3.org/2000/svg" 
                        // fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button data-id="${transaction.id}" class="delete-btn cursor-pointer"><svg data-id="${transaction.id}" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                    </td>
                `;
    tableBody.appendChild(row);
  });

  // Update pagination controls
  updateTransactionPaginationControls(totalTransactions, page);

  // Modal setup (moved to initialize function)
};

// New pagination control function for Transaction Table
const updateTransactionPaginationControls = (totalItems, currentPage) => {
  const totalPages = Math.ceil(totalItems / transactionItemsPerPage);
  let paginationHTML = '';

  if (totalPages > 1) {
    paginationHTML += `<button id="transactionPrevPage" class="pagination-button ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>&laquo; Previous</button>`;
    paginationHTML += `<span>Page ${currentPage} of ${totalPages}</span>`;
    paginationHTML += `<button id="transactionNextPage" class="pagination-button ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
  }

  const paginationDiv = document.getElementById('transactionPagination');
  if (paginationDiv) {
    paginationDiv.innerHTML = paginationHTML;

    // Add event listeners
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

const formatNumberWithCommas = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const initialize = async () => {
  try {
    while (!uid) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    //test();
    transactions = await ref.access(uid, 'transaction')
    transactions = process.sortTransactions(transactions);
    transactions = sortTransactions(transactions, "date", false)


    listTransactions(transactions, transactionCurrentPage);

    document.getElementById("searchInput").addEventListener("input", () => {
      transactionCurrentPage = 1; // Reset pagination on search
      listTransactions(transactions, transactionCurrentPage);
    });
    document.getElementById("selectRangeHistory").addEventListener("change", handleHistoryChange);
    document.querySelectorAll("#filterSelect").forEach(button => {
      button.addEventListener("click", function () {
        filterValue = this.getAttribute("data-value");
        transactionCurrentPage = 1; // Reset pagination on filter
        listTransactions(transactions, transactionCurrentPage);
      });
    });
    document.getElementById("signOutBtn").onclick = () => auth.signOut().then(() => window.location.href = '/index.html');

    addSortingHandlers();

    const balanceOverTimeData = process.genBalanceOverTime(transactions)
    let totalIncome = 0;
    let totalExpense = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date.seconds * 1000);
      if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
        if (transaction.type === "income") {
          totalIncome += transaction.amount;
        } else if (transaction.type === "expense") {
          totalExpense += transaction.amount;
        }
      }
    });
    document.getElementById("balance").innerHTML = `$${formatNumberWithCommas(balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0)}`; // Display balance, handle empty data
    document.getElementById("income").innerHTML = `$${formatNumberWithCommas(totalIncome)}`;
    document.getElementById("expenses").innerHTML = `$${formatNumberWithCommas(totalExpense)}`;
    plotBalanceChart();

    // Modal setup (moved here to initialize)
    const modal = document.getElementById("deleteModal");
    const cancelBtn = document.getElementById("cancelDelete");
    const confirmBtn = document.getElementById("confirmDelete");
    const closeBtn = document.getElementById("closeBtn");
    const addModal = document.getElementById("addTransactionModal")
    let transactionIdToDelete;
    let transactionIdToEdit = null; // Variable to store transaction ID for editing

    document.getElementById("addTransactionBtn").addEventListener("click", async () => {
      addModal.classList.remove("hidden");
      // Clear form fields when adding new transaction
      document.getElementById("transactionAmount").value = '';
      document.getElementById("transactionCategory").value = '';
      document.getElementById("transactionDate").value = '';
      document.getElementById("transactionType").value = 'income'; // default to income, or set to empty if no default is preferred
      document.querySelector("#addTransactionModal h2").textContent = "Add New Transaction"; // Change modal title
      document.getElementById("saveTransaction").textContent = "Save"; // Change button text
      transactionIdToEdit = null; // Clear edit ID
    })

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
      document.getElementById("addTransactionModal").classList.add("hidden");


      if (transactionIdToEdit) {
        // Update existing transaction
        await ref.updateTransaction(amount, category, date, type, transactionIdToEdit, uid);
      } else {
        // Add new transaction
        await ref.addTransaction(amount, category, date, type, uid);
      }

      transactions = await ref.access(uid, 'transaction');
      transactions = sortTransactions(transactions, sortType, sortDirection === 'asc')
      listTransactions(transactions, transactionCurrentPage);

      updateDashboardCards(); // Update dashboard cards if necessary
      plotBalanceChart();     // Update balance chart if necessary

      transactionIdToEdit = null; // Clear transactionIdToEdit after operation
    });

    document.getElementById("cancelTransaction").addEventListener("click", () => {
      document.getElementById("addTransactionModal").classList.add("hidden");
      transactionIdToEdit = null; // Clear edit ID when cancelling
    });

    document.querySelector("#transactionTable tbody").addEventListener("click", (event) => {
      if (event.target.closest('.delete-btn')) {
        const deleteButton = event.target.closest('.delete-btn');
        transactionIdToDelete = deleteButton.dataset.id;
        modal.classList.remove("hidden");
      } else if (event.target.closest('.edit-btn')) {
        const editButton = event.target.closest('.edit-btn');
        const transactionId = editButton.dataset.transactionId;
        transactionIdToEdit = transactionId; // Set transactionIdToEdit

        const transactionToEdit = transactions.find(transaction => transaction.id === transactionId);
        if (transactionToEdit) {
          // Populate modal with transaction data
          document.getElementById("transactionAmount").value = transactionToEdit.amount;
          document.getElementById("transactionCategory").value = transactionToEdit.category;
          document.getElementById("transactionDate").value = new Date(transactionToEdit.date.seconds * 1000).toISOString().split('T')[0];
          document.getElementById("transactionType").value = transactionToEdit.type;
          document.querySelector("#addTransactionModal h2").textContent = "Edit Transaction"; // Change modal title
          document.getElementById("saveTransaction").textContent = "Update"; // Change button text
          addModal.classList.remove("hidden"); // Show the modal for editing
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
          listTransactions(transactions, transactionCurrentPage); // Re-list with current page
          updateDashboardCards(); // Update dashboard cards if necessary
          plotBalanceChart();     // Update balance chart if necessary
        } catch (error) {
          console.error("Error deleting transaction:", error);
        }
        modal.classList.add("hidden");
        transactionIdToDelete = null;
      }
    });

    // Add report generation handler
    document.getElementById("generateReportBtn").addEventListener("click", generatePDFReport);

  } catch (error) {
    console.error("Error initializing data:", error);
  }
};


initialize().then(() => {
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
})

const updateDashboardCards = async () => {
  transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
  const balanceOverTimeData = process.genBalanceOverTime(transactions)
  let totalIncome = 0;
  let totalExpense = 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date.seconds * 1000);
    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else if (transaction.type === "expense") {
        totalExpense += transaction.amount;
      }
    }
  });
  document.getElementById("balance").innerHTML = `$${formatNumberWithCommas(balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0)}`; // Display balance, handle empty data
  document.getElementById("income").innerHTML = `$${formatNumberWithCommas(totalIncome)}`;
  document.getElementById("expenses").innerHTML = `$${formatNumberWithCommas(totalExpense)}`;

}

const plotBalanceChart = async () => {
    transactions = process.sortTransactions(await ref.access(uid, 'transaction'));
    const balanceOverTimeData = process.genBalanceOverTime(transactions);
    
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

    plot.plotBalance(balanceCharts, monthlyBalanceData);
}


const test = async () => {
  while (!uid) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

    for (let i = 1; i < 12; i++) {
      for (let j = 1; j < 28; j++) {
        await ref.addTransaction((i * j * 900) / 2, transactionCategories[(i + 1) % 3], new Date(2024, i, j), "expense", uid);
        await ref.addTransaction(i * j * 1000, transactionCategories[i % 3], new Date(2024, i, j), "income", uid);
      }
    } 
  for (let i = 1; i < 2; i++) {
    for (let j = 1; j < 12; j++) {
      await ref.addTransaction((i * j * 900) / 2, transactionCategories[i + 1 % 3], new Date(2025, i, j), "expense", uid);
      await ref.addTransaction(i * j * 1000, transactionCategories[i % 3], new Date(2025, i, j), "income", uid);
    }
  }
}