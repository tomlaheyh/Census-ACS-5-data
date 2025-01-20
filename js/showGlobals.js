// showGlobals.js

document.addEventListener("DOMContentLoaded", () => {
    // Connect to the button in the HTML
    const debugButton = document.getElementById("showGlobalsButton");

    // Function to display the selectedStateName variable
    function showSelectedStateName() {
        const globals = `selectedStateName: ${selectedStateName || "Not Set"}`;
        alert(globals); // Display the selectedStateName in a popup
    }

    // Add an event listener to the button
    if (debugButton) {
        debugButton.addEventListener("click", showSelectedStateName);
    }
});
