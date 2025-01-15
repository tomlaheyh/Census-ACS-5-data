// js/chart-config.js
let chart;

function createChart(countyValues, stateValues, usValues, years, labels) {
    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('dataChart').getContext('2d');
    const countyName = document.getElementById('countySelect').options[document.getElementById('countySelect').selectedIndex].text;
    const stateName = document.getElementById('stateSelect').options[document.getElementById('stateSelect').selectedIndex].text;

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: `${countyName}`,
                    data: countyValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 3,
                    type: 'bar'
                },
                {
                    label: stateName,
                    data: stateValues,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    type: 'line'
                },
                {
                    label: 'United States',
                    data: usValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: false,
                    type: 'line'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}