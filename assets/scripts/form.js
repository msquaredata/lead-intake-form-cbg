window.addEventListener("load", () => {
  console.log("🔍 File uploader binding started");
  console.log("✅ DOM fully loaded — initializing dropdowns...");

  // === File Upload Configuration ===
  const MAX_TOTAL_SIZE_MB = 20;
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
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
  const fileInfo = document.getElementById("fileInfo"); // 💡 NEW DOM REFERENCE

  // === Helper: format bytes → MB ===
  function formatBytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // === Render selected files ===
  function renderFiles(files) {
    if (!fileList) return;
    fileList.innerHTML = "";

    let totalSize = 0;
    [...files].forEach(file => {
      totalSize += file.size;

      const li = document.createElement("li");
      li.classList.add("file-item");
      li.innerHTML = `
        <span class="file-icon">📄</span>
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatBytes(file.size)}</span>
      `;
      fileList.appendChild(li);
    });

    const totalSizeMB = totalSize / (1024 * 1024);
    const maxSizeBytes = MAX_TOTAL_SIZE_MB * 1024 * 1024;

    // 💡 NEW LOGIC: Update file size counter
    if (fileInfo) {
      fileInfo.innerHTML = `
        Max size: **${MAX_TOTAL_SIZE_MB} MB**. 
        Current size: **${totalSizeMB.toFixed(1)} MB**
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

  // === Validate and handle file input ===
  function handleFiles(files) {
    if (!files || files.length === 0) {
      if (fileList) fileList.innerHTML = "";
      if (progressFill) progressFill.style.width = "0%";
      // 💡 NEW LOGIC: Reset file info display
      if (fileInfo) {
        fileInfo.innerHTML = `Max size: **${MAX_TOTAL_SIZE_MB} MB**. Current size: **0 MB**`;
        fileInfo.style.color = 'inherit';
      }
      fileError.textContent = "";
      fileError.style.display = "none";
      return;
    }

    const invalidFiles = [...files].filter(f => !ALLOWED_TYPES.includes(f.type));
    
    if (invalidFiles.length > 0) {
      if (fileList) fileList.innerHTML = ""; 
      if (progressFill) progressFill.style.width = "0%";
      // 💡 NEW LOGIC: Reset file info display on error
      if (fileInfo) {
        fileInfo.innerHTML = `Max size: **${MAX_TOTAL_SIZE_MB} MB**. Current size: **0 MB**`;
        fileInfo.style.color = 'inherit';
      }

      fileError.textContent = `Unsupported file types: ${invalidFiles.map(f => f.name).join(", ")}`;
      fileError.style.display = "block";
      return;
    }

    fileError.textContent = "";
    fileError.style.display = "none";
    renderFiles(files);
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
      fileInput.files = e.dataTransfer.files;
      handleFiles(e.dataTransfer.files);
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

    const files = fileInput?.files || [];
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