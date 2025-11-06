window.addEventListener("load", () => {
  console.log("✅ DOM loaded — initializing form and file upload");

  // === Initialize custom multiselect dropdowns ===
const dropdowns = document.querySelectorAll(".multiselect-dropdown");

dropdowns.forEach(drop => {
  const button = drop.querySelector(".dropdown-btn");
  const list = drop.querySelector(".dropdown-list");
  const name = drop.getAttribute("data-name");
  
  // Create hidden input if not present
  let hidden = drop.querySelector(`input[name="${name}"]`);
  if (!hidden) {
    hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = name;
    drop.appendChild(hidden);
  }

  // Toggle dropdown visibility
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    list.classList.toggle("show");
  });

  // Update hidden input when a checkbox changes
  list.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = Array.from(list.querySelectorAll("input:checked"))
        .map(i => i.value)
        .join(", ");
      hidden.value = selected;
      button.textContent = selected || button.getAttribute("data-placeholder") || "Select options";
    });
  });
});

// Close any open dropdown if clicking outside
document.addEventListener("click", (e) => {
  document.querySelectorAll(".dropdown-list.show").forEach(list => {
    if (!list.contains(e.target)) list.classList.remove("show");
  });
});


  const MAX_TOTAL_SIZE_MB = 20;
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
  ];

  const fileInput = document.getElementById("fileUpload");
  const browseTrigger = document.getElementById("browseTrigger");
  const fileDropArea = document.getElementById("fileDropArea");
  const fileDisplay = document.getElementById("fileDisplay");
  const fileList = document.getElementById("fileList");
  const fileError = document.getElementById("fileError");

  function formatBytes(bytes) {
    if (bytes === 0) return "0 MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function validateFiles(files) {
    let totalSize = 0;
    let invalidFiles = [];

    for (const file of files) {
      totalSize += file.size;
      if (!ALLOWED_TYPES.includes(file.type)) invalidFiles.push(file.name);
    }

    const totalMB = totalSize / (1024 * 1024);
    if (totalMB > MAX_TOTAL_SIZE_MB)
      return { valid: false, msg: `Total file size (${formatBytes(totalSize)}) exceeds ${MAX_TOTAL_SIZE_MB} MB.` };
    if (invalidFiles.length)
      return { valid: false, msg: `Unsupported file(s): ${invalidFiles.join(", ")}.` };
    return { valid: true, msg: "" };
  }

  function renderFileList(files) {
    fileList.innerHTML = "";
    for (const file of files) {
      const li = document.createElement("li");
      li.className = "file-item";
      const ext = file.name.split(".").pop().toLowerCase();
      li.innerHTML = `<span class="file-icon file-${ext}"></span> ${file.name} <span class="size">(${formatBytes(file.size)})</span>`;
      fileList.appendChild(li);
    }
  }

  function handleFiles(files) {
    const validation = validateFiles(files);
    if (!validation.valid) {
      fileError.textContent = validation.msg;
      fileError.style.display = "block";
      fileInput.value = "";
      fileList.innerHTML = "";
      return;
    }
    fileError.style.display = "none";
    renderFileList(files);
  }

  if (fileInput && browseTrigger && fileDropArea && fileDisplay) {
    browseTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener("change", () => handleFiles(fileInput.files));

    ["dragenter", "dragover"].forEach((ev) =>
      fileDropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        fileDropArea.classList.add("drag-over");
      })
    );

    ["dragleave", "drop"].forEach((ev) =>
      fileDropArea.addEventListener(ev, (e) => {
        e.preventDefault();
        fileDropArea.classList.remove("drag-over");
      })
    );

    fileDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      fileInput.files = e.dataTransfer.files;
      handleFiles(fileInput.files);
    });

    console.log("✅ File upload initialized with validation.");
  }

  // === Form submission ===
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const files = fileInput.files;
    const validation = validateFiles(files);
    if (!validation.valid) {
      alert(validation.msg);
      return;
    }

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Submitting...";

    try {
      const response = await fetch(form.action, { method: "POST", body: formData });
      const data = await response.json();

      if (response.ok) {
        const redirect = data.redirect || "thank-you.html";
        window.location.href = redirect;
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      alert("An error occurred. Please try again later.");
    } finally {
      button.disabled = false;
      button.textContent = "Submit";
    }
  });
});
