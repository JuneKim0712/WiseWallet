// import jsPDF from 'jspdf'; // If using npm, uncomment this line
// import 'jspdf-autotable'; // If using npm and autotable, uncomment this line (and ensure it's installed: npm install jspdf jspdf-autotable)

import * as process from "./preprocess.js";
import * as ref from "./db.js";

document.getElementById('generateReportBtn').addEventListener('click', generatePDFReport);

async function generatePDFReport() {

    console.log("Generate Report button clicked! Function started."); // ADD THIS LINE

    // 1. Initialize jsPDF document
    const pdfDoc = new jspdf.jsPDF(); // Access jsPDF as a global object namespace

    // --- Header Section ---
    pdfDoc.setFontSize(24);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text("Personal Finance Report", 20, 30); // Main title

    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'normal');


    // --- Summary Figures Section ---
    // --- Calculate Summary Figures
    const uid = firebase.auth().currentUser?.uid; // Get current user's uid
    if (!uid) {
        console.error("Error: User not authenticated. Cannot generate report.");
        alert("User not authenticated. Please sign in to generate a report."); // Optional user feedback
        return; // Stop PDF generation if no uid
    }

    const transactions = await ref.access(uid, 'transaction'); // Fetch transactions in report.js
    const balanceOverTimeData = process.genBalanceOverTime(transactions);
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
    const balanceValue = balanceOverTimeData.length > 0 ? balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;
    const incomeValue = totalIncome;
    const expensesValue = totalExpense;

    let yPosition = 70; // Starting Y position for summary section

    pdfDoc.text(`Account Balance: $${balanceValue}`, 20, yPosition); // Use calculated balanceValue
    yPosition += 10;
    pdfDoc.text(`Total Income: $${incomeValue}`, 20, yPosition); // Use calculated incomeValue
    yPosition += 10;
    pdfDoc.text(`Total Expenses: $${expensesValue}`, 20, yPosition); // Use calculated expensesValue


    // --- Balance Over Time Chart Data Preparation (from charts.js) ---
    const chartTransactions = await ref.access(uid, 'transaction'); // Fetch transactions again if needed in report.js, or reuse if already fetched
    const monthlyData = {};
    chartTransactions.forEach(t => {
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

    const trendChartData = {
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
    // --- End of Chart Data Preparation ---

    // --- Generate Chart Image (using Chart.js) ---
    const chartCanvas = document.createElement('canvas'); // Create a canvas element in memory
    chartCanvas.width = 400;  // Set chart width (adjust as needed)
    chartCanvas.height = 200; // Set chart height (adjust as needed)
    const chartCtx = chartCanvas.getContext('2d');

    const pdfTrendChart = new Chart(chartCtx, { // Create Chart.js instance, but on our in-memory canvas
        type: 'line',
        data: trendChartData, // Use the chart data we prepared
        options: {
            responsive: false, // Set responsive to false for fixed size
            plugins: {
                legend: { display: false }, // Hide legend in PDF chart (optional)
                title: {
                    display: true,
                    text: 'Balance Over Time' // Chart title in PDF
                }
            },
            scales: {
                x: {
                    title: { display: false } // Hide X-axis title in PDF (optional)
                },
                y: {
                    title: { display: false } // Hide Y-axis title in PDF (optional)
                }
            }
        }
    });

    const chartImageData = chartCanvas.toDataURL('image/png'); // Get chart as PNG data URL
    // --- End of Chart Image Generation ---


    // --- Filters and Search Information Section ---
    yPosition += 20; // Add space before filters section
    pdfDoc.text("Report Filters:", 20, yPosition);
    yPosition += 10;

    // Get filter and search values from your UI elements (adjust selectors as needed)
    const selectedFilter = "All Time"; // Hardcode a filter value (e.g., "All Time")
    const searchTerm = ""; // Hardcode an empty search term (for now)

    pdfDoc.text(`  Date Range Filter: ${selectedFilter}`, 20, yPosition);
    yPosition += 10;
    if (searchTerm) {
        pdfDoc.text(`  Search Term: "${searchTerm}"`, 20, yPosition);
        yPosition += 10;
    }


    // --- Transactions Table Section ---
    yPosition += 20; // Add space before transactions table

    pdfDoc.setFontSize(14);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.text("Transactions", 20, yPosition); // Transactions section title
    pdfDoc.setFontSize(12);
    pdfDoc.setFont('helvetica', 'normal');
    yPosition += 10;


    // *** IMPORTANT: Replace this example data with your actual displayedTransactions array ***
    const displayedTransactions = [
        { date: '2025-02-11', amount: '11000', category: 'Insurance bills' },
        { date: '2025-02-11', amount: '11000', category: 'Insurance bills' },
        { date: '2025-02-11', amount: '4950', category: 'Utilities' },
        // ... Add more example transaction objects or replace with your real data
    ];


    const tableColumns = ["Date", "Amount", "Category"];
    const tableRows = transactions.map(transaction => [ // USE FETCHED TRANSACTIONS DATA HERE!
        new Date(transaction.date.seconds * 1000).toISOString().split('T')[0], // Format date
        transaction.amount,
        transaction.category
    ]);


    pdfDoc.autoTable({ // Use jsPDF-autotable plugin for table generation
        startY: yPosition + 10,
        head: [tableColumns],
        body: tableRows,
        margin: { left: 20, right: 20 },
    });


    // --- Embed Chart Image in PDF ---
    yPosition += 20; // Add space before chart
    pdfDoc.text("Balance Over Time Chart:", 20, yPosition); // Chart section title
    yPosition += 10;

    pdfDoc.addImage(chartImageData, 'PNG', 20, yPosition, 180, 100); // Embed chart image
    yPosition += 100; // Move yPosition down after chart (adjust based on chart height)
    // --- End of Chart Image Embedding ---


    // 4. Save the PDF (downloads it to the user's computer)
    pdfDoc.save('personal_finance_report.pdf');
}