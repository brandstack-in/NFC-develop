// Premium NFC Card - Input Form Handler
const API_URL = "https://nfc-develop.data-brandstack.workers.dev/api/update";
const AUTH_TOKEN = "3f7c1e9a-6c2b-4b5e-9d44-91c2c0a6b9fd";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("nfc-form");
  const photoInput = document.getElementById("photo");
  const logoInput = document.getElementById("logo");
  const photoPreview = document.getElementById("photo-preview");
  const logoPreview = document.getElementById("logo-preview");
  const submitBtn = document.querySelector(".submit-btn");

if (photoInput && photoPreview) {
    photoInput.addEventListener("change", () => previewFile(photoInput, photoPreview));
  }
  if (logoInput && logoPreview) {
    logoInput.addEventListener("change", () => previewFile(logoInput, logoPreview));
  }



  function previewFile(input, img) {
    const file = input.files[0];
    if (!file) { img.style.display = "none"; return; }
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; img.style.display = "block"; };
    reader.readAsDataURL(file);
  }
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  // Form submit
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const cardId = form.querySelector('[name="card_id"]')?.value.trim();
      const name = form.querySelector('[name="name"]')?.value.trim();
      if (!cardId) return showNotification("Please enter a Card ID", "error");
      if (!name) return showNotification("Please enter your name", "error");
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ Saving...";
      try {
        // Build JSON payload from form fields
        const payload = { cardId, name };
        const textFields = [
          "title", "company", "tagline", "phone", "whatsapp", "email",
          "location", "upi", "about", "skills", "milestones", "testimonials",
          "company_desc", "products", "website", "company_location",
          "facebook", "instagram", "twitter", "linkedin",
          "youtube", "tiktok", "pinterest", "telegram"
        ];
        textFields.forEach((field) => {
          const el = form.querySelector(`[name="${field}"]`);
          if (el && el.value.trim()) payload[field] = el.value.trim();
        });
        // Convert photo to base64
        const photoFile = photoInput?.files[0];
        if (photoFile) {
          payload.photo = await fileToBase64(photoFile);
        }
        // Convert logo to base64
        const logoFile = logoInput?.files[0];
        if (logoFile) {
          payload.logo = await fileToBase64(logoFile);
        }
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AUTH_TOKEN}`
          },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          showNotification("✅ Card updated successfully!", "success");
          setTimeout(() => {
            const viewUrl = `https://nfc-develop.data-brandstack.workers.dev/u/${cardId}`;
            if (confirm(`Card updated! View your card at ${viewUrl}?`)) {
              window.open(viewUrl, "_blank");
            }
          }, 1000);
        } else {
          throw new Error(result.error || "Failed to update card");
        }
      } catch (err) {
        console.error("Submit error:", err);
        showNotification(`❌ Error: ${err.message}`, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "💾 Save & Update Card";
      }
    });
  }
  // Notification
  function showNotification(message, type) {
    const existing = document.querySelector(".notification");
    if (existing) existing.remove();
    const el = document.createElement("div");
    el.className = `notification notification-${type}`;
    el.textContent = message;
    el.style.cssText = "position:fixed;top:20px;right:20px;padding:16px 24px;border-radius:8px;z-index:9999;font-family:Montserrat,sans-serif;font-size:14px;color:#fff;background:" + (type === "error" ? "#e74c3c" : "#27ae60") + ";box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn .3s ease";
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); }, 5000);
  }
  // Auto-format phone
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^\d+\-\s()]/g, "");
    });
  });
  // Auto-prefix URLs
  document.querySelectorAll('input[type="url"]').forEach((input) => {
    input.addEventListener("blur", function () {
      const v = this.value.trim();
      if (v && !v.startsWith("http://") && !v.startsWith("https://")) {
        this.value = "https://" + v;
      }
    });
  });
});
  
