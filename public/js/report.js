/**
 * Financial Report Generation Module
 * Generates PDF reports with charts and transaction analysis
 */

// main.js
// import jsPDF from 'jspdf'; // If using npm, uncomment this line
// import 'jspdf-autotable'; // If using npm and autotable, uncomment this line (and ensure it's installed: npm install jspdf jspdf-autotable)

import * as process from "./preprocess.js";
import * as ref from "./db.js";
import * as plot from "./plot.js";

// Add this check at the start of your file
if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded! Please ensure the Chart.js script is included before this file.');
}

/**
 * Generates a comprehensive financial report in PDF format
 * Includes:
 * - Balance over time chart
 * - Income/Expense breakdown
 * - Category analysis
 * - Recent transactions
 */
export const generatePDFReport = async () => {
    try {
        // Create hidden container for charts
        const chartContainer = createChartContainer();

        // Initialize PDF document
        const pdfDoc = initializePDF();

        // Add company branding and header
        addReportHeader(pdfDoc);

        // Get and process user data
        const transactions = await getUserTransactions();
        
        // Generate and add charts
        await addBalanceChart(pdfDoc, transactions);
        await addCategoryCharts(pdfDoc, transactions);

        // Add transaction analysis
        addTransactionAnalysis(pdfDoc, transactions);

        // Add footer
        addReportFooter(pdfDoc);

        // Save and cleanup
        pdfDoc.save('Financial_Performance_Report.pdf');
        cleanup(chartContainer);

    } catch (error) {
        console.error("Error generating report:", error);
        alert("An error occurred while generating the report.");
    }
};
