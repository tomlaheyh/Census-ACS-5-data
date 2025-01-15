// js/measures/poverty.js
const povertyMeasures = {
   'poverty_household': {
       fieldName: 'S1701_C03_001E',
       shortLabel: 'Household Poverty',
       mainTitle: 'American Community Survey ACS-5: Household Poverty',
       censusDescription: '', // Will be populated from API
       calculation: (values) => parseFloat(values[0]).toFixed(1)
   },
   'poverty_child_under_5': {
       fieldName: 'S1701_C03_003E',
       shortLabel: 'Household Poverty for Child <5',
       mainTitle: 'American Community Survey ACS-5: Household Poverty for Child <5',
       censusDescription: '', // Will be populated from API
       calculation: (values) => parseFloat(values[0]).toFixed(1)
   }
};

async function getCensusDescription(variable) {
   try {
       const url = `https://api.census.gov/data/2023/acs/acs5/subject/variables/${variable}.json`;
       const response = await fetch(url);
       const data = await response.json();
       return data.label || 'Description not available';
   } catch (error) {
       console.error('Error fetching census description:', error);
       return 'Description not available';
   }
}

async function getPovertyData(state, county, year, measureKey) {
   const measure = povertyMeasures[measureKey];
   const vars = [measure.fieldName];
   
   // Fetch description if not already loaded
   if (!measure.censusDescription) {
       measure.censusDescription = await getCensusDescription(measure.fieldName);
   }
   
   // County data
   let url = `https://api.census.gov/data/${year}/acs/acs5/subject?get=${vars.join(',')}&for=county:${county}&in=state:${state}`;
   let response = await fetch(url);
   let data = await response.json();
   let countyRate = measure.calculation([data[1][0]]);

   // State data
   url = `https://api.census.gov/data/${year}/acs/acs5/subject?get=${vars.join(',')}&for=state:${state}`;
   response = await fetch(url);
   data = await response.json();
   let stateRate = measure.calculation([data[1][0]]);

   // US data
   url = `https://api.census.gov/data/${year}/acs/acs5/subject?get=${vars.join(',')}&for=us:*`;
   response = await fetch(url);
   data = await response.json();
   let usRate = measure.calculation([data[1][0]]);

   return { countyRate, stateRate, usRate };
}