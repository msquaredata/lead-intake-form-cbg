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

  // DOM references
  const fileInput = document.getElementById("fileUpload");
  const browseTrigger = document.getElementById("browseTrigger");
  const fileDropArea = document.getElementById("fileDropArea");
  const fileList = document.getElementById("fileList");
  const fileError = document.getElementById("fileError");
  const progressFill = document.getElementById("uploadProgressFill");
  const fileInfo = document.getElementById("fileInfo"); 
  
  // DataTransfer object is used to create a mutable FileList
  let currentFiles = new DataTransfer();

  // === Helper: format bytes → MB ===
  function formatBytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // === Render selected files ===
  function renderFiles(files) {
    if (!fileList) return;
    fileList.innerHTML = "";

    let totalSize = 0;
    
    // Ensure files is an array-like object before iterating
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
      // Optionally add a class to highlight size when approaching limit
      fileInfo.style.color = totalSizeMB > MAX_TOTAL_SIZE_MB * 0.9 ? 'orange' : 'inherit';
    }


    const pct = Math.min((totalSizeMB / MAX_TOTAL_SIZE_MB) * 100, 100);
    progressFill.style.width = `${pct}%`;

    if (totalSize > maxSizeBytes) {
      fileError.textContent = `Total size exceeds ${MAX_TOTAL_SIZE_MB} MB limit.`;
      fileError.style.display = "block";
    } else {
      fileError.textContent = "";
      fileError.style.display = "none";
    }
  }
  
  // Deletes a single file by name
  function deleteFile(fileName) {
    // Convert current FileList to an array
    const filesArray = Array.from(currentFiles.files);

    // Find the index of the file to remove (using a simple name match for simplicity)
    const fileIndex = filesArray.findIndex(f => f.name === fileName);

    if (fileIndex > -1) {
      // Remove the file from the array
      filesArray.splice(fileIndex, 1);

      // Clear the DataTransfer object
      currentFiles = new DataTransfer();

      // Add the remaining files back to the DataTransfer object
      filesArray.forEach(file => currentFiles.items.add(file));

      // Update the main file input with the new FileList
      fileInput.files = currentFiles.files;

      // Re-validate and re-render the list
      handleFiles(currentFiles.files);
    }
  }


  // === Validate and handle file input ===
  function handleFiles(files) {
    // FIX 1: Prevent clearing files on cancel
    if (files.length === 0 && currentFiles.files.length > 0) {
        // Dialog was canceled, keep the current file list
        files = currentFiles.files;
    }
    
    if (!files || files.length === 0) {
      if (fileList) fileList.innerHTML = "";
      if (progressFill) progressFill.style.width = "0%";
      if (fileInfo) {
        fileInfo.innerHTML = `Max size: <strong>${MAX_TOTAL_SIZE_MB} MB</strong>. Current size: <strong>0 MB</strong>`;
        fileInfo.style.color = 'inherit';
      }
      fileError.textContent = "";
      fileError.style.display = "none";
      
      // Also clear the internal file list and the input itself
      currentFiles = new DataTransfer();
      fileInput.files = currentFiles.files;
      return;
    }
    
    // Convert new files to array for validation
    const incomingFilesArray = Array.from(files);

    const invalidFiles = incomingFilesArray.filter(f => !ALLOWED_TYPES.includes(f.type));
    
    if (invalidFiles.length > 0) {
      // Validation failed, clear everything and show error
      if (fileList) fileList.innerHTML = ""; 
      if (progressFill) progressFill.style.width = "0%";
      if (fileInfo) {
        fileInfo.innerHTML = `Max size: <strong>${MAX_TOTAL_SIZE_MB} MB</strong>. Current size: <strong>0 MB</strong>`;
        fileInfo.style.color = 'inherit';
      }

      fileError.textContent = `Unsupported file types: ${invalidFiles.map(f => f.name).join(", ")}`;
      fileError.style.display = "block";

      // Clear the internal file list and the input itself
      currentFiles = new DataTransfer();
      fileInput.files = currentFiles.files;
      return;
    }

    fileError.textContent = "";
    fileError.style.display = "none";
    
    // Update the internal file list for valid changes
    currentFiles = new DataTransfer();
    incomingFilesArray.forEach(file => currentFiles.items.add(file));
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
    // File input change handler now just calls handleFiles
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
      // On drop, treat the dropped files as the *new* selection
      handleFiles(e.dataTransfer.files);
    });
  }
  
  // 💡 FIX: Event listener for file deletion clicks with stopPropagation()
  if (fileList) {
    fileList.addEventListener("click", e => {
        const deleteButton = e.target.closest(".delete-file");
        if (deleteButton) {
            // CRITICAL FIX: Stop the click event from bubbling up to the file input container
            e.stopPropagation(); 
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
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = dropdown.dataset.name;
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

  // === Form Submission ===
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Submitting...";

    if (!form.checkValidity()) {
      alert("Please fill in all required fields before submitting.");
      button.disabled = false;
      button.textContent = "Submit";
      return;
    }

    // Use currentFiles.files for submission, which is the validated list
    const files = currentFiles.files || [];
    let totalSize = [...files].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      alert(`Total file size exceeds ${MAX_TOTAL_SIZE_MB} MB.`);
      button.disabled = false;
      button.textContent = "Submit";
      return;
    }

    const formData = new FormData(form);
    document.querySelectorAll(".multiselect-dropdown input[type='hidden']").forEach(input => {
      formData.append(input.name, input.value);
    });

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