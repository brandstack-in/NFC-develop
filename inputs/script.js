// Premium NFC Card - Form Handler Script

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('nfc-form');
  const photoInput = document.getElementById('photo');
  const logoInput = document.getElementById('logo');
  const photoPreview = document.getElementById('photo-preview');
  const logoPreview = document.getElementById('logo-preview');
  const submitBtn = document.querySelector('.submit-btn');

  // 🔴 CHANGE THIS TO YOUR REAL CLOUDFLARE WORKER URL
  const API_BASE = 'https://nfc-develop.data-brandstack.workers.dev';

  /* ================= FILE PREVIEWS ================= */

  photoInput?.addEventListener('change', (e) => {
    handleFilePreview(e.target, photoPreview);
  });

  logoInput?.addEventListener('change', (e) => {
    handleFilePreview(e.target, logoPreview);
  });

  function handleFilePreview(input, previewElement) {
    const file = input.files?.[0];
    if (!file) {
      previewElement.style.display = 'none';
      previewElement.src = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      previewElement.src = e.target.result;
      previewElement.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  /* ================= FORM SUBMIT ================= */

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const cardId = form.card_id?.value.trim();
    const name = form.name?.value.trim();

    if (!cardId) {
      showNotification('Please enter a Card ID', 'error');
      return;
    }

    if (!name) {
      showNotification('Please enter your name', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';

    try {
      const formData = new FormData(form);

      const response = await fetch(`${API_BASE}/api/update`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update card');
      }

      showNotification('✅ Card updated successfully!', 'success');

      setTimeout(() => {
        const cardUrl = `${API_BASE}/${cardId}`;
        if (confirm(`Card updated!\n\nView your card now?`)) {
          window.open(cardUrl, '_blank');
        }
      }, 800);

    } catch (err) {
      console.error(err);
      showNotification(`❌ ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save & Update Card';
    }
  });

  /* ================= NOTIFICATIONS ================= */

  function showNotification(message, type) {
    document.querySelector('.notification')?.remove();

    const n = document.createElement('div');
    n.className = `notification notification-${type}`;
    n.textContent = message;

    n.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      border-radius: 10px;
      font-weight: 500;
      z-index: 9999;
      max-width: 90%;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: #fff;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(n);

    setTimeout(() => {
      n.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => n.remove(), 300);
    }, 5000);
  }

  /* ================= HELPERS ================= */

  // Auto-format phone inputs
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^\d+\-\s()]/g, '');
    });
  });

  // Auto-fix URLs
  document.querySelectorAll('input[type="url"]').forEach((input) => {
    input.addEventListener('blur', function () {
      const v = this.value.trim();
      if (v && !/^https?:\/\//i.test(v)) {
        this.value = 'https://' + v;
      }
    });
  });

  // Inject animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});
