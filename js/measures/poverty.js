// js/measures/poverty.js
const povertyMeasures = {
    'poverty_household': {
        fieldName: 'S1701_C03_001E',
        shortLabel: 'Household Poverty',
        mainTitle: 'American Community Survey ACS-5: Household Poverty',
        description_url1: 'https://api.census.gov/data/2023/acs/acs5/subject/variables/S1701_C03_001E.json',
        description_url2: '',
        description_url3: '',
        description_url4: '',
        calculation: (values) => parseFloat(values[0]).toFixed(1)
    },
    'poverty_child_under_5': {
        fieldName: 'S1701_C03_003E',
        shortLabel: 'Household Poverty for Child <5',
        mainTitle: 'American Community Survey ACS-5: Household Poverty for Child <5',
        description_url1: 'https://api.census.gov/data/2023/acs/acs5/subject/variables/S1701_C03_003E.json',
        description_url2: '',
        description_url3: '',
        description_url4: '',
        calculation: (values) => parseFloat(values[0]).toFixed(1)
    },
    'poverty_child_under_18': {
        fieldName: 'S1701_C03_002E',
        shortLabel: 'Household Poverty Child <18',
        mainTitle: 'American Community Survey ACS-5: Household Poverty Child <18',
        description_url1: 'https://api.census.gov/data/2023/acs/acs5/subject/variables/S1701_C03_002E.json',
        description_url2: '',
        description_url3: '',
        description_url4: '',
        calculation: (values) => parseFloat(values[0]).toFixed(1)
    },
    'poverty_adult_working_age': {
        fieldName: ['S1701_C03_008E', 'S1701_C03_009E'],
        shortLabel: 'Household Poverty Adult 18-64',
        mainTitle: 'American Community Survey ACS-5: Household Poverty Adult 18-64',
        description_url1: 'https://api.census.gov/data/2023/acs/acs5/subject/variables/S1701_C03_008E.json',
        description_url2: 'https://api.census.gov/data/2023/acs/acs5/subject/variables/S1701_C03_009E.json',
        description_url3: '',
        description_url4: '',
        calculation: (values) => ((parseFloat(values[0]) + parseFloat(values[1])) / 2).toFixed(1)
    },
    'gini_index': {
        fieldName: 'B19083_001E',
        shortLabel: 'Gini Index',
        mainTitle: 'American Community Survey ACS-5: Gini Index',
        description_url1: 'https://api.census.gov/data/2023/acs/acs5/variables/B19083_001E.json',
        description_url2: '',
        description_url3: '',
        description_url4: '',
        calculation: (values) => parseFloat(values[0]).toFixed(3)
    }
};

async function getCensusDescription(url) {
    try {
        if (!url) return '';
        const response = await fetch(url);
        const data = await response.json();
        return data.label || 'Description not available';
    } catch (error) {
        console.error('Error fetching census description:', error);
        return 'Description not available';
    }
}

async function getPovertyData(state, county, year, measureKey, data = null, geographyLevel = 'county', tract = null) {
    const debugDisplay = document.getElementById('apiCallDisplay');
    const measure = povertyMeasures[measureKey];
    const vars = Array.isArray(measure.fieldName) ? measure.fieldName : [measure.fieldName];
    const isSubjectTable = vars[0].startsWith('S');
    const API_KEY = '58c63bc07d82b39eb3acdde0318544bb2f8df53a';
    
    // Fetch descriptions if not already loaded
    if (!measure.censusDescription) {
        const descriptions = [];
        for (let i = 1; i <= 4; i++) {
            const urlKey = `description_url${i}`;
            if (measure[urlKey]) {
                const desc = await getCensusDescription(measure[urlKey]);
                if (desc) descriptions.push(desc);
            }
        }
        measure.censusDescription = descriptions.join(' ');
    }
    
    const baseUrl = isSubjectTable ? 
        `https://api.census.gov/data/${year}/acs/acs5/subject` :
        `https://api.census.gov/data/${year}/acs/acs5`;

    async function fetchWithDebug(url, label) {
        try {
            debugDisplay.innerHTML += `<pre style="color: blue;">Fetching ${label}...</pre>`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const responseText = await response.text();
            try {
                const data = JSON.parse(responseText);
                debugDisplay.innerHTML += `<pre style="color: green;">${label} successful</pre>`;
                return data;
            } catch (parseError) {
                throw new Error(`JSON Parse Error: ${parseError.message}\nRaw response: ${responseText}`);
            }
        } catch (error) {
            debugDisplay.innerHTML += `<pre style="color: red;">Error ${label}: ${error.message}</pre>`;
            throw error;
        }
    }

    try {
        // Geography data (county or tract)
        let geographyRate;
        if (data) {
            // Use provided data if available
            geographyRate = measure.calculation(data[1].slice(0, vars.length));
        } else {
            let url;
            if (geographyLevel === 'tract') {
                url = `${baseUrl}?get=${vars.join(',')}&for=tract:${tract}&in=state:${state}%20county:${county}&key=${API_KEY}`;
                const tractData = await fetchWithDebug(url, 'Tract data');
                geographyRate = measure.calculation(tractData[1].slice(0, vars.length));
            } else {
                url = `${baseUrl}?get=${vars.join(',')}&for=county:${county}&in=state:${state}&key=${API_KEY}`;
                const countyData = await fetchWithDebug(url, 'County data');
                geographyRate = measure.calculation(countyData[1].slice(0, vars.length));
            }
        }

        // State data
        const stateUrl = `${baseUrl}?get=${vars.join(',')}&for=state:${state}&key=${API_KEY}`;
        const stateData = await fetchWithDebug(stateUrl, 'State data');
        const stateRate = measure.calculation(stateData[1].slice(0, vars.length));

        // US data
        const usUrl = `${baseUrl}?get=${vars.join(',')}&for=us:*&key=${API_KEY}`;
        const usData = await fetchWithDebug(usUrl, 'US data');
        const usRate = measure.calculation(usData[1].slice(0, vars.length));

        return { geographyRate, stateRate, usRate };
    } catch (error) {
        debugDisplay.innerHTML += `<pre style="color: red;">Failed to get complete data for ${year}: ${error.message}</pre>`;
        throw error;
    }
}