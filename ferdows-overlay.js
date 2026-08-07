// ══════════════════════════════════════════
// FERDOWS - TEMPORARILY DISABLED
// ══════════════════════════════════════════

let ferdowsDismissed = false;

function buildFerdowsOverlay() {
  if (ferdowsDismissed) return;

  const wrapper = document.createElement("div");
  wrapper.id = "ferdows-overlay-wrapper";
  wrapper.innerHTML = `
    <div id="ferdows-overlay-backdrop"></div>
    <div id="ferdows-overlay-card">
      <button id="ferdows-overlay-close" onclick="dismissFerdowsOverlay()">✕</button>
      
      <div id="ferdows-overlay-icon">✦</div>
      
      <h2 id="ferdows-overlay-title">فردوس</h2>
      <p id="ferdows-overlay-subtitle">دستیار هوش مصنوعی شعر پارسی</p>
      
      <div id="ferdows-overlay-divider"></div>
      
      <p id="ferdows-overlay-message">
        متاسفانه به دلیل محدودیت‌های موقعیتی و مالی مجبوریم فعلاً فردوس رو خاموش کنیم!
      </p>
      
      <p id="ferdows-overlay-note">
        به زودی با قابلیت‌های بهتر برمی‌گردیم 
      </p>
    </div>
  `;

  document.body.appendChild(wrapper);

  // Close on backdrop click
  document.getElementById("ferdows-overlay-backdrop").addEventListener("click", dismissFerdowsOverlay);
}

function dismissFerdowsOverlay() {
  const wrapper = document.getElementById("ferdows-overlay-wrapper");
  if (wrapper) {
    wrapper.style.opacity = "0";
    wrapper.style.transform = "scale(0.95)";
    setTimeout(() => {
      wrapper.remove();
      ferdowsDismissed = true;
    }, 300);
  }
}

window.dismissFerdowsOverlay = dismissFerdowsOverlay;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(buildFerdowsOverlay, 1500); // Show after 1.5s for better UX
});