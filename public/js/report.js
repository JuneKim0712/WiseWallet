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

// Helper function to calculate month-over-month and year-over-year changes
const calculateGrowthMetrics = (transactions, currentDate) => {
    const lastMonth = new Date(currentDate);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastYear = new Date(currentDate);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    
    const currentMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date.seconds * 1000);
        return date.getMonth() === currentDate.getMonth() && 
               date.getFullYear() === currentDate.getFullYear();
    });
    
    const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date.seconds * 1000);
        return date.getMonth() === lastMonth.getMonth() && 
               date.getFullYear() === lastMonth.getFullYear();
    });
    
    const lastYearTransactions = transactions.filter(t => {
        const date = new Date(t.date.seconds * 1000);
        return date.getMonth() === currentDate.getMonth() && 
               date.getFullYear() === lastYear.getFullYear();
    });
    
    const calculateTotal = (transactions, type) => {
        return transactions
            .filter(t => t.type === type)
            .reduce((sum, t) => sum + t.amount, 0);
    };
    
    const currentMonthIncome = calculateTotal(currentMonthTransactions, 'income');
    const lastMonthIncome = calculateTotal(lastMonthTransactions, 'income');
    const lastYearIncome = calculateTotal(lastYearTransactions, 'income');
    
    const currentMonthExpense = calculateTotal(currentMonthTransactions, 'expense');
    const lastMonthExpense = calculateTotal(lastMonthTransactions, 'expense');
    const lastYearExpense = calculateTotal(lastYearTransactions, 'expense');
    
    const momIncomeGrowth = lastMonthIncome ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
    const yoyIncomeGrowth = lastYearIncome ? ((currentMonthIncome - lastYearIncome) / lastYearIncome) * 100 : 0;
    
    const momExpenseGrowth = lastMonthExpense ? ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
    const yoyExpenseGrowth = lastYearExpense ? ((currentMonthExpense - lastYearExpense) / lastYearExpense) * 100 : 0;
    
    return {
        momIncomeGrowth,
        yoyIncomeGrowth,
        momExpenseGrowth,
        yoyExpenseGrowth,
        currentMonthIncome,
        currentMonthExpense,
        savingsRate: currentMonthIncome ? ((currentMonthIncome - currentMonthExpense) / currentMonthIncome) * 100 : 0
    };
};

// Helper function to generate financial insights
const generateFinancialInsights = (transactions, balanceOverTimeData, goals) => {
    const currentDate = new Date();
    const growthMetrics = calculateGrowthMetrics(transactions, currentDate);
    const currentBalance = balanceOverTimeData.length > 0 ? 
        balanceOverTimeData[balanceOverTimeData.length - 1].amount : 0;
    
    const insights = [];
    
    // Create a narrative financial summary
    let summary = "Financial Summary & Insights\n\n";
    
    // Opening statement with AI-like analysis
    summary += `Based on my analysis of your financial data, I can provide the following insights:\n\n`;
    
    // Current financial position with context
    summary += `Your current financial position shows a balance of $${currentBalance.toLocaleString()}. `;
    if (currentBalance > 0) {
        summary += `This is a positive foundation for your financial journey. `;
    } else {
        summary += `While this presents a challenge, it's an opportunity to build a stronger financial foundation. `;
    }
    summary += `\n\n`;
    
    // Income analysis with detailed insights
    summary += `Income Analysis:\n`;
    summary += `This month, you've earned $${growthMetrics.currentMonthIncome.toLocaleString()} in income`;
    if (growthMetrics.momIncomeGrowth !== 0) {
        const momTrend = growthMetrics.momIncomeGrowth > 0 ? "increased" : "decreased";
        const momStrength = Math.abs(growthMetrics.momIncomeGrowth) > 10 ? "significantly" : 
                          Math.abs(growthMetrics.momIncomeGrowth) > 5 ? "moderately" : "slightly";
        summary += `, which has ${momStrength} ${momTrend} by ${Math.abs(growthMetrics.momIncomeGrowth).toFixed(1)}% compared to last month`;
    }
    if (growthMetrics.yoyIncomeGrowth !== 0) {
        const yoyTrend = growthMetrics.yoyIncomeGrowth > 0 ? "increased" : "decreased";
        const yoyStrength = Math.abs(growthMetrics.yoyIncomeGrowth) > 15 ? "substantially" : 
                          Math.abs(growthMetrics.yoyIncomeGrowth) > 8 ? "notably" : "marginally";
        summary += ` and ${yoyStrength} ${yoyTrend} by ${Math.abs(growthMetrics.yoyIncomeGrowth).toFixed(1)}% compared to the same period last year`;
    }
    summary += ".\n\n";
    
    // Expense analysis with detailed insights
    summary += `Expense Analysis:\n`;
    summary += `Your expenses for this month total $${growthMetrics.currentMonthExpense.toLocaleString()}`;
    if (growthMetrics.momExpenseGrowth !== 0) {
        const momTrend = growthMetrics.momExpenseGrowth > 0 ? "increased" : "decreased";
        const momStrength = Math.abs(growthMetrics.momExpenseGrowth) > 10 ? "significantly" : 
                          Math.abs(growthMetrics.momExpenseGrowth) > 5 ? "moderately" : "slightly";
        summary += `, showing a ${momStrength} ${momTrend} of ${Math.abs(growthMetrics.momExpenseGrowth).toFixed(1)}% from last month`;
    }
    if (growthMetrics.yoyExpenseGrowth !== 0) {
        const yoyTrend = growthMetrics.yoyExpenseGrowth > 0 ? "increased" : "decreased";
        const yoyStrength = Math.abs(growthMetrics.yoyExpenseGrowth) > 15 ? "substantially" : 
                          Math.abs(growthMetrics.yoyExpenseGrowth) > 8 ? "notably" : "marginally";
        summary += ` and a ${yoyStrength} ${yoyTrend} of ${Math.abs(growthMetrics.yoyExpenseGrowth).toFixed(1)}% year-over-year`;
    }
    summary += ".\n\n";
    
    // Savings analysis with detailed insights
    summary += `Savings Analysis:\n`;
    summary += `Your current savings rate stands at ${growthMetrics.savingsRate.toFixed(1)}% of your income`;
    if (growthMetrics.savingsRate < 10) {
        summary += `, which is significantly below the recommended 20% savings rate. This may impact your ability to build wealth and handle unexpected expenses.`;
    } else if (growthMetrics.savingsRate < 20) {
        summary += `, which is below the recommended 20% savings rate. While not ideal, you're making progress toward better financial health.`;
    } else if (growthMetrics.savingsRate < 30) {
        summary += `, which is a healthy rate for building your financial future. You're on track for achieving your long-term financial goals.`;
    } else {
        summary += `, which is excellent! You're building wealth at an impressive rate and setting yourself up for financial success.`;
    }
    summary += `\n\n`;
    
    // Goals progress with detailed analysis
    if (goals && goals.length > 0) {
        summary += `Financial Goals Progress:\n`;
        goals.forEach(goal => {
            const progress = (currentBalance / goal.target) * 100;
            summary += `- ${goal.name} ($${goal.target.toLocaleString()}):\n`;
            summary += `  Progress: ${progress.toFixed(1)}% complete\n`;
            
            if (progress >= 100) {
                summary += `  Status: Congratulations! You've successfully achieved this financial goal. This is a significant milestone in your financial journey.\n`;
            } else if (progress >= 75) {
                summary += `  Status: Excellent progress! You're in the final stretch of achieving this goal. Keep up the momentum!\n`;
            } else if (progress >= 50) {
                summary += `  Status: You've reached the halfway point! This is a great achievement, and you're well on your way to success.\n`;
            } else if (progress >= 25) {
                summary += `  Status: Good progress! You've made a solid start toward this goal. Consistent effort will help you reach the finish line.\n`;
            } else {
                summary += `  Status: Early stages of progress. Every step counts, and you're building the foundation for future success.\n`;
            }
            
            // Add time-based insights if available
            const monthsToGoal = (goal.target - currentBalance) / (growthMetrics.currentMonthIncome * growthMetrics.savingsRate / 100);
            if (monthsToGoal > 0) {
                summary += `  Projection: At your current savings rate, you could reach this goal in approximately ${Math.ceil(monthsToGoal)} months.\n`;
            }
            summary += `\n`;
        });
    }
    
    // Detailed recommendations with actionable insights
    summary += `Recommendations for Financial Growth:\n`;
    
    // Savings recommendations
    if (growthMetrics.savingsRate < 20) {
        summary += `1. Savings Enhancement:\n`;
        summary += `   - Review your monthly expenses to identify potential savings opportunities\n`;
        summary += `   - Consider setting up automatic transfers to a savings account\n`;
        summary += `   - Aim to gradually increase your savings rate to at least 20%\n\n`;
    }
    
    // Expense management recommendations
    if (growthMetrics.momExpenseGrowth > 5) {
        summary += `2. Expense Management:\n`;
        summary += `   - Analyze your recent spending patterns to identify areas of significant growth\n`;
        summary += `   - Consider implementing a more detailed budget tracking system\n`;
        summary += `   - Look for opportunities to reduce recurring expenses\n\n`;
    }
    
    // Income growth recommendations
    if (growthMetrics.yoyIncomeGrowth < 0) {
        summary += `3. Income Growth:\n`;
        summary += `   - Explore opportunities for professional development or additional income streams\n`;
        summary += `   - Consider negotiating for a raise or seeking higher-paying opportunities\n`;
        summary += `   - Look into side hustles or passive income opportunities\n\n`;
    }
    
    // General financial health recommendations
    if (growthMetrics.savingsRate >= 20 && growthMetrics.momExpenseGrowth <= 5 && growthMetrics.yoyIncomeGrowth >= 0) {
        summary += `4. Wealth Building:\n`;
        summary += `   - Consider diversifying your savings into investment opportunities\n`;
        summary += `   - Review your financial goals and consider setting more ambitious targets\n`;
        summary += `   - Explore tax-advantaged savings and investment options\n\n`;
    }
    
    // Closing statement
    summary += `\nRemember, financial success is a journey, not a destination. Each positive step you take brings you closer to your financial goals. `;
    summary += `Regular review of your financial position and consistent implementation of these recommendations will help you build a stronger financial future.\n`;
    
    insights.push(summary);
    return insights;
};

export const generatePDFReport = async () => {
    try {
        // Create hidden container for charts
        const chartContainer = document.createElement('div');
        chartContainer.style.position = 'absolute';
        chartContainer.style.left = '-9999px';
        chartContainer.style.width = '1200px';
        chartContainer.style.height = '600px';
        chartContainer.style.background = '#FFFFFF';
        document.body.appendChild(chartContainer);

        // Create canvas for balance chart with increased dimensions
        const chartCtx = document.createElement('canvas');
        chartCtx.width = 1200;
        chartCtx.height = 600;
        chartCtx.style.background = '#FFFFFF';
        chartContainer.appendChild(chartCtx);

        // Initialize PDF with business letter format (portrait, inches)
        const pdfDoc = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add company branding
        pdfDoc.setFillColor(52, 73, 94);
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

        // Plugin to set white background
        Chart.register({
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart, args, options) => {
                const {ctx} = chart;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = options.color || '#ffffff';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        });

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
                    display: false
                },
                customCanvasBackgroundColor: {
                    color: 'white'
                }
            }
        };

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
                ...commonChartOptions,
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

        // Create metrics boxes with improved layout and larger font
        let yPos = 35;
        const metrics = [
            { label: "Total Income", value: totalIncome, color: "rgb(46, 204, 113)" },
            { label: "Total Expenses", value: totalExpense, color: "rgb(231, 76, 60)" },
            { label: "Net Income", value: netIncome, color: netIncome >= 0 ? "rgb(46, 204, 113)" : "rgb(231, 76, 60)" }
        ];

        // Add metrics boxes with improved styling
        yPos += 10;
        const boxWidth = 53;
        const boxHeight = 35;
        const spacing = 10;
        const totalWidth = (boxWidth * 3) + (spacing * 2);
        const plotWidth = 180;
        const startX = (pdfDoc.internal.pageSize.width - plotWidth) / 2;

        metrics.forEach((metric, index) => {
            const xPos = startX + (index * (boxWidth + spacing));
            
            // Draw metric box with shadow effect
            pdfDoc.setFillColor(245, 245, 245);
            pdfDoc.rect(xPos, yPos, boxWidth, boxHeight, 'F');
            
            // Add subtle border
            pdfDoc.setDrawColor(200, 200, 200);
            pdfDoc.rect(xPos, yPos, boxWidth, boxHeight);
            
            // Add metric label
            pdfDoc.setFontSize(10);
            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text(metric.label, xPos + 5, yPos + 10, { align: 'left' });
            
            // Add metric value with improved formatting and larger font
            pdfDoc.setFontSize(14);
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(0, 0, 0);
            const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(metric.value);
            pdfDoc.text(formattedValue, xPos + 5, yPos + 25, { align: 'left' });
        });

        // Add balance chart to PDF with improved spacing
        yPos += boxHeight + 15;
        pdfDoc.setFontSize(14);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(52, 73, 94);
        pdfDoc.text("Balance Trend Analysis", 15, yPos);

        try {
            const balanceChartImage = chartCtx.toDataURL('image/jpeg', 0.85);
            yPos += 5;
            pdfDoc.addImage(balanceChartImage, 'JPEG', 15, yPos, 180, 80, undefined, 'FAST');
        } catch (chartError) {
            console.error("Failed to add chart to PDF:", chartError);
            yPos += 10;
            pdfDoc.text("Chart could not be generated", 15, yPos);
        }

        // Add Income vs Expense Comparison with improved styling
        yPos += 90;
        pdfDoc.setFontSize(14);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.setTextColor(52, 73, 94);
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        plot.plotIncomeExpenseComparison(comparisonChart, transactions);
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const comparisonChartImage = comparisonCanvas.toDataURL('image/jpeg', 0.85);
            yPos += 5;
            pdfDoc.addImage(comparisonChartImage, 'JPEG', 15, yPos, 180, 80, undefined, 'FAST');
        } catch (chartError) {
            console.error("Failed to add comparison chart to PDF:", chartError);
            yPos += 10;
            pdfDoc.text("Comparison chart could not be generated", 15, yPos);
        }

        // Add a new page for category analysis with improved header
        pdfDoc.addPage();
        yPos = 20;
        
        // Add professional header with gradient
        pdfDoc.setFillColor(52, 73, 94);
        pdfDoc.rect(0, 0, 210, 15, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(14);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text("Category Distribution Analysis", 15, 10);
        
        // Reset text color and add description with improved styling
        pdfDoc.setTextColor(100, 100, 100);
        pdfDoc.setFontSize(10);
        pdfDoc.setFont('helvetica', 'normal');
        yPos = 25;
        pdfDoc.text("Top 5 categories by transaction volume", 15, yPos);

        // Create canvases with increased dimensions
        const incomePieCanvas = document.createElement('canvas');
        const expensePieCanvas = document.createElement('canvas');
        incomePieCanvas.width = 1000;
        incomePieCanvas.height = 1000;
        expensePieCanvas.width = 1000;
        expensePieCanvas.height = 1000;
        incomePieCanvas.style.background = '#FFFFFF';
        expensePieCanvas.style.background = '#FFFFFF';
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
            const incomePieImage = incomePieCanvas.toDataURL('image/jpeg', 1.0);
            const expensePieImage = expensePieCanvas.toDataURL('image/jpeg', 1.0);
            
            // Adjust chart dimensions for better layout
            const pageWidth = pdfDoc.internal.pageSize.width;
            const chartWidth = 85;
            const chartHeight = 85;
            const spacing = 35;
            
            const totalWidth = (chartWidth * 2) + spacing;
            const startX = (pageWidth - totalWidth) / 2;
            
            // Add titles above charts with professional styling
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setFontSize(14);
            pdfDoc.setTextColor(52, 73, 94);
            
            // Income chart title
            pdfDoc.text('Income Distribution', startX + (chartWidth/2), yPos - 5, { align: 'center' });
            
            // Expense chart title
            pdfDoc.text('Expense Distribution', startX + chartWidth + spacing + (chartWidth/2), yPos - 5, { align: 'center' });
            
            // Position charts with FAST option and higher quality
            pdfDoc.addImage(incomePieImage, 'JPEG', startX, yPos, chartWidth, chartHeight, undefined, 'FAST');
            pdfDoc.addImage(expensePieImage, 'JPEG', startX + chartWidth + spacing, yPos, chartWidth, chartHeight, undefined, 'FAST');
            
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

        // Add Financial Summary Section
        pdfDoc.addPage();
        yPos = 20;
        
        // Add professional header
        pdfDoc.setFillColor(52, 73, 94);
        pdfDoc.rect(0, 0, 210, 15, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(14);
        pdfDoc.text("Financial Summary & Insights", 15, 10);
        
        // Reset text color and add insights
        pdfDoc.setTextColor(0, 0, 0);
        pdfDoc.setFontSize(10);
        
        // Define goals for analysis
        const goals = [
            { name: "New Car Fund", target: 37000 },
            { name: "Vacation Fund", target: 5000 },
            { name: "Emergency Fund", target: 10000 }
        ];
        
        // Generate insights
        const insights = generateFinancialInsights(transactions, balanceOverTimeData, goals);
        
        // Add insights to PDF with proper formatting
        yPos = 25;
        const lineHeight = 5;
        const marginLeft = 15;
        const maxWidth = 180;
        
        insights.forEach(insight => {
            // Split the insight into lines that fit within the page width
            const lines = pdfDoc.splitTextToSize(insight, maxWidth);
            
            lines.forEach(line => {
                if (yPos > 270) { // Check if we need a new page
                    pdfDoc.addPage();
                    yPos = 20;
                }
                
                if (line.startsWith("Financial Summary & Insights")) {
                    pdfDoc.setFont('helvetica', 'bold');
                    pdfDoc.setFontSize(12);
                    pdfDoc.text(line, marginLeft, yPos);
                    yPos += lineHeight + 2;
                } else if (line.includes("Analysis:") || line.includes("Progress:") || line.includes("Recommendations")) {
                    pdfDoc.setFont('helvetica', 'bold');
                    pdfDoc.setFontSize(10);
                    pdfDoc.text(line, marginLeft, yPos);
                    yPos += lineHeight;
                } else if (line.startsWith("   -")) {
                    pdfDoc.setFont('helvetica', 'normal');
                    pdfDoc.setFontSize(9);
                    pdfDoc.text(line, marginLeft + 5, yPos);
                    yPos += lineHeight;
                } else {
                    pdfDoc.setFont('helvetica', 'normal');
                    pdfDoc.setFontSize(10);
                    pdfDoc.text(line, marginLeft, yPos);
                    yPos += lineHeight;
                }
            });
            
            yPos += lineHeight; // Add extra space between sections
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