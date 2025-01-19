// js/main.js
const CENSUS_API_KEY = '58c63bc07d82b39eb3acdde0318544bb2f8df53a';
const DEBUG_MODE = false;  // Set to true to show debug info

function updateDebugDisplay(content) {
    if (!DEBUG_MODE) return;
    
    const debugSection = document.getElementById('debugSection');
    const debugDisplay = document.getElementById('apiCallDisplay');
    
    debugSection.style.display = 'block';
    if (debugDisplay) {
        if (content.startsWith('<pre style="color: red;">')) {
            // For error messages, always show regardless of DEBUG_MODE
            debugSection.style.display = 'block';
            debugDisplay.innerHTML += content;
        } else {
            debugDisplay.innerHTML = content;
        }
    }
}

function loadStates() {
   const stateSelect = document.getElementById('stateSelect');
   stateSelect.innerHTML = '<option value="">Select a state</option>';
   
   censusStates.forEach(state => {
       const option = document.createElement('option');
       option.value = state.value;
       option.textContent = state.name;
       stateSelect.appendChild(option);
   });
}

function loadCounties(state) {
   const countySelect = document.getElementById('countySelect');
   countySelect.innerHTML = '<option value="">Select a county</option>';
   
   const tractSelect = document.getElementById('tractSelect');
   tractSelect.innerHTML = '<option value="">Select a Census Tract (optional)</option>';
   
   censusCounties[state].forEach(county => {
       const option = document.createElement('option');
       option.value = county.value;
       option.textContent = county.name;
       countySelect.appendChild(option);
   });
}

async function loadCensusTracts(state, county) {
    const tractSelect = document.getElementById('tractSelect');
    tractSelect.innerHTML = '<option value="">Select a Census Tract (optional)</option>';
    
    try {
        const url = `https://api.census.gov/data/2020/dec/pl?get=NAME&for=tract:*&in=state:${state}&in=county:${county}&key=${CENSUS_API_KEY}`;
        updateDebugDisplay(`<pre>Fetching tracts from: ${url}</pre>`);
        
        const response = await fetch(url);
        const data = await response.json();
        
        updateDebugDisplay(`<pre>Received tracts data: ${JSON.stringify(data, null, 2)}</pre>`);
        
        // Skip header row
        data.slice(1).forEach(tract => {
            const option = document.createElement('option');
            option.value = tract[3];  // Use tract number
            option.textContent = tract[0];  // Use full name
            tractSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading census tracts:', error);
        updateDebugDisplay(`<pre style="color: red;">Error loading tracts: ${error.message}</pre>`);
        tractSelect.innerHTML = '<option value="">Error loading tracts</option>';
    }
}

function updateMeasureSelect(category) {
   const measureSelect = document.getElementById('measureSelect');
   measureSelect.innerHTML = '<option value="">Select a Measure</option>';
   
   if (category === 'Poverty') {
       Object.entries(povertyMeasures).forEach(([key, measure]) => {
           const option = document.createElement('option');
           option.value = key;
           option.textContent = `${measure.shortLabel} (${Array.isArray(measure.fieldName) ? measure.fieldName.join(', ') : measure.fieldName})`;
           measureSelect.appendChild(option);
       });
   }
}

function updateTitle(measureKey, isStandard = false) {
    let measure;
    if (isStandard) {
        measure = standardCensusMeasures.standard_field;
    } else {
        measure = povertyMeasures[measureKey];
    }
    document.getElementById('mainTitle').textContent = measure.mainTitle;
    document.getElementById('fieldName').textContent = Array.isArray(measure.fieldName) ? 
        measure.fieldName.join(', ') : measure.fieldName;
}

function toggleMeasureMode(mode) {
    const curatedControls = document.getElementById('curatedControls');
    const standardFieldInput = document.getElementById('standardFieldInput');
    
    if (mode === 'curated') {
        curatedControls.style.display = 'block';
        standardFieldInput.style.display = 'none';
        document.getElementById('censusFieldInput').value = '';
    } else {
        curatedControls.style.display = 'none';
        standardFieldInput.style.display = 'block';
        // Reset curated selections
        document.getElementById('categorySelect').value = '';
        document.getElementById('measureSelect').innerHTML = '<option value="">Select a Measure</option>';
    }
    checkEnablePullButton();
}

async function updateChart(geographyLevel = 'county') {
   const state = document.getElementById('stateSelect').value;
   const county = document.getElementById('countySelect').value;
   const tract = document.getElementById('tractSelect').value;
   const measureType = document.querySelector('input[name="measureType"]:checked').value;
   
   // Get measure info based on type
   let measure, measureKey;
   if (measureType === 'curated') {
       measureKey = document.getElementById('measureSelect').value;
       if (!measureKey) return;
       measure = povertyMeasures[measureKey];
   } else {
       const standardField = document.getElementById('censusFieldInput').value;
       if (!standardField) return;
       try {
           measure = await setStandardCensusField(standardField);
           updateTitle(null, true);
       } catch (error) {
           updateDebugDisplay(`<pre style="color: red;">${error.message}</pre>`);
           return;
       }
   }
   
   if (!state || !county) return;
   if (geographyLevel === 'tract' && !tract) return;

   const years = ['2019', '2020', '2021', '2022', '2023'];
   const yearLabels = years.map(year => {
       const startYear = parseInt(year) - 4;
       return `${startYear}-${year}`;
   });

   try {
       const fieldNames = Array.isArray(measure.fieldName) ? measure.fieldName : [measure.fieldName];
       
       // Determine API base URL based on whether it's a subject or detailed table
       const isSubjectTable = fieldNames[0].startsWith('S');
       const baseApiUrl = isSubjectTable ? 
           'https://api.census.gov/data/{year}/acs/acs5/subject' :
           'https://api.census.gov/data/{year}/acs/acs5';
       
       const apiCalls = years.map(year => {
           const baseUrl = baseApiUrl.replace('{year}', year);
           const fields = fieldNames.join(',');
           const forClause = geographyLevel === 'tract' ? 
               `tract:${tract}&in=state:${state}&in=county:${county}` :
               `county:${county}&in=state:${state}`;
           return `${baseUrl}?get=${fields}&for=${forClause}&key=${CENSUS_API_KEY}`;
       }).join('\n\n');

       updateDebugDisplay(`<pre>${apiCalls}</pre>`);

       const results = await Promise.all(
           years.map(async year => {
               try {
                   const baseUrl = baseApiUrl.replace('{year}', year);
                   const forClause = geographyLevel === 'tract' ? 
                       `tract:${tract}&in=state:${state}&in=county:${county}` :
                       `county:${county}&in=state:${state}`;
                   const response = await fetch(
                       `${baseUrl}?get=${fieldNames.join(',')}&for=${forClause}&key=${CENSUS_API_KEY}`
                   );
                   
                   if (!response.ok) {
                       const text = await response.text();
                       throw new Error(`Year ${year} - Status ${response.status}: ${text}`);
                   }
                   
                   const data = await response.json();
                   if (measureType === 'curated') {
                       return getPovertyData(state, county, year, measureKey, data, geographyLevel, tract);
                   } else {
                       return getStandardCensusData(state, county, year, 'standard_field', data, geographyLevel, tract);
                   }
               } catch (yearError) {
                   console.error(`Error for year ${year}:`, yearError);
                   updateDebugDisplay(`<pre style="color: red;">Error for ${year}: ${yearError.message}</pre>`);
                   return null;
               }
           })
       );

       const validResults = results.filter(result => result !== null);
       
       if (validResults.length === 0) {
           throw new Error('No valid data received from any year');
       }

       const geographyValues = validResults.map(data => data.geographyRate);
       const stateValues = validResults.map(data => data.stateRate);
       const usValues = validResults.map(data => data.usRate);

       const geographyName = geographyLevel === 'tract' ? 
           document.getElementById('tractSelect').options[document.getElementById('tractSelect').selectedIndex].text :
           document.getElementById('countySelect').options[document.getElementById('countySelect').selectedIndex].text;

       const format = createChart(geographyValues, stateValues, usValues, yearLabels, 'Value', geographyName);

       const tbody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
       tbody.innerHTML = '';
       
       const stateName = document.getElementById('stateSelect').options[document.getElementById('stateSelect').selectedIndex].text;
       
       document.getElementById('geographyHeader').textContent = geographyName;
       document.getElementById('stateHeader').textContent = stateName;

       yearLabels.forEach((year, index) => {
           const row = tbody.insertRow();
           row.insertCell(0).textContent = year;
           row.insertCell(1).textContent = validResults[index] ? format.format(geographyValues[index]) : 'N/A';
           row.insertCell(2).textContent = validResults[index] ? format.format(stateValues[index]) : 'N/A';
           row.insertCell(3).textContent = validResults[index] ? format.format(usValues[index]) : 'N/A';
       });

   } catch (error) {
       console.error('Error fetching data:', error);
       updateDebugDisplay(`
           <pre style="color: red;">Error: ${error.message}</pre>
           <div style="color: red;">
               Response Details:
               1. Check if all API URLs are accessible
               2. Verify the Census variable names are correct for each year
               3. Try accessing one of the URLs above directly in your browser
           </div>`);
   }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
   loadStates();
   document.getElementById('pullDataBtn').disabled = true;
});

document.querySelectorAll('input[name="measureType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        toggleMeasureMode(this.value);
    });
});

document.getElementById('categorySelect').addEventListener('change', function() {
   updateMeasureSelect(this.value);
   checkEnablePullButton();
});

document.getElementById('measureSelect').addEventListener('change', function() {
   if (this.value) {
       updateTitle(this.value);
   }
   checkEnablePullButton();
});

document.getElementById('stateSelect').addEventListener('change', function() {
   loadCounties(this.value);
   checkEnablePullButton();
});

document.getElementById('countySelect').addEventListener('change', function() {
   if (this.value) {
       const state = document.getElementById('stateSelect').value;
       loadCensusTracts(state, this.value);
   }
   checkEnablePullButton();
});

document.getElementById('tractSelect').addEventListener('change', function() {
   checkEnablePullButton();
});

document.getElementById('censusFieldInput').addEventListener('input', function() {
    checkEnablePullButton();
});

document.getElementById('pullDataBtn').addEventListener('click', async function() {
    const tractValue = document.getElementById('tractSelect').value;
    const measureType = document.querySelector('input[name="measureType"]:checked').value;
    
    if (measureType === 'standard') {
        const fieldName = document.getElementById('censusFieldInput').value;
        try {
            await setStandardCensusField(fieldName);
            updateTitle(null, true);
        } catch (error) {
            updateDebugDisplay(`<pre style="color: red;">${error.message}</pre>`);
            return;
        }
    }
    
    updateChart(tractValue ? 'tract' : 'county');
});

function checkEnablePullButton() {
    const state = document.getElementById('stateSelect').value;
    const county = document.getElementById('countySelect').value;
    const measureType = document.querySelector('input[name="measureType"]:checked').value;
    
    let measureValid;
    if (measureType === 'curated') {
        const category = document.getElementById('categorySelect').value;
        const measure = document.getElementById('measureSelect').value;
        measureValid = category !== '' && measure !== '';
    } else {
        measureValid = document.getElementById('censusFieldInput').value.trim() !== '';
    }
    
    document.getElementById('pullDataBtn').disabled = !state || !county || !measureValid;
}

document.querySelector('.info-button').addEventListener('click', function() {
    const measureType = document.querySelector('input[name="measureType"]:checked').value;
    let descriptions;
    
    if (measureType === 'curated') {
        const measureKey = document.getElementById('measureSelect').value;
        const measure = povertyMeasures[measureKey];
        const fieldNames = Array.isArray(measure.fieldName) ? measure.fieldName : [measure.fieldName];
        descriptions = fieldNames.map(field => 
            `${field}: ${censusVariables[field].label}`
        ).join('\n\n');
    } else {
        const fieldName = document.getElementById('censusFieldInput').value;
        if (!fieldName) {
            descriptions = 'Please enter a Census field name';
        } else if (standardCensusMeasures.standard_field.label) {
            descriptions = `${fieldName}: ${standardCensusMeasures.standard_field.label}`;
        } else {
            descriptions = `${fieldName}: Standard Census field`;
        }
    }
    
    alert(descriptions);
});