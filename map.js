// map.js
let leafletMap = null;
let cityMarkerLayers = {};

function initializeMap() {
  // 1. Initialize Map
  leafletMap = L.map("map-container", {
    center: [33, 57],
    zoom: 4,
    zoomControl: false,
  });

  // 2. Add Standard Map Tiles (Free, No API Key needed)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 10
  }).addTo(leafletMap);

  // 3. Add Zoom Control
  L.control.zoom({ position: 'bottomleft' }).addTo(leafletMap);

  // 4. Create Markers
  initializeCityMarkers();
}

function initializeCityMarkers() {
  CITIES.forEach((city) => {
    // Check if coordinates exist
    if (!city.lat || !city.lon) return;

    // Create HTML for the marker
    const el = document.createElement("div");
    el.className = "city-marker-html";
    el.innerHTML = `
      <div class="city-dot"></div>
      <div class="city-label-text">${city.name}</div>
    `;
    
    // Click Event
    el.addEventListener("click", () => openCity(city));

    // Create Leaflet Marker
    const marker = L.marker([city.lat, city.lon], {
      icon: L.divIcon({
        className: "", // Reset default class
        html: el,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });

    cityMarkerLayers[city.id] = marker;
  });
}

function updateCityMarkers(eraIndex) {
  CITIES.forEach((city) => {
    const marker = cityMarkerLayers[city.id];
    if (!marker) return;

    // Check if city is active in this era
    const isActive = city.eras.includes(eraIndex);

    if (isActive) {
      if (!leafletMap.hasLayer(marker)) {
        marker.addTo(leafletMap);
      }
    } else {
      if (leafletMap.hasLayer(marker)) {
        leafletMap.removeLayer(marker);
      }
    }
  });
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeMap();
});