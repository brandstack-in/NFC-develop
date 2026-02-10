document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('nfc-form');
  const photoInput = document.getElementById('photo');
  const logoInput = document.getElementById('logo');
  const photoPreview = document.getElementById('photo-preview');
  const logoPreview = document.getElementById('logo-preview');
  const submitBtn = document.querySelector('.submit-btn');

  const API_BASE = 'https://nfc-develop.data-brandstack.workers.dev';

  // ===== FILE PREVIEW & BASE64 =====
  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFilePreview(input, previewElement) {
    const file = input.files?.[0];
    if (!file) {
      previewElement.style.display = 'none';
      previewElement.src = '';
      return null;
    }
    const base64 = await fileToBase64(file);
    previewElement.src = base64;
    previewElement.style.display = 'block';
    return base64;
  }

  photoInput?.addEventListener('change', () => handleFilePreview(photoInput, photoPreview));
  logoInput?.addEventListener('change', () => handleFilePreview(logoInput, logoPreview));

  // ===== FORM SUBMIT =====
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const cardId = form.card_id?.value.trim();
    const name = form.name?.value.trim();

    if (!cardId) return showNotification('Please enter a Card ID', 'error');
    if (!name) return showNotification('Please enter your name', 'error');

    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';

    try {
      const formData = new FormData(form);

      // Add Base64 images
      if (photoInput.files?.[0]) {
        formData.set('photo', await fileToBase64(photoInput.files[0]));
      }
      if (logoInput.files?.[0]) {
        formData.set('logo', await fileToBase64(logoInput.files[0]));
      }

      const response = await fetch(`${API_BASE}/api/update`, {
        method: 'POST',
        body: formData
      });

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Invalid server response:\n' + text.slice(0, 150));
      }

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update card');

      showNotification('✅ Card updated successfully!', 'success');

      // Clear previews
      photoPreview.style.display = logoPreview.style.display = 'none';
      photoPreview.src = logoPreview.src = '';

      // Prompt for view, WhatsApp, or VCF
      setTimeout(() => {
        const cardUrl = `${API_BASE}/${cardId}`;
        const action = prompt('Card updated!\n\nEnter "view" to open, "vcf" to download VCF, "wa" to share on WhatsApp:', 'view');

        if (!action) return;

        if (action.toLowerCase() === 'view') {
          window.open(cardUrl, '_blank');
        } else if (action.toLowerCase() === 'vcf') {
          downloadVCF(formData);
        } else if (action.toLowerCase() === 'wa') {
          shareWhatsApp(cardUrl);
        }
      }, 800);

    } catch (err) {
      console.error(err);
      showNotification('❌ ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save & Update Card';
    }
  });

  // ===== NOTIFICATIONS =====
  function showNotification(message, type) {
    document.querySelector('.notification')?.remove();
    const n = document.createElement('div');
    n.className = 'notification notification-' + type;
    n.textContent = message;
    n.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      padding: 15px 25px; border-radius: 10px;
      font-weight: 500; z-index: 9999;
      max-width: 90%;
      background: ${type==='success'?'#10b981':'#ef4444'}; color:#fff;
      box-shadow:0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(n);
    setTimeout(() => { n.style.animation = 'slideOut 0.3s ease'; setTimeout(() => n.remove(),300); }, 5000);
  }

  // ===== HELPERS =====
  document.querySelectorAll('input[type="tel"]').forEach(i => i.addEventListener('input', () => {
    i.value = i.value.replace(/[^\d+\-\s()]/g,'');
  }));

  document.querySelectorAll('input[type="url"]').forEach(i => i.addEventListener('blur', () => {
    if (i.value && !/^https?:\/\//i.test(i.value)) i.value = 'https://' + i.value;
  }));

  // ===== MODAL FIXES =====
  document.querySelectorAll('.modal-close').forEach(x =>
    x.addEventListener('click', () => document.querySelectorAll('.modal-toggle').forEach(c=>c.checked=false))
  );

  // ===== ANIMATION =====
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from{transform:translateX(100%);opacity:0;} to{transform:translateX(0);opacity:1;} }
    @keyframes slideOut { from{transform:translateX(0);opacity:1;} to{transform:translateX(100%);opacity:0;} }
  `;
  document.head.appendChild(style);

  // ===== VCF DOWNLOAD =====
  function downloadVCF(formData) {
    const name = formData.get('name') || '';
    const phone = formData.get('phone') || '';
    const email = formData.get('email') || '';
    const company = formData.get('company') || '';
    const title = formData.get('title') || '';

    const vcf = `
BEGIN:VCARD
VERSION:3.0
FN:${name}
ORG:${company}
TITLE:${title}
TEL;TYPE=CELL:${phone}
EMAIL;TYPE=INTERNET:${email}
END:VCARD
`.trim();

    const blob = new Blob([vcf], { type: 'text/vcard' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name.replace(/\s+/g,'_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ===== WHATSAPP SHARE =====
  function shareWhatsApp(url) {
    const waUrl = `https://wa.me/?text=${encodeURIComponent('Check out my NFC card: ' + url)}`;
    window.open(waUrl, '_blank');
  }

});
