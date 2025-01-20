// main.js

// Global Variables
let selectedStateName = "";
let selectedStateCode = "";
let selectedCountyName = "";
let selectedCountyCode = "";
let selectedCountyFullCode = "";
let selectedCensusTractName = ""; // Global variable for census tract name
let selectedCensusTractValue = ""; // Global variable for census tract value

document.addEventListener("DOMContentLoaded", () => {
    const categorySelect = document.getElementById("categorySelect");
    const measures = document.getElementById("measures");
    const censusField = document.getElementById("censusField");
    const stateSelect = document.getElementById("stateSelect");
    const countySelect = document.getElementById("countySelect");
    const censusTractSelect = document.getElementById("censustractSelect");

    // Populate the first dropdown from categoryOptions.js
    if (Array.isArray(categoryOptions)) {
        categoryOptions.forEach(option => {
            const categoryOption = document.createElement("option");
            categoryOption.value = option.value;
            categoryOption.textContent = option.label;
            categorySelect.appendChild(categoryOption);
        });
    }

    // Populate the state dropdown from states.js
    if (Array.isArray(censusStates)) {
        censusStates.forEach(state => {
            const stateOption = document.createElement("option");
            stateOption.value = state.value; // Use state code (e.g., "01") as the value
            stateOption.textContent = `${state.name} (${state.value})`; // Display name and code
            stateSelect.appendChild(stateOption);
        });
    }

    // Handle category selection and populate the second dropdown
    categorySelect.addEventListener("change", () => {
        const selectedCategory = categorySelect.value;
        measures.innerHTML = '<option value="">Select a Measure</option>';
        censusField.value = ''; // Clear the input field
        if (!selectedCategory) return;

        const categoryData = measuresData[selectedCategory];
        if (categoryData) {
            for (const key in categoryData) {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = categoryData[key].shortLabel;
                measures.appendChild(option);
            }
        }
    });

    // Handle state selection and populate counties
    stateSelect.addEventListener("change", () => {
        selectedStateCode = stateSelect.value;
        selectedStateName = stateSelect.options[stateSelect.selectedIndex]?.text.split(" (")[0] || ""; // Extract name

        // Populate counties
        countySelect.innerHTML = '<option value="">Select a County</option>'; // Reset county dropdown
        censusTractSelect.innerHTML = '<option value="">Select a Census Tract</option>'; // Reset tract dropdown

        if (selectedStateCode && censusCounties[selectedStateCode]) {
            const counties = censusCounties[selectedStateCode];
            counties.forEach(county => {
                const countyOption = document.createElement("option");
                countyOption.value = county.value;
                const fullCode = `${selectedStateCode}${county.value}`;
                countyOption.textContent = `${county.name} (${fullCode})`; // Display name and full code
                countySelect.appendChild(countyOption);
            });
        }
    });

    // Handle county selection and populate census tracts from tracts.json
    countySelect.addEventListener("change", async () => {
        selectedCountyCode = countySelect.value;
        selectedCountyName = countySelect.options[countySelect.selectedIndex]?.text.split(" (")[0] || "";
        selectedCountyFullCode = `${selectedStateCode}${selectedCountyCode}`; // Combine state and county FIPS codes

        // Reset and populate census tracts
        censusTractSelect.innerHTML = '<option value="">Select a Census Tract</option>';

        try {
            // Fetch the tracts JSON file
            const response = await fetch("js/tracts.json");
            if (!response.ok) throw new Error("Failed to load tracts.json");

            const censusTracts = await response.json();

            // Access the tracts for the selected state and county
            const tracts = censusTracts[selectedStateCode]?.[selectedCountyCode];

            if (tracts && Array.isArray(tracts)) {
                tracts.forEach(tract => {
                    const tractOption = document.createElement("option");
                    tractOption.value = tract.value; // Use "value" for selection
                    tractOption.textContent = tract.name; // Display "name" in dropdown
                    censusTractSelect.appendChild(tractOption);
                });
            }
        } catch {
            // Leave the dropdown empty if an error occurs
        }
    });

    // Handle census tract selection
    censusTractSelect.addEventListener("change", () => {
        selectedCensusTractValue = censusTractSelect.value; // Save the tract's "value"
        selectedCensusTractName = censusTractSelect.options[censusTractSelect.selectedIndex]?.text || ""; // Save the tract's "name"
    });
});
