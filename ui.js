// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let currentEra = 0; // 🔥 این خط حتماً باید اینجا باشد (در map.js تعریف نشده است)
let panelStack = [];

// ══════════════════════════════════════════
// PANEL SYSTEM
// ══════════════════════════════════════════
function openOverlay() {
  document.getElementById("overlay").classList.add("active");
  document.getElementById("map-container").classList.add("blurred");
}

function closePanel() {
  document.getElementById("overlay").classList.remove("active");
  document.getElementById("map-container").classList.remove("blurred");
  panelStack = [];
  document.getElementById("panel-back").classList.remove("visible");
}

function goBack() {
  panelStack.pop();
  if (panelStack.length === 0) {
    closePanel();
    return;
  }
  const prev = panelStack[panelStack.length - 1];
  renderPanel(prev, false);
}

function openCity(city) {
  panelStack = [{ type: "city", data: city }];
  renderPanel(panelStack[0], false);
  openOverlay();
}

function openPoet(poet, city) {
  panelStack.push({ type: "poet", data: poet, city });
  renderPanel(panelStack[panelStack.length - 1], true);
}

function openWork(work, poet) {
  panelStack.push({ type: "work", data: work, poet });
  renderPanel(panelStack[panelStack.length - 1], true);
}

function renderPanel({ type, data, city, poet }, showBack) {
  const backBtn = document.getElementById("panel-back");
  backBtn.classList.toggle("visible", showBack);

  const eyebrow = document.getElementById("panel-eyebrow");
  const title = document.getElementById("panel-title");
  const subtitle = document.getElementById("panel-subtitle");
  const body = document.getElementById("panel-body");

  document.getElementById("panel").scrollTop = 0;

  body.style.opacity = "0";
  body.style.transform = "translateY(8px)";
  setTimeout(() => {
    body.style.transition = "opacity 0.25s, transform 0.25s";
    body.style.opacity = "1";
    body.style.transform = "translateY(0)";
  }, 20);

  if (type === "city") {
    const era = ERAS[currentEra];
    eyebrow.textContent = "شهر · CITY";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + " · " + era.nameEn;
    
    const poets = data.poets.filter(p => !p.eras || p.eras.includes(currentEra));

    if (poets.length === 0) {
      body.innerHTML = `
        <p style="text-align:center; color:var(--text-dim); padding:40px 20px; font-size:15px; line-height:1.8;">
          شاعری برای «${era.name}» در این شهر ثبت نشده است.
        </p>
        <div class="more-info-link">
          <a href="https://docs.chekameh.xyz/" target="_blank">اطلاعات بیشتر ←</a>
        </div>`;
    } else {
      body.innerHTML = poets
        .map(
          (p) => `
        <div class="poet-card" onclick="openPoet(${JSON.stringify(p).replace(/"/g, "&quot;")}, ${JSON.stringify(data).replace(/"/g, "&quot;")})">
          <div class="poet-avatar">${p.emoji}</div>
          <div class="poet-info">
            <div class="poet-name">${p.name}</div>
            <div class="poet-name-en">${p.nameEn}</div>
            <div class="poet-dates">${p.dates}</div>
          </div>
          <div class="poet-arrow">←</div>
        </div>
      `
        )
        .join("") + 
        `<div class="more-info-link">
          <a href="https://docs.chekameh.xyz/" target="_blank">اطلاعات بیشتر ←</a>
        </div>`;
    }
  } else if (type === "poet") {
    eyebrow.textContent = "شاعر · POET";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + " · " + data.dates;

    body.innerHTML = `
      <p id="poet-bio">${data.bio}</p>
      <div class="works-title">WORKS · آثار برتر</div>
      ${data.works
        .map(
          (w) => `
        <div class="work-tile" onclick="openWork(${JSON.stringify(w).replace(/"/g, "&quot;")}, ${JSON.stringify({ name: data.name, nameEn: data.nameEn }).replace(/"/g, "&quot;")})">
          <div class="work-tile-header">
            <div>
              <div class="work-name">${w.name}</div>
              <div class="work-name-en">${w.nameEn}</div>
            </div>
            <div style="color:var(--gold);font-size:18px;">←</div>
          </div>
          <div class="work-desc">${w.desc}</div>
        </div>
      `
        )
        .join("")}
      <div class="more-info-link">
        <a href="https://docs.chekameh.xyz/" target="_blank">اطلاعات بیشتر ←</a>
      </div>`;
  } else if (type === "work") {
    eyebrow.textContent = "اثر · WORK";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + (poet ? " · " + poet.nameEn : "");

    body.innerHTML = `
      <div class="poem-block">
        <p class="poem-intro">${data.desc}</p>
        <div class="poem-divider">— ✦ —</div>
        ${data.lines.map((l) => `<div class="poem-line">${l}</div>`).join("")}
      </div>
      <div class="more-info-link">
        <a href="https://docs.chekameh.xyz/" target="_blank">اطلاعات بیشتر ←</a>
      </div>`;
  }
}

// ══════════════════════════════════════════
// TIMELINE & ERA
// ══════════════════════════════════════════
function updateEra(idx) {
  currentEra = idx;
  const era = ERAS[idx];

  document.getElementById("era-name").textContent = era.name;
  document.getElementById("era-years").textContent = era.years;

  const slider = document.getElementById("timeline-slider");
  slider.value = idx;
  const pct = (idx / (ERAS.length - 1)) * 100;
  slider.style.setProperty("--pct", pct + "%");

  // 🔥 FIX: مدیریت هوشمند و مطمئن نمایش Era Badge
  const badge = document.getElementById("era-badge");
  if (badge) {
    badge.textContent = `${era.name} · ${era.nameEn}`;
    void badge.offsetWidth; // فورس کردن Reflow برای اجرای صحیح انیمیشن در Brave/Safari
    
    badge.style.opacity = "1";
    badge.style.transform = "translateX(-50%) translateY(0)";
    
    if (badge._hideTimer) clearTimeout(badge._hideTimer);
    
    badge._hideTimer = setTimeout(() => {
      badge.style.opacity = "0";
      badge.style.transform = "translateX(-50%) translateY(20px)";
    }, 3000);
  }

  document.dispatchEvent(new CustomEvent('eraChanged', { detail: idx }));
}

window.openPoet = openPoet;
window.openWork = openWork;

document.addEventListener('openCityPanel', (e) => {
  const city = e.detail;
  const panel = document.getElementById("panel");
  const panelHeader = document.getElementById("panel-header");
  if (panel && panelHeader) {
    let headerImg = document.getElementById("panel-header-img");
    if (!headerImg) {
      headerImg = document.createElement("img");
      headerImg.id = "panel-header-img";
      panel.insertBefore(headerImg, panelHeader);
    }

    if (city.headerImage) {
      headerImg.src = city.headerImage;
      headerImg.style.display = "block";
    } else {
      headerImg.style.display = "none";
    }
  }
  openCity(e.detail);
});

function setupTimeline() {
  const slider = document.getElementById("timeline-slider");
  slider.setAttribute("min", "0");
  slider.setAttribute("max", ERAS.length - 1);
  slider.setAttribute("value", "0");
  slider.setAttribute("step", "1");

  slider.addEventListener("input", (e) => {
    updateEra(parseInt(e.target.value));
  });
}

function setupUI() {
  document.getElementById("panel-close").addEventListener("click", closePanel);
  document.getElementById("panel-back").addEventListener("click", goBack);
  setupTimeline();
  updateEra(0);
}

document.addEventListener("DOMContentLoaded", () => {
  setupUI();
  handleDeepLink();
});

function handleDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const poetId = params.get("poet");

  if (!poetId) return;

  console.log("Deep link detected:", poetId);

  for (const city of CITIES) {
    const poet = city.poets.find(p => p.id === poetId);
    if (!poet) continue;

    if (window.mapReady) {
      navigateToPoet(city, poet);
    } else {
      document.addEventListener("mapReady", () => navigateToPoet(city, poet), { once: true });
    }
    return;
  }
  console.warn(`Poet "${poetId}" not found.`);
}

function navigateToPoet(city, poet) {
  updateEra(city.eras[0]);

  if (window.map) {
    window.map.flyTo({
      center: [city.lon, city.lat],
      zoom: 6.5,
      speed: 0.8,
      curve: 1.4,
      essential: true
    });
  }

  markers.forEach(marker => {
    if (marker.cityData.id === city.id) {
      marker.getElement().classList.add("deep-link-highlight");
      setTimeout(() => {
        marker.getElement().classList.remove("deep-link-highlight");
      }, 3000);
    }
  });

  setTimeout(() => {
    openCity(city);
  }, 1200);
}