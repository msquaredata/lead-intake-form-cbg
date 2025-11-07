// form.js
window.addEventListener("load", () => {
  console.log("✅ DOM fully loaded — initializing dropdowns...");

/* ======= Sort all custom multiselect checkboxes alphabetically ======= */

  document.querySelectorAll(".multiselect-dropdown .dropdown-list").forEach(list => {
  const labels = Array.from(list.querySelectorAll("label"));

  labels.sort((a, b) => {
    const textA = a.textContent.trim();
    const textB = b.textContent.trim();

    // Always push "Other" to the end
    if (textA === "Other") return 1;
    if (textB === "Other") return -1;

    return textA.localeCompare(textB);
  });

  list.innerHTML = "";
  labels.forEach(label => list.appendChild(label));
});



  document.querySelectorAll(".multiselect-dropdown").forEach((dropdown, i) => {
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
  
  const form = document.getElementById("leadForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.textContent = "Submitting...";

     // --- Frontend validation for required fields ---
  if (!form.checkValidity()) {
    alert("Please fill in all required fields before submitting.");
    return; // stop form submission if any required fields are missing
  }

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
      button.textContent = "Submit";
    }
  });

function handleFiles(files) {
  if (!files.length) return;
  const invalid = [...files].filter(f => !ALLOWED_TYPES.includes(f.type));
  if (invalid.length) {
    fileError.textContent = `Unsupported: ${invalid.map(f => f.name).join(", ")}`;
    fileError.style.display = "block";
    return;
  }
  fileError.textContent = "";
  fileError.style.display = "none";
  renderFiles(files);
}

fileInput.addEventListener("change", e => handleFiles(e.target.files));

function renderFiles(files) {
  fileList.innerHTML = "";
  let total = 0;
  [...files].forEach(f => {
    total += f.size;
    const li = document.createElement("li");
    li.className = "file-item";
    li.innerHTML = `
      <span>📄 ${f.name}</span>
      <span class="meta">${(f.size / (1024 * 1024)).toFixed(1)} MB</span>
    `;
    fileList.appendChild(li);
  });
  ...
}




});
