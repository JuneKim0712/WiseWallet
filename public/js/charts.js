import * as ref from "./db.js";
import * as plot from "./plot.js"; // Ensure plot.js is actually used somewhere, otherwise remove

const auth = firebase.auth();
let uid;

// Professional color palette
const colorPalette = [
    '#2E4057', '#7C8DA4', '#A9B4C2', '#B7C3D1', '#4B6584',
    '#5E7494', '#8596AD', '#99A8BC', '#6B7F9E', '#3D5270'
];

let comparisonChart, trendChart, categoryChart;

const updateCharts = async (startDate, endDate) => {
    if (!uid) return;

    const transactions = await ref.access(uid, 'transaction');
    let filteredTransactions = transactions;

    if (startDate && endDate) {
        filteredTransactions = filteredTransactions.filter(t => {
            const date = new Date(t.date.seconds * 1000);
            return date >= startDate && date <= endDate;
        });
    }

    // Income vs Expenses Data
    const incomeExpenseData = {
        labels: ['Income vs Expenses'],
        datasets: [
            {
                label: 'Income',
                data: [filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)],
                backgroundColor: 'rgb(75, 192, 192)'
            },
            {
                label: 'Expenses',
                data: [filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)],
                backgroundColor: 'rgb(255, 99, 132)'
            }
        ]
    };
    
    if (comparisonChart) {
        comparisonChart.data = incomeExpenseData;
        comparisonChart.update();
    }

    // Category Chart Data
    const categoryType = document.getElementById('categoryType').value;
    const categoryData = {};

    filteredTransactions
        .filter(t => t.type === categoryType)
        .forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const categoryChartData = {
        labels: sortedCategories.map(([category]) => category),
        datasets: [{
            data: sortedCategories.map(([, amount]) => amount),
            backgroundColor: colorPalette.slice(0, sortedCategories.length),
            borderWidth: 1
        }]
    };

    if (categoryChart) {
        categoryChart.data = categoryChartData;
        categoryChart.update();
    }

    // Trend Chart Data
    const monthlyData = {};
    filteredTransactions.forEach(t => {
        const date = new Date(t.date.seconds * 1000);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + t.amount;
    });

    const trendData = {
        labels: Object.keys(monthlyData).sort(),
        datasets: [{ 
            label: 'Transactions Over Time', 
            data: Object.values(monthlyData), 
            borderColor: 'rgb(54, 162, 235)', 
            tension: 0.3 
        }]
    };

    if (trendChart) {
        trendChart.data = trendData;
        trendChart.update();
    }
};

// Initialize Charts
const initialize = async () => {
    while (!uid) await new Promise(resolve => setTimeout(resolve, 100));

    const ctxComparison = document.getElementById('comparisonChart');
    if (ctxComparison) {
        comparisonChart = new Chart(ctxComparison, {
            type: 'bar',
            data: {},
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Income vs Expenses - [Date Range]' },
                    legend: { display: true }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Amount ($)' },
                        ticks: { callback: value => `$${value.toFixed(2)}` }
                    }
                }
            }
        });
    }

    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {},
            options: {
                responsive: true,
                plugins: { title: { display: true, text: 'Monthly Trends' } }
            }
        });
    }

    const ctxCategory = document.getElementById('categoryChart');
    if (ctxCategory) {
        categoryChart = new Chart(ctxCategory, {
            type: 'pie',
            data: {},
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { title: { display: true, text: 'Category Distribution' } }
            }
        });
    }

    // Fetch transactions to set the initial date range
    const transactions = await ref.access(uid, 'transaction');
    const endDate = new Date();
    const startDate = transactions.length > 0
        ? new Date(Math.min(...transactions.map(t => t.date.seconds * 1000)))
        : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());

    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;

    document.getElementById('applyDateRange')?.addEventListener('click', () => {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        updateCharts(startDate, endDate);
    });

    document.getElementById('categoryType')?.addEventListener('change', () => {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        updateCharts(startDate, endDate);
    });

    document.getElementById('signOutBtn')?.addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = '/index.html');
    });

    updateCharts(startDate, endDate);
};

// Auth State Change Handler
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        uid = user.uid;
        initialize();
    } else {
        window.location.href = '/index.html';
    }
});
