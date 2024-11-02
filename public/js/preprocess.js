const auth = firebase.auth()
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

export const filterTransactions = (transactions, startDate, endDate) => {
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date.seconds * 1000);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
}

export const sortTransactions = (transactions) => {
    const sortedTransactions = transactions.sort((a, b) => a.date.seconds - b.date.seconds);
    return sortedTransactions
};

export const sortIncome = (income) => {
    const sortedTransactions = income.sort((a, b) => a.amount - b.amount);
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