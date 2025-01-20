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
    const labels = data.map(item => new Date(item.date.seconds * 1000).toISOString().split('T')[0]);
    const amounts = data.map(entry => entry.amount);

    // Prepare chart data structure
    const chartData = {
        labels: labels,  // Dates formatted as 'YYYY-MM-DD'
        datasets: [{
            label: 'Balance',
            data: amounts,
            borderColor: 'rgba(75, 192, 192, 1)',  // Line color
            backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Area under line
            fill: true,
            borderWidth: 2,
            tension: 0,  // Slightly higher tension for a smoother curve
            pointRadius: 0,  // Smaller individual data points
            pointHoverRadius: 5,  // Slightly bigger points on hover
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',  // Color of points
            pointBorderColor: 'rgba(75, 192, 192, 1)',  // Border color of points
            pointBorderWidth: 1  // Border width of points
        }]
    };

    // Customize chart options to remove grid lines
    const chartOptions = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Balance Over Time',  // Optional title
                font: { size: 18 }
            },
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false  // Remove grid lines from the x-axis
                }
            },
            y: {
                grid: {
                    display: true  // Remove grid lines from the y-axis
                }
            }
        }
    };

    // Set the chart data and options, then update
    chart.data = chartData;
    chart.options = chartOptions;
    chart.update();
};


export const plotDonut = (chart, data) => {
    // Group by category and calculate total amounts
    const categories = [...new Set(data.map(item => item.category))];
    const categoryData = categories.map(category => ({
        category,
        amount: data
            .filter(item => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0),
    }));

    // Sort data by amount in descending order
    categoryData.sort((a, b) => b.amount - a.amount);

    const sortedCategories = categoryData.map(item => item.category);
    const sortedAmounts = categoryData.map(item => item.amount);
    const totalAmount = sortedAmounts.reduce((sum, amount) => sum + amount, 0);

    // Modern gradient colors (based on sorted order)
    const gradientColors = sortedCategories.map((_, index) =>
        `hsl(${index * 40}, 70%, 55%)`
    );

    chart.data = {
        labels: sortedCategories,
        datasets: [{
            data: sortedAmounts,
            backgroundColor: gradientColors,
            hoverOffset: 8, // Larger hover effect
            borderWidth: 1.5, // Remove borders for a clean look
        }]
    };

    // Customizing Tooltip to show category, amount, and percentage
    chart.options.plugins.tooltip = {
        callbacks: {
            label: function (context) {
                const category = context.label;
                const amount = context.raw;
                const percentage = ((amount / totalAmount) * 100).toFixed(1);
                return `${category}: $${amount.toFixed(2)} (${percentage}%)`;
            }
        },
        backgroundColor: '#000',
        titleFont: { size: 14, family: 'Arial' },
        bodyFont: { size: 12, family: 'Arial' },
        borderWidth: 1,
        borderColor: '#ddd',
    };

    // Customizing Legend to display percentages and set legend text color to white
    chart.options.plugins.legend = {
        position: 'right',
        align: 'start',
        labels: {
            generateLabels: function (chart) {
                const data = chart.data;
                const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i];
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                        text: `${label}: ${percentage}%`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        strokeStyle: data.datasets[0].backgroundColor[i],
                        hidden: !chart.isDatasetVisible(0),
                    };
                });
            },
            font: {
                size: 14,
                family: 'Arial',
                weight: 'normal',
            },
            padding: 0,
        },
        labels: {
            color: '#ebebeb',  // Make the legend text white
        },
    };

    // Modern Doughnut Chart Styling
    chart.options.cutout = '0%'; // Increase cutout for a modern ring look
    chart.options.plugins.title = {
        display: true,
        text: '',
        font: {
            size: 20,
            weight: 'bold',
            family: 'Arial',
        },
        color: '#ffffff',  // Set the title color to white (if displayed)
    };

    chart.update();
};
