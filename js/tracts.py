import json
import re

# Input and output file paths
input_file = "tracts.js"  # Replace with the path to your tracts.js
output_file = "tracts.json"

# Read the JavaScript file
with open(input_file, "r") as file:
    js_content = file.read()

# Extract the JavaScript object using a regex
match = re.search(r"const\s+censusTracts\s*=\s*(\{.*\});", js_content, re.DOTALL)
if not match:
    print("Error: Unable to extract the censusTracts object.")
    exit(1)

# Parse the extracted object as JSON
tracts_object = match.group(1)
tracts_object = tracts_object.rstrip(";")  # Remove the trailing semicolon

# Convert the JavaScript object to JSON
try:
    tracts_json = json.loads(tracts_object)
except json.JSONDecodeError as e:
    print(f"Error decoding JSON: {e}")
    exit(1)

# Write the JSON to a new file
with open(output_file, "w") as file:
    json.dump(tracts_json, file, indent=4)

print(f"Successfully converted tracts.js to {output_file}")
