// Premium NFC Card - Form Handler Script

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('nfc-form');
  const photoInput = document.getElementById('photo');
  const logoInput = document.getElementById('logo');
  const photoPreview = document.getElementById('photo-preview');
  const logoPreview = document.getElementById('logo-preview');
  const submitBtn = document.querySelector('.submit-btn');

  // File preview handlers
  photoInput.addEventListener('change', function(e) {
    handleFilePreview(e.target, photoPreview);
  });

  logoInput.addEventListener('change', function(e) {
    handleFilePreview(e.target, logoPreview);
  });

  function handleFilePreview(input, previewElement) {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewElement.src = e.target.result;
        previewElement.style.display = 'block';
      };
      reader.readAsDataURL(file);
    } else {
      previewElement.style.display = 'none';
      previewElement.src = '';
    }
  }

  // Form submission handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const cardId = document.getElementById('card_id').value.trim();
    if (!cardId) {
      showNotification('Please enter a Card ID', 'error');
      return;
    }

    const name = document.getElementById('name').value.trim();
    if (!name) {
      showNotification('Please enter your name', 'error');
      return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Saving...';

    try {
      const formData = new FormData(form);
      
      // Send to API
      const response = await fetch('/api/update', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification('✅ Card updated successfully!', 'success');
        
        // Show link to view card
        const cardUrl = `/${cardId}`;
        setTimeout(() => {
          if (confirm(`Card updated! View your card at ${window.location.origin}${cardUrl}?`)) {
            window.open(cardUrl, '_blank');
          }
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to update card');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showNotification(`❌ Error: ${error.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save & Update Card';
    }
  });

  // Notification helper
  function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

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
      animation: slideIn 0.3s ease;
      max-width: 90%;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      ${type === 'success' 
        ? 'background: #10b981; color: white;' 
        : 'background: #ef4444; color: white;'}
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Add animation styles
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

  // Auto-format phone numbers
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      // Allow only numbers, +, -, spaces, and parentheses
      this.value = this.value.replace(/[^\d+\-\s()]/g, '');
    });
  });

  // URL validation helper for social links
  const urlInputs = document.querySelectorAll('input[type="url"]');
  urlInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const value = this.value.trim();
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        this.value = 'https://' + value;
      }
    });
  });
});
