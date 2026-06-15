// ══════════════════════════════════════════
// MAP — Phase 5: Bulletproof CartoDB + Fixed Paths
// ══════════════════════════════════════════

let map;
let markers = [];

// 🔥 CRITICAL FIX: Match your slider to your file names!
// If your slider goes 0 to 5, but your files are era_1.geojson, era_2.geojson...
// Set this to 1. If your files are era_0.geojson, set this to 0.
const STARTING_ERA = 1; 

function initializeMap() {
  map = new maplibregl.Map({
    container: "map-container",
    style: {
      version: 8,
      sources: {
        // 🌟 CARTODB POSITRON (No Labels)
        // Free, no API key, no blocking, works perfectly in Iran.
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
          paint: { "background-color": "#f7f2e6" } // Cream background
        },
        {
          id: "basemap",
          type: "raster",
          source: "carto-light",
          paint: {
            "raster-opacity": 0.65, // Let the cream background show through slightly
            "raster-saturation": -0.8 // Remove any lingering modern map colors
          }
        }
      ]
    },
    center: [58, 32], // Centered perfectly on the Greater Persian Realm
    zoom: 4,
    minZoom: 3,
    maxZoom: 10,
  });

  //map.addControl(new maplibregl.NavigationControl(), "bottom-left");──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  map.on("load", async () => {
    console.log("✓ MapLibre loaded with CartoDB basemap");
    
    // 🔥 FIX: Use the STARTING_ERA variable instead of hardcoded 0
    await loadBorders(STARTING_ERA);
    loadCities();
    updateMarkers(STARTING_ERA);
  });
}

// ══════════════════════════════════════════
// BORDERS (Bulletproof Fetch)
// ══════════════════════════════════════════
async function loadBorders(eraIndex) {
  // 🔥 FIX: Construct the path carefully. 
  // Ensure this matches where your files actually live in your project folder.
  const filePath = `map/borders/era_${eraIndex}.geojson`; 
  
  try {
    console.log(`📂 Attempting to load borders from: ${filePath}`);
    const res = await fetch(filePath);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - File not found or blocked`);
    }
    
    const geojson = await res.json();

    // Update source if it already exists (for smooth era transitions)
    if (map.getSource("empire")) {
      map.getSource("empire").setData(geojson);
      console.log(`✓ Updated borders for era ${eraIndex}`);
      return;
    }

    // Add source and layers if it's the first time loading
    map.addSource("empire", { type: "geojson", data: geojson });

    // 1. Turquoise Fill
    map.addLayer({
      id: "empire-fill",
      type: "fill",
      source: "empire",
      paint: { "fill-color": "#0f8b8d", "fill-opacity": 0.1 }
    });

    // 2. Turquoise Outer Border (Dashed)
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

    // 3. Gold Inner Border (Double-line effect)
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
    console.warn(`💡 Check if the file exists at exactly this path: ${filePath}`);
  }
}

// ══════════════════════════════════════════
// CITIES
// ══════════════════════════════════════════
function loadCities() {
  CITIES.forEach(city => {
    const el = document.createElement("div");
    el.className = "city-marker-html";
    el.innerHTML = `
      <div class="city-dot"></div>
      <div class="city-label-text">${city.name}</div>
    `;

    el.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("openCityPanel", { detail: city }));
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([city.lon, city.lat])
      .addTo(map);

    marker.cityData = city;
    markers.push(marker);
  });
}

function updateMarkers(eraIndex) {
  markers.forEach(marker => {
    const visible = marker.cityData.eras.includes(eraIndex);
    marker.getElement().style.display = visible ? "flex" : "none";
  });
}

// ══════════════════════════════════════════
// ERA CHANGES
// ══════════════════════════════════════════
document.addEventListener("eraChanged", async (e) => {
  // 🔥 FIX: If your slider sends 0,1,2... but files are era_1, era_2...
  // You might need to add 1 here: const fileEra = e.detail + 1;
  const fileEra = e.detail; // Change this math if your slider and files don't match!
  
  await loadBorders(fileEra);
  updateMarkers(e.detail);
});

document.addEventListener("DOMContentLoaded", initializeMap);