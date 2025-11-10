window.addEventListener("load", () => {
    console.log("🔍 File uploader binding started");
    console.log("✅ DOM fully loaded — initializing dropdowns...");

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

        // 💡 Only handle the size error here. Preserve the type warning if it exists.
        if (totalSize > maxSizeBytes) {
            fileError.textContent = `Total size exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`;
            fileError.style.display = "block";
        } else if (fileError.textContent.includes(`Total size exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`)) {
            // If the current error is a size error and size is now okay, clear it.
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

            // Explicitly clear the type warning on deletion 
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
        
        // 1. Prevent clearing files on cancel
        if (incomingFilesArray.length === 0 && currentFiles.files.length > 0) {
            return renderFiles(currentFiles.files);
        }
        
        // 2. Implement file appending logic (merge new files with existing)
        let filesToProcess = Array.from(currentFiles.files);
        const existingFileSignatures = filesToProcess.map(f => f.name + f.size);

        incomingFilesArray.forEach(newFile => {
            // Only append files that are not already in the list (based on name + size)
            if (!existingFileSignatures.includes(newFile.name + newFile.size)) {
                filesToProcess.push(newFile);
            }
        });
        
        // If no files at all (e.g., empty initial selection), reset
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

        // 3. VALIDATION: Check for unsupported files in the merged list
        const invalidFiles = filesToProcess.filter(f => !ALLOWED_TYPES.includes(f.type));
        
        if (invalidFiles.length > 0) {
            // SET the type warning error text here
            fileError.textContent = `🚫 Warning: Unsupported file types were removed. Files removed: ${invalidFiles.map(f => f.name).join(", ")}. Supported types are: ${SUPPORTED_EXTENSIONS}`;
            fileError.style.display = "block";
            
            // Filter out only the invalid files but keep all previously and newly added VALID files
            filesToProcess = filesToProcess.filter(f => ALLOWED_TYPES.includes(f.type));
        } else {
            // Clear the type warning if a new, fully valid upload is performed.
            if (fileError.textContent.includes("Unsupported file types")) {
                 fileError.textContent = "";
                 fileError.style.display = "none";
            }
        }

        // 4. Update the internal file list and the actual input element
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
        
        // Safety check to prevent errors if the data-name attribute is missing
        if (!dataName) {
            console.error("Multiselect initialization failed: Missing 'data-name' attribute on a dropdown.");
            return; 
        }
        
        const isRequired = dropdown.hasAttribute('required') || dropdown.querySelector('[required]') !== null;

        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = dataName; 
        
        if(isRequired) {
             hiddenInput.setAttribute('required', 'required'); 
             hiddenInput.classList.add('multiselect-hidden'); // Tag for custom validation
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
            
            // 💡 ADDED: Clear/Apply error state on selection change for required fields
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
    // === NEW CUSTOM VALIDATION LOGIC START ===
    // ======================================
    
    const form = document.getElementById("leadForm");
    if (!form) return;
    
    const requiredFields = form.querySelectorAll('[required]');

    /**
     * Finds the correct element to apply/clear the error class (usually the parent <label>).
     * @param {HTMLElement} inputElement - The input, select, textarea, or multiselect-btn element.
     * @returns {HTMLElement|null} The element to which the 'field-error' class should be applied.
     */
    const getTargetElement = (inputElement) => {
        if (inputElement.classList.contains('dropdown-btn')) {
            // For a multiselect button, target its parent label
            return inputElement.closest('.multiselect-dropdown')?.closest('label');
        }
        // For standard inputs, target the closest label
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

    /**
     * Checks if a field is valid (i.e., not empty). Only called for [required] fields.
     */
    const isValid = (input) => {
        if (input.type === 'checkbox') {
            return input.checked;
        }
        // For text, select, textarea, hidden inputs, etc., trim whitespace and check if not empty
        return input.value.trim() !== '';
    };

    // --- Real-time feedback: Clear error as user types ---
    requiredFields.forEach(field => {
        // Skip multiselect hidden fields as their visual feedback is handled in the updateDropdown function
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
    
    // === Form Submission Override (Replaces form.checkValidity()) ===
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const button = form.querySelector("button[type='submit']");
        
        let isFormValid = true;

        // 1. Reset all previous error states
        form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));

        // 2. Check all required fields (Custom Validation)
        requiredFields.forEach(field => {
            
            if (field.classList.contains('multiselect-hidden')) {
                // For multiselects, check the hidden input value but highlight the visible button
                 const dropdownButton = field.closest('.multiselect-dropdown')?.querySelector('.dropdown-btn');
                 if (!isValid(field)) {
                    if(dropdownButton) applyError(dropdownButton);
                    isFormValid = false;
                } else {
                    if(dropdownButton) clearError(dropdownButton);
                }
            } else if (!isValid(field)) {
                applyError(field);
                isFormValid = false;
            } else {
                clearError(field);
            }
        });

        if (!isFormValid) {
            console.log('Form validation failed. Missing required fields.');
            // Scroll to the first error field for better UX
            const firstError = form.querySelector('.field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Stop processing and re-enable button
            button.disabled = false;
            button.textContent = "Submit";
            return; 
        }
        // --- Custom Validation Passed ---

        // Proceed with submission (original code structure)
        button.disabled = true;
        button.textContent = "Submitting...";

        // Use currentFiles.files for submission and final size check
        const files = currentFiles.files || [];
        let totalSize = [...files].reduce((sum, f) => sum + f.size, 0);
        const MAX_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

        if (totalSize > MAX_SIZE_BYTES) {
            alert(`Total file size exceeds ${MAX_TOTAL_SIZE_MB} MB.`);
            button.disabled = false;
            button.textContent = "Submit";
            return;
        }

        // 1. Create FormData from the base form (gets ALL text inputs and hidden multiselects)
        const formData = new FormData(form);

        // 2. CRITICAL FIX: Manually append the files from currentFiles 
        //    (This ensures file data is sent to n8n's binary field)
        const FILE_FIELD_NAME = fileInput.name || "fileUpload";

        for (let i = 0; i < files.length; i++) {
            formData.append(FILE_FIELD_NAME, files[i]); 
        }
        
        // --- Submission Logic ---
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
            button.disabled = false;
            button.textContent = "Submit";
        }
    });
});