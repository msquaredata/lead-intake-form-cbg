window.addEventListener("load", () => {
    console.log("🔍 Form logic initialization started.");

    // =================================================================
    // 1. Configuration & Global References
    // =================================================================

    const MAX_TOTAL_SIZE_MB = 20;
    const MAX_SINGLE_FILE_SIZE_MB = 10;
    const MAX_FILE_COUNT = 3;
    const ALLOWED_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "image/png",
        "image/jpeg"
    ];
    const SUPPORTED_EXTENSIONS = ".pdf, .doc, .docx, .xls, .xlsx, .png, .jpg, .jpeg"; 

    // DOM references
    const fileInput = document.getElementById("fileUpload");
    const browseTrigger = document.getElementById("browseTrigger");
    const fileDropArea = document.getElementById("fileDropArea");
    const fileList = document.getElementById("fileList");
    const fileError = document.getElementById("fileError");
    const progressFill = document.getElementById("uploadProgressFill");
    const fileInfo = document.getElementById("fileInfo"); 
    const form = document.getElementById("leadForm");
    const loadTestButton = document.getElementById("loadTestDataButton");
    const submissionErrorBox = document.getElementById('submissionErrorBox');

    // Data source of truth for files
    let currentFiles = new DataTransfer();


    // =================================================================
    // 2. File Handling Logic
    // =================================================================

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const updateFileInfo = () => {
        const files = currentFiles.files;
        let totalSize = 0;
        Array.from(files).forEach(file => {
            totalSize += file.size;
        });

        const totalSizeMB = totalSize / (1024 * 1024);
        
        fileInfo.textContent = `(${files.length}/${MAX_FILE_COUNT} files, ${formatBytes(totalSize)} / ${MAX_TOTAL_SIZE_MB} MB max)`;
        
        const progressPercentage = Math.min(100, (totalSizeMB / MAX_TOTAL_SIZE_MB) * 100);
        progressFill.style.width = `${progressPercentage}%`;
        
        // Validation check
        if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
            fileError.textContent = `Error: Total file size exceeds ${MAX_TOTAL_SIZE_MB} MB. Please remove files.`;
            fileError.classList.add('active');
            return false;
        } else {
            fileError.classList.remove('active');
            fileError.textContent = '';
            return true;
        }
    };

    const removeFile = (indexToRemove) => {
        const newDT = new DataTransfer();
        Array.from(currentFiles.files).forEach((file, index) => {
            if (index !== indexToRemove) {
                newDT.items.add(file);
            }
        });
        currentFiles = newDT;
        renderFileList();
    };

    const renderFileList = () => {
        const files = currentFiles.files;
        fileList.innerHTML = ''; 

        if (files.length === 0) {
            fileList.innerHTML = '<li class="muted">No files attached. Max: 3 files, 20 MB total.</li>';
            fileDropArea.classList.remove('has-files');
            return;
        }

        fileDropArea.classList.add('has-files');
        Array.from(files).forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatBytes(file.size)}</span>
                <button type="button" class="remove-file-btn" data-index="${index}" aria-label="Remove file ${file.name}">
                    &times;
                </button>
            `;
            fileList.appendChild(li);
        });
        
        fileList.querySelectorAll('.remove-file-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                removeFile(index);
            });
        });
        
        updateFileInfo();
    };

    const addFiles = (filesToAdd) => {
        fileError.textContent = ''; 
        fileError.classList.remove('active');
        
        let newFilesCount = 0;
        let filesExceedingSize = [];
        let invalidTypeCount = 0;

        Array.from(filesToAdd).forEach(file => {
            const totalCount = currentFiles.files.length + newFilesCount;
            
            if (totalCount >= MAX_FILE_COUNT) {
                return;
            }

            if ((file.size / (1024 * 1024)) > MAX_SINGLE_FILE_SIZE_MB) {
                filesExceedingSize.push(file.name);
                return;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                invalidTypeCount++;
                return;
            }
            
            currentFiles.items.add(file);
            newFilesCount++;
        });
        
        if (filesExceedingSize.length > 0) {
            fileError.textContent = `Error: The following file(s) exceed the ${MAX_SINGLE_FILE_SIZE_MB} MB limit: ${filesExceedingSize.join(', ')}.`;
            fileError.classList.add('active');
        } else if (invalidTypeCount > 0) {
            fileError.textContent = `Error: ${invalidTypeCount} file(s) were ignored due to unsupported file types. Supported: ${SUPPORTED_EXTENSIONS}`;
            fileError.classList.add('active');
        } else if (newFilesCount > 0 && (currentFiles.files.length > MAX_FILE_COUNT)) {
             fileError.textContent = `Warning: Only the first ${MAX_FILE_COUNT} files are kept.`;
             fileError.classList.add('active');
        }
        
        renderFileList();
        updateFileInfo();
    };


    // --- File Drop and Input Listeners ---
    if (fileDropArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('highlight'), false);
        });

        fileDropArea.addEventListener('drop', (e) => {
            addFiles(e.dataTransfer.files);
        }, false);
    }
    
    if (fileInput) {
        if (browseTrigger) {
            browseTrigger.addEventListener('click', () => fileInput.click());
        }
        
        fileInput.addEventListener('change', (e) => {
            addFiles(e.target.files);
            fileInput.value = ''; // Clear native input value to allow selecting same files again
        });
    }

    renderFileList(); // Initial file list rendering


    // =================================================================
    // 3. Multiselect Dropdown Logic (Data Serialization)
    // =================================================================

    const multiselects = document.querySelectorAll('.multiselect-dropdown');
    
    multiselects.forEach(dropdown => {
        const dataName = dropdown.getAttribute('data-name');
        const button = dropdown.querySelector('.dropdown-btn');
        const list = dropdown.querySelector('.dropdown-list');
        const checkboxes = list ? list.querySelectorAll('input[type="checkbox"]') : [];
        
        if (!button || !list) return; 

        // CRITICAL LEARNING: Create a hidden input to hold the comma-separated values for submission
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = dataName;
        hiddenInput.value = '';
        dropdown.appendChild(hiddenInput);

        const updateSelection = () => {
            const selectedValues = [];
            const selectedLabels = [];
            
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedValues.push(checkbox.value);
                    const label = checkbox.closest('label');
                    if (label) {
                        const labelText = Array.from(label.childNodes)
                            .filter(node => node.nodeType === 3) 
                            .map(node => node.textContent.trim())
                            .join('');
                        selectedLabels.push(labelText || checkbox.value);
                    } else {
                        selectedLabels.push(checkbox.value);
                    }
                }
            });

            // Set the value of the hidden input for form submission
            hiddenInput.value = selectedValues.join(',');
            
            if (selectedValues.length === 0) {
                const displayName = dataName.charAt(0).toUpperCase() + dataName.slice(1).replace(/([a-z])([A-Z])/g, '$1 $2');
                button.textContent = `Select ${displayName}`;
            } else if (selectedValues.length === 1) {
                button.textContent = selectedLabels[0];
            } else {
                button.textContent = `${selectedValues.length} selected`;
            }
            
            // Add arrow icon for visual cue
            const arrowIcon = `<span style="margin-left: 10px; color: ${selectedValues.length > 0 ? 'inherit' : 'var(--color-light-text)'};">&#9660;</span>`;
            button.innerHTML = `${button.textContent} ${arrowIcon}`;
        };

        updateSelection(); // Initial update

        // Toggle dropdown list visibility
        button.addEventListener('click', (e) => {
            e.stopPropagation(); 
            document.querySelectorAll('.dropdown-list.active').forEach(openlist => {
                if (openlist !== list) {
                    openlist.classList.remove('active');
                    openlist.previousElementSibling.classList.remove('active');
                }
            });
            list.classList.toggle('active');
            button.classList.toggle('active');
        });

        // Update when a checkbox state changes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelection);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                list.classList.remove('active');
                button.classList.remove('active');
            }
        });
    });


    // =================================================================
    // 4. Form Submission Handler
    // =================================================================

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const button = form.querySelector('button[type="submit"]');
            submissionErrorBox.style.display = 'none';
            submissionErrorBox.textContent = '';


            // 1. Client-Side Validation & File Check
            if (!form.checkValidity()) {
                console.warn("Form validation failed. Please check required fields.");
                button.textContent = "Check Fields!";
                setTimeout(() => { button.textContent = "Submit"; }, 1500);
                return;
            }

            if (!updateFileInfo()) { // Checks total size constraint
                 button.textContent = "File Too Large!";
                 submissionErrorBox.textContent = "Total file size exceeds the limit. Please remove some files.";
                 submissionErrorBox.style.display = 'block';
                 setTimeout(() => { button.textContent = "Submit"; }, 1500);
                return;
            }
            
            // Set Loading State
            button.disabled = true;
            button.textContent = "Submitting...";
            button.classList.remove("btn-success");

            // CRITICAL LEARNING: Create FormData from the base form (gets ALL text and hidden inputs)
            const formData = new FormData(form);

            // CRITICAL LEARNING: Manually append the files from currentFiles (the source of truth)
            const files = currentFiles.files;
            if (fileInput) {
                const FILE_FIELD_NAME = fileInput.name || "fileUpload"; 
                for (let i = 0; i < files.length; i++) {
                    formData.append(FILE_FIELD_NAME, files[i]); 
                }
            }
            
            // --- Submission Logic ---
            let response = null; 
            
            try {
                console.log("Attempting to send form data to webhook:", form.action);

                response = await fetch(form.action, {
                    method: "POST",
                    body: formData
                });

                const responseText = await response.text();
                let data = {};

                if (responseText.trim().length > 0 && responseText.trim().startsWith('{')) {
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.warn("Could not parse response as JSON. Proceeding based on HTTP status.");
                    }
                }

                // Assuming the backend returns {ok: true, redirect: '...'} or 200 status code
                if (response.ok) {
                    console.log("✅ Form submission successful (HTTP OK).");
                    
                    button.textContent = "Success!";
                    button.classList.add("btn-success");
                    
                    // Mocking successful submission response for this environment
                    console.log(`Mocking successful submission. Data sent to ${form.action}`);
                    setTimeout(() => { 
                        button.disabled = false; 
                        button.textContent = "Submit"; 
                        // In production, you would redirect here if response contained a redirect URL
                        // window.location.href = data.redirect || "thank-you.html"; 
                    }, 2000);

                } else {
                    console.error("❌ Submission failed (HTTP Status Error).", response.status, responseText);
                    const message = `Submission failed. The server returned an error: ${response.status}. See console for details.`;
                    submissionErrorBox.textContent = message;
                    submissionErrorBox.style.display = 'block';
                }
            } catch (error) {
                console.error("❌ Error submitting form (Network/Fetch Failure):", error);
                const message = "Unable to connect to the server. Please check your network. See console for details.";
                submissionErrorBox.textContent = message;
                submissionErrorBox.style.display = 'block';
            } finally {
                 // Guarantees button re-enables after a short delay
                 setTimeout(() => {
                    button.disabled = false;
                    if (button.textContent === "Submitting...") {
                        button.textContent = "Submit";
                    }
                 }, 500);
            }
        });
    }


    // =================================================================
    // 5. Test Data Loader (For Debugging Only)
    // =================================================================

    if (loadTestButton) {
        console.log("🧪 Test Data Loader Initialized.");
        
        function loadTestData() {
            console.log("🚀 Loading test data into form fields...");

            // --- 1. Standard Input Fields ---
            const fields = {
                firstNameInput: "Jane",
                lastNameInput: "Tester (Auto-Fill)",
                emailInput: "jane.tester@test-corp.io",
                phoneInput: "555-867-5309", 
                companyRepresentedInput: "Test Advisors, LLC",
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
                roleSelect: "Advisor",
                industrySelect: "BUSINESS_SERVICES", 
                hqStateSelect: "FL", 
                ownershipSelect: "Founder/Family-Owned",
                transitionGoalSelect: "Exit",
                transitionTimingSelect: "< 12 months",
                revenueRangeTextSelect: "$10–25M",
                ebitdaMarginSelect: "20%+",
                leverageSelect: "Manageable",
                referralSourceSelect: "Website"
            };

            for (const id in selects) {
                const select = document.getElementById(id);
                if (select) {
                    select.value = selects[id];
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

            // --- 5. CRITICAL: Multiselect Dropdowns Loader ---
            function setMultiselect(dataName, valuesArray) {
                const multiselectDiv = document.querySelector(`.multiselect-dropdown[data-name="${dataName}"]`);
                if (!multiselectDiv) return;

                const dropdownList = multiselectDiv.querySelector('.dropdown-list');

                dropdownList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = valuesArray.includes(checkbox.value);
                    // Trigger change event to update the button text in form_logic.js
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }

            setMultiselect("keyAssets", ["Goodwill/Brand", "Team", "Contracts"]);
            setMultiselect("challenge", ["Succession Planning", "Operational Efficiency"]);


            console.log("✅ All required fields populated with test data.");
        }

        loadTestButton.addEventListener('click', loadTestData);
    }
});