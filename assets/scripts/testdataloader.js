// --- WARNING: This file is for testing only and should NOT be deployed to production. ---

window.addEventListener("load", () => {
    
    // Find the dedicated test button
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

        // --- 4. Multiselect Dropdown (Requires special handling) ---
        const multiselectName = "industry"; 
        const multiselectHiddenInput = document.querySelector(`input[name="${multiselectName}"]`);
        
        if (multiselectHiddenInput) {
            const testValues = "TECH,HEALTHCARE"; // The values you want to select
            multiselectHiddenInput.value = testValues;
            
            // CRITICAL: Manually check the checkboxes and trigger change events to update the UI button text
            const dropdownList = multiselectHiddenInput.closest('.multiselect-dropdown')?.querySelector('.dropdown-list');
            if (dropdownList) {
                dropdownList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = testValues.includes(checkbox.value);
                    checkbox.dispatchEvent(new Event('change')); // Trigger change to update the button text
                });
            }
        }
        
        console.log("✅ All required fields populated with test data.");
    }
    // === END TEST DATA LOADER FUNCTION ===

    // === Listener for the Test Button ===
    loadTestButton.addEventListener('click', loadTestData);

});