/**
 * Data visualization module
 * Provides functions for:
 * - Balance trend charts
 * - Income/expense comparisons
 * - Category distribution charts
 * - Transaction projections
 * Uses Chart.js for rendering
 */

// plot.js
export const plotProjection = (chart, data, period) => {
    chart.data = {
        labels: Array.from({ length: period }, (_, index) => index),
        datasets: [{
            label: 'Balance',
            data: data,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            borderWidth: 2,
            tension: 0.1
        }]
    };
    chart.update();
};

export const plotBalance = (chart, data) => {
    // Extract dates and amounts from the data
    const labels = data.map(item => item.monthLabel || new Date(item.date.seconds * 1000).toLocaleString('default', { month: 'short', year: '2-digit' }));
    const amounts = data.map(entry => entry.amount);

    // Prepare chart data structure
    const chartData = {
        labels: labels,  // Use month labels instead of full dates
        datasets: [{
            label: 'Balance',
            data: amounts,
            borderColor: 'rgb(91, 184, 125)',
            backgroundColor: 'rgba(75, 192, 108, 0.2)',
            fill: true,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: 'rgba(75, 192, 192, 1)',
            pointBorderWidth: 1
        }]
    };

    // Customize chart options
    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'nearest',
            intersect: false
        },
        plugins: {
            title: {
                display: true,
                text: 'Balance Over Time',
                color: 'rgba(0, 0, 0)',
                font: { size: 18 }
            },
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        return context[0].label;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                }
            },
            y: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Set the chart data and options, then update
    chart.data = chartData;
    chart.options = chartOptions;
    chart.update();
};


export const plot = (chart, data) => {
    // Aggregate data by category
    const categoryData = [...new Set(data.map(item => item.category))]
        .map(category => ({
            category,
            amount: data.filter(item => item.category === category)
                .reduce((sum, item) => sum + item.amount, 0)
        }))
        .sort((a, b) => b.amount - a.amount);

    const labels = categoryData.map(item => item.category);
    const amounts = categoryData.map(item => item.amount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const colors = labels.map((_, i) => `hsl(${i * 40}, 70%, 55%)`);

    chart.data = {
        labels,
        datasets: [{
            data: amounts,
            backgroundColor: colors,
            borderRadius: 5, // Round edges of bars
            borderWidth: 0,
        }]
    };

    chart.options = {
        interaction: {
            mode: 'nearest',
            intersect: false // Ensures tooltips appear even when not directly over a point
        },
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2, // Make it take half the space of the canvas
        scales: {
            x: {
                stacked: true,
                ticks: { color: '#000000' },
                grid: { display: false }
            },
            y: {
                position: 'right',
                stacked: true,
                ticks: { color: '#000000' },
                grid: { display: false }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: ({ raw }) => `$${raw.toFixed(2)} (${((raw / totalAmount) * 100).toFixed(1)}%)`
                },
                backgroundColor: '#000',
                titleFont: { size: 14, family: 'Arial' },
                bodyFont: { size: 12, family: 'Arial' },
            },
            legend: { display: false }
        }
    };

    chart.update();
};

// Add new plotting functions for income/expense comparison
export const plotIncomeExpenseComparison = (chart, data) => {
    // Group by month and type
    const monthlyData = {};
    data.forEach(item => {
        const date = new Date(item.date.seconds * 1000);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { income: 0, expense: 0, net: 0 };
        }
        if (item.type === 'income') {
            monthlyData[monthYear].income += item.amount;
            monthlyData[monthYear].net += item.amount;
        } else {
            monthlyData[monthYear].expense += item.amount;
            monthlyData[monthYear].net -= item.amount;
        }
    });

    const labels = Object.keys(monthlyData).sort();
    const incomeData = labels.map(month => monthlyData[month].income);
    const expenseData = labels.map(month => -monthlyData[month].expense); // Negative for expenses
    const netIncomeData = labels.map(month => monthlyData[month].net);

    chart.data = {
        labels: labels,
        datasets: [
            {
                type: 'bar',
                label: 'Income',
                data: incomeData,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                order: 2,
                borderRadius: {
                    topLeft: 5,
                    topRight: 5,
                    bottomLeft: 0,
                    bottomRight: 0
                }
            },
            {
                type: 'bar',
                label: 'Expenses',
                data: expenseData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2,
                order: 2,
                borderRadius: {
                    topLeft: 0,
                    topRight: 0,
                    bottomLeft: 5,
                    bottomRight: 5
                }
            },
            {
                type: 'line',
                label: 'Net Income',
                data: netIncomeData,
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(54, 162, 235)',
                fill: false,
                order: 1,
                tension: 0.3
            }
        ]
    };

    chart.options = {
        responsive: true,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                ticks: {
                    callback: value => {
                        const prefix = value < 0 ? '-' : '';
                        return `${prefix}$${Math.abs(value).toLocaleString()}`;
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const prefix = context.raw < 0 ? '-' : '';
                        return `${context.dataset.label}: ${prefix}$${Math.abs(context.raw).toLocaleString()}`;
                    }
                }
            }
        }
    };

    // Change to mixed chart type to support both bars and line
    chart.config.type = 'bar'; // No need to explicitly set to 'bar' again, it was already a bar chart, and mixed types are handled within datasets now.
    chart.update();
};

export const plotCategoryComparison = (chart, data) => {
    // Process categories
    const categories = {};
    data.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + item.amount;
    });

    // Sort and get top 5
    const sortedCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    const total = sortedCategories.reduce((sum, [,amount]) => sum + amount, 0);

    // Professional color scheme
    const colors = [
        '#2E4057', '#7C8DA4', '#A9B4C2', '#B7C3D1', '#4B6584',
        '#5E7494', '#8596AD', '#99A8BC', '#6B7F9E', '#3D5270'
    ];

    chart.data = {
        labels: sortedCategories.map(([cat]) => cat),
        datasets: [{
            data: sortedCategories.map(([,amount]) => amount),
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };

    chart.options = {
        responsive: false,
        maintainAspectRatio: false,
        layout: {
            padding: 20
        },
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    font: { size: 14 },
                    padding: 20,
                    usePointStyle: true, // Added to ensure point style in legend
                    generateLabels: (chart) => { // Corrected generateLabels
                        return chart.data.labels.map((label, index) => {
                            const value = chart.data.datasets[0].data[index];
                            const percentage = ((value / total) * 100).toFixed(1);
                            return {
                                text: `${label} (${percentage}%)`,
                                fillStyle: colors[index],
                                strokeStyle: '#ffffff',
                                lineWidth: 2,
                                hidden: false,
                                pointStyle: 'circle' // Ensure point style is circle for pie chart legend
                            };
                        });
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const percentage = ((context.raw / total) * 100).toFixed(1);
                        return `${context.label}: $${context.raw.toLocaleString()} (${percentage}%)`;
                    }
                },
                titleFont: { size: 14 },
                bodyFont: { size: 14 }
            }
        }
    };

    // Disable animations for PDF generation - keep this
    chart.options.animation = false;
    chart.update('none');
};