// js/chart-config.js
let chart;

function isCensusSpecialValue(value) {
    // Census Bureau special codes for missing/NA values
    const specialValues = [-666666666, -888888888, -999999999];
    const numValue = Number(value);
    return specialValues.includes(numValue) || isNaN(numValue);
}

function determineDataFormat(values) {
    // Convert all values to numbers and filter out special values
    const allValues = [
        ...values.geographyValues.map(Number),
        ...values.stateValues.map(Number),
        ...values.usValues.map(Number)
    ].filter(value => !isCensusSpecialValue(value));

    // If no valid values after filtering
    if (allValues.length === 0) {
        return {
            suffix: '',
            format: (value) => 'N/A',
            axisLabel: 'Value'
        };
    }
    
    // Check the range of values
    const maxValue = Math.max(...allValues);
    
    // If all values are between 0 and 100, likely percentages
    if (maxValue <= 100) {
        return {
            suffix: '%',
            format: (value) => isCensusSpecialValue(value) ? 'N/A' : Number(value).toFixed(1) + '%',
            axisLabel: 'Percentage'
        };
    }
    
    // For larger numbers, use number formatting
    return {
        suffix: '',
        format: (value) => {
            if (isCensusSpecialValue(value)) return 'N/A';
            value = Number(value);
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            } else {
                return value.toFixed(1);
            }
        },
        axisLabel: 'Value'
    };
}

function createChart(geographyValues, stateValues, usValues, years, labels, geographyName) {
    const debugDisplay = document.getElementById('apiCallDisplay');
    try {
        if (chart) {
            chart.destroy();
        }

        const dataValues = {
            geographyValues: geographyValues,
            stateValues: stateValues,
            usValues: usValues
        };
        
        const format = determineDataFormat(dataValues);

        debugDisplay.innerHTML += `<pre style="color: blue;">Creating chart with:
Geography values: ${JSON.stringify(geographyValues)}
State values: ${JSON.stringify(stateValues)}
US values: ${JSON.stringify(usValues)}
Years: ${JSON.stringify(years)}</pre>`;

        const ctx = document.getElementById('dataChart').getContext('2d');

        // Process data to handle special values
        const processedData = {
            geographyValues: geographyValues.map(v => isCensusSpecialValue(v) ? null : Number(v)),
            stateValues: stateValues.map(v => isCensusSpecialValue(v) ? null : Number(v)),
            usValues: usValues.map(v => isCensusSpecialValue(v) ? null : Number(v))
        };

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: geographyName,
                        data: processedData.geographyValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 3,
                        type: 'bar'
                    },
                    {
                        label: document.getElementById('stateHeader').textContent,
                        data: processedData.stateValues,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        type: 'line'
                    },
                    {
                        label: 'United States',
                        data: processedData.usValues,
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                if (value === null) return `${context.dataset.label}: N/A`;
                                return `${context.dataset.label}: ${format.format(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: format.axisLabel
                        },
                        ticks: {
                            callback: function(value) {
                                return format.format(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });

        debugDisplay.innerHTML += `<pre style="color: green;">Chart created successfully</pre>`;
        
        return format; // Return the format object for use in table formatting
    } catch (error) {
        debugDisplay.innerHTML += `<pre style="color: red;">Error creating chart: ${error.message}</pre>`;
        console.error('Chart creation error:', error);
        throw error;
    }
}