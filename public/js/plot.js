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