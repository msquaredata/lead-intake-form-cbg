form.addEventListener("submit", async (e) => {
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

  // Validate file size total
  const files = fileInput?.files || [];
  let totalSize = 0;
  [...files].forEach(f => (totalSize += f.size));
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
      body: formData, // <-- send FormData, not JSON
    });

    if (response.ok) {
      const data = await response.json();
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
