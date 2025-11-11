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

        // --- 1. Standard Input Fields (Text, Email, URL, Number) ---
        const fields = {
            // Section 1: Contact
            firstNameInput: "Jane",
            lastNameInput: "Tester (Auto-Fill)",
            emailInput: "jane.tester@test-corp.io",
            phoneInput: "555-867-5309", // Matches the required pattern
            companyRepresentedInput: "Test Advisors, LLC",
            // Section 2: Business
            businessNameInput: "Test Corp XYZ Inc.",
            websiteInput: "https://www.test-corp-xyz.io",
            hqCityInput: "Testville",
            yearFoundedInput: 2005,
        };

        for (const id in fields) {
            const field = document.getElementById(id);
            if (field) {
                field.value = fields[id];
            }
        }

        // --- 2. Standard Select Fields ---
        const selects = {
            // Section 1: Contact
            roleSelect: "Advisor",
            // Section 2: Business
            industrySelect: "BUSINESS_SERVICES", // Must match an existing <option> value
            hqStateSelect: "FL", // Florida
            // Section 3: Ownership
            ownershipSelect: "Founder/Family-Owned",
            transitionGoalSelect: "Exit",
            transitionTimingSelect: "< 12 months",
            // Section 4: Financial
            revenueRangeTextSelect: "$10–25M",
            ebitdaMarginSelect: "20%+",
            leverageSelect: "Manageable",
            // Section 6: Miscellaneous
            referralSourceSelect: "Website"
        };

        for (const id in selects) {
            const select = document.getElementById(id);
            if (select) {
                // Check if the option exists before setting the value
                if (Array.from(select.options).some(opt => opt.value === selects[id] || opt.textContent === selects[id])) {
                    select.value = selects[id];
                } else {
                    console.warn(`Test data failed: Option "${selects[id]}" not found in select #${id}`);
                }
            }
        }

        // --- 3. Textarea Fields ---
        const textareas = {
            notableCustomersInput: "Multi-year contracts with major utility companies (50% recurring revenue).",
            fitReasonInput: "Strong recurring revenue model, founder is ready for a clean exit, established team in place.",
            otherDetailsInput: "Seller prefers an expedited close timeline. NDA is on file."
        };

        for (const id in textareas) {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.value = textareas[id];
            }
        }


        // --- 4. Checkbox Fields ---
        const hasManagementTeamCheckbox = document.getElementById("hasManagementTeamCheckbox");
        if (hasManagementTeamCheckbox) {
            hasManagementTeamCheckbox.checked = true;
        }

        // --- 5. Multiselect Dropdowns (Requires setting checkboxes and triggering UI update) ---
        // Helper function for multiselects
        function setMultiselect(dataName, valuesArray) {
            const multiselectDiv = document.querySelector(`.multiselect-dropdown[data-name="${dataName}"]`);
            if (!multiselectDiv) return;

            // Update individual checkboxes
            const dropdownList = multiselectDiv.querySelector('.dropdown-list');
            dropdownList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                const isSelected = valuesArray.includes(checkbox.value);
                checkbox.checked = isSelected;

                // Trigger a change event so the underlying form.js script updates the button text/hidden field
                // Note: We dispatch 'change' and 'click' for maximum compatibility with the original form.js event listeners
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                // If the field is managed by form.js, the 'change' event should be enough.
            });
        }

        // Apply test values to multiselects
        setMultiselect("keyassets", ["Goodwill/Brand", "Team", "Contracts"]);
        setMultiselect("challenge", ["Succession Planning", "Operational Efficiency"]);


        console.log("✅ All required fields populated with test data.");
    }
    // === END TEST DATA LOADER FUNCTION ===

    // === Listener for the Test Button ===
    loadTestButton.addEventListener('click', loadTestData);

});