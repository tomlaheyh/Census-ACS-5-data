// js/main.js
async function loadStates() {
    try {
        const response = await fetch('https://api.census.gov/data/2023/acs/acs5?get=NAME&for=state:*');
        const data = await response.json();
        const stateSelect = document.getElementById('stateSelect');
        
        stateSelect.innerHTML = '<option value="">Select a state</option>';
        data.slice(1).forEach(state => {
            const option = document.createElement('option');
            option.value = state[1];
            option.textContent = state[0];
            stateSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading states:', error);
    }
}

async function loadCounties(state) {
    const response = await fetch(`https://api.census.gov/data/2023/acs/acs5?get=NAME&for=county:*&in=state:${state}`);
    const data = await response.json();
    const countySelect = document.getElementById('countySelect');
    
    countySelect.innerHTML = '<option value="">Select a county</option>';
    data.slice(1).forEach(county => {
        const option = document.createElement('option');
        option.value = county[2];
        option.textContent = county[0].split(',')[0];
        countySelect.appendChild(option);
    });
}

function updateMeasureSelect(category) {
    const measureSelect = document.getElementById('measureSelect');
    measureSelect.innerHTML = '<option value="">Select a Measure</option>';
    
    if (category === 'Poverty') {
        Object.entries(povertyMeasures).forEach(([key, measure]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${measure.shortLabel} (${measure.fieldName})`;
            measureSelect.appendChild(option);
        });
    }
}

function updateTitle(measureKey) {
    const measure = povertyMeasures[measureKey];
    document.getElementById('mainTitle').textContent = measure.mainTitle;
    document.getElementById('fieldName').textContent = measure.fieldName;
}

function updateDataTable(yearLabels, countyValues, stateValues, usValues, countyName, stateName) {
    const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
    
    // Update header names
    document.getElementById('countyHeader').textContent = countyName;
    document.getElementById('stateHeader').textContent = stateName;

    yearLabels.forEach((year, index) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = year;
        row.insertCell(1).textContent = countyValues[index] + '%';
        row.insertCell(2).textContent = stateValues[index] + '%';
        row.insertCell(3).textContent = usValues[index] + '%';
    });
}

async function updateChart() {
    const state = document.getElementById('stateSelect').value;
    const county = document.getElementById('countySelect').value;
    const measureKey = document.getElementById('measureSelect').value;
    
    if (!state || !county || !measureKey) return;

    const years = ['2019', '2020', '2021', '2022', '2023'];
    const yearLabels = years.map(year => {
        const startYear = parseInt(year) - 4;
        return `${startYear}-${year}`;
    });
    
    let countyValues = [];
    let stateValues = [];
    let usValues = [];

    for (const year of years) {
        const data = await getPovertyData(state, county, year, measureKey);
        countyValues.push(data.countyRate);
        stateValues.push(data.stateRate);
        usValues.push(data.usRate);
    }

    const countyName = document.getElementById('countySelect').options[document.getElementById('countySelect').selectedIndex].text;
    const stateName = document.getElementById('stateSelect').options[document.getElementById('stateSelect').selectedIndex].text;

    createChart(countyValues, stateValues, usValues, yearLabels, 'Rate (%)');
    updateDataTable(yearLabels, countyValues, stateValues, usValues, countyName, stateName);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadStates();
});

document.getElementById('categorySelect').addEventListener('change', function() {
    updateMeasureSelect(this.value);
});

document.getElementById('measureSelect').addEventListener('change', function() {
    if (this.value) {
        updateTitle(this.value);
        if (document.getElementById('countySelect').value) {
            updateChart();
        }
    }
});

document.getElementById('stateSelect').addEventListener('change', function() {
    loadCounties(this.value);
});

document.getElementById('countySelect').addEventListener('change', function() {
    if (this.value && document.getElementById('measureSelect').value) {
        updateChart();
    }
});

document.querySelector('.info-button').addEventListener('click', async function() {
    const fieldName = document.getElementById('fieldName').textContent;
    const description = await getCensusDescription(fieldName);
    alert(description);
});