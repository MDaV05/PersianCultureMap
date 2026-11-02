// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let currentEra = 0;
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

// ── Safe DOM helpers ──
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
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

  // Clear body safely
  body.innerHTML = "";

  if (type === "city") {
    const era = ERAS[currentEra];
    eyebrow.textContent = "شهر · CITY";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + " · " + era.nameEn;

    const poets = data.poets.filter(p => !p.eras || p.eras.includes(currentEra));

    if (poets.length === 0) {
      const emptyMsg = el("p", "empty-state");
      emptyMsg.textContent = `شاعری برای «${era.name}» در این شهر ثبت نشده است.`;
      body.appendChild(emptyMsg);
    } else {
      poets.forEach(p => {
        const card = el("div", "poet-card");
        card.dataset.poetId = p.id;
        card.dataset.cityId = data.id;

        const avatar = el("div", "poet-avatar", p.emoji);
        const info = el("div", "poet-info");
        info.appendChild(el("div", "poet-name", p.name));
        info.appendChild(el("div", "poet-name-en", p.nameEn));
        info.appendChild(el("div", "poet-dates", p.dates));
        const arrow = el("div", "poet-arrow", "←");

        card.appendChild(avatar);
        card.appendChild(info);
        card.appendChild(arrow);
        body.appendChild(card);
      });
    }

    const moreLink = el("div", "more-info-link");
    const link = el("a", null, "اطلاعات بیشتر ←");
    link.href = "https://docs.chekameh.xyz/";
    link.target = "_blank";
    moreLink.appendChild(link);
    body.appendChild(moreLink);

  } else if (type === "poet") {
    eyebrow.textContent = "شاعر · POET";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + " · " + data.dates;

    const bio = el("p", "poet-bio", data.bio);
    body.appendChild(bio);

    const worksTitle = el("div", "works-title", "WORKS · آثار برتر");
    body.appendChild(worksTitle);

    data.works.forEach(w => {
      const tile = el("div", "work-tile");
      tile.dataset.workId = w.name;
      tile.dataset.poetName = data.name;
      tile.dataset.poetNameEn = data.nameEn;

      const header = el("div", "work-tile-header");
      const titleWrap = el("div");
      titleWrap.appendChild(el("div", "work-name", w.name));
      titleWrap.appendChild(el("div", "work-name-en", w.nameEn));
      const arrow = el("div", "work-arrow", "←");
      arrow.style.color = "var(--gold)";
      arrow.style.fontSize = "18px";
      header.appendChild(titleWrap);
      header.appendChild(arrow);

      const desc = el("div", "work-desc", w.desc);

      tile.appendChild(header);
      tile.appendChild(desc);
      body.appendChild(tile);
    });

    const moreLink = el("div", "more-info-link");
    const link = el("a", null, "اطلاعات بیشتر ←");
    link.href = "https://docs.chekameh.xyz/";
    link.target = "_blank";
    moreLink.appendChild(link);
    body.appendChild(moreLink);

  } else if (type === "work") {
    eyebrow.textContent = "اثر · WORK";
    title.textContent = data.name;
    subtitle.textContent = data.nameEn + (poet ? " · " + poet.nameEn : "");

    const block = el("div", "poem-block");
    const intro = el("p", "poem-intro", data.desc);
    const divider = el("div", "poem-divider", "— ✦ —");
    block.appendChild(intro);
    block.appendChild(divider);

    data.lines.forEach(line => {
      block.appendChild(el("div", "poem-line", line));
    });

    body.appendChild(block);

    const moreLink = el("div", "more-info-link");
    const link = el("a", null, "اطلاعات بیشتر ←");
    link.href = "https://docs.chekameh.xyz/";
    link.target = "_blank";
    moreLink.appendChild(link);
    body.appendChild(moreLink);
  }
}

// ── Event delegation for dynamically created cards ──
document.getElementById("panel-body").addEventListener("click", (e) => {
  const card = e.target.closest(".poet-card");
  if (card) {
    const city = CITIES.find(c => c.id === card.dataset.cityId);
    const poet = city?.poets.find(p => p.id === card.dataset.poetId);
    if (city && poet) openPoet(poet, city);
    return;
  }

  const tile = e.target.closest(".work-tile");
  if (tile) {
    const poetName = tile.dataset.poetName;
    const poetNameEn = tile.dataset.poetNameEn;
    const workName = tile.dataset.workId;

    // Find the work in the current panel stack
    const current = panelStack[panelStack.length - 1];
    if (current?.type === "poet") {
      const work = current.data.works.find(w => w.name === workName);
      if (work) openWork(work, { name: poetName, nameEn: poetNameEn });
    }
    return;
  }
});

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