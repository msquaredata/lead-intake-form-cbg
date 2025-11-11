window.addEventListener("load", () => {
    console.log("🔍 File uploader binding started");
    console.log("✅ DOM fully loaded — initializing dropdowns...");

    // === DYNAMIC DROPDOWN LOADER CALL ===
    // loadDropdownFromCSV('industrySelect', 'assets/data/industries.csv');


// === CSV Loader Function with Active Filter ===
    // NOTE: This function is commented out as the CSV file is not provided, 
    // but the structure is maintained for future use.
    /*
    async function loadDropdownFromCSV(selectId, csvPath) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) {
            console.error(`Dropdown element with ID '${selectId}' not found.`);
            return;
        }

        try {
            const response = await fetch(csvPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();

            // Simple CSV Parser: splits by line, then by comma. Assumes first line is header (Label,Value,Active?).
            const lines = csvText.trim().split('\n');
            
            // 1. Parse all data, capturing all three columns
            const parsedData = lines.slice(1).map(line => {
                const parts = line.split(',').map(part => part.trim());
                return {
                    label: parts[0],
                    value: parts[1],
                    active: parts[2] // Capture the third column (Active?)
                };
            });

            // 2. FILTER STEP: Only keep rows where the third column (active) is 'Y'
            const activeData = parsedData.filter(item => item.active === 'Y');

            // 3. Clear existing options and add a default 'Select' option
            selectElement.innerHTML = '<option value="">Select Industry</option>';

            // 4. Populate the dropdown with active options
            activeData.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.label;
                selectElement.appendChild(option);
            });

            console.log(`Dropdown #${selectId} loaded successfully with ${activeData.length} active options.`);

        } catch (error) {
            console.error(`Error loading CSV for dropdown ${selectId}:`, error);
        }
    }
    */
    
    // === File Upload Configuration ===
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
    // List of supported extensions for user guidance
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

    // DataTransfer object is used to create a mutable FileList, 
    // which acts as the source of truth for all currently selected files.\
    let currentFiles = new DataTransfer();

    // === Helper: format bytes ===
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // === Helper: Update Total Size & Info UI ===
    const updateFileInfo = () => {
        const files = currentFiles.files;
        let totalSize = 0;
        Array.from(files).forEach(file => {
            totalSize += file.size;
        });

        const totalSizeMB = totalSize / (1024 * 1024);
        
        // Update text
        fileInfo.textContent = `(${files.length}/${MAX_FILE_COUNT} files, ${formatBytes(totalSize)} / ${MAX_TOTAL_SIZE_MB} MB max)`;
        
        // Update progress bar
        const progressPercentage = Math.min(100, (totalSizeMB / MAX_TOTAL_SIZE_MB) * 100);
        progressFill.style.width = `${progressPercentage}%`;
        
        // Check for total size error
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

    // === Helper: Render File List ===
    const renderFileList = () => {
        const files = currentFiles.files;
        fileList.innerHTML = ''; // Clear current list

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
        
        // Bind remove buttons after rendering
        fileList.querySelectorAll('.remove-file-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                removeFile(index);
            });
        });
        
        updateFileInfo();
    };
    
    // === File Removal Logic ===
    const removeFile = (indexToRemove) => {
        const newDT = new DataTransfer();
        const filesArray = Array.from(currentFiles.files);
        
        filesArray.forEach((file, index) => {
            if (index !== indexToRemove) {
                newDT.items.add(file);
            }
        });

        currentFiles = newDT;
        renderFileList();
    };

    // === File Validation and Addition Logic ===
    const addFiles = (filesToAdd) => {
        fileError.textContent = ''; // Clear previous errors
        fileError.classList.remove('active');
        
        let newFilesCount = 0;
        let filesExceedingSize = [];
        let invalidTypeCount = 0;

        Array.from(filesToAdd).forEach(file => {
            const totalCount = currentFiles.files.length + newFilesCount;
            
            // Check 1: Max file count
            if (totalCount >= MAX_FILE_COUNT) {
                return; // Skip if max count reached
            }

            // Check 2: Single file size limit
            if ((file.size / (1024 * 1024)) > MAX_SINGLE_FILE_SIZE_MB) {
                filesExceedingSize.push(file.name);
                return;
            }

            // Check 3: File type
            if (!ALLOWED_TYPES.includes(file.type)) {
                invalidTypeCount++;
                return;
            }
            
            // Add valid file to DataTransfer object
            currentFiles.items.add(file);
            newFilesCount++;
        });
        
        // Handle error messages
        if (filesExceedingSize.length > 0) {
            fileError.textContent = `Error: The following file(s) exceed the ${MAX_SINGLE_FILE_SIZE_MB} MB limit: ${filesExceedingSize.join(', ')}.`;
            fileError.classList.add('active');
        } else if (invalidTypeCount > 0) {
            fileError.textContent = `Error: ${invalidTypeCount} file(s) were ignored due to unsupported file types. Supported: ${SUPPORTED_EXTENSIONS}`;
            fileError.classList.add('active');
        } else if (newFilesCount > 0 && (currentFiles.files.length > MAX_FILE_COUNT)) {
             // This catch handles the edge case where the loop was allowed to run, but total count was reached
             fileError.textContent = `Warning: Only the first ${MAX_FILE_COUNT} files are kept.`;
             fileError.classList.add('active');
        }
        
        // After adding, re-render and check total size constraint
        renderFileList();
        updateFileInfo();
    };

    // === Drag and Drop Listeners ===
    if (fileDropArea) {
        // Prevent default behavior (prevent file from being opened in browser)
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlight drop area on drag enter/over
        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => fileDropArea.classList.add('highlight'), false);
        });

        // Unhighlight drop area on drag leave/drop
        ['dragleave', 'drop'].forEach(eventName => {
            fileDropArea.addEventListener(eventName, () => fileDropArea.classList.remove('highlight'), false);
        });

        // Handle file drop
        fileDropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            addFiles(files);
        }, false);
    }
    
    // === Standard Input Listener ===
    if (fileInput) {
        // Trigger file input when browse trigger is clicked
        if (browseTrigger) {
            browseTrigger.addEventListener('click', () => fileInput.click());
        }
        
        // Listen for files selected via the file dialog
        fileInput.addEventListener('change', (e) => {
            addFiles(e.target.files);
            // Must clear the file input value so selecting the same file triggers 'change' next time
            fileInput.value = ''; 
        });
    }

    // Initial render
    renderFileList();


    // === Multiselect Dropdown Logic ===
    const multiselects = document.querySelectorAll('.multiselect-dropdown');
    
    multiselects.forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-btn');
        const list = dropdown.querySelector('.dropdown-list');
        const checkboxes = list.querySelectorAll('input[type="checkbox"]');
        const dataName = dropdown.getAttribute('data-name');
        
        // Create a hidden input to hold the comma-separated values for submission
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = dataName; // Use the data-name attribute for the name
        hiddenInput.value = '';
        dropdown.appendChild(hiddenInput);

        // Function to update the button text and the hidden input value
        const updateSelection = () => {
            const selectedValues = [];
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedValues.push(checkbox.value);
                }
            });

            hiddenInput.value = selectedValues.join(',');
            
            if (selectedValues.length === 0) {
                button.textContent = `Select ${dataName}`;
            } else if (selectedValues.length === 1) {
                button.textContent = selectedValues[0];
            } else {
                button.textContent = `${selectedValues.length} selected`;
            }
        };

        // Initialize and bind listeners
        updateSelection(); // Initial update

        // Toggle dropdown list visibility
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click on button from immediately closing via document listener
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


    // === Form Submission Handler ===
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const button = form.querySelector('button[type="submit"]');
            
            // Basic client-side validation check (HTML5 standard validity)
            if (!form.checkValidity()) {
                console.warn("Form validation failed. Browser should show warnings.");
                // This triggers the browser's native error display
                button.textContent = "Check Fields!";
                setTimeout(() => {
                    button.textContent = "Submit";
                }, 1500);
                return;
            }

            // Client-side file size check (Total size)
            if (!updateFileInfo()) {
                 button.textContent = "File Too Large!";
                 setTimeout(() => {
                    button.textContent = "Submit";
                }, 1500);
                return;
            }
            
            // Disable button and show loading state
            button.disabled = true;
            button.textContent = "Submitting...";
            button.classList.remove("btn-success");


            // 1. Create FormData from the base form (gets ALL text inputs and hidden multiselects)
            const formData = new FormData(form);

            // 2. CRITICAL FIX: Manually append the files from currentFiles 
            if (fileInput) {
                const files = currentFiles.files;
                const FILE_FIELD_NAME = fileInput.name || "fileUpload";

                for (let i = 0; i < files.length; i++) {
                    formData.append(FILE_FIELD_NAME, files[i]); 
                }
            }
            
            // --- Submission Logic ---
            console.log("Attempting to send form data to webhook:", form.action);
            
            // Ensure response is declared outside the try block for access in finally
            let response = null; 
            
            try {
                response = await fetch(form.action, {
                    method: "POST",
                    body: formData
                });

                // --- ROBUST RESPONSE HANDLING (CRITICAL FOR N8N) ---
                // Try to read the response as text first. This prevents crashes if the body is empty or not JSON.
                const responseText = await response.text();
                let data = {};

                // If text is present and looks like JSON, attempt to parse it
                if (responseText.trim().length > 0 && responseText.trim().startsWith('{')) {
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.warn("Could not parse response as JSON. Assuming success based on status code.");
                    }
                }
                // --- END ROBUST RESPONSE HANDLING ---


                // Check for a successful HTTP status code (200-299)
                if (response.ok) {
                    console.log("✅ Form submission successful (HTTP OK). Preparing redirect.");
                    
                    // Use a redirect URL if n8n returned it in JSON (data.redirect), otherwise use the default
                    const redirectURL = data.redirect || "thank-you.html"; 
                    
                    // Show success, disable button again briefly, then redirect
                    button.textContent = "Success!";
                    button.classList.add("btn-success");
                    
                    // Use a shorter delay for success feedback
                    setTimeout(() => (window.location.href = redirectURL), 1000); 

                } else {
                    // Handle non-OK status (e.g., 400, 500)
                    console.error("❌ Submission failed (HTTP Status Error).", response.status, responseText);
                    alert(`Submission failed. The server returned an error: ${response.status}`);
                }
            } catch (error) {
                console.error("❌ Error submitting form (Network/Fetch Failure):", error);
                alert("Unable to connect to the server. Please check your network.");
            } finally {
                // Guarantees button re-enables after a short delay, especially on error
                if (response === null || !response.ok) {
                     // Only re-enable if the fetch failed entirely or if the response was NOT successful
                     setTimeout(() => {
                        button.disabled = false;
                        button.textContent = "Submit";
                     }, 500);
                }
            }
        });
    }

});