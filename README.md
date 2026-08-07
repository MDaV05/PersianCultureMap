# 🗺️ Persian Poetry Map

An interactive exploration of Persian poetry's influence across time and geography.

**Live Site:** [chekameh.xyz](https://chekameh.xyz/)  
**Documentation:** [docs.chekameh.xyz](https://docs.chekameh.xyz/)

## Overview

Persian Poetry Map is an interactive web application that visualizes the historical spread and cultural impact of Persian poetry throughout different eras and regions. Navigate through timelines, explore influential poets and works, and discover the geographical reach of Persian literary heritage.

## Features

- **Interactive Timeline** – Explore Persian poetry across 6 historical periods (Samanid → Safavid)
- **Geographical Visualization** – MapLibre-powered map with era-based borders and city markers
- **Detailed Information** – Learn about poets, works, and historical context
- **Deep Linking** – Share direct links to poets (`?poet=ferdowsi`)
- **Responsive Design** – Optimized for desktop and mobile browsing
- **Persian-First** – Full RTL layout with Vazirmatn and Lalezar typography

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, MapLibre GL, Bootstrap 5 |
| **Backend** | Cloudflare Workers (proxy for AI chat) |
| **Storage** | Cloudflare KV (subscriptions, rate limits) |
| **AI** | OpenRouter API (Ferdows AI assistant) |

## Project Structure

```
├── index.html          # Main entry point
├── styles.css          # Global styles
├── data.js             # Eras, cities, poets, and works data
├── ui.js               # Panel system, timeline, deep linking
├── ferdows-overlay.js  # Ferdows AI disabled-state overlay
├── map/
│   ├── map.js          # MapLibre map initialization & markers
│   └── borders/        # GeoJSON era border files
├── worker/
│   ├── proxy.js        # Cloudflare Worker (AI proxy, rate limiting)
│   └── wrangler.toml   # Worker config (KV namespace)
├── scripts/
│   └── createToken.js  # Subscription token generator
└── assets/             # Fonts, images, icons
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

The app will be available at `http://localhost:8081`.

### Cloudflare Worker Deployment

```bash
# Deploy the worker
npm run deploy:worker
```

**Required environment variables (`.dev.vars`):**

```
WORKER_SECRET=your_worker_secret
OPENROUTER_API_KEY=your_openrouter_key
```

## Data Model

The app uses a static data file (`data.js`) with the following structure:

```js
ERAS = [
  { name: "دوره‌ی سامانی", nameEn: "Samanid Era", years: "875 – 1000 CE" },
  // ...
];

CITIES = [
  {
    id: "shiraz",
    name: "شیراز",
    nameEn: "Shiraz",
    lat: 29.59, lon: 52.58,
    eras: [2, 3],           // Which eras this city is active in
    headerImage: "images/cities/shiraz.jpg",
    poets: [
      {
        id: "hafez",
        name: "حافظ",
        nameEn: "Hafez",
        dates: "1315 – 1390 CE",
        emoji: "🌙",
        bio: "...",
        works: [
          {
            name: "دیوان حافظ",
            nameEn: "Divan of Hafez",
            desc: "...",
            lines: ["...", "..."]
          }
        ]
      }
    ]
  }
];
```

## Security Notes

- **XSS-safe rendering**: All dynamic content is rendered via `textContent` and DOM APIs — no `innerHTML` with user data
- **CORS**: Worker validates `Origin` header against an allowlist
- **Rate limiting**: Free tier limited to 4 requests/day per IP
- **Token validation**: Paid tier uses KV-backed subscription tokens with expiry and message limits
- **Secrets**: Never commit `.dev.vars` or `wrangler.toml` (contains KV namespace IDs)

## License

ISC