// ══════════════════════════════════════════
// MAP — Phase 5: Bulletproof CartoDB + Fixed Paths
// ══════════════════════════════════════════
let map;
let markers = [];
let citiesLoaded = false;
let eraPopup = null; // 🔥 Popup برای نمایش دوره
const STARTING_ERA = 0;

function initializeMap() {
  map = new maplibregl.Map({
    container: "map-container",
    style: {
      version: 8,
      sources: {
        "carto-light": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
            "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
            "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "© CartoDB © OpenStreetMap"
        }
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#f7f2e6" }
        },
        {
          id: "basemap",
          type: "raster",
          source: "carto-light",
          paint: {
            "raster-opacity": 0.65,
            "raster-saturation": -0.8
          }
        }
      ]
    },
    center: [58, 32],
    zoom: 4,
    minZoom: 3,
    maxZoom: 10,
  });

  map.on("load", async () => {
    console.log("✓ MapLibre loaded with CartoDB basemap");
    await loadBorders(STARTING_ERA);
    loadCities();
    updateMarkers(STARTING_ERA);
    
    // نمایش پاپ‌آپ دوره اولیه
    showEraPopup(STARTING_ERA);

    // Signal that the map is ready (for deep linking)
    window.map = map;
    window.mapReady = true;
    document.dispatchEvent(new CustomEvent("mapReady"));
  });
}

function showEraPopup(eraIndex) {
  const era = ERAS[eraIndex];
  if (!era) return;

  const existingPopup = document.getElementById('era-popup-html');
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement('div');
  popup.id = 'era-popup-html';
  popup.className = 'era-popup-html';
  popup.textContent = `${era.name} · ${era.nameEn}`;
  
  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup.parentNode) {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(20px)';
      setTimeout(() => popup.remove(), 300);
    }
  }, 3000);
}

// ══════════════════════════════════════════
// BORDERS (Bulletproof Fetch)
// ══════════════════════════════════════════
async function loadBorders(eraIndex) {
  const filePath = `map/borders/era_${eraIndex}.geojson`;
  try {
    console.log(` Attempting to load borders from: ${filePath}`);
    const res = await fetch(filePath);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - File not found or blocked`);
    }
    
    const geojson = await res.json();

    if (map.getSource("empire")) {
      map.getSource("empire").setData(geojson);
      console.log(`✓ Updated borders for era ${eraIndex}`);
      return;
    }

    map.addSource("empire", { type: "geojson", data: geojson });

    map.addLayer({
      id: "empire-fill",
      type: "fill",
      source: "empire",
      paint: { "fill-color": "#0f8b8d", "fill-opacity": 0.1 }
    });

    map.addLayer({
      id: "empire-border-outer",
      type: "line",
      source: "empire",
      paint: {
        "line-color": "#0f8b8d",
        "line-width": 3,
        "line-opacity": 0.85,
        "line-dasharray": [4, 3]
      }
    });

    map.addLayer({
      id: "empire-border-inner",
      type: "line",
      source: "empire",
      paint: {
        "line-color": "#c9a84c",
        "line-width": 1.5,
        "line-opacity": 0.9,
        "line-offset": -2.5
      }
    });

    console.log(`✓ Successfully loaded borders for era ${eraIndex}`);
  } catch (err) {
    console.warn(`❌ Failed to load borders for era ${eraIndex}:`, err.message);
  }
}

// ══════════════════════════════════════════
// CITIES
// ══════════════════════════════════════════
function loadCities() {
  if (citiesLoaded) return;
  citiesLoaded = true;
  
  CITIES.forEach(city => {
    const el = document.createElement("div");
    el.className = "city-marker-html";

    const dot = document.createElement("div");
    dot.className = "city-dot";
    const label = document.createElement("div");
    label.className = "city-label-text";
    label.textContent = city.name;

    el.appendChild(dot);
    el.appendChild(label);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent("openCityPanel", { detail: city }));
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([city.lon, city.lat])
      .addTo(map);

    marker.cityData = city;
    markers.push(marker);
  });
}

function clearMarkers() {
  markers.forEach(marker => {
    marker.remove();
  });
  markers = [];
}

function updateMarkers(eraIndex) {
  markers.forEach(marker => {
    const visible = marker.cityData.eras.includes(eraIndex);
    const element = marker.getElement();
    
    if (visible) {
      element.style.display = "flex";
      element.style.pointerEvents = "auto";
    } else {
      element.style.display = "none";
      element.style.pointerEvents = "none";
    }
  });
}

// ══════════════════════════════════════════
// ERA CHANGES
// ══════════════════════════════════════════
document.addEventListener("eraChanged", async (e) => {
  const fileEra = e.detail;
  await loadBorders(fileEra);
  updateMarkers(e.detail);
  showEraPopup(e.detail); // 🔥 نمایش پاپ‌آپ دوره جدید
});

document.addEventListener("DOMContentLoaded", initializeMap);