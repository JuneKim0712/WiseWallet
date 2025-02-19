import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js";

const auth = firebase.auth();
let uid;

// Professional color palette
const colorPalette = [
    '#2E4057', // Navy Blue
    '#7C8DA4', // Steel Blue
    '#A9B4C2', // Light Steel Blue
    '#B7C3D1', // Pale Blue
    '#4B6584', // Slate Blue
    '#5E7494', // Dark Steel Blue
    '#8596AD', // Medium Steel Blue
    '#99A8BC', // Gray Blue
    '#6B7F9E', // Dusty Blue
    '#3D5270'  // Deep Navy
];

// Chart instances
let comparisonChart;
let trendChart;
let categoryChart;

// Update charts based on date range
const updateCharts = async (startDate, endDate) => {
    const transactions = await ref.access(uid, 'transaction');
    let filteredTransactions = transactions;

    // Apply date range filter if dates are provided
    if (startDate && endDate) {
        filteredTransactions = process.filterTransactions(transactions, startDate, endDate);
    }

    // Update Income vs Expenses Chart
    const incomeExpenseData = {
        labels: ['Income vs Expenses'],
        datasets: [
            {
                label: 'Income',          
                data: [
                    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                ],
                backgroundColor: 'rgb(75, 192, 192)' // Color for Income bars
            },
            {
                label: 'Expenses', 
                data: [
                    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                ],
                backgroundColor: 'rgb(255, 99, 132)' // Color for Expense bars
            }
        ]
    };
    
    comparisonChart.data = incomeExpenseData;
    comparisonChart.update();

    // Update Category Chart based on selected type
    const categoryType = document.getElementById('categoryType').value;
    const categoryData = {};
    filteredTransactions
        .filter(t => t.type === categoryType)
        .forEach(t => {
            categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
        });

    const sortedCategories = Object.entries(categoryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Show top 10 categories

    const categoryChartData = {
        labels: sortedCategories.map(([category]) => category),
        datasets: [{
            data: sortedCategories.map(([, amount]) => amount),
            backgroundColor: colorPalette.slice(0, sortedCategories.length),
            borderWidth: 1
        }]
    };
    categoryChart.data = categoryChartData;
    categoryChart.update();

    // Update Trend Chart
    const monthlyData = {};
    filteredTransactions.forEach(t => {
        const date = new Date(t.date.seconds * 1000);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            monthlyData[monthYear].income += t.amount;
        } else {
            monthlyData[monthYear].expense += t.amount;
        }
    });

    const trendData = {
        labels: Object.keys(monthlyData).sort(),
        datasets: [
            {
                label: 'Income',
                data: Object.keys(monthlyData).sort().map(key => monthlyData[key].income),
                borderColor: 'rgb(75, 192, 192)',
                fill: false
            },
            {
                label: 'Expenses',
                data: Object.keys(monthlyData).sort().map(key => monthlyData[key].expense),
                borderColor: 'rgb(255, 99, 132)',
                fill: false
            }
        ]
    };
    trendChart.data = trendData;
    trendChart.update();
};

// Initialize
const initialize = async () => {
    // Wait for auth
    while (!uid) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Initialize charts
    comparisonChart = new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {},
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Income vs Expenses - [Date Range]' // Dynamically update date range in title
                },
                legend: {
                    display: true,
                },
                tooltip: { // Customize tooltips
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || ''; // Get dataset label (Income or Expenses)
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y); // Format value as currency
                            }
                            return label;
                        }
                    }
                },
                datalabels: { // Example of adding a data labels plugin (you might need to install it separately)
                    display: true,
                    color: 'black', // Adjust label color
                    font: {
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); // Format data labels as currency
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function (value, index, values) {
                            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); // Format Y-axis ticks as currency, no decimals
                        }
                    }
                },
                x: {
                }
            }
        }
    });

    trendChart = new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {},
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Trends'
                }
            }
        }
    });

    categoryChart = new Chart(document.getElementById('categoryChart'), {
        type: 'pie',
        data: {},
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Category Distribution'
                },
                legend: {
                    position: 'right',
                    align: 'center'
                }
            }
        }
    });

    // Get transactions to set initial date range
    const transactions = await ref.access(uid, 'transaction');
    
    // Set date range inputs
    const endDate = new Date();
    const startDate = transactions.length > 0 
        ? new Date(Math.min(...transactions.map(t => t.date.seconds * 1000)))
        : new Date(endDate.getFullYear(), endDate.getMonth() - 1, endDate.getDate());

    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;

    // Set up event listeners
    document.getElementById('applyDateRange').addEventListener('click', () => {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        if (startDate && endDate) {
            updateCharts(startDate, endDate);
        }
    });

    document.getElementById('categoryType').addEventListener('change', () => {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        updateCharts(startDate, endDate);
    });

    document.getElementById('signOutBtn').onclick = () => 
        auth.signOut().then(() => window.location.href = '/index.html');

    // Initial chart update
    updateCharts(startDate, endDate);
};

// Auth state change handler
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        uid = user.uid;
        initialize();
    } else {
        window.location.href = '/index.html';
    }
}); 