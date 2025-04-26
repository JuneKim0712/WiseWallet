/**
 * Data processing module
 * Handles:
 * - Transaction filtering and sorting
 * - Balance calculations
 * - Date range processing
 * - Search functionality
 * - Data aggregation for reports
 */

const auth = firebase.auth()

/**
 * Generates summary of income and expenses for a given transaction range
 * @param {string} range - Time range to summarize ('week', 'month', 'year', 'all')
 * @param {Array<Object>} transaction - Array of transaction objects
 * @returns {Object} Summary containing:
 *   - totalIncome: Total income amount
 *   - totalExpense: Total expense amount
 *   - netIncome: Net income (income - expenses)
 */
export const genSummary = (range, transaction) => {
    let income = 0
    let expense = 0
    for (let i = 0; i < transaction.length; i++) {
        if (transaction[i].type == "income") {
            income += transaction[i].amount
        }
        else {
            expense += transaction[i].amount
        }
    }
    return {
        totalIncome: income,
        totalExpense: expense,
        netIncome: income - expense
    };
}

/**
 * Calculates running balance over time from transaction history
 * @param {Array<Object>} transactions - Array of transaction objects with date, amount, type
 * @returns {Array<Object>} Array of balance points containing:
 *   - date: Transaction date
 *   - amount: Running balance at that date
 */
export const genBalanceOverTime = (transactions) => {
    let balance = 0;
    let result = [];
    let currentDate = null;
    let dailyTotal = 0;

    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        if (transaction.date !== currentDate) {
            if (currentDate !== null) {
                result.push({ date: currentDate, amount: balance });
            }
            currentDate = transaction.date;
            dailyTotal = 0;
        }

        dailyTotal += transaction.type === "income" ? transaction.amount : -transaction.amount;

        if (i === transactions.length - 1 || transactions[i + 1].date !== currentDate) {
            balance += dailyTotal;
            result.push({ date: currentDate, amount: balance });
        }
    }

    return result;
}

/**
 * Generates projected balance based on recurring income and expenses
 * @param {Array<Object>} income - Array of income objects with amount and period
 * @param {Array<Object>} expense - Array of expense objects with amount and period
 * @param {number} balance - Starting balance
 * @param {number} period - Number of periods to project
 * @returns {Array<number>} Array of projected balance values
 */
export const genProjectedBalance = (income, expense, balance, period) => {
    let projection = [0];
    let incomeCounters = Array(income.length).fill(0);
    let expenseCounters = Array(expense.length).fill(0);
    for (let i = 0; i < period; i++) {
        let netIncome = 0;

        for (let j = 0; j < income.length; j++) {
            if (i % income[j].period == 0) {
                netIncome += income[j].amount
            }
        }

        for (let k = 0; k < expense.length; k++) {
            if (i % expense[k].period == 0) {
                netIncome -= expense[k].amount
            }
        }

        balance += netIncome;
        projection.push(balance);
    }
    return projection;
}

/**
 * Filters transactions within a date range
 * @param {Array<Object>} transactions - Array of transaction objects
 * @param {Date} startDate - Start date for filtering
 * @param {Date} endDate - End date for filtering
 * @returns {Array<Object>} Filtered array of transactions
 */
export const filterTransactions = (transactions, startDate, endDate) => {
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date.seconds * 1000);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
}

export const sortTransactions = (transactions) => {
    const sortedTransactions = transactions.sort((a, b) => b.date.seconds - a.date.seconds);
    return sortedTransactions
};

/**
 * Sorts transactions from oldest to newest (ascending order)
 * Used specifically for balance chart display
 * @param {Array<Object>} transactions - Array of transaction objects
 * @returns {Array<Object>} Sorted transactions from oldest to newest
 */
export const sortTransactionsForChart = (transactions) => {
    const sortedTransactions = transactions.sort((a, b) => a.date.seconds - b.date.seconds);
    return sortedTransactions;
};

export const sortIncome = (income) => {
    const sortedTransactions = income.sort((a, b) => a.amount - b.amount);
    return sortedTransactions
}

export const sortExpense = (expense) => {
    const sortedTransactions = expense.sort((a, b) => a.amount - b.amount);
    return sortedTransactions
}

export const searchTransactions = (transactions, searchValue) => {
    // Convert search value to lowercase for case-insensitive matching
    searchValue = searchValue.toLowerCase();

    return transactions.filter(transaction => {
        const dateStr = new Date(transaction.date.seconds * 1000).toISOString().split('T')[0];
        return (
            transaction.category.toLowerCase().includes(searchValue) ||
            String(transaction.amount).includes(searchValue) ||
            dateStr.includes(searchValue)
        );
    });
};

export const applyFilterTransactions = (transactions, selectedRange) => {
    const now = new Date();
    let startDate = new Date();
    const endDate = now;

    switch (selectedRange) {
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
            return transactions;
    }

    return filterTransactions(transactions, startDate, endDate);
};

/**
 * Validates transaction dates based on various rules
 * @param {Date} inputDate - Date to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowFuture - Whether to allow future dates (default: false)
 * @param {Date} options.minDate - Minimum allowed date (optional)
 * @param {Date} options.maxDate - Maximum allowed date (optional)
 * @returns {Object} Validation result containing:
 *   - isValid: boolean indicating if date is valid
 *   - message: error message if invalid, empty string if valid
 */
export const validateTransactionDate = (inputDate, options = {}) => {
    const {
        allowFuture = false,
        minDate = null,
        maxDate = null
    } = options;

    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of current day

    // Check if date is valid
    if (!(inputDate instanceof Date) || isNaN(inputDate)) {
        return {
            isValid: false,
            message: "Invalid date format"
        };
    }

    // Check future date
    if (!allowFuture && inputDate > now) {
        return {
            isValid: false,
            message: "Future dates are not allowed"
        };
    }

    // Check minimum date if specified
    if (minDate && inputDate < minDate) {
        return {
            isValid: false,
            message: `Date must be after ${minDate.toLocaleDateString()}`
        };
    }

    // Check maximum date if specified
    if (maxDate && inputDate > maxDate) {
        return {
            isValid: false,
            message: `Date must be before ${maxDate.toLocaleDateString()}`
        };
    }

    return {
        isValid: true,
        message: ""
    };
};