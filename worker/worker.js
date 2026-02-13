/**
 * Premium NFC Card - Cloudflare Worker
 * Handles dynamic card rendering, form updates, and vCard generation
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const GIT_BASE =
  "https://raw.githubusercontent.com/brandstack-in/NFC-Develop/main/templates";

/* ================= SOCIAL NORMALIZERS ================= */

function normalizePhone(phone) {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^00/, "+");
}

function normalizeUrl(url) {
  if (!url) return "";
  url = url.trim();
  if (url && !url.match(/^https?:\/\//i)) return `https://${url}`;
  return url;
}

function normalizeInstagram(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("instagram.com")) return normalizeUrl(val);
  return `https://instagram.com/${val}`;
}

function normalizeFacebook(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("facebook.com")) return normalizeUrl(val);
  return `https://facebook.com/${val}`;
}

function normalizeTwitter(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("twitter.com") || val.includes("x.com")) return normalizeUrl(val);
  return `https://x.com/${val}`;
}

function normalizeLinkedIn(val) {
  if (!val) return "";
  val = val.trim();
  if (val.includes("linkedin.com")) return normalizeUrl(val);
  return `https://linkedin.com/in/${val}`;
}

function normalizeYouTube(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("youtube.com")) return normalizeUrl(val);
  return `https://youtube.com/@${val}`;
}

function normalizeTikTok(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("tiktok.com")) return normalizeUrl(val);
  return `https://tiktok.com/@${val}`;
}

function normalizePinterest(val) {
  if (!val) return "";
  val = val.trim();
  if (val.includes("pinterest.com")) return normalizeUrl(val);
  return `https://pinterest.com/${val}`;
}

function normalizeTelegram(val) {
  if (!val) return "";
  val = val.trim().replace(/^@/, "");
  if (val.includes("t.me")) return normalizeUrl(val);
  return `https://t.me/${val}`;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(text) {
  if (!text) return "";
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
}

function parseFirstName(fullName) {
  if (!fullName) return "";
  return fullName.split(" ")[0] || "";
}

function parseLastName(fullName) {
  if (!fullName) return "";
  const parts = fullName.split(" ");
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

/* ================= WORKER ================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (path === "/api/update") {
        if (request.method !== "POST") {
          return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
        }
        return handleUpdate(request, env);
      }

      if (path === "/") {
        return new Response("NFC Worker is running ✅", { headers: CORS_HEADERS });
      }

      if (path === "/style.css") {
        const css = await fetchFromGit("style.css");
        return new Response(css, {
          headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "public, max-age=86400" },
        });
      }

      if (path.startsWith("/u/")) {
        const cardId = path.split("/")[2];
        return serveHTML(cardId, env);
      }

      if (path.startsWith("/api/user/")) {
        const cardId = path.split("/")[3];
        return serveUserJSON(cardId, env);
      }

      if (path.startsWith("/vcf/")) {
        const cardId = path.split("/")[2];
        return serveVCF(cardId, env);
      }

      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};

/* ================= HELPERS ================= */

async function fetchFromGit(file) {
  try {
    const res = await fetch(`${GIT_BASE}/${file}`, {
      headers: { "User-Agent": "Cloudflare-Worker" },
    });
    if (!res.ok) {
      console.log("Git fetch failed:", file);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.log("Git fetch error:", err);
    return null;
  }
}

/* ================= API UPDATE ================= */

async function handleUpdate(request, env) {
  try {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
      return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
    }

    const data = await request.json();

    if (!data.cardId || !data.name) {
      return new Response("cardId and name are required", { status: 400, headers: CORS_HEADERS });
    }

    const userData = {
      ...data,
      phone: normalizePhone(data.phone),
      whatsapp: normalizePhone(data.whatsapp),
      website: normalizeUrl(data.website),
      instagram: normalizeInstagram(data.instagram),
      facebook: normalizeFacebook(data.facebook),
      twitter: normalizeTwitter(data.twitter),
      linkedin: normalizeLinkedIn(data.linkedin),
      youtube: normalizeYouTube(data.youtube),
      tiktok: normalizeTikTok(data.tiktok),
      pinterest: normalizePinterest(data.pinterest),
      telegram: normalizeTelegram(data.telegram),
      updatedAt: new Date().toISOString(),
    };

    await env.DEVELOP_USERS.put(`user:${data.cardId}`, JSON.stringify(userData));

    return new Response(
      JSON.stringify({ success: true, message: "Card updated successfully", card_url: `/u/${data.cardId}` }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (err) {
    console.error("Update failed:", err);
    return new Response("Internal Server Error", { status: 500, headers: CORS_HEADERS });
  }
}

/* ================= HTML ================= */

async function serveHTML(cardId, env) {
  const raw = await env.DEVELOP_USERS.get(`user:${cardId}`);
  if (!raw) return new Response("User not found", { status: 404 });

  const u = JSON.parse(raw);
  let html = await fetchFromGit("index.html");
  let css = await fetchFromGit("style.css");

  if (!html) {
    return new Response("Template load failed", { status: 500 });
  }
  if (!css) {
    css = "";
  }

  // Inject inline CSS
  html = html.replace("</head>", `<style>${css}</style></head>`);

  // Replace text placeholders
  html = html.replaceAll("{{NAME}}", escapeHtml(u.name) || "");
  html = html.replaceAll("{{COMPANY}}", escapeHtml(u.company) || "");
  html = html.replaceAll("{{TITLE}}", escapeHtml(u.title) || "");
  html = html.replaceAll("{{TAGLINE}}", escapeHtml(u.tagline) || "");

  // Update page title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${escapeHtml(u.name) || "Premium NFC Card"} - Digital Card</title>`
  );

  // === AVATAR ===
  if (u.photo) {
    html = html.replace(
      /(<div[^>]*class="avatar"[^>]*id="avatar"[^>]*>)[\s\S]*?(<\/div>)/i,
      `$1<img src="${u.photo}" alt="Profile Photo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />$2`
    );
  }

  // === LOGO ===
  if (u.logo) {
    html = html.replace(
      /(<div[^>]*id="company-logo"[^>]*>)[\s\S]*?(<\/div>)/i,
      `$1<img src="${u.logo}" alt="Company Logo" style="max-width:120px;max-height:80px;object-fit:contain;" />$2`
    );
  }

  // === CONTACT SECTION ===
  html = injectHrefIfAvailable(html, "call", u.phone ? `tel:${u.phone}` : null);
  html = injectHrefIfAvailable(html, "whatsapp", u.whatsapp ? `https://wa.me/${u.whatsapp.replace(/\D/g, "")}` : null);
  html = injectHrefIfAvailable(html, "email", u.email ? `mailto:${u.email}` : null);
  html = injectHrefIfAvailable(html, "location", u.location || null);

  // === UPI / Pay Me — QR Code via public API ===
  if (u.upi) {
    const upiValue = u.upi.trim();
    // Build a UPI deep link or use raw value for QR
    const upiPayload = upiValue.startsWith("upi://") ? upiValue : `upi://pay?pa=${encodeURIComponent(upiValue)}&pn=${encodeURIComponent(u.name || "")}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPayload)}`;
    html = html.replace(
      /(<div[^>]*id="upi-qr"[^>]*>)[\s\S]*?(<\/div>)/i,
      `$1<img src="${qrUrl}" alt="UPI QR Code" style="width:200px;height:200px;margin:0 auto;display:block;" />$2`
    );
  }

  // Save Contact
  html = injectHrefIfAvailable(html, "save-contact", `/vcf/${cardId}`);

  // === PROFILE SECTION (modals) ===
  html = injectModalContent(html, "about-content", u.about);
  html = injectModalContent(html, "skills-content", u.skills);
  html = injectModalContent(html, "milestones-content", u.milestones);
  html = injectModalContent(html, "testimonials-content", u.testimonials);

  // === COMPANY SECTION (modals) ===
  html = injectModalContent(html, "company-desc-content", u.company_desc);
  html = injectModalContent(html, "products-content", u.products);
  html = injectHrefIfAvailable(html, "website", u.website || null);
  html = injectHrefIfAvailable(html, "company-location", u.company_location || null);

  // === SOCIAL MEDIA ===
  html = injectHrefIfAvailable(html, "facebook", u.facebook || null);
  html = injectHrefIfAvailable(html, "twitter", u.twitter || null);
  html = injectHrefIfAvailable(html, "instagram", u.instagram || null);
  html = injectHrefIfAvailable(html, "linkedin", u.linkedin || null);
  html = injectHrefIfAvailable(html, "youtube", u.youtube || null);
  html = injectHrefIfAvailable(html, "tiktok", u.tiktok || null);
  html = injectHrefIfAvailable(html, "pinterest", u.pinterest || null);
  html = injectHrefIfAvailable(html, "telegram", u.telegram || null);

  // === INJECT CLIENT SCRIPT ===
  html = injectClientScript(html, cardId, u);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/* ================= INJECTION HELPERS ================= */

function injectHrefIfAvailable(html, elementId, url) {
  if (!url) return html;

  // Replace existing href
   const hrefBeforeId = new RegExp(
    `(<(?:a|label)[^>]*?)href="[^"]*"([^>]*id="${elementId}"[^>]*>)`,
    "gi"
  );
  html = html.replace(hrefBeforeId, `$1href="${url}"$2`);

  // Case 2: href exists AFTER id
  const hrefAfterId = new RegExp(
    `(<(?:a|label)[^>]*id="${elementId}"[^>]*?)href="[^"]*"`,
    "gi"
  );
  html = html.replace(hrefAfterId, `$1href="${url}"`);

  // Case 3: No href exists at all
  const noHrefRegex = new RegExp(
    `(<a[^>]*id="${elementId}"(?![^>]*href)[^>]*)>`,
    "gi"
  );
  html = html.replace(noHrefRegex, `$1 href="${url}">`);

  return html;
}

function injectModalContent(html, contentId, content) {
  if (!content) return html;
  const formatted = escapeHtml(content).replace(/\n/g, "<br>");
  return html.replace(
    new RegExp(`(<div[^>]*id="${contentId}"[^>]*>)[\\s\\S]*?(<\\/div>)`, "i"),
    `$1<p>${formatted}</p>$2`
  );
}

/**
 * Inject client-side scripts:
 * - Prevent empty links from refreshing page
 * - Share button
 * - Save contact
 * - Auto-hide empty sections
 * - Modal open/close
 */
function injectClientScript(html, cardId, u) {
  const script = `
<script>
document.addEventListener('DOMContentLoaded', function() {

  // ===== FIX #1: Prevent empty/hash links from refreshing =====
  document.querySelectorAll('a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href === '#' || href === '') {
      link.addEventListener('click', function(e) {
        e.preventDefault();
      });
    }
  });

  // ===== External links open in new tab =====
  document.querySelectorAll('a[href^="http"]').forEach(function(link) {
    if (!link.getAttribute('target')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // ===== Share button =====
  var shareBtn = document.getElementById('share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (navigator.share) {
        navigator.share({
          title: '${escapeJs(u.name || "")}',
          text: '${escapeJs(u.tagline || "")}',
          url: window.location.href
        }).catch(function() {});
      } else {
        // Fallback: copy URL
        navigator.clipboard.writeText(window.location.href).then(function() {
          alert('Link copied to clipboard!');
        }).catch(function() {
          prompt('Copy this link:', window.location.href);
        });
      }
    });
  }

  // ===== Save contact button =====
  var saveBtn = document.getElementById('save-contact');
  if (saveBtn) {
    var href = saveBtn.getAttribute('href');
    if (href && href !== '#') {
      saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = href;
      });
    }
  }

  // ===== Modal open/close =====
  document.querySelectorAll('[data-modal]').forEach(function(trigger) {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      var modalId = this.getAttribute('data-modal');
      var modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
      }
    });
  });

  document.querySelectorAll('.modal-close, .modal-overlay').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });

  // Close modal on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active, .modal[style*="display: flex"]').forEach(function(m) {
        m.classList.remove('active');
        m.style.display = 'none';
      });
    }
  });

  // ===== Auto-hide empty sections =====
  var sectionsToCheck = [
    { id: 'about-content', section: 'about-section' },
    { id: 'skills-content', section: 'skills-section' },
    { id: 'milestones-content', section: 'milestones-section' },
    { id: 'testimonials-content', section: 'testimonials-section' },
    { id: 'company-desc-content', section: 'company-section' },
    { id: 'products-content', section: 'products-section' }
  ];

  sectionsToCheck.forEach(function(item) {
    var el = document.getElementById(item.id);
    if (el && el.innerHTML.trim() === '') {
      // Try to hide parent section
      var section = document.getElementById(item.section);
      if (section) section.style.display = 'none';
      // Also try hiding the trigger button
      var trigger = document.querySelector('[data-modal="' + item.section + '"]');
      if (trigger) trigger.style.display = 'none';
    }
  });

  // Hide social icons without valid hrefs
  document.querySelectorAll('.social-icons a, .social-grid a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href === '#' || href === '') {
      link.style.display = 'none';
    }
  });

  // Hide contact items without valid hrefs
  document.querySelectorAll('.contact-grid a, .contact-section a').forEach(function(link) {
    var href = link.getAttribute('href');
    if (!href || href === '#' || href === '') {
      link.style.display = 'none';
    }
  });
   document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        var toggle = overlay.previousElementSibling;
        if (toggle && toggle.classList.contains('modal-toggle')) {
          toggle.checked = false;
        }
      }
    });
  });
  // === Modal close: ensure X button works ===
  document.querySelectorAll('.modal-close').forEach(function(closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var overlay = closeBtn.closest('.modal-overlay');
      if (overlay) {
        var toggle = overlay.previousElementSibling;
        if (toggle && toggle.classList.contains('modal-toggle')) {
          toggle.checked = false;
        }
      }
    });
  });

});
</script>`;
  return html.replace("</body>", script + "</body>");
}

/* ================= API READ ================= */

async function serveUserJSON(cardId, env) {
  const raw = await env.DEVELOP_USERS.get(`user:${cardId}`);
  if (!raw) return new Response("User not found", { status: 404, headers: CORS_HEADERS });

  return new Response(raw, {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/* ================= VCF ================= */

async function serveVCF(cardId, env) {
  const raw = await env.DEVELOP_USERS.get(`user:${cardId}`);
  if (!raw) return new Response("User not found", { status: 404, headers: CORS_HEADERS });

  const u = JSON.parse(raw);

  let vcf = `BEGIN:VCARD
VERSION:3.0
FN:${u.name || ""}
N:${parseLastName(u.name)};${parseFirstName(u.name)};;;
TITLE:${u.title || ""}
ORG:${u.company || ""}
NOTE:${u.tagline || ""}`;

  if (u.phone) vcf += `\nTEL;TYPE=CELL:${u.phone}`;
  if (u.email) vcf += `\nEMAIL;TYPE=WORK:${u.email}`;
  if (u.website) vcf += `\nURL:${u.website}`;
  if (u.location) vcf += `\nURL;TYPE=LOCATION:${u.location}`;
  if (u.linkedin) vcf += `\nURL;TYPE=LINKEDIN:${u.linkedin}`;
  if (u.instagram) vcf += `\nURL;TYPE=INSTAGRAM:${u.instagram}`;
  if (u.facebook) vcf += `\nURL;TYPE=FACEBOOK:${u.facebook}`;
  if (u.twitter) vcf += `\nURL;TYPE=TWITTER:${u.twitter}`;
  if (u.youtube) vcf += `\nURL;TYPE=YOUTUBE:${u.youtube}`;
  if (u.telegram) vcf += `\nURL;TYPE=TELEGRAM:${u.telegram}`;

  if (u.photo && u.photo.startsWith("data:image")) {
    const photoData = u.photo.split(",")[1];
    const photoType = u.photo.match(/data:image\/(\w+);/)?.[1]?.toUpperCase() || "JPEG";
    vcf += `\nPHOTO;ENCODING=b;TYPE=${photoType}:${photoData}`;
  }

  vcf += `\nEND:VCARD`;

  const filename = `${(u.name || cardId).replace(/\s+/g, "_")}.vcf`;

  return new Response(vcf, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
