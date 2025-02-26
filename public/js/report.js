/**
 * Report generation module
 * Creates detailed PDF financial reports including:
 * - Balance summaries
 * - Transaction analysis
 * - Category breakdowns
 * - Trend visualizations
 * Uses jsPDF for PDF generation
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

export const generatePDFReport = async () => {
    try {
        // Create hidden container for charts
        const chartContainer = document.createElement('div');
        chartContainer.style.position = 'absolute';
        chartContainer.style.left = '-9999px';
        chartContainer.style.width = '800px';
        chartContainer.style.height = '400px';
        document.body.appendChild(chartContainer);

        // Create canvas for balance chart
        const chartCtx = document.createElement('canvas');
        chartCtx.width = 800;
        chartCtx.height = 400;
        chartContainer.appendChild(chartCtx);

        // Initialize PDF with business letter format (portrait, inches)
        const pdfDoc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add company branding
        pdfDoc.setFillColor(52, 73, 94); // Professional dark blue
        pdfDoc.rect(0, 0, 210, 25, 'F');

        // Header
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(20);
    pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text("Financial Performance Report", 15, 15);

        // Reset text color for body
        pdfDoc.setTextColor(0, 0, 0);

        // Add report metadata
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        pdfDoc.setFontSize(10);
    pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.text(`Generated on: ${currentDate}`, 15, 35);

        // Get user data
        const uid = firebase.auth().currentUser?.uid;
    if (!uid) {
            throw new Error("User not authenticated");
    }

        // Fetch and process data
    let transactions = await ref.access(uid, 'transaction');
        transactions = process.sortTransactions(transactions);

        // Process monthly data for the chart
    const balanceOverTimeData = process.genBalanceOverTime(transactions);
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

        const monthlyBalanceData = Object.values(monthlyBalances)
            .sort((a, b) => a.date.seconds - b.date.seconds);

        // Create and wait for balance chart
        const balanceChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: monthlyBalanceData.map(d => d.monthLabel),
                datasets: [{
                    label: 'Balance',
                    data: monthlyBalanceData.map(d => d.amount),
                    borderColor: 'rgb(52, 152, 219)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: false },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        ticks: {
                            callback: value => `$${value.toLocaleString()}`
                        }
                    }
                }
            }
    });

        // Wait for chart rendering - Increased timeout for better reliability
        await new Promise(resolve => setTimeout(resolve, 500));

        // Calculate metrics and create summary section
        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
        const netIncome = totalIncome - totalExpense;
        const currentBalance = balanceOverTimeData.length > 0 ?
            balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;

        // Create metrics boxes
        let yPos = 50;
        const metrics = [
            { label: "Total Revenue", value: totalIncome, color: "rgb(46, 204, 113)" },
            { label: "Total Expenses", value: totalExpense, color: "rgb(231, 76, 60)" },
            { label: "Net Income", value: netIncome, color: netIncome >= 0 ? "rgb(46, 204, 113)" : "rgb(231, 76, 60)" },
            { label: "Current Balance", value: currentBalance, color: "rgb(52, 152, 219)" }
        ];

        // Add metrics boxes
        yPos += 10;
        metrics.forEach((metric, index) => {
            const xPos = 15 + (index * 45);
            pdfDoc.setFillColor(245, 245, 245);
            pdfDoc.rect(xPos, yPos, 40, 25, 'F');

            pdfDoc.setFontSize(8);
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text(metric.label, xPos + 2, yPos + 5);

            pdfDoc.setFontSize(10);
            pdfDoc.setTextColor(0, 0, 0);
            pdfDoc.text(`$${metric.value.toLocaleString()}`, xPos + 2, yPos + 15);
        });

        // Add balance chart to PDF
        yPos += 35;
        pdfDoc.setFontSize(14);
        pdfDoc.text("Balance Trend Analysis", 15, yPos);

        try {
            const balanceChartImage = chartCtx.toDataURL('image/png', 1.0);
            yPos += 5;
            pdfDoc.addImage(balanceChartImage, 'PNG', 15, yPos, 180, 80);
        } catch (chartError) {
            console.error("Failed to add chart to PDF:", chartError);
            yPos += 10;
            pdfDoc.text("Chart could not be generated", 15, yPos);
        }

        // Add Income vs Expense Comparison
        yPos += 90;
        pdfDoc.setFontSize(14);
        pdfDoc.text("Income vs Expense Analysis", 15, yPos);

        // Create income/expense comparison chart
        const comparisonCanvas = document.createElement('canvas');
        comparisonCanvas.width = 800;
        comparisonCanvas.height = 400;
        chartContainer.appendChild(comparisonCanvas);

        const comparisonChart = new Chart(comparisonCanvas, {
            type: 'bar',
            data: {},
            options: {
                responsive: false,
                maintainAspectRatio: false
            }
        });

        plot.plotIncomeExpenseComparison(comparisonChart, transactions);
        await new Promise(resolve => setTimeout(resolve, 500));

        // After the comparison chart and before creating pie charts, add a new page
        try {
            const comparisonChartImage = comparisonCanvas.toDataURL('image/png', 1.0);
            yPos += 5;
            pdfDoc.addImage(comparisonChartImage, 'PNG', 15, yPos, 180, 80);
        } catch (chartError) {
            console.error("Failed to add comparison chart to PDF:", chartError);
            yPos += 10;
            pdfDoc.text("Comparison chart could not be generated", 15, yPos);
        }

        // Add a new page for pie charts
        pdfDoc.addPage();
        yPos = 20; // Start higher on the page

        // Add professional header
        pdfDoc.setFillColor(52, 73, 94);
        pdfDoc.rect(0, 0, 210, 15, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(14);
        pdfDoc.text("Category Distribution Analysis", 15, 10);

        // Reset text color and add description
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.setFontSize(10);
        yPos = 25;
        pdfDoc.text("Top 5 categories by transaction volume", 15, yPos);

        // Create canvases with optimized dimensions
        const incomePieCanvas = document.createElement('canvas');
        const expensePieCanvas = document.createElement('canvas');
        incomePieCanvas.width = 3600;  // Increased for ultra-high resolution
        incomePieCanvas.height = 3600;
        expensePieCanvas.width = 3600;
        expensePieCanvas.height = 3600;
        chartContainer.appendChild(incomePieCanvas);
        chartContainer.appendChild(expensePieCanvas);

        // Process category data
        const incomeByCategory = {};
        const expenseByCategory = {};
        transactions.forEach(t => {
            if (t.type === 'income') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
                expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            }
        });

        // Sort and get top 5 categories for each
        const getTop5Categories = (data) => {
            return Object.entries(data)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
        };

        const topIncomeCategories = getTop5Categories(incomeByCategory);
        const topExpenseCategories = getTop5Categories(expenseByCategory);

        // Enhanced color palette with better contrast
        const pieColors = [
            '#2E4057', '#4B6584', '#5E7494', '#7C8DA4', '#99A8BC'
        ];

        // Update the common chart options to remove title
        const commonChartOptions = {
            responsive: false,
            maintainAspectRatio: false,
            animation: false,
            layout: {
                padding: {
                    left: 15,
                    right: 15,
                    top: 15,
                    bottom: 15
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false  // Disable chart.js title
                }
            }
        };

        // Update the income pie chart options
        const incomePieChart = new Chart(incomePieCanvas, {
            type: 'doughnut',
            data: {
                labels: topIncomeCategories.map(([cat]) => cat),
                datasets: [{
                    data: topIncomeCategories.map(([,amount]) => amount),
                    backgroundColor: pieColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverOffset: 4,
                    spacing: 1
                }]
            },
            options: {
                ...commonChartOptions,
                plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                        ...commonChartOptions.plugins.title,
                        text: 'Income Distribution'
                    }
                }
            }
        });

        // Update the expense pie chart similarly
        const expensePieChart = new Chart(expensePieCanvas, {
            type: 'doughnut',
            data: {
                labels: topExpenseCategories.map(([cat]) => cat),
                datasets: [{
                    data: topExpenseCategories.map(([,amount]) => amount),
                    backgroundColor: pieColors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverOffset: 4,
                    spacing: 1
                }]
            },
            options: {
                ...commonChartOptions,
                plugins: {
                    ...commonChartOptions.plugins,
                    title: {
                        ...commonChartOptions.plugins.title,
                        text: 'Expense Distribution'
                    }
                }
            }
        });

        // Force immediate updates
        incomePieChart.update('none');
        expensePieChart.update('none');

        // Increased wait time for rendering
        await new Promise(resolve => setTimeout(resolve, 1500));

        // When adding charts to PDF, add titles and charts
        try {
            yPos += 15;
            const incomePieImage = incomePieCanvas.toDataURL('image/png', 1.0);
            const expensePieImage = expensePieCanvas.toDataURL('image/png', 1.0);
            
            // Adjust chart dimensions for better layout
            const pageWidth = pdfDoc.internal.pageSize.width;
            const chartWidth = 80;
            const chartHeight = 80;
            const spacing = 35;
            
            const totalWidth = (chartWidth * 2) + spacing;
            const startX = (pageWidth - totalWidth) / 2;
            
            // Add titles above charts with professional styling
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setFontSize(14);
            pdfDoc.setTextColor(52, 73, 94);  // Professional dark blue
            
            // Income chart title
            pdfDoc.text('Income Distribution', startX + (chartWidth/2), yPos - 5, { align: 'center' });
            
            // Expense chart title
            pdfDoc.text('Expense Distribution', startX + chartWidth + spacing + (chartWidth/2), yPos - 5, { align: 'center' });
            
            // Position charts
            pdfDoc.addImage(incomePieImage, 'PNG', startX, yPos, chartWidth, chartHeight);
            pdfDoc.addImage(expensePieImage, 'PNG', startX + chartWidth + spacing, yPos, chartWidth, chartHeight);
            
            // Function to add custom labels with improved styling
            const addCustomLabels = (categories, startX, yPos) => {
                const total = categories.reduce((sum, [,amount]) => sum + amount, 0);
                const labelStartY = yPos + chartHeight + 15;
                
                // Set styling for labels
                pdfDoc.setFontSize(10);
                pdfDoc.setFont('helvetica', 'bold');
                
                categories.forEach(([category, amount], index) => {
                    const percentage = ((amount / total) * 100).toFixed(1);
                    const yPosition = labelStartY + (index * 7);
                    
                    // Draw color box with improved styling
                    pdfDoc.setFillColor(...hexToRgb(pieColors[index]));
                    pdfDoc.rect(startX, yPosition - 2.5, 4, 4, 'F');
                    
                    // Add label text with improved formatting
                    pdfDoc.setTextColor(60, 60, 60);
                    const formattedAmount = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(amount);
                    
                    const formattedCategory = category
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    
                    const labelText = `${formattedCategory}: ${formattedAmount} (${percentage}%)`;
                    pdfDoc.text(labelText, startX + 6, yPosition);
                });
            };
            
            // Helper function to convert hex to RGB
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16)
                ] : [0, 0, 0];
            };
            
            // Add labels for both charts
            addCustomLabels(topIncomeCategories, startX, yPos);
            addCustomLabels(topExpenseCategories, startX + chartWidth + spacing, yPos);
            
            // Update yPos for next section with proper spacing
            yPos += chartHeight + (7 * 6) + 25;
            
        } catch (chartError) {
            console.error("Failed to add pie charts to PDF:", chartError);
            pdfDoc.text("Category charts could not be generated", 15, yPos + 10);
        }

        // Update the doughnut chart options
        const chartDatasetOptions = {
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 4,
            hoverOffset: 4,
            spacing: 1  // Add slight spacing between segments
        };

        // Apply these options to both charts' datasets
        incomePieChart.data.datasets[0] = {
            ...incomePieChart.data.datasets[0],
            ...chartDatasetOptions
        };

        expensePieChart.data.datasets[0] = {
            ...expensePieChart.data.datasets[0],
            ...chartDatasetOptions
        };

        // Cleanup wait with reduced time
        await new Promise(resolve => setTimeout(resolve, 300));

        // Add Transaction Analysis with reduced spacing
        yPos += 20; // Reduced spacing before transaction analysis
        pdfDoc.setFontSize(14);
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.text("Transaction Analysis", 15, yPos);

        // Recent transactions table with adjusted starting position
        const recentTransactions = [...transactions]
            .sort((a, b) => b.date.seconds - a.date.seconds)
            .slice(0, 5);

        pdfDoc.autoTable({
            startY: yPos + 5, // Reduced spacing before table
            head: [["Date", "Category", "Type", "Amount"]],
            body: recentTransactions.map(t => [
                new Date(t.date.seconds * 1000).toLocaleDateString(),
                t.category,
                t.type.charAt(0).toUpperCase() + t.type.slice(1),
                `$${t.amount.toLocaleString()}`
            ]),
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [52, 73, 94],
                textColor: 255
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 15, right: 15 }
        });

        // Footer
        const pageCount = pdfDoc.internal.getNumberOfPages();
        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(150, 150, 150);
        for (let i = 1; i <= pageCount; i++) {
            pdfDoc.setPage(i);
            pdfDoc.text(
                `Page ${i} of ${pageCount} | Confidential Financial Report`,
                pdfDoc.internal.pageSize.width / 2,
                pdfDoc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        // Clean up and save
        document.body.removeChild(chartContainer);
        pdfDoc.save('Financial_Performance_Report.pdf');

    } catch (error) {
        console.error("Error generating report:", error);
        alert("An error occurred while generating the report.");
    }
};