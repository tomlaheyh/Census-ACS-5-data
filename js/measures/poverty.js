// js/measures/poverty.js
export const povertyMeasures = {
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