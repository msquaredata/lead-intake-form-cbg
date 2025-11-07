window.addEventListener("load", () => {
  console.log("✅ DOM loaded — initializing form and widgets");

  // ================================
  // 1. FILE UPLOAD ENHANCEMENTS
  // ================================
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
  const fileList = document.getElementById("fileList");
  const fileError = document.getElementById("fileError");

  function formatBytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function validateFiles(files) {
    let total = 0;
    let invalid = [];
    for (const f of files) {
      total += f.size;
      if (!ALLOWED_TYPES.includes(f.type)) invalid.push(f.name);
    }
    if (total / (1024 * 1024) > MAX_TOTAL_SIZE_MB)
      return { valid: false, msg: `Total exceeds ${MAX_TOTAL_SIZE_MB} MB.` };
    if (invalid.length)
      return { valid: false, msg: `Unsupported: ${invalid.join(", ")}` };
    return { valid: true, msg: "" };
  }

  function renderFileList(files) {
    fileList.innerHTML = "";
    [...files].forEach((f) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.innerHTML = `<span>${f.name}</span> <small>(${formatBytes(f.size)})</small>`;
      fileList.appendChild(li);
    });
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return; // user canceled → skip
    const validation = validateFiles(files);
    if (!validation.valid) {
      fileError.textContent = validation.msg;
      fileError.style.display = "block";
      return;
    }
    fileError.style.display = "none";
    renderFileList(files);
  }

  if (browseTrigger) browseTrigger.addEventListener("click", () => fileInput.click());
  if (fileInput)
    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  if (fileDropArea) {
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
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFiles(e.dataTransfer.files);
      }
    });
  }

  // ================================
  // 2. MULTISELECT DROPDOWNS
  // ================================
  const dropdowns = document.querySelectorAll(".multiselect-dropdown");

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".dropdown-btn");
    const list = dropdown.querySelector(".dropdown-list");
    const name = dropdown.getAttribute("data-name");

    // Hidden input for form submission
    let hidden = dropdown.querySelector(`input[name='${name}']`);
    if (!hidden) {
      hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = name;
      dropdown.appendChild(hidden);
    }

    // Toggle dropdown
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllDropdowns(); // close others
      list.classList.toggle("show");
    });

    // Update hidden input on checkbox change
    list.querySelectorAll("input[type='checkbox']").forEach((cb) => {
      cb.addEventListener("change", () => {
        const selected = Array.from(list.querySelectorAll("input:checked"))
          .map((i) => i.value)
          .join(", ");
        hidden.value = selected;
        button.textContent = selected || "Select options";
      });
    });
  });

  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-list.show").forEach((list) => {
      list.classList.remove("show");
    });
  }
  document.addEventListener("click", closeAllDropdowns);

  // ================================
  // 3. FORM SUBMISSION
  // ================================
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Submitting...";

    try {
      const res = await fetch(form.action, { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        window.location.href = data.redirect || "thank-you.html";
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("An unexpected error occurred.");
    } finally {
      button.disabled = false;
      button.textContent = "Submit";
    }
  });
});
