// ══════════════════════════════════════════
// MAP — Phase 3+: Stadia basemap + Borders + Cities
// ══════════════════════════════════════════

let map;
let markers = [];

function initializeMap() {
  map = new maplibregl.Map({
    container: "map-container",
    style: {
      version: 8,
      sources: {
        "stadia-toner": {
          type: "raster",
          tiles: [
            "https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "© Stadia Maps © Stamen Design © OpenMapTiles © OpenStreetMap"
        }
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#1a1408" }
        },
        {
          id: "basemap",
          type: "raster",
          source: "stadia-toner",
          paint: {
            "raster-opacity": 0.18,
            "raster-saturation": -1,
            "raster-brightness-min": 0,
            "raster-brightness-max": 0.4
          }
        }
      ]
    },
    center: [60, 35],
    zoom: 4,
    minZoom: 3,
    maxZoom: 10,
  });

  map.addControl(new maplibregl.NavigationControl(), "bottom-left");

  map.on("load", async () => {
    console.log("✓ MapLibre loaded");
    await loadBorders(0);
    loadCities();
    updateMarkers(0);
  });
}

// ══════════════════════════════════════════
// BORDERS
// ══════════════════════════════════════════
async function loadBorders(eraIndex) {
  try {
    const res = await fetch(`map/borders/era_${eraIndex}.geojson`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const geojson = await res.json();

    if (map.getSource("empire")) {
      map.getSource("empire").setData(geojson);
      return;
    }

    map.addSource("empire", { type: "geojson", data: geojson });

    map.addLayer({
      id: "empire-fill",
      type: "fill",
      source: "empire",
      paint: { "fill-color": "#C9A84C", "fill-opacity": 0.12 }
    });

    map.addLayer({
      id: "empire-border",
      type: "line",
      source: "empire",
      paint: {
        "line-color": "#C9A84C",
        "line-width": 2,
        "line-opacity": 0.7,
        "line-dasharray": [3, 2]
      }
    });

    console.log(`✓ Borders loaded for era ${eraIndex}`);
  } catch (err) {
    console.warn(`No borders for era ${eraIndex}:`, err.message);
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
  await loadBorders(e.detail);
  updateMarkers(e.detail);
});

document.addEventListener("DOMContentLoaded", initializeMap);