window.addEventListener("load", () => {
    console.log("🔍 Form initialization started...");

    // ====================================
    // === DYNAMIC DROPDOWN LOADER FUNCTION ===
    // ====================================
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

            // Simple CSV Parser: splits by line, then by comma. Assumes first line is header.
            const lines = csvText.trim().split('\n');
            
            // Parse and capture all three columns
            const parsedData = lines.slice(1).map(line => {
                const parts = line.split(',').map(part => part.trim());
                return {
                    label: parts[0],
                    value: parts[1],
                    active: parts[2] // Capture the third column (Active?)
                };
            });

            // FILTER: Only keep items where 'active' is 'Y'
            const filteredData = parsedData.filter(item => item.active && item.active.toUpperCase() === 'Y');

            // Clear the initial state
            selectElement.innerHTML = '';

            // Add a default empty option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select an option...';
            selectElement.appendChild(defaultOption);

            // Populate the dropdown with filtered data
            filteredData.forEach(item => {
                const option = document.createElement('option');
                option.value = item.value;
                option.textContent = item.label;
                selectElement.appendChild(option);
            });
            console.log(`✅ Dropdown '${selectId}' loaded with ${filteredData.length} active options.`);

        } catch (error) {
            console.error(`❌ Failed to load CSV data for ${selectId}:`, error);
            selectElement.innerHTML = '<option value="" disabled selected>Error loading options</option>';
        }
    }
    
    // === CSV Loader Call ===
    loadDropdownFromCSV('referralSourceSelect', 'assets/data/options.csv');


    // === File Upload Configuration ===
    const MAX_TOTAL_SIZE_MB = 20;
    const ALLOWED_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

    // DataTransfer object is used to create a mutable FileList, 
    // which acts as the source of truth for all currently selected files.
    let currentFiles = new DataTransfer();

    // === CONDITIONAL FILE UPLOADER LOGIC START ===
    if (fileInput) {
        
        console.log("✅ File upload component found. Initializing uploader...");
        
        // === Helper: format bytes → MB ===
        function formatBytes(bytes) {
            return (bytes / (1024 * 1024)).toFixed(1) + " MB";
        }

        // === Render selected files (Includes Delete Icon) ===
        function renderFiles(files) {
            if (!fileList) return;
            fileList.innerHTML = "";

            let totalSize = 0;
            const filesArray = Array.from(files);

            filesArray.forEach(file => {
                totalSize += file.size;

                const li = document.createElement("li");
                li.classList.add("file-item");
                li.innerHTML = `
                    <span class="file-icon">📄</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatBytes(file.size)}</span>
                    <span class="delete-file" data-file-name="${file.name}">&times;</span> 
                `;
                fileList.appendChild(li);
            });

            const totalSizeMB = totalSize / (1024 * 1024);
            const maxSizeBytes = MAX_TOTAL_SIZE_MB * 1024 * 1024;

            if (fileInfo) {
                fileInfo.innerHTML = `
                    Max size: <strong>${MAX_TOTAL_SIZE_MB} MB</strong>. 
                    Current size: <strong>${totalSizeMB.toFixed(1)} MB</strong>
                `;
                fileInfo.style.color = totalSizeMB > maxSizeBytes * 0.9 ? 'orange' : 'inherit';
            }

            const pct = Math.min((totalSizeMB / MAX_TOTAL_SIZE_MB) * 100, 100);
            progressFill.style.width = `${pct}%`;

            // Error handling for size
            if (totalSize > maxSizeBytes) {
                fileError.textContent = `Total size exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`;
                fileError.style.display = "block";
            } else if (fileError.textContent.includes(`Total size exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`)) {
                fileError.textContent = "";
                fileError.style.display = "none";
            }
        }
        
        // Delete function
        function deleteFile(fileName) {
            const filesArray = Array.from(currentFiles.files);
            const fileIndex = filesArray.findIndex(f => f.name === fileName);

            if (fileIndex > -1) {
                filesArray.splice(fileIndex, 1);
                
                currentFiles = new DataTransfer();
                filesArray.forEach(file => currentFiles.items.add(file));

                fileInput.files = currentFiles.files;

                if (fileError.textContent.includes("Unsupported file types")) {
                     fileError.textContent = "";
                     fileError.style.display = "none"; 
                }

                renderFiles(currentFiles.files);
            }
        }

        // === Validate and handle file input (Appends files and shows type warning) ===
        function handleFiles(newFiles) {
            const incomingFilesArray = Array.from(newFiles);
            
            if (incomingFilesArray.length === 0 && currentFiles.files.length > 0) {
                return renderFiles(currentFiles.files);
            }
            
            let filesToProcess = Array.from(currentFiles.files);
            const existingFileSignatures = filesToProcess.map(f => f.name + f.size);

            incomingFilesArray.forEach(newFile => {
                if (!existingFileSignatures.includes(newFile.name + newFile.size)) {
                    filesToProcess.push(newFile);
                }
            });
            
            if (filesToProcess.length === 0) {
                if (fileList) fileList.innerHTML = "";
                if (progressFill) progressFill.style.width = "0%";
                if (fileInfo) {
                    fileInfo.innerHTML = `Max size: <strong>${MAX_TOTAL_SIZE_MB} MB</strong>. Current size: <strong>0 MB</strong>`;
                    fileInfo.style.color = 'inherit';
                }
                fileError.textContent = "";
                fileError.style.display = "none";
                
                currentFiles = new DataTransfer();
                fileInput.files = currentFiles.files;
                return;
            }

            // VALIDATION: Check for unsupported files in the merged list
            const invalidFiles = filesToProcess.filter(f => !ALLOWED_TYPES.includes(f.type));
            
            if (invalidFiles.length > 0) {
                fileError.textContent = `🚫 Warning: Unsupported file types were removed. Files removed: ${invalidFiles.map(f => f.name).join(", ")}. Supported types are: ${SUPPORTED_EXTENSIONS}`;
                fileError.style.display = "block";
                
                filesToProcess = filesToProcess.filter(f => ALLOWED_TYPES.includes(f.type));
            } else {
                if (fileError.textContent.includes("Unsupported file types")) {
                     fileError.textContent = "";
                     fileError.style.display = "none";
                }
            }

            // Update the internal file list and the actual input element
            currentFiles = new DataTransfer();
            filesToProcess.forEach(file => currentFiles.items.add(file));
            fileInput.files = currentFiles.files;

            renderFiles(currentFiles.files);
        }

        // === Bind UI interactions ===
        if (browseTrigger) {
            browseTrigger.addEventListener("click", e => {
                e.preventDefault();
                fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener("change", e => handleFiles(e.target.files));
        }

        if (fileDropArea) {
            ["dragenter", "dragover"].forEach(ev =>
                fileDropArea.addEventListener(ev, e => {
                    e.preventDefault();
                    fileDropArea.classList.add("drag-over");
                })
            );
            ["dragleave", "drop"].forEach(ev =>
                fileDropArea.addEventListener(ev, e => {
                    e.preventDefault();
                    fileDropArea.classList.remove("drag-over");
                })
            );
            fileDropArea.addEventListener("drop", e => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
            });
        }
        
        // Event listener for file deletion clicks 
        if (fileList) {
            fileList.addEventListener("click", e => {
                const deleteButton = e.target.closest(".delete-file");
                if (deleteButton) {
                    e.stopPropagation(); 
                    e.preventDefault(); 
                    
                    const fileName = deleteButton.dataset.fileName;
                    deleteFile(fileName);
                }
            });
        }
    } else {
        console.log("⚠️ File uploader binding skipped.");
    }
    // === CONDITIONAL FILE UPLOADER LOGIC END ===


    // === Multiselect sorting ===
    document.querySelectorAll(".multiselect-dropdown .dropdown-list").forEach(list => {
        const labels = Array.from(list.querySelectorAll("label"));
        labels.sort((a, b) => {
            const textA = a.textContent.trim();
            const textB = b.textContent.trim();
            if (textA === "Other") return 1;
            if (textB === "Other") return -1;
            return textA.localeCompare(textB);
        });
        list.innerHTML = "";
        labels.forEach(label => list.appendChild(label));
    });

    // === Multiselect behavior ===
    document.querySelectorAll(".multiselect-dropdown").forEach(dropdown => {
        const button = dropdown.querySelector(".dropdown-btn");
        const list = dropdown.querySelector(".dropdown-list");
        
        const dataName = dropdown.dataset.name;
        
        if (!dataName) {
            console.error("Multiselect initialization failed: Missing 'data-name' attribute.");
            return; 
        }
        
        const isRequired = dropdown.hasAttribute('required') || dropdown.querySelector('[required]') !== null;

        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = dataName; 
        
        if(isRequired) {
             hiddenInput.setAttribute('required', 'required'); 
             hiddenInput.classList.add('multiselect-hidden'); 
        }
        
        dropdown.appendChild(hiddenInput);

        const defaultText = button.textContent.trim();

        const updateDropdown = () => {
            const selected = Array.from(list.querySelectorAll("input:checked")).map(cb => cb.value);
            hiddenInput.value = selected.join(", ");
            let newText = selected.length === 0
                ? defaultText
                : selected.length === 1
                ? selected[0]
                : `${selected.length} items selected`;
            button.textContent = newText;
            button.classList.toggle("has-selection", selected.length > 0);
            
            // Clear/Apply error state on selection change for required fields
            if (isRequired) {
                 if (selected.length > 0) {
                     button.closest('label')?.classList.remove('field-error');
                 } else {
                     button.closest('label')?.classList.add('field-error'); 
                 }
            }
        };

        updateDropdown();

        button.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });

        list.querySelectorAll("input[type='checkbox']").forEach(cb =>
            cb.addEventListener("change", updateDropdown)
        );

        document.addEventListener("click", e => {
            if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
        });
    });

    console.log("✅ Dropdown initialization complete.");
    
    // ======================================
    // === FORM VALIDATION & SUBMISSION LOGIC ===
    // ======================================
    
    const form = document.getElementById("leadForm");
    if (!form) return;
    
    const requiredFields = form.querySelectorAll('[required]');

    /** Finds the correct element to apply/clear the error class. */
    const getTargetElement = (inputElement) => {
        if (inputElement.classList.contains('dropdown-btn')) {
            return inputElement.closest('.multiselect-dropdown')?.closest('label');
        }
        return inputElement.closest('label');
    };

    const clearError = (inputElement) => {
        const targetElement = getTargetElement(inputElement);
        if (targetElement) {
            targetElement.classList.remove('field-error');
        }
    };

    const applyError = (inputElement) => {
        const targetElement = getTargetElement(inputElement);
        if (targetElement) {
            targetElement.classList.add('field-error');
        }
    };

    /** Checks if a field is valid using native HTML validation. */
    const isValid = (input) => {
        return input.checkValidity();
    };

    // --- Real-time feedback: Clear error as user types ---
    requiredFields.forEach(field => {
        if (field.type === 'hidden' && field.classList.contains('multiselect-hidden')) {
             return; 
        }

        field.addEventListener('input', () => {
            if (isValid(field)) {
                clearError(field);
            }
        });

        field.addEventListener('change', () => {
            if (isValid(field)) {
                clearError(field);
            }
        });
    });
    
    // === Form Submission Override ===
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const button = form.querySelector("button[type='submit']");
        
        let isFormValid = true;

        // 1. Reset all previous error states
        form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

        // 2. Check all required fields
        requiredFields.forEach(field => {
            const isMultiselectHidden = field.classList.contains('multiselect-hidden');
            const elementToHighlight = isMultiselectHidden 
                ? field.closest('.multiselect-dropdown')?.querySelector('.dropdown-btn') 
                : field;
           
            if (!isValid(field)) {
                if(elementToHighlight) applyError(elementToHighlight);
                isFormValid = false; 
            } else {
                if(elementToHighlight) clearError(elementToHighlight);
            }
        });

        if (!isFormValid) {
            console.log('Form validation failed. Missing required fields.');
            const firstError = form.querySelector('.field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            button.disabled = false;
            button.textContent = "Submit";
            return; 
        }

        // --- Validation Passed ---
        button.disabled = true;
        button.textContent = "Submitting...";

        // File size check (only if file input exists)
        const files = fileInput ? (currentFiles.files || []) : [];
        let totalSize = [...files].reduce((sum, f) => sum + f.size, 0);
        const MAX_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

        if (totalSize > MAX_SIZE_BYTES) {
            alert(`Total file size exceeds ${MAX_TOTAL_SIZE_MB} MB.`);
            button.disabled = false;
            button.textContent = "Submit";
            return;
        }

        // 1. Create FormData 
        const formData = new FormData(form);

        // 2. Manually append the files 
        if (fileInput) {
            const FILE_FIELD_NAME = fileInput.name || "fileUpload";

            for (let i = 0; i < files.length; i++) {
                formData.append(FILE_FIELD_NAME, files[i]); 
            }
        }
        
        // --- Submission Logic ---
        console.log("Attempting to send form data to webhook:", form.action);
        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.status === "received") {
                const redirectURL = data.redirect || "thank-you.html";
                setTimeout(() => (window.location.href = redirectURL), 800);
            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error submitting form:", error);
            alert("Unable to connect to the server. Please try again later.");
        } finally {
            // Guarantees button re-enables after a short delay, even if fetch times out
            setTimeout(() => {
                button.disabled = false;
                button.textContent = "Submit";
            }, 500); 
        }
    });
});