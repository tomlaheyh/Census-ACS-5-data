// js/measures/standard_census.js

// Example Census API calls (key removed for security):
// Subject Table (S) API: 
// https://api.census.gov/data/2023/acs/acs5/subject?get=S1701_C03_001E&for=county:013&in=state:06
// Detailed Table (B) API:
// https://api.census.gov/data/2023/acs/acs5?get=B19083_001E&for=county:013&in=state:06

const standardCensusMeasures = {
    'standard_field': {
        fieldName: '',  // Will be set dynamically
        shortLabel: 'Census Field (Detailed and Subject Tables)',
        mainTitle: 'American Community Survey ACS-5: Census Field',
        description_url1: '', // Will be constructed dynamically
        description_url2: '',
        description_url3: '',
        description_url4: '',
        calculation: (values) => parseFloat(values[0]).toFixed(3),
        label: '' // Will store the fetched Census description
    }
};

// Function to validate Census field name format
function isValidCensusField(fieldName) {
    // Allows for multiple segments between underscores
    return /^[BS]\d+_[A-Z0-9_]+E$/.test(fieldName);
}

async function setStandardCensusField(fieldName) {
    if (!isValidCensusField(fieldName)) {
        throw new Error('Invalid Census field format. Must be a valid ACS field ending in E (e.g., B19083_001E or S1701_C03_001E)');
    }
    
    const isSubjectTable = fieldName.startsWith('S');
    const year = '2023';
    const descriptionUrl = isSubjectTable ?
        `https://api.census.gov/data/${year}/acs/acs5/subject/variables/${fieldName}.json` :
        `https://api.census.gov/data/${year}/acs/acs5/variables/${fieldName}.json`;
    
    try {
        // Fetch the label first
        const response = await fetch(descriptionUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch field description');
        }
        const data = await response.json();
        
        standardCensusMeasures.standard_field.fieldName = fieldName;
        standardCensusMeasures.standard_field.label = data.label || 'No description available';
        standardCensusMeasures.standard_field.shortLabel = fieldName;  // Just the field name
        standardCensusMeasures.standard_field.mainTitle = `American Community Survey ACS-5: ${fieldName}`;  // Just the field name
        standardCensusMeasures.standard_field.description_url1 = descriptionUrl;
        
        return standardCensusMeasures.standard_field;
    } catch (error) {
        console.error('Error fetching field description:', error);
        // Still create the measure but with placeholder text
        standardCensusMeasures.standard_field.fieldName = fieldName;
        standardCensusMeasures.standard_field.label = 'Description unavailable';
        standardCensusMeasures.standard_field.shortLabel = fieldName;  // Just the field name
        standardCensusMeasures.standard_field.mainTitle = `American Community Survey ACS-5: ${fieldName}`;  // Just the field name
        standardCensusMeasures.standard_field.description_url1 = descriptionUrl;
        
        return standardCensusMeasures.standard_field;
    }
}

async function getStandardCensusData(state, county, year, measureKey, data, geographyLevel = 'county', tract = null) {
    const measure = standardCensusMeasures[measureKey];
    const vars = Array.isArray(measure.fieldName) ? measure.fieldName : [measure.fieldName];
    const isSubjectTable = vars[0].startsWith('S');
    const API_KEY = '58c63bc07d82b39eb3acdde0318544bb2f8df53a';
    
    const baseUrl = isSubjectTable ? 
        `https://api.census.gov/data/${year}/acs/acs5/subject` :
        `https://api.census.gov/data/${year}/acs/acs5`;

    try {
        // Geography (county or tract) rate
        let geographyRate = measure.calculation(data[1].slice(0, vars.length));

        // State data
        let stateUrl = `${baseUrl}?get=${vars.join(',')}`;
        stateUrl += `&for=state:${state}&key=${API_KEY}`;
        const stateResponse = await fetch(stateUrl);
        if (!stateResponse.ok) {
            throw new Error(`HTTP error for state data! status: ${stateResponse.status}`);
        }
        const stateData = await stateResponse.json();
        const stateRate = measure.calculation(stateData[1].slice(0, vars.length));

        // US data
        let usUrl = `${baseUrl}?get=${vars.join(',')}`;
        usUrl += `&for=us:*&key=${API_KEY}`;
        const usResponse = await fetch(usUrl);
        if (!usResponse.ok) {
            throw new Error(`HTTP error for US data! status: ${usResponse.status}`);
        }
        const usData = await usResponse.json();
        const usRate = measure.calculation(usData[1].slice(0, vars.length));

        return { geographyRate, stateRate, usRate };
    } catch (error) {
        console.error('Error in getStandardCensusData:', error);
        throw error;
    }
}