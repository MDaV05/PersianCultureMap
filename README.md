# Persian Poetry Map 🗺️

A web app that maps Persian poetry across history. Navigate through 6 classical eras (Samanid to Safavid), explore cities on a custom SVG map, and discover the lives and works of Persian poets.

## ✨ Features

- **Timeline Slider**: Move through 6 historical eras (Samanid → Safavid)
- **Custom SVG Map**: Simplified map of the Greater Persian Cultural Realm with interactive city markers
- **Dynamic City Display**: Cities light up based on the selected era
- **Poet Browser**: Click a city → view its poets → read their biographies
- **Works Collection**: Access famous excerpts and poem lines from major works
- **RTL Layout**: Full Persian (Farsi) support with proper right-to-left formatting
- **No Backend**: Pure client-side HTML/CSS/JavaScript

## 📁 Project Structure

```
PersianCultureMap/
├── index.html          # Main HTML file (imports all modules)
├── styles.css          # All CSS styling (colors, layout, animations)
├── data.js             # JSON data: ERAS and CITIES with poet information
├── map.js              # SVG map initialization and city marker logic
├── ui.js               # Panel system, timeline controls, overlay management
└── README.md           # This file
```

### File Responsibilities

- **index.html**: Barebones HTML structure, links to CSS and JS files. No embedded styles or logic.
- **styles.css**: All visual styling including:
  - Color palette (gold, parchment, ink theme)
  - Header and timeline
  - SVG map container
  - Modal panel styling
  - Poet cards and work tiles
  - Animations (pulse effect, panel transitions)

- **data.js**: Data definitions:
  - `ERAS`: Array of 6 historical periods with names and date ranges
  - `CITIES`: Array of major cities with:
    - City ID, Persian name, English name
    - SVG coordinates (x, y) for positioning
    - Era availability (which eras had poets)
    - Array of poets with bios, works, and poem lines

- **map.js**: Map rendering and interactivity:
  - `initializeMap()`: Creates SVG map container
  - `addSVGDefinitions()`: Adds gradients and filters for city dots
  - `initializeCityMarkers()`: Creates interactive SVG city markers
  - `updateCityMarkers(eraIndex)`: Shows/hides cities based on era
  - City dot styling: glowing animation, hover effects

- **ui.js**: User interface logic:
  - `updateEra(idx)`: Updates timeline and refreshes display
  - `openCity(city)`: Opens city detail panel
  - `openPoet(poet)`: Opens poet detail panel
  - `openWork(work)`: Opens poem/work detail panel
  - `renderPanel()`: Dynamically renders panel content based on view type
  - `setupUI()`: Initializes event listeners and timeline

## 🎨 Data Format

### ERAS

```javascript
{
  name: "دوره‌ی سامانی",      // Persian name
  nameEn: "Samanid Era",       // English name
  years: "875 – 1000 CE"       // Date range
}
```

### CITIES

```javascript
{
  id: "bukhara",
  name: "بخارا",
  nameEn: "Bukhara",
  x: 320,                      // SVG x coordinate
  y: 180,                      // SVG y coordinate
  eras: [0, 1],                // Which eras had poets
  poets: [                     // Array of poets
    {
      id: "rudaki",
      name: "رودکی",
      nameEn: "Rudaki",
      dates: "858 – 941 CE",
      emoji: "📜",
      bio: "...",
      works: [
        {
          name: "بوی جوی مولیان",
          nameEn: "The Scent of Mulian River",
          desc: "...",
          lines: ["poem line 1", "poem line 2", ...]
        }
      ]
    }
  ]
}
```

## 🔄 How It Works

1. **Page Load**:
   - `data.js` loads all era and city data
   - `map.js` creates SVG map with city markers
   - `ui.js` initializes timeline and panel system

2. **Timeline Interaction**:
   - User moves slider → `updateEra()` is called
   - Era badge displays current period
   - `updateCityMarkers()` shows/hides cities for that era

3. **City Click**:
   - `openCity()` adds city to `panelStack`
   - `renderPanel()` displays city info and poets

4. **Navigation**:
   - Poet/Work clicks push to `panelStack` with back button visible
   - Back button pops stack and re-renders previous view
   - Close button clears stack and closes panel

## 🎯 Customization

### Adding a New City

1. Add entry to `CITIES` array in `data.js`
2. Set `x, y` coordinates (SVG viewport is 800×600)
3. Add `eras` array showing which periods had poets
4. Add `poets` array with bios and works

### Styling Changes

- Color palette: Edit CSS variables in `:root` selector in `styles.css`
- Map colors: Edit SVG background and decorative paths in `map.js`
- Typography: Modify font sizes and weights in `styles.css`

### Adding More Eras

1. Add new era to `ERAS` in `data.js`
2. Update `max` value of timeline slider in `index.html` to `ERAS.length - 1`
3. Add poets with updated era indices to relevant cities

## 🚀 Running the App

Simply open `index.html` in any modern web browser. No build process or server needed!

```bash
# Option 1: Direct file open
open index.html

# Option 2: Local server (if behind CORS restrictions)
python -m http.server 8000
# Then visit: http://localhost:8000
```

## 🎨 Design Notes

- **SVG Map**: Uses simplified paths to represent the Persian Cultural Realm boundary
- **Color Scheme**: Gold, parchment, and ink colors inspired by classical Persian manuscripts
- **Animations**: Pulsing city markers and smooth panel transitions
- **Typography**: Vazirmatn font for proper Persian rendering
- **Responsiveness**: Adapts to viewport size while maintaining RTL layout

## 📚 Poetry Data

Features 9 major poets across 7 cities:

- **Rudaki** & **Daqiqi** - Samanid Era (Bukhara)
- **Ferdowsi** - Ghaznavid Era (Tus/Mashhad)
- **Omar Khayyam** & **Attar** - Seljuk Era (Nishapur)
- **Rumi** - Ilkhanate Era (Balkh)
- **Saadi** & **Hafez** - Seljuk/Later Eras (Shiraz)
- **Jami** - Timurid Era (Samarkand)
- **Saeb Tabrizi** - Safavid Era (Isfahan)

Each includes biography, major works, and famous poem excerpts.

## 📝 License

Open source - feel free to modify and extend!
