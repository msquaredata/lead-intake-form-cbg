// form.js
window.addEventListener("load", () => {
  console.log("✅ DOM fully loaded — initializing dropdowns and file upload...");

  /* ======= Sort all custom multiselect checkboxes alphabetically ======= */
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

  /* ======= Initialize all multiselect dropdowns ======= */
  document.querySelectorAll(".multiselect-dropdown").forEach((dropdown) => {
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
      const newText =
        selected.length === 0
          ? defaultText
          : selected.length === 1
          ? selected[0]
          : `${selected.length} items selected`;
      button.textContent = newText;
      button.classList.toggle("has-selection", selected.length > 0);
    };

    updateDropdown();

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });

    list.querySelectorAll("input[type='checkbox']").forEach(cb =>
      cb.addEventListener("change", updateDropdown)
    );

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
    });
  });

  console.log("✅ Dropdown initialization complete.");

  /* ======= File Upload Logic ======= */
  const fileInput = document.getElementById("fileUpload");
  const browseTrigger = document.getElementById("browseTrigger");
  const fileDropArea = document.getElementById("fileDropArea");
  const fileDisplay = document.getElementById("fileDisplay");

  if (fileInput && browseTrigger && fileDropArea && fileDisplay) {
    // Clicking “browse” opens file picker
    browseTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });

    // Show selected filenames
    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files).map(f => f.name).join(", ");
      fileDisplay.innerHTML = files || 'Drag & drop files here or <strong>browse</strong>';
    });

    // Enable drag & drop
    ["dragenter", "dragover"].forEach(ev => {
      fileDropArea.addEventListener(ev, e => {
        e.preventDefault();
        fileDropArea.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach(ev => {
      fileDropArea.addEventListener(ev, e => {
        e.preventDefault();
        fileDropArea.classList.remove("drag-over");
      });
    });

    // Handle dropped files
    fileDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      fileInput.files = e.dataTransfer.files;
      const files = Array.from(fileInput.files).map(f => f.name).join(", ");
      fileDisplay.innerHTML = files || 'Drag & drop files here or <strong>browse</strong>';
    });

    console.log("✅ File upload logic initialized.");
  }

  /* ======= Form Submission ======= */
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Submitting...";

    const formData = new FormData(form);
    const formObject = Object.fromEntries(formData.entries());

    document.querySelectorAll(".multiselect-dropdown input[type='hidden']").forEach(input => {
      formObject[input.name] = input.value;
    });

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formObject),
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
      button.textContent = "Submit Opportunity";
    }
  });
});
