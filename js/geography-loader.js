// js/geography-loader.js
const CENSUS_API_KEY = '58c63bc07d82b39eb3acdde0318544bb2f8df53a';

async function initializeGeography() {
    const stateSelect = document.getElementById('stateSelect');
    const countySelect = document.getElementById('countySelect');
    const tractSelect = document.getElementById('tractSelect');

    try {
        if (typeof censusStates === 'undefined') {
            throw new Error('States data not loaded');
        }

        stateSelect.innerHTML = '<option value="">Select a state</option>';
        stateSelect.disabled = false;
        
        censusStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state.value;
            option.textContent = state.name;
            stateSelect.appendChild(option);
        });

        countySelect.innerHTML = '<option value="">Select a state first</option>';
        countySelect.disabled = true;
        
        tractSelect.innerHTML = '<option value="">Select a county first</option>';
        tractSelect.disabled = true;

    } catch (error) {
        console.error('Geography initialization error:', error);
        stateSelect.innerHTML = '<option value="">Error loading states</option>';
        return false;
    }
    return true;
}

async function loadCounties(state) {
    const countySelect = document.getElementById('countySelect');
    const tractSelect = document.getElementById('tractSelect');
    
    try {
        if (!state || typeof censusCounties === 'undefined') {
            throw new Error('County data not available');
        }

        countySelect.disabled = true;
        countySelect.innerHTML = '<option value="">Loading counties...</option>';
        
        tractSelect.disabled = true;
        tractSelect.innerHTML = '<option value="">Select a county first</option>';

        const counties = censusCounties[state];
        if (!counties) {
            throw new Error(`No counties found for state ${state}`);
        }

        countySelect.innerHTML = '<option value="">Select a county</option>';
        counties.forEach(county => {
            const option = document.createElement('option');
            option.value = county.value;
            option.textContent = county.name;
            countySelect.appendChild(option);
        });
        
        countySelect.disabled = false;
        return true;

    } catch (error) {
        console.error('Error loading counties:', error);
        countySelect.innerHTML = '<option value="">Error loading counties</option>';
        return false;
    }
}

async function loadCensusTracts(state, county) {
    const tractSelect = document.getElementById('tractSelect');
    
    try {
        tractSelect.disabled = true;
        tractSelect.innerHTML = '<option value="">Loading tracts...</option>';
        
        const url = `https://api.census.gov/data/2020/dec/pl?get=NAME&for=tract:*&in=state:${state}&in=county:${county}&key=${CENSUS_API_KEY}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        tractSelect.innerHTML = '<option value="">Select a Census Tract (optional)</option>';
        
        // Skip header row
        data.slice(1).forEach(tract => {
            const option = document.createElement('option');
            option.value = tract[3];  // Use tract number
            option.textContent = tract[0];  // Use full name
            tractSelect.appendChild(option);
        });
        
        tractSelect.disabled = false;
        return true;

    } catch (error) {
        console.error('Error loading census tracts:', error);
        tractSelect.innerHTML = '<option value="">Error loading tracts</option>';
        return false;
    }
}