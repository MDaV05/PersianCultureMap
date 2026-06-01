// ══════════════════════════════════════════
// ERAS DATA
// ══════════════════════════════════════════
const ERAS = [
  { name: "دوره‌ی سامانی", nameEn: "Samanid Era", years: "875 – 1000 CE" },
  { name: "دوره‌ی غزنوی", nameEn: "Ghaznavid Era", years: "1000 – 1150 CE" },
  { name: "دوره‌ی سلجوقی", nameEn: "Seljuk Era", years: "1150 – 1300 CE" },
  { name: "دوره‌ی ایلخانی", nameEn: "Ilkhanate Era", years: "1260 – 1370 CE" },
  { name: "دوره‌ی تیموری", nameEn: "Timurid Era", years: "1370 – 1500 CE" },
  { name: "دوره‌ی صفوی", nameEn: "Safavid Era", years: "1500 – 1736 CE" },
];

// ══════════════════════════════════════════
// CITIES DATA (with lat/lon + full poets)
// ══════════════════════════════════════════
const CITIES = [
  {
    id: "bukhara",
    name: "بخارا",
    nameEn: "Bukhara",
    lat: 39.77, lon: 64.42,
    x: 320, y: 180,
    eras: [0, 1, 2, 3],
    poets: [
      {
        id: "rudaki", name: "رودکی", nameEn: "Rudaki", dates: "858 – 941 CE", emoji: "📜",
        bio: "رودکی سمرقندی، پدر شعر فارسی، نخستین شاعر بزرگ ادبیات کلاسیک فارسی است.",
        works: [
          { name: "بوی جوی مولیان", nameEn: "The Scent of Mulian River", desc: "قصیده‌ای مشهور", lines: ["بوی جوی مولیان آید همی", "یاد یار مهربان آید همی"] }
        ]
      },
      {
        id: "daqiqi", name: "دقیقی", nameEn: "Daqiqi", dates: "935 – 977 CE", emoji: "⚔️",
        bio: "دقیقی بلخی شاعر دربار سامانی بود.",
        works: [
          { name: "آغاز شاهنامه", nameEn: "Beginning of Shahnameh", desc: "هزار بیت", lines: ["چهار چیز است کاندر جهان"] }
        ]
      }
    ]
  },
  {
    id: "tus",
    name: "توس / مشهد",
    nameEn: "Tus / Mashhad",
    lat: 36.27, lon: 59.56,
    x: 380, y: 220,
    eras: [0, 1, 2, 3],
    poets: [
      {
        id: "ferdowsi", name: "فردوسی", nameEn: "Ferdowsi", dates: "940 – 1020 CE", emoji: "🦁",
        bio: "ابوالقاسم فردوسی توسی، حماسه‌سرای بزرگ ایران.",
        works: [
          { name: "شاهنامه", nameEn: "Shahnameh", desc: "بزرگترین حماسه", lines: ["بسی رنج بردم در این سال سی", "عجم زنده کردم بدین پارسی"] }
        ]
      }
    ]
  },
  {
    id: "nishapur",
    name: "نیشابور",
    nameEn: "Nishapur",
    lat: 36.21, lon: 58.79,
    x: 410, y: 260,
    eras: [1, 2, 3],
    poets: [
      {
        id: "khayyam", name: "خیام", nameEn: "Omar Khayyam", dates: "1048 – 1131 CE", emoji: "🌹",
        bio: "عمر خیام نیشابوری، ریاضیدان و شاعر.",
        works: [
          { name: "رباعیات خیام", nameEn: "Rubaiyat", desc: "رباعیات فلسفی", lines: ["می خور که ز دانش و ز فضل و هنر", "در کارگه کوزه‌گری رفتم دوش"] }
        ]
      },
      {
        id: "attar", name: "عطار", nameEn: "Attar", dates: "1145 – 1221 CE", emoji: "🦅",
        bio: "فریدالدین عطار نیشابوری، شاعر و عارف.",
        works: [
          { name: "منطق‌الطیر", nameEn: "Conference of the Birds", desc: "منظومه عرفانی", lines: ["هدهد آمد پیش مرغان سرفراز"] }
        ]
      }
    ]
  },
  {
    id: "shiraz",
    name: "شیراز",
    nameEn: "Shiraz",
    lat: 29.59, lon: 52.58,
    x: 300, y: 400,
    eras: [2, 3, 4, 5],
    poets: [
      {
        id: "saadi", name: "سعدی", nameEn: "Saadi", dates: "1210 – 1292 CE", emoji: "🌺",
        bio: "سعدی شیرازی، استاد سخن.",
        works: [
          { name: "گلستان", nameEn: "Gulistan", desc: "اثر منثور", lines: ["بنی آدم اعضای یک پیکرند"] }
        ]
      },
      {
        id: "hafez", name: "حافظ", nameEn: "Hafez", dates: "1315 – 1390 CE", emoji: "🌙",
        bio: "حافظ شیرازی، لسان‌الغیب.",
        works: [
          { name: "دیوان حافظ", nameEn: "Divan of Hafez", desc: "غزل‌های لطیف", lines: ["الا یا ایها الساقی ادر کاساً و ناولها"] }
        ]
      }
    ]
  },
  {
    id: "balkh",
    name: "بلخ",
    nameEn: "Balkh",
    lat: 36.76, lon: 66.90,
    x: 450, y: 240,
    eras: [2, 3],
    poets: [
      {
        id: "rumi", name: "مولانا", nameEn: "Rumi", dates: "1207 – 1273 CE", emoji: "🌀",
        bio: "مولانا جلال‌الدین بلخی، شاعر عارف.",
        works: [
          { name: "مثنوی معنوی", nameEn: "Masnavi", desc: "شعر عرفانی", lines: ["بشنو این نی چون شکایت می‌کند"] }
        ]
      }
    ]
  },
  {
    id: "samarkand",
    name: "سمرقند",
    nameEn: "Samarkand",
    lat: 39.65, lon: 66.97,
    x: 340, y: 160,
    eras: [0, 1, 4],
    poets: [
      {
        id: "jami", name: "جامی", nameEn: "Jami", dates: "1414 – 1492 CE", emoji: "✨",
        bio: "نورالدین عبدالرحمان جامی، خاتم‌الشعرا.",
        works: [
          { name: "هفت اورنگ", nameEn: "Seven Thrones", desc: "هفت منظومه", lines: ["سخن چون آب زلال است بهل تا جاری شود"] }
        ]
      }
    ]
  },
  {
    id: "isfahan",
    name: "اصفهان",
    nameEn: "Isfahan",
    lat: 32.66, lon: 51.68,
    x: 350, y: 310,
    eras: [5],
    poets: [
      {
        id: "saeb", name: "صائب تبریزی", nameEn: "Saeb Tabrizi", dates: "1601 – 1676 CE", emoji: "🏛️",
        bio: "صائب تبریزی، نماینده سبک هندی.",
        works: [
          { name: "دیوان صائب", nameEn: "Divan of Saeb", desc: "غزل‌های بدیع", lines: ["زندگانی را غنیمت دان"] }
        ]
      }
    ]
  }
];