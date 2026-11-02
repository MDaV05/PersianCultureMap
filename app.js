// ══════════════════════════════════════════════════════════════
// چکامه (Chekameh) — Master Rework Application Controller
// Built under $frontend-craft:
// Anti-slop reactive state, MapLibre GL 4, Emil Kowalski tactile motion,
// Persian RTL localization, classical poetry bayt parser, Cmd+K search,
// architectural timeline scrubber, and deep-linking with https://docs.chekameh.xyz/
// ══════════════════════════════════════════════════════════════

// ── Application State ──
const state = {
  currentEra: 0,
  activeCity: null,
  activePoetId: null,
  activeBasemap: "carto",
  cartoKey: "cb1_4siw_1_e17f79cbd8950e0bf9a1ceb3",
  isTouring: false,
  tourInterval: null,
  baytFontSizeRem: 0.96,
  mapReady: false,
};

// ── Docs Base URL & Slugs ──
const DOCS_BASE = "https://docs.chekameh.xyz";

const ERA_DOCS_SLUGS = [
  "samanid",
  "ghaznavid",
  "seljuk",
  "ilkhanate",
  "timurid",
  "safavid"
];

// Short Dynasty Names for the Minimal Scrubber
const SCRUBBER_ERA_DATA = [
  { name: "سامانیان", startYear: "875" },
  { name: "غزنویان", startYear: "1000" },
  { name: "سلجوقیان", startYear: "1150" },
  { name: "ایلخانان", startYear: "1260" },
  { name: "تیموریان", startYear: "1370" },
  { name: "صفویان", startYear: "1500" }
];

// ── Basemap Configurations ──
const BASEMAPS = {
  carto: {
    name: "کارتو دی‌بی (Positron)",
    getTiles: (key, isDark) => {
      if (typeof isDark === "undefined") {
        isDark = document.body.classList.contains("theme-dark");
      }
      const mode = isDark ? "dark_nolabels" : "light_nolabels";
      return [
        `https://a.basemaps.cartocdn.com/${mode}/{z}/{x}/{y}.png?key=${key}`,
        `https://b.basemaps.cartocdn.com/${mode}/{z}/{x}/{y}.png?key=${key}`,
        `https://c.basemaps.cartocdn.com/${mode}/{z}/{x}/{y}.png?key=${key}`,
        `https://d.basemaps.cartocdn.com/${mode}/{z}/{x}/{y}.png?key=${key}`
      ];
    },
    attribution: "© CartoDB © OpenStreetMap",
    opacity: 0.65,
    saturation: -0.8
  },
  shadedRelief: {
    name: "Esri Shaded Relief",
    getTiles: () => [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
    ],
    attribution: "© Esri — USGS, NOAA",
    opacity: 0.65,
    saturation: -0.7
  },
  terrain: {
    name: "Esri World Terrain",
    getTiles: () => [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}"
    ],
    attribution: "© Esri — USGS, NOAA",
    opacity: 0.65,
    saturation: -0.6
  }
};

// Era Summaries for Historical Context HUD (The Sole Authoritative Placard)
const ERA_METADATA = [
  {
    century: "صده ۳ و ۴ هجری",
    title: "دوره‌ی سامانی",
    en: "Samanid Dynasty",
    period: "875 – 1000 CE",
    summary: "عصر زرین ادب پارسی؛ شکوفایی خراسان بزرگ و ماوراءالنهر در دربار بخارا با سرایش شاهنامه و دیوان رودکی."
  },
  {
    century: "صده ۴ و ۵ هجری",
    title: "دوره‌ی غزنوی",
    en: "Ghaznavid Dynasty",
    period: "1000 – 1150 CE",
    summary: "گسترش قلمرو زبان پارسی تا شبه‌قاره هند؛ حامی بزرگ سرایش حماسه‌ها و قصاید درباری."
  },
  {
    century: "صده ۶ و ۷ هجری",
    title: "دوره‌ی سلجوقی",
    en: "Seljuk Empire",
    period: "1150 – 1300 CE",
    summary: "پایتختی اصفهان و نیشابور؛ اوج حکمت خیام، عرفان عطار و شکل‌گیری مکاتب بزرگ تصوف و ادبیات."
  },
  {
    century: "صده ۷ و ۸ هجری",
    title: "دوره‌ی ایلخانی",
    en: "Ilkhanate Era",
    period: "1260 – 1370 CE",
    summary: "دوران رستاخیز فرهنگی پس از هجوم؛ نگارش شاهکارهای سعدی و مولانا، شکوه معماری و شعر عرفانی شیراز."
  },
  {
    century: "صده ۸ و ۹ هجری",
    title: "دوره‌ی تیموری",
    en: "Timurid Renaissance",
    period: "1370 – 1500 CE",
    summary: "رنسانس هنر تیموری در هرات و سمرقند؛ غزل‌های بی‌مانند حافظ شیرازی و کمال تذهیب و خطاطی."
  },
  {
    century: "صده ۱۰ تا ۱۲ هجری",
    title: "دوره‌ی صفوی",
    en: "Safavid Empire",
    period: "1500 – 1736 CE",
    summary: "عصر صفوی و مکتب اصفهان؛ وحدت سرزمینی ایران، اوج‌گیری سبک هندی (اصفهانی) و شاهکارهای صائب تبریزی."
  }
];

let map = null;
let cityMarkers = [];

// ══════════════════════════════════════════════════════════════
// MAP INITIALIZATION
// ══════════════════════════════════════════════════════════════
function initMap() {
  const isDark = document.body.classList.contains("theme-dark");
  const provider = BASEMAPS[state.activeBasemap];
  const tileUrls = provider.getTiles(state.cartoKey);
  const opacity = (state.activeBasemap === "carto" && isDark) ? 0.85 : provider.opacity;
  const saturation = (state.activeBasemap === "carto" && isDark) ? 0 : provider.saturation;

  map = new maplibregl.Map({
    container: "map",
    style: {
      version: 8,
      sources: {
        "basemap-source": {
          type: "raster",
          tiles: tileUrls,
          tileSize: 256,
          attribution: provider.attribution
        }
      },
      layers: [
        {
          id: "background-tint",
          type: "background",
          paint: { "background-color": isDark ? "#080d1a" : "#f7f2e6" }
        },
        {
          id: "basemap",
          type: "raster",
          source: "basemap-source",
          paint: {
            "raster-opacity": opacity,
            "raster-saturation": saturation
          }
        }
      ]
    },
    center: [58.5, 33],
    zoom: 4.3,
    minZoom: 3,
    maxZoom: 9
  });

  map.on("load", async () => {
    state.mapReady = true;
    console.log("✓ MapLibre 4.7.1 initialized with", state.activeBasemap);
    await loadBorders(state.currentEra);
    initCityMarkers();
    updateCityMarkers(state.currentEra);
    updateEraUI(state.currentEra);
  });
}

// ══════════════════════════════════════════════════════════════
// HISTORICAL BORDERS (GEOJSON)
// ══════════════════════════════════════════════════════════════
async function loadBorders(eraIndex) {
  if (!map) return;
  const path = `map/borders/era_${eraIndex}.geojson`;

  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (map.getSource("empire")) {
      map.getSource("empire").setData(data);
    } else {
      map.addSource("empire", { type: "geojson", data: data });

      const isDarkInit = document.body.classList.contains("theme-dark");
      // 1. Shaded Empire Fill (Illuminated Parchment Hue)
      map.addLayer({
        id: "empire-fill",
        type: "fill",
        source: "empire",
        paint: {
          "fill-color": isDarkInit ? "#2ec4b6" : "#0a8791",
          "fill-opacity": isDarkInit ? 0.12 : 0.08
        }
      });

      // 2. Imperial Glow Halo
      map.addLayer({
        id: "empire-glow",
        type: "line",
        source: "empire",
        paint: {
          "line-color": isDarkInit ? "#f3d47d" : "#c59b27",
          "line-width": 6,
          "line-opacity": isDarkInit ? 0.55 : 0.35,
          "line-blur": 3
        }
      });

      // 3. Crisp Historic Border Line
      map.addLayer({
        id: "empire-border",
        type: "line",
        source: "empire",
        paint: {
          "line-color": isDarkInit ? "#5eead4" : "#0a8791",
          "line-width": 2,
          "line-opacity": isDarkInit ? 0.95 : 0.9,
          "line-dasharray": [4, 2]
        }
      });
    }

    // Auto fit viewport to historic empire bounds
    const bounds = new maplibregl.LngLatBounds();
    let hasCoords = false;

    function extendCoords(c) {
      if (!Array.isArray(c)) return;
      if (typeof c[0] === "number" && typeof c[1] === "number") {
        bounds.extend(c);
        hasCoords = true;
      } else {
        c.forEach(extendCoords);
      }
    }

    if (data.features) {
      data.features.forEach((feat) => {
        if (feat.geometry && feat.geometry.coordinates) {
          extendCoords(feat.geometry.coordinates);
        }
      });
    }

    if (hasCoords) {
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 100, left: 60, right: 60 },
        maxZoom: 5.6,
        duration: 900
      });
    }
  } catch (err) {
    console.warn("Error loading borders for era", eraIndex, err);
  }
}

// ══════════════════════════════════════════════════════════════
// JEWELED CITY BEACONS
// ══════════════════════════════════════════════════════════════
function initCityMarkers() {
  if (cityMarkers.length > 0) return;

  CITIES.forEach((city) => {
    const el = document.createElement("div");
    el.className = "city-beacon";
    el.title = `${city.name} (${city.nameEn})`;

    const core = document.createElement("div");
    core.className = "beacon-core";

    const pulse = document.createElement("div");
    pulse.className = "beacon-pulse";

    const jewel = document.createElement("div");
    jewel.className = "beacon-jewel";

    core.appendChild(pulse);
    core.appendChild(jewel);

    const tag = document.createElement("div");
    tag.className = "beacon-tag";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = city.name;
    tag.appendChild(titleSpan);

    // City tag contains only the city name (poet count badge removed as requested)

    el.appendChild(core);
    el.appendChild(tag);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      openCityDrawer(city);
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([city.lon, city.lat])
      .addTo(map);

    marker.cityData = city;
    cityMarkers.push(marker);
  });
}

function updateCityMarkers(eraIndex) {
  cityMarkers.forEach((marker) => {
    const isVisible = marker.cityData.eras.includes(eraIndex);
    const el = marker.getElement();
    if (isVisible) {
      el.style.display = "flex";
      el.style.pointerEvents = "auto";
    } else {
      el.style.display = "none";
      el.style.pointerEvents = "none";
    }
  });
}

// ══════════════════════════════════════════════════════════════
// ARCHITECTURAL TIMELINE SCRUBBER
// Sleek, minimal, single-decked rail with milestone jewel nodes
// ══════════════════════════════════════════════════════════════
function initTimelineScrubber() {
  const container = document.getElementById("scrubber-milestones");
  container.innerHTML = "";

  SCRUBBER_ERA_DATA.forEach((item, idx) => {
    const node = document.createElement("button");
    node.className = `scrubber-node ${idx === state.currentEra ? "active" : ""}`;
    node.dataset.index = idx;
    node.title = `${item.name} (${item.startYear} CE)`;

    const bead = document.createElement("div");
    bead.className = "node-bead";

    const label = document.createElement("span");
    label.className = "node-label";
    label.textContent = item.name;

    const sub = document.createElement("span");
    sub.className = "node-sub tabular-num";
    sub.textContent = `${item.startYear} میلادی`;

    node.appendChild(bead);
    node.appendChild(label);
    node.appendChild(sub);

    node.addEventListener("click", () => {
      selectEra(idx);
    });

    container.appendChild(node);
  });

  updateScrubberVisuals(state.currentEra);
}

function updateScrubberVisuals(eraIndex) {
  const nodes = document.querySelectorAll(".scrubber-node");
  nodes.forEach((node, idx) => {
    node.classList.toggle("active", idx === eraIndex);
    node.classList.toggle("passed", idx < eraIndex);
  });

  // Calculate rail progress percentage
  const total = SCRUBBER_ERA_DATA.length - 1;
  const pct = total > 0 ? (eraIndex / total) * 100 : 0;
  const fill = document.getElementById("scrubber-rail-fill");
  if (fill) {
    fill.style.width = `${pct}%`;
  }

  // Update nav buttons disabled state at boundaries
  const btnPrev = document.getElementById("btn-prev-era");
  const btnNext = document.getElementById("btn-next-era");
  if (btnPrev) {
    btnPrev.disabled = eraIndex === 0;
    btnPrev.classList.toggle("disabled", eraIndex === 0);
  }
  if (btnNext) {
    btnNext.disabled = eraIndex === total;
    btnNext.classList.toggle("disabled", eraIndex === total);
  }
}

async function selectEra(eraIndex) {
  if (eraIndex < 0 || eraIndex >= ERAS.length) return;
  state.currentEra = eraIndex;

  updateScrubberVisuals(eraIndex);

  // Update Map
  await loadBorders(eraIndex);
  updateCityMarkers(eraIndex);
  updateEraUI(eraIndex);

  // If a city is currently opened in the drawer, check if it's active in the new era
  if (state.activeCity) {
    if (!state.activeCity.eras.includes(eraIndex)) {
      closeCityDrawer();
    } else {
      renderDrawerPoets(state.activeCity, eraIndex);
    }
  }
}

function updateEraUI(eraIndex) {
  const era = ERAS[eraIndex];
  const meta = ERA_METADATA[eraIndex];
  const docsSlug = ERA_DOCS_SLUGS[eraIndex] || "samanid";

  // Historical Detail Card (Sole Authoritative Placard)
  document.getElementById("era-card-badge").textContent = meta.century;
  document.getElementById("era-card-title").textContent = meta.title;
  document.getElementById("era-card-en").textContent = meta.en;
  document.getElementById("era-card-period").textContent = meta.period;
  document.getElementById("era-card-summary").textContent = meta.summary;

  // Era Deep Link into docs.chekameh.xyz
  const eraDocsLink = document.getElementById("era-docs-link");
  if (eraDocsLink) {
    eraDocsLink.href = `${DOCS_BASE}/data/eras/${docsSlug}/`;
    eraDocsLink.title = `مطالعه پرونده کامل ${era.name} در دانشنامه چکامه`;
  }
}

// ══════════════════════════════════════════════════════════════
// CITY & POET DRAWER (INSPECTOR)
// ══════════════════════════════════════════════════════════════
function openCityDrawer(city) {
  state.activeCity = city;

  const overlay = document.getElementById("drawer-overlay");
  const heroImg = document.getElementById("drawer-hero-img");
  const cityTitle = document.getElementById("drawer-city-title");
  const cityEn = document.getElementById("drawer-city-en");
  const cityCoords = document.getElementById("drawer-city-coords");
  const cityDocsLink = document.getElementById("city-docs-link");

  heroImg.src = city.headerImage;
  cityTitle.textContent = city.name;
  cityEn.textContent = city.nameEn;
  cityCoords.textContent = `${city.lat}° N, ${city.lon}° E`;

  // Deep Link for city in docs.chekameh.xyz
  if (cityDocsLink) {
    cityDocsLink.href = `${DOCS_BASE}/data/cities/${city.id}/`;
    cityDocsLink.title = `مطالعه تاریخچه و آثار ادبی شهر ${city.name} در دانشنامه`;
  }

  renderDrawerPoets(city, state.currentEra);

  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");

  // Fly map camera to city
  if (map) {
    map.flyTo({
      center: [city.lon, city.lat],
      zoom: 6.2,
      speed: 0.8,
      curve: 1.2
    });
  }
}

function closeCityDrawer() {
  state.activeCity = null;
  state.activePoetId = null;
  const overlay = document.getElementById("drawer-overlay");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
}

function renderDrawerPoets(city, currentEra) {
  const chipsContainer = document.getElementById("poets-chips");
  chipsContainer.innerHTML = "";

  // Filter poets belonging to the current era
  const activePoets = (city.poets || []).filter((p) => {
    if (p.eras && p.eras.length > 0) {
      return p.eras.includes(currentEra);
    }
    return true;
  });

  if (activePoets.length === 0) {
    chipsContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">در این دوره شاعری در این شهر ثبت نشده است.</span>`;
    document.getElementById("drawer-content").style.display = "none";
    return;
  }

  document.getElementById("drawer-content").style.display = "flex";

  activePoets.forEach((poet, idx) => {
    const btn = document.createElement("button");
    btn.className = `poet-chip-btn haptic-press ${idx === 0 ? "active" : ""}`;
    btn.textContent = `${poet.emoji || "✒️"} ${poet.name}`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".poet-chip-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      displayPoetProfile(poet);
    });
    chipsContainer.appendChild(btn);
  });

  displayPoetProfile(activePoets[0]);
}

function displayPoetProfile(poet) {
  state.activePoetId = poet.id;

  document.getElementById("poet-avatar").textContent = poet.emoji || "📜";
  document.getElementById("poet-name").textContent = poet.name;
  document.getElementById("poet-dates").textContent = poet.dates;
  document.getElementById("poet-bio").textContent = poet.bio || "";

  // Deep Link for poet in docs.chekameh.xyz
  const poetDocsLink = document.getElementById("poet-docs-link");
  if (poetDocsLink) {
    poetDocsLink.href = `${DOCS_BASE}/data/poets/${poet.id}/`;
    poetDocsLink.title = `مطالعه زندگینامه و دیوان اشعار ${poet.name} در دانشنامه چکامه`;
  }

  // Render Work
  const work = poet.works && poet.works[0];
  if (work) {
    document.getElementById("work-title").textContent = work.name;
    document.getElementById("work-desc").textContent = work.desc || "";

    const baytContainer = document.getElementById("bayt-container");
    baytContainer.innerHTML = "";

    (work.lines || []).forEach((line) => {
      const parts = line.split("/").map((s) => s.trim());
      const baytCard = document.createElement("div");
      baytCard.className = "bayt-card";

      const mesra1 = document.createElement("div");
      mesra1.className = "mesra mesra-first";
      mesra1.textContent = parts[0] || "";

      const flower = document.createElement("div");
      flower.className = "bayt-flower";
      flower.textContent = "❦";

      const mesra2 = document.createElement("div");
      mesra2.className = "mesra mesra-second";
      mesra2.textContent = parts[1] || "";

      baytCard.appendChild(mesra1);
      baytCard.appendChild(flower);
      baytCard.appendChild(mesra2);

      baytContainer.appendChild(baytCard);
    });
  }
}

// ══════════════════════════════════════════════════════════════
// SPOTLIGHT SEARCH (CMD+K)
// ══════════════════════════════════════════════════════════════
function initSearchModal() {
  const modal = document.getElementById("search-modal");
  const input = document.getElementById("search-input");
  const resultsContainer = document.getElementById("search-results");
  const clearBtn = document.getElementById("btn-clear-search");

  function openSearch() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    input.value = "";
    input.focus();
    renderSearchResults("");
  }

  function closeSearch() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  document.getElementById("btn-search-trigger").addEventListener("click", openSearch);
  clearBtn.addEventListener("click", () => {
    input.value = "";
    renderSearchResults("");
    input.focus();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSearch();
  });

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (modal.classList.contains("open")) closeSearch();
      else openSearch();
    }
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeSearch();
    }
  });

  input.addEventListener("input", (e) => {
    renderSearchResults(e.target.value.trim());
  });

  function renderSearchResults(query) {
    resultsContainer.innerHTML = "";
    const q = query.toLowerCase();

    const matches = [];

    // 1. Search Poets
    CITIES.forEach((city) => {
      (city.poets || []).forEach((poet) => {
        if (!q || poet.name.toLowerCase().includes(q) || poet.nameEn.toLowerCase().includes(q)) {
          matches.push({
            type: "شاعر",
            title: poet.name,
            subtitle: `${poet.nameEn} · ${city.name} (${poet.dates})`,
            icon: poet.emoji || "✒️",
            city: city,
            era: city.eras[0],
            poet: poet
          });
        }
      });
    });

    // 2. Search Cities
    CITIES.forEach((city) => {
      if (!q || city.name.toLowerCase().includes(q) || city.nameEn.toLowerCase().includes(q)) {
        matches.push({
          type: "شهر تاریخی",
          title: city.name,
          subtitle: `${city.nameEn} · ${city.poets ? city.poets.length : 0} شاعر برجسته`,
          icon: "🏛️",
          city: city,
          era: city.eras[0]
        });
      }
    });

    // 3. Search Docs Knowledge Base Pages
    const docsPages = [
      { title: "دانشنامه: معرفی و راهنمای چکامه", url: `${DOCS_BASE}/`, sub: "اهداف، مخاطبان و چشم‌انداز اطلس", icon: "📖" },
      { title: "دانشنامه: پایگاه جامع داده‌ها و دوران‌ها", url: `${DOCS_BASE}/data/`, sub: "ساختار داده‌های تاریخی، شهرها و شعرا", icon: "📊" },
      { title: "دانشنامه: معماری و مستندات فنی", url: `${DOCS_BASE}/technical/`, sub: "فناوری MapLibre، تایل‌ها، CDN و کشینگ", icon: "⚙️" },
      { title: "دانشنامه: منابع و کتاب‌شناسی مرجع", url: `${DOCS_BASE}/resources/`, sub: "اسناد و مراجع معتبر شعر کلاسیک فارسی", icon: "📚" }
    ];

    docsPages.forEach((dp) => {
      if (!q || dp.title.toLowerCase().includes(q) || dp.sub.toLowerCase().includes(q) || "مستندات دانشنامه docs".includes(q)) {
        matches.push({
          type: "دانشنامه",
          isDocsLink: true,
          title: dp.title,
          subtitle: dp.sub,
          url: dp.url,
          icon: dp.icon
        });
      }
    });

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">موردی یافت نشد.</div>`;
      return;
    }

    matches.slice(0, 10).forEach((item) => {
      if (item.isDocsLink) {
        const link = document.createElement("a");
        link.className = "search-result-item";
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.innerHTML = `
          <div class="result-main">
            <span class="result-icon">${item.icon}</span>
            <div>
              <div class="result-title">${item.title} ↗</div>
              <div class="result-sub">${item.subtitle}</div>
            </div>
          </div>
          <span class="result-tag docs-tag">${item.type}</span>
        `;
        resultsContainer.appendChild(link);
      } else {
        const row = document.createElement("button");
        row.className = "search-result-item";
        row.innerHTML = `
          <div class="result-main">
            <span class="result-icon">${item.icon}</span>
            <div>
              <div class="result-title">${item.title}</div>
              <div class="result-sub">${item.subtitle}</div>
            </div>
          </div>
          <span class="result-tag">${item.type}</span>
        `;

        row.addEventListener("click", async () => {
          closeSearch();
          await selectEra(item.era);
          openCityDrawer(item.city);
          if (item.poet) {
            displayPoetProfile(item.poet);
          }
        });

        resultsContainer.appendChild(row);
      }
    });
  }
}

// ══════════════════════════════════════════════════════════════
// DOCS MENU DROPDOWN
// ══════════════════════════════════════════════════════════════
function initDocsMenu() {
  const btn = document.getElementById("btn-docs-menu");
  const dropdown = document.getElementById("docs-dropdown");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("basemap-dropdown")?.classList.remove("show");
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });
}

// ══════════════════════════════════════════════════════════════
// BASEMAP SWITCHER & TOOLS
// ══════════════════════════════════════════════════════════════
function initBasemapSwitcher() {
  const btn = document.getElementById("btn-basemap-menu");
  const dropdown = document.getElementById("basemap-dropdown");
  const label = document.getElementById("active-basemap-label");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("docs-dropdown")?.classList.remove("show");
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });

  document.querySelectorAll(".dropdown-item[data-provider]").forEach((item) => {
    item.addEventListener("click", () => {
      const providerKey = item.dataset.provider;
      if (!BASEMAPS[providerKey]) return;

      state.activeBasemap = providerKey;
      label.textContent = item.querySelector(".item-title").textContent;

      document.querySelectorAll(".dropdown-item[data-provider]").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      dropdown.classList.remove("show");

      switchBasemap(providerKey, document.body.classList.contains("theme-dark"));
      showToast(`نقشه به ${item.querySelector(".item-title").textContent} تغییر یافت`);
    });
  });
}

function switchBasemap(providerKey, isDark) {
  if (!map) return;
  if (typeof isDark === "undefined") {
    isDark = document.body.classList.contains("theme-dark");
  }
  const config = BASEMAPS[providerKey];
  if (!config) return;
  const tileUrls = config.getTiles(state.cartoKey, isDark);

  if (map.getLayer("basemap")) map.removeLayer("basemap");
  if (map.getSource("basemap-source")) map.removeSource("basemap-source");

  map.addSource("basemap-source", {
    type: "raster",
    tiles: tileUrls,
    tileSize: 256,
    attribution: config.attribution
  });

  const opacity = (providerKey === "carto")
    ? (isDark ? 0.85 : 0.65)
    : (isDark ? 0.45 : config.opacity);
  const saturation = (providerKey === "carto")
    ? (isDark ? 0 : -0.8)
    : (isDark ? -0.85 : config.saturation);

  const beforeLayer = map.getLayer("empire-fill") ? "empire-fill" : undefined;
  map.addLayer(
    {
      id: "basemap",
      type: "raster",
      source: "basemap-source",
      paint: {
        "raster-opacity": opacity,
        "raster-saturation": saturation
      }
    },
    beforeLayer
  );

  if (map.getLayer("background-tint")) {
    map.setPaintProperty("background-tint", "background-color", isDark ? "#080d1a" : "#f7f2e6");
  }
}

function applyThemeToMap(isDark) {
  if (!map) return;
  if (!map.isStyleLoaded()) {
    map.once("styledata", () => applyThemeToMap(isDark));
    return;
  }

  // 1. Update background tint behind raster tiles
  if (map.getLayer("background-tint")) {
    map.setPaintProperty("background-tint", "background-color", isDark ? "#080d1a" : "#f7f2e6");
  }

  // 2. Reload basemap (switches between light_nolabels and dark_nolabels for carto)
  switchBasemap(state.activeBasemap, isDark);

  // 3. Update historic borders and glow for contrast
  if (map.getLayer("empire-fill")) {
    map.setPaintProperty("empire-fill", "fill-color", isDark ? "#2ec4b6" : "#0a8791");
    map.setPaintProperty("empire-fill", "fill-opacity", isDark ? 0.12 : 0.08);
  }
  if (map.getLayer("empire-glow")) {
    map.setPaintProperty("empire-glow", "line-color", isDark ? "#f3d47d" : "#c59b27");
    map.setPaintProperty("empire-glow", "line-opacity", isDark ? 0.55 : 0.35);
  }
  if (map.getLayer("empire-border")) {
    map.setPaintProperty("empire-border", "line-color", isDark ? "#5eead4" : "#0a8791");
    map.setPaintProperty("empire-border", "line-opacity", isDark ? 0.95 : 0.9);
  }
}

// ══════════════════════════════════════════════════════════════
// AUTOPLAY TOUR MODE
// ══════════════════════════════════════════════════════════════
function initTourMode() {
  const btn = document.getElementById("btn-tour-toggle");
  const iconPlay = btn.querySelector(".icon-play");
  const iconPause = btn.querySelector(".icon-pause");
  const label = document.getElementById("tour-label");

  btn.addEventListener("click", () => {
    state.isTouring = !state.isTouring;
    btn.classList.toggle("active", state.isTouring);

    if (state.isTouring) {
      iconPlay.classList.add("d-none");
      iconPause.classList.remove("d-none");
      label.textContent = "توقف پیمایش";
      showToast("پیمایش خودکار دوره‌های تاریخی آغاز شد");

      state.tourInterval = setInterval(() => {
        const next = (state.currentEra + 1) % ERAS.length;
        selectEra(next);
      }, 5500);
    } else {
      iconPlay.classList.remove("d-none");
      iconPause.classList.add("d-none");
      label.textContent = "پیمایش خودکار";
      clearInterval(state.tourInterval);
      state.tourInterval = null;
    }
  });
}

// ══════════════════════════════════════════════════════════════
// MAP TOOLS & POETRY ADJUSTERS
// ══════════════════════════════════════════════════════════════
function initMapTools() {
  document.getElementById("btn-zoom-in").addEventListener("click", () => map && map.zoomIn());
  document.getElementById("btn-zoom-out").addEventListener("click", () => map && map.zoomOut());
  document.getElementById("btn-reset-view").addEventListener("click", () => {
    if (map) {
      map.flyTo({ center: [58.5, 33], zoom: 4.3, pitch: 0, bearing: 0, duration: 800 });
    }
  });

  // Scrubber Nav Buttons
  document.getElementById("btn-prev-era").addEventListener("click", () => {
    if (state.currentEra > 0) selectEra(state.currentEra - 1);
  });
  document.getElementById("btn-next-era").addEventListener("click", () => {
    if (state.currentEra < ERAS.length - 1) selectEra(state.currentEra + 1);
  });

  window.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") {
      // In RTL, left arrow goes forward in timeline
      if (state.currentEra < ERAS.length - 1) selectEra(state.currentEra + 1);
    } else if (e.key === "ArrowRight") {
      if (state.currentEra > 0) selectEra(state.currentEra - 1);
    }
  });

  // Drawer Close
  document.getElementById("btn-close-drawer").addEventListener("click", closeCityDrawer);

  // Verse font size adjusters
  document.getElementById("btn-font-smaller").addEventListener("click", () => {
    state.baytFontSizeRem = Math.max(0.85, state.baytFontSizeRem - 0.08);
    document.documentElement.style.setProperty("--bayt-font-size", `${state.baytFontSizeRem}rem`);
  });
  document.getElementById("btn-font-larger").addEventListener("click", () => {
    state.baytFontSizeRem = Math.min(1.4, state.baytFontSizeRem + 0.08);
    document.documentElement.style.setProperty("--bayt-font-size", `${state.baytFontSizeRem}rem`);
  });

  // Copy Verse Button
  document.getElementById("btn-copy-poem").addEventListener("click", () => {
    const lines = [];
    document.querySelectorAll(".bayt-card").forEach((card) => {
      const m1 = card.querySelector(".mesra-first").textContent;
      const m2 = card.querySelector(".mesra-second").textContent;
      lines.push(`${m1}  /  ${m2}`);
    });
    const poetName = document.getElementById("poet-name").textContent;
    const workTitle = document.getElementById("work-title").textContent;
    const text = `«${workTitle}» — ${poetName}\n\n` + lines.join("\n");

    navigator.clipboard.writeText(text).then(() => {
      showToast("ابیات در حافظه کپی شد ✨");
    });
  });
}

function showToast(message) {
  const toast = document.getElementById("toast-notice");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ══════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────
// THEME CONTROLLER (Light & Nocturnal Dark Mode)
// ────────────────────────────────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem("chekameh_theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

  if (isDark) {
    document.body.classList.add("theme-dark");
    document.body.classList.remove("theme-illumination");
  } else {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-illumination");
  }
  updateThemeUI(isDark);

  const btnTheme = document.getElementById("btn-theme-toggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const darkNow = document.body.classList.toggle("theme-dark");
      document.body.classList.toggle("theme-illumination", !darkNow);
      localStorage.setItem("chekameh_theme", darkNow ? "dark" : "light");
      updateThemeUI(darkNow);

      // Dynamically apply dark/light theme to the map
      applyThemeToMap(darkNow);
    });
  }
}

function updateThemeUI(isDark) {
  const themeLabel = document.getElementById("theme-label");
  const iconSun = document.querySelector(".icon-sun");
  const iconMoon = document.querySelector(".icon-moon");
  // The button indicates what mode the site is CURRENTLY in
  if (themeLabel) themeLabel.textContent = isDark ? "حالت شب" : "حالت روز";
  if (iconSun && iconMoon) {
    iconSun.classList.toggle("d-none", isDark);
    iconMoon.classList.toggle("d-none", !isDark);
  }
}

// BOOTSTRAP APP
// ══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMap();
  initTimelineScrubber();
  initSearchModal();
  initDocsMenu();
  initBasemapSwitcher();
  initTourMode();
  initMapTools();
});
