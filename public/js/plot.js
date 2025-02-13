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
            pointBorderWidth: 1 , // Border width of points
        }]
    };

    // Customize chart options to remove grid lines
    const chartOptions = {
        responsive: true,

        interaction: {
            mode: 'nearest',
            intersect: false // Ensures tooltips appear even when not directly over a point
        },

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
