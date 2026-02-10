// Premium NFC Card - Form Handler Script

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('nfc-form');
  const photoInput = document.getElementById('photo');
  const logoInput = document.getElementById('logo');
  const photoPreview = document.getElementById('photo-preview');
  const logoPreview = document.getElementById('logo-preview');
  const submitBtn = document.querySelector('.submit-btn');

  // 🔴 CHANGE THIS
  const API_BASE = 'https://nfc-develop.data-brandstack.workers.dev';

  /* ================= FILE PREVIEW ================= */

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
        body: formData
      });

      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(
          'Invalid server response:\n' + text.slice(0, 150)
        );
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update card');
      }

      showNotification('✅ Card updated successfully!', 'success');

      setTimeout(() => {
        const cardUrl = `${API_BASE}/${cardId}`;
        if (confirm('Card updated!\n\nView your card now?')) {
          window.open(cardUrl, '_blank');
        }
      }, 800);

    } catch (error) {
      console.error('Submit error:', error);
      showNotification(`❌ ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save & Update Card';
    }
  });

  /* ================= NOTIFICATIONS ================= */

  function showNotification(message, type) {
    document.querySelector('.notification')?.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
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

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  /* ================= HELPERS ================= */

  // Phone formatting
  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^\d+\-\s()]/g, '');
    });
  });

  // URL normalization
  document.querySelectorAll('input[type="url"]').forEach((input) => {
    input.addEventListener('blur', function () {
      const v = this.value.trim();
      if (v && !/^https?:\/\//i.test(v)) {
        this.value = 'https://' + v;
      }
    });
  });

  // Animations
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
