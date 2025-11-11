// --- WARNING: This file is for testing only and should NOT be deployed to production. ---

window.addEventListener("load", () => {
    
    // Find the dedicated test button (ID must match the button in index.html)
    const loadTestButton = document.getElementById("loadTestDataButton");

    // Exit immediately if the button isn't present (e.g., in a production environment)
    if (!loadTestButton) {
        return; 
    }
    
    console.log("🧪 Test Data Loader Initialized.");

    // === TEST DATA LOADER FUNCTION ===
    function loadTestData() {
        console.log("🚀 Loading test data into form fields...");
        
        // --- 1. Standard Input Fields (Use IDs defined in index.html) ---
        const nameField = document.getElementById("nameInput");
        const emailField = document.getElementById("emailInput");
        const phoneField = document.getElementById("phoneInput");
        const urlField = document.getElementById("urlInput");
        
        if (nameField) nameField.value = "Jane Tester (Auto-Fill)";
        if (emailField) emailField.value = "jane.tester@test-corp.io";
        if (phoneField) phoneField.value = "+15558675309";
        if (urlField) urlField.value = "https://www.test-corp-xyz.io";

        // --- 2. Textarea Fields (Use names defined in index.html) ---
        // QuerySelector is used here to target by name attribute
        const notableCustomers = document.querySelector('[name="notableCustomers"]');
        const strongFit = document.querySelector('[name="strongFit"]');
        const otherDetail = document.querySelector('[name="otherDetails"]'); 
        
        if (notableCustomers) {
             notableCustomers.value = "Key metrics: $12M ARR, 25% YoY Growth, 95% Retention. Major customers include Test-A Corp and Demo Solutions.";
        }
        if (strongFit) {
             strongFit.value = "The prospect is a perfect fit for the 'Digital Transformation' thesis. We believe an investment in operational tooling could increase margins by 15% within 18 months.";
        }
        if (otherDetail) {
             otherDetail.value = "The current owner is looking for a structured exit within 6-9 months and is open to minority equity participation post-acquisition.";
        }
        
        // --- 3. Single Select Dropdown (Use ID) ---
        const referralSelect = document.getElementById("referralSourceSelect");
        if (referralSelect) {
             // Use a value that exists in the static list
             referralSelect.value = "REFERRAL";
        }

        // --- 4. Multiselect Dropdown (CRITICAL LOGIC) ---
        const multiselectName = "industry"; 
        // Find the hidden input that stores the final submitted value
        const multiselectHiddenInput = document.querySelector(`input[name="${multiselectName}"]`);
        
        if (multiselectHiddenInput) {
            // == CONFIGURE YOUR TEST VALUES HERE ==
            // Must be comma-separated strings matching the checkbox 'value' attributes in index.html
            const testValues = "TECH,FINANCE,OTHER"; 
            
            // 1. Set the value of the hidden input
            multiselectHiddenInput.value = testValues;
            
            // 2. Find the visible checkbox list
            const dropdownList = multiselectHiddenInput.closest('.multiselect-dropdown')?.querySelector('.dropdown-list');
            
            // 3. Manually check the checkboxes and trigger change events to update the UI
            if (dropdownList) {
                dropdownList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    // Set the checked state if the checkbox value is in our test list
                    checkbox.checked = testValues.includes(checkbox.value);
                    // Trigger the 'change' event to force the form.js logic to update the dropdown button text
                    checkbox.dispatchEvent(new Event('change')); 
                });
            }
        }
        
        console.log("✅ All required fields populated with test data.");
    }
    // === END TEST DATA LOADER FUNCTION ===

    // === Listener for the Test Button ===
    loadTestButton.addEventListener('click', loadTestData);

});