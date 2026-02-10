// ================= USER DATA =================
const userData = {
  name: "John Doe",
  title: "Software Engineer",
  company: "Tech Corp",
  tagline: "Innovating the Future",
  phone: "+1234567890",
  email: "john@example.com",
  whatsapp: "+1234567890",
  website: "https://example.com",
  location: "https://goo.gl/maps/xyz",
  social: {
    facebook: "https://facebook.com/john",
    twitter: "https://twitter.com/john",
    instagram: "https://instagram.com/john",
    linkedin: "https://linkedin.com/in/john",
    youtube: "",
    tiktok: "",
    pinterest: "",
    telegram: ""
  },
  about: "I am a software engineer with 5 years of experience in building scalable web applications...",
  skills: ["JavaScript", "HTML", "CSS", "React", "Node.js"],
  milestones: ["Launched App X", "Awarded Employee of the Year", "Built scalable SaaS platform"],
  testimonials: ["Great work!", "Highly professional!", "Amazing problem solver!"],
  products: ["App X", "Service Y", "Premium NFC Cards"],
  payQR: "" // base64 QR code string or image URL
};

// ================= AVATAR UPLOAD =================
const avatar = document.getElementById('avatar');
avatar.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = "file";
  input.accept = "image/*";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatar.innerHTML = `<img src="${reader.result}" alt="Avatar" />`;
    };
    reader.readAsDataURL(file);
  };
  input.click();
});

// ================= POPULATE PROFILE =================
function populateProfile() {
  document.querySelector('.name').textContent = userData.name;
  document.querySelector('.title').textContent = userData.title;
  document.querySelector('.company').textContent = userData.company;
  document.querySelector('.tagline').textContent = `"${userData.tagline}"`;

  document.getElementById('call').href = `tel:${userData.phone}`;
  document.getElementById('email').href = `mailto:${userData.email}`;
  document.getElementById('whatsapp').href = `https://wa.me/${userData.whatsapp.replace(/\D/g,'')}`;
  document.getElementById('location').href = userData.location;
  document.getElementById('website').href = userData.website;
  document.getElementById('company-location').href = userData.location;

  // Social Links
  Object.entries(userData.social).forEach(([key, url]) => {
    const el = document.getElementById(key);
    if (el) el.href = url || "#";
  });

  // Modals content
  document.getElementById('about-content').textContent = userData.about;
  document.getElementById('skills-content').innerHTML = userData.skills.map(s => `<li>${s}</li>`).join('');
  document.getElementById('milestones-content').innerHTML = userData.milestones.map(m => `<li>${m}</li>`).join('');
  document.getElementById('testimonials-content').innerHTML = userData.testimonials.map(t => `<p>"${t}"</p>`).join('');
  document.getElementById('company-desc-content').textContent = `Welcome to ${userData.company}, we provide premium services and products.`;
  document.getElementById('products-content').innerHTML = userData.products.map(p => `<li>${p}</li>`).join('');

  // Pay QR
  const qrEl = document.getElementById('upi-qr');
  if (userData.payQR) qrEl.innerHTML = `<img src="${userData.payQR}" alt="Pay QR" />`;
}

populateProfile();

// ================= VCF DOWNLOAD =================
document.getElementById('save-contact').addEventListener('click', () => {
  const vcf = `BEGIN:VCARD
VERSION:3.0
FN:${userData.name}
ORG:${userData.company}
TITLE:${userData.title}
TEL;TYPE=CELL:${userData.phone}
EMAIL:${userData.email}
END:VCARD`;
  const blob = new Blob([vcf], {type: 'text/vcard'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${userData.name}.vcf`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// ================= SHARE =================
document.getElementById('share').addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: userData.name,
        text: userData.tagline,
        url: window.location.href
      });
    } catch (err) {
      alert("Sharing cancelled");
    }
  } else {
    alert("Web Share API not supported on this device.");
  }
});

// ================= MODAL CLOSE FIX =================
document.querySelectorAll('.modal-close').forEach(closeBtn => {
  closeBtn.addEventListener('click', () => {
    const modal = closeBtn.closest('.modal-overlay').previousElementSibling;
    if (modal && modal.checked) modal.checked = false;
  });
});
