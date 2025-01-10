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

    chart.options.plugins.tooltip.callbacks = {
        label: function (context) {
            const amount = context.raw;
            const percentage = ((amount / totalAmount) * 100).toFixed(2);
            return `$${amount.toFixed(2)} (${percentage}%)`;
        }
    };

    chart.options.plugins.legend.labels.generateLabels = function (chart) {
        return chart.data.labels.map((label, index) => {
            const amount = chart.data.datasets[0].data[index];
            const percentage = ((amount / totalAmount) * 100).toFixed(2);
            return {
                text: `${label}: $${amount.toFixed(2)} (${percentage}%)`,
                fillStyle: chart.data.datasets[0].backgroundColor[index],
                strokeStyle: chart.data.datasets[0].backgroundColor[index],
                hidden: chart.getDatasetMeta(0).data[index].hidden,
                index: index
            };
        });
    };

    chart.update();
};

