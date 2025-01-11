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
    chart.data = {
        labels: data.map(item => new Date(item.date.seconds * 1000).toISOString().split('T')[0]),
        datasets: [{
            label: 'Balance',
            data: data.map(entry => entry.amount),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            borderWidth: 2,
            tension: 0.1
        }]
    };
    chart.update();
};

export const plotDonut = (chart, data) => {
    const categories = [...new Set(data.map(item => item.category))];
    const categoryAmounts = categories.map(category =>
        data.filter(item => item.category === category)
            .reduce((sum, item) => sum + item.amount, 0)
    );
    const totalAmount = categoryAmounts.reduce((sum, amount) => sum + amount, 0);

    chart.data = {
        labels: categories,
        datasets: [{
            data: categoryAmounts,
            backgroundColor: categories.map((_, index) => `hsl(${index * 30}, 70%, 60%)`), // Dynamic colors
            hoverOffset: 4,
        }]
    };

    // Customizing Tooltip Font
    chart.options.plugins.tooltip = {
        callbacks: {
            label: function (context) {
                const amount = context.raw;
                const percentage = ((amount / totalAmount) * 100).toFixed(2);
                return `$${amount.toFixed(2)} (${percentage}%)`;
            }
        }
    };

    // Customizing Legend Font
    chart.options.plugins.legend = {
        position: 'right',       // Position the legend to the right
        align: 'start',    
        labels: {
            font: {
                size: 18,         // Font size for legend
                family: 'Monserrat',  // Font family for legend
                weight: 'normal', // Font weight for legend
                color: '#444444'  // Font color for legend
            }
        },
    };

    // Customizing Doughnut (Arc) Label Font (using `chartjs-plugin-datalabels`)
    chart.options.plugins.datalabels = {
        color: '#fff',   // Font color for the labels inside the donut
        font: {
            size: 20,     // Font size for labels inside the donut
            weight: 'bold', // Font weight for labels inside the donut
            family: 'Arial' // Font family for labels inside the donut
        },
        formatter: (value) => {
            return `$${value.toFixed(2)}`;  // Format the label text inside the donut
        }
    };

    chart.update();
};


