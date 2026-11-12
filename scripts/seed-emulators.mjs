// Fills the running emulators with demo content through the API, as the admin would: page heroes,
// the About page, the contacts, the currency rates, the projects with their photos, and the gallery text, sections,
// materials, colors, palettes, collections and works. Every run first empties the Firestore emulator, so the admin
// always starts from the same content. The images are drawn here, so the result is the same on
// every machine and needs no network.
//
//   pnpm emulators:seed [email] [password]
//
// The admin must exist (pnpm emulators:admin); `emulators:seed` creates it first.

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// sharp is a dependency of the backend, which encodes the uploads with it too.
const sharp = createRequire(new URL("../backend/package.json", import.meta.url))("sharp");

const [email = "admin@example.com", password = "admin123"] = process.argv.slice(2);

const { projects: firebaseProjects } = JSON.parse(readFileSync(".firebaserc", "utf8"));
const { emulators } = JSON.parse(readFileSync("firebase.json", "utf8"));
const projectId = firebaseProjects.default;
const apiUrl = `http://127.0.0.1:${emulators.functions.port}/${projectId}/europe-west1/api/api`;
const authUrl = `http://127.0.0.1:${emulators.auth.port}/identitytoolkit.googleapis.com/v1`;
const firestoreDocumentsUrl = `http://127.0.0.1:${emulators.firestore.port}/emulator/v1/projects/${projectId}/databases/(default)/documents`;

// ---------------------------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------------------------

/** A small seeded random generator (mulberry32): the same seed draws the same picture. */
function random(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth direction field made of a few random waves, so neighbouring strokes run together. */
function flowField(next, width, height) {
  const waves = Array.from({ length: 4 }, () => ({
    phaseX: next() * Math.PI * 2,
    phaseY: next() * Math.PI * 2,
    scaleX: (0.5 + next() * 2.5) / width,
    scaleY: (0.5 + next() * 2.5) / height,
    weight: 0.4 + next(),
  }));
  const base = next() * Math.PI;

  return (x, y) =>
    waves.reduce(
      (angle, wave) =>
        angle +
        wave.weight *
          Math.sin(x * wave.scaleX * Math.PI * 2 + wave.phaseX) *
          Math.cos(y * wave.scaleY * Math.PI * 2 + wave.phaseY),
      base,
    );
}

/** How much ink a point gets, 0 to 1: a few soft masses, so the hatching draws forms, not noise. */
function inkDensity(next, width, height) {
  const masses = Array.from({ length: 3 }, () => ({
    radius: (0.18 + next() * 0.25) * Math.min(width, height),
    x: (0.2 + next() * 0.6) * width,
    y: (0.2 + next() * 0.6) * height,
  }));

  return (x, y) =>
    Math.min(
      1,
      masses.reduce(
        (sum, mass) =>
          sum + Math.exp(-((x - mass.x) ** 2 + (y - mass.y) ** 2) / (2 * mass.radius ** 2)),
        0.08,
      ),
    );
}

/** Strokes along the flow field, darker and denser where the ink gathers; a colour per stroke. */
function hatching({ colors, height, next, width }) {
  const angleAt = flowField(next, width, height);
  const inkAt = inkDensity(next, width, height);
  const strokes = [];
  const attempts = Math.round((width * height) / 300);

  for (let index = 0; index < attempts; index += 1) {
    let x = next() * width;
    let y = next() * height;
    const ink = inkAt(x, y);
    if (next() > ink) continue;

    const points = [`M${x.toFixed(1)} ${y.toFixed(1)}`];
    const steps = 6 + Math.floor(next() * 14);

    for (let step = 0; step < steps; step += 1) {
      const angle = angleAt(x, y);
      x += Math.cos(angle) * 9;
      y += Math.sin(angle) * 9;
      points.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    const color = colors[Math.floor(next() * colors.length)];
    strokes.push(
      `<path d="${points.join("")}" stroke="${color}" stroke-opacity="${(0.25 + ink * 0.6).toFixed(2)}" stroke-width="${(0.5 + ink * 1.1).toFixed(2)}"/>`,
    );
  }

  return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${strokes.join("")}</g>`;
}

/** An etching: ink hatching on warm paper, like the hero of the design. */
function etchingSvg({ height, seed, width }) {
  const next = random(seed);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="light" cx="50%" cy="45%" r="80%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.1"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="#ebe6dc"/>
    ${hatching({ colors: ["#1f1d1b"], height, next, width })}
    <rect width="100%" height="100%" fill="url(#light)"/>
  </svg>`;
}

/** A coloured etching: soft washes of the palette under hatching in its deep colours. */
function paintingSvg({ height, palette, seed, width }) {
  const next = random(seed);
  const [paper, deep, ...accents] = palette;
  const washes = accents.map((color) => {
    const radius = (0.2 + next() * 0.3) * Math.min(width, height);

    return `<circle cx="${(next() * width).toFixed(0)}" cy="${(next() * height).toFixed(0)}" r="${radius.toFixed(0)}" fill="${color}" fill-opacity="${(0.35 + next() * 0.3).toFixed(2)}"/>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${(Math.min(width, height) / 10).toFixed(0)}"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="${paper}"/>
    <g filter="url(#soft)">${washes.join("")}</g>
    ${hatching({ colors: [deep, deep, accents.at(-1)], height, next, width })}
  </svg>`;
}

async function toJpeg(svg) {
  return sharp(Buffer.from(svg)).jpeg({ mozjpeg: true, quality: 88 }).toBuffer();
}

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

const palettes = {
  dragonfly: ["#e8f0ee", "#1f3b3a", "#7fb7a8", "#c9e2d6", "#3f7f78"],
  elephant: ["#ece7e1", "#3a3530", "#b9aa98", "#d8cbbb", "#7d6f62"],
  frog: ["#eef0e2", "#2f3a1f", "#a6b86a", "#d9e0a8", "#5f7a35"],
  lion: ["#f4ebdc", "#4a2f17", "#e0a55a", "#f1d29c", "#b4692a"],
  owl: ["#ebe8f0", "#2c2740", "#9b90bf", "#d6d0e6", "#5b4f86"],
  tiger: ["#f6ece4", "#3d1f12", "#e07a3f", "#f3c39b", "#a8492a"],
};

const heroPages = [
  { page: "home", seed: 11 },
  { page: "gallery", seed: 23 },
  { page: "exhibitions", seed: 29 },
  { page: "projects", seed: 37 },
  { page: "about", seed: 41 },
  { page: "contacts", seed: 53 },
];

const aboutText = {
  about:
    "Художник-иллюстратор. Работаю с книжной и журнальной иллюстрацией, рисую животных и " +
    "придуманные миры, соединяя точный рисунок с лёгкой сказочностью.",
  biography:
    "Рисую столько, сколько себя помню: сначала в полях школьных тетрадей, потом в мастерской " +
    "художественной школы.\n\nПосле академии несколько лет работала в издательстве: оформляла " +
    "детские книги, обложки и журнальные развороты.\n\nСейчас работаю самостоятельно и веду " +
    "собственные проекты — серии иллюстраций, которые складываются в книги и выставки.",
  creation:
    "Начинаю с карандаша: десятки набросков, пока не найдётся характер героя. Затем — тушь и " +
    "штриховка, которые дают глубину и фактуру.\n\nЦвет добавляю в конце, акварелью или в " +
    "цифре, оставляя бумаге возможность дышать. Мне важно, чтобы в каждой работе было место " +
    "для истории, которую зритель досочинит сам.",
};

const processPhotos = [
  { alt: "Первые карандашные наброски слона в блокноте", kind: "etching", seed: 101 },
  { alt: "Поиск композиции: три варианта разворота", kind: "etching", seed: 102 },
  { alt: "Штриховка тушью крупным планом", kind: "etching", seed: 103 },
  {
    alt: "Палитра акварели после работы над тигром",
    kind: "painting",
    palette: "tiger",
    seed: 104,
  },
  {
    alt: "Цветовые пробы для серии о стрекозах",
    kind: "painting",
    palette: "dragonfly",
    seed: 105,
  },
  { alt: "Готовый лист на рабочем столе", kind: "painting", palette: "elephant", seed: 106 },
];

const contactLinks = {
  email: "hello@example.com",
  instagram: "https://www.instagram.com/example",
  linkedin: "https://www.linkedin.com/in/example",
  youtube: "https://www.youtube.com/@example",
};

const projectsIntro =
  "Проекты — это длинные истории: серии иллюстраций к книгам, выставкам и журналам. Каждая " +
  "начинается с одного героя и вырастает в целый мир.\n\nЗдесь собраны работы последних лет — " +
  "от первых набросков до напечатанных страниц.";

const galleryIntro =
  "Живопись, графика и постеры разных лет. Работы можно выбрать по разделу и материалу, " +
  "а понравившуюся — купить.";

/** The site lists sections, subsections, materials, colors and palettes by title, so the order here is free. */
const gallerySections = [
  { title: "Живопись", subsections: ["Пейзаж", "Портрет", "Натюрморт"] },
  { title: "Графика", subsections: [] },
  { title: "Постеры", subsections: ["Рекламные", "Социальные", "Театральные"] },
  { title: "Рисунок", subsections: [] },
];

/** The sections the works are in, one after another. */
const workSections = ["Пейзаж", "Графика", "Портрет", "Натюрморт", "Рекламные", "Театральные"];

/** How many units of each currency one US dollar buys. */
const currencyRates = {
  EUR: 0.92,
  GBP: 0.79,
  PLN: 3.65,
  CHF: 0.88,
  CAD: 1.37,
  AUD: 1.52,
  JPY: 150,
  CNY: 7.1,
  RUB: 80,
  BYN: 3.2,
  UAH: 41,
  CZK: 23,
};

const galleryMaterials = ["Акварель", "Гуашь", "Карандаш", "Масло", "Тушь", "Холст", "Бумага"];

/** The materials of the seeded works by title: a painting gets one of the pairs. */
const workPaintingMaterials = [
  ["Масло", "Холст"],
  ["Акварель", "Бумага"],
];
const workEtchingMaterials = ["Тушь", "Бумага"];

/** A black-and-white work gets both «Чёрный» and «Белый»: a color is one swatch. */
const galleryColors = [
  { title: "Синий", hex: "#1f4e9c" },
  { title: "Красный", hex: "#c0392b" },
  { title: "Жёлтый", hex: "#f2c94c" },
  { title: "Зелёный", hex: "#3a7d44" },
  { title: "Чёрный", hex: "#1a1a1a" },
  { title: "Белый", hex: "#ffffff" },
  { title: "Охра", hex: "#c8913a" },
];

/** The colors of the seeded paintings by the palette of their drawing; an etching is black and white. */
const workPaintingColors = {
  dragonfly: ["Синий", "Зелёный"],
  elephant: ["Охра", "Красный"],
  frog: ["Зелёный", "Жёлтый"],
  lion: ["Жёлтый", "Охра"],
  owl: ["Охра", "Чёрный"],
  tiger: ["Охра", "Зелёный"],
};
const workEtchingColors = ["Чёрный", "Белый"];

/** The palettes of the seeded works, one after another; an etching is monochrome. */
const workPaintingPalettes = [
  ["Тёплая", "Яркая"],
  ["Холодная"],
  ["Пастельная", "Тёплая"],
  ["Приглушённая"],
];
const workEtchingPalettes = ["Монохромная"];

/** The coloring of a work as a whole, apart from the colors it has. */
const galleryPalettes = [
  "Пастельная",
  "Яркая",
  "Приглушённая",
  "Тёплая",
  "Холодная",
  "Монохромная",
];

/** The works refer to them by title; «Зима» has no works yet. */
const galleryCollections = [
  { title: "Саванна", palette: "lion", startYear: 2024, endYear: 2025 },
  { title: "У воды", palette: "frog", startYear: 2022, endYear: 2025 },
  { title: "Ночные птицы", palette: "owl", startYear: 2020, endYear: 2024 },
  { title: "Зима", palette: "elephant", startYear: 2025, endYear: null },
];

/** In the order the site shows them; a work without a collection is a work on its own. */
const galleryWorks = [
  {
    title: "Слон на закате",
    palette: "elephant",
    size: [50, 70],
    year: 2025,
    collection: "Саванна",
    country: "PL",
    city: "Варшава",
    price: 1200,
  },
  {
    title: "Тигр в зарослях",
    palette: "tiger",
    size: [60, 80],
    year: 2025,
    collection: "Саванна",
    country: "PL",
    city: "Варшава",
    price: 1500,
    discountPercent: 20,
  },
  { title: "Стрекоза", palette: "dragonfly", size: [21.6, 27.9], year: 2025, collection: "У воды" },
  {
    title: "Лев",
    palette: "lion",
    size: [40, 50],
    year: 2024,
    collection: "Саванна",
    price: 800,
    saleStatus: "sold",
  },
  {
    title: "Лягушка на листе",
    palette: "frog",
    size: [29.7, 42],
    year: 2024,
    collection: "У воды",
  },
  {
    title: "Сова",
    palette: "owl",
    size: [30, 40],
    year: 2024,
    collection: "Ночные птицы",
    // An etching printed from one plate, priced for the whole set.
    format: "set",
    partCount: 30,
    price: 1800,
  },
  { title: "Слонёнок", palette: "elephant", size: [30.5, 40.6], year: 2023 },
  {
    title: "Полосы",
    palette: "tiger",
    size: [100, 70],
    year: 2023,
    format: "diptych",
    price: 2400,
    discountPercent: 15,
    saleStatus: "reserved",
  },
  {
    title: "Пруд",
    palette: "dragonfly",
    size: [70, 50],
    year: 2022,
    collection: "У воды",
    country: "BY",
    city: "Минск",
  },
  {
    title: "Грива",
    palette: "lion",
    size: [61, 76.2],
    year: 2021,
    format: "triptych",
    saleStatus: "notForSale",
  },
  {
    title: "Ночная сова",
    palette: "owl",
    size: [21, 29.7],
    year: 2020,
    collection: "Ночные птицы",
  },
  // A draft the site does not show yet.
  { title: "Болото", palette: "frog", size: [80, 60], year: 2019, price: 950, published: false },
];

const projects = [
  {
    description:
      "Иллюстрации к книге о слонёнке, который ищет дорогу домой через пустыню.\n\nТушь, " +
      "акварель и много тёплого песочного цвета: каждая страница — новый день пути.",
    link: "https://example.com/projects/elephant",
    palette: "elephant",
    photos: [
      "Слонёнок на гребне бархана",
      "Караван на закате",
      "Встреча с мамой у реки",
      "Обложка книги",
    ],
    title: "Слон",
  },
  {
    description:
      "Серия плакатов для выставки о дикой природе Дальнего Востока.\n\nКрупные форматы, " +
      "контрастная штриховка и огненно-оранжевые акценты.",
    link: "https://example.com/projects/tiger",
    palette: "tiger",
    photos: ["Тигр в зимнем лесу", "Портрет тигра крупным планом", "Следы на снегу"],
    title: "Тигр",
  },
  {
    description:
      "Научно-популярная книга для детей о жизни насекомых у воды.\n\nПрозрачные крылья, " +
      "отражения и много воздуха между строк.",
    link: "https://example.com/projects/dragonfly",
    palette: "dragonfly",
    photos: [
      "Стрекоза над кувшинкой",
      "Строение крыла",
      "Утро на озере",
      "Разворот книги",
      "Обложка",
    ],
    title: "Стрекоза",
  },
  {
    description:
      "Иллюстрации к сказке о льве, который боялся темноты.\n\nМягкий золотой свет, ночные " +
      "сцены и много юмора в деталях.",
    link: "https://example.com/projects/lion",
    palette: "lion",
    photos: ["Лев с фонариком", "Ночная саванна", "Утро после страшной ночи"],
    title: "Лев",
  },
  {
    description:
      "Журнальная серия о лесных птицах: двенадцать сов для двенадцати месяцев года.\n\nКаждый " +
      "лист — отдельный характер и своё время года.",
    link: "",
    palette: "owl",
    photos: ["Январская сова в снегу", "Весенняя сова среди почек", "Осенний портрет"],
    title: "Сова",
  },
  {
    description:
      "Обучающие карточки для малышей о том, как головастик становится лягушкой.\n\nЯркая " +
      "зелень, простые формы и крупные понятные образы.",
    link: "https://example.com/projects/frog",
    palette: "frog",
    photos: ["Икринки в пруду", "Головастик", "Лягушонок на листе", "Набор карточек"],
    title: "Лягушка",
  },
];

// ---------------------------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------------------------

class Api {
  #cookie = "";
  #csrfToken = "";

  /** Signs in as the admin, the way the admin panel does: an ID token for a session cookie. */
  async signIn() {
    const response = await fetch(`${authUrl}/accounts:signInWithPassword?key=emulator`, {
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => {
      throw new Error("The Auth emulator is not running: start it with pnpm dev:backend");
    });
    const { error, idToken } = await response.json();

    if (error) {
      throw new Error(`Cannot sign in as ${email}: ${error.message}. Run pnpm emulators:admin`);
    }

    const login = await this.#send("POST", "/auth/login", { json: { idToken } });
    this.#cookie = login.headers
      .getSetCookie()
      .map((cookie) => cookie.split(";")[0])
      .join("; ");

    const { csrfToken } = await (await this.#send("GET", "/auth/csrf")).json();
    this.#csrfToken = csrfToken;
  }

  /** A change that replaces whatever is saved: the seed does not edit, it starts over. */
  async put(path, json) {
    return this.#send("PUT", path, { ifMatch: "*", json });
  }

  /** Creates the resource the client names in `path`, as the admin creates a project. */
  async create(path, json) {
    return this.#send("PUT", path, { ifNoneMatch: "*", json });
  }

  /** Uploads a JPEG and returns the id that the content refers to it by. */
  async upload(name, data) {
    const form = new FormData();
    form.append("file", new Blob([data], { type: "image/jpeg" }), name);

    const { id } = await (await this.#send("POST", "/uploads", { form })).json();
    return id;
  }

  async #send(method, path, { form, ifMatch, ifNoneMatch, json } = {}) {
    const headers = {};

    if (this.#cookie) headers.Cookie = this.#cookie;
    if (method !== "GET" && this.#csrfToken) headers["X-CSRF-Token"] = this.#csrfToken;
    if (ifMatch) headers["If-Match"] = ifMatch;
    if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;
    if (json) headers["Content-Type"] = "application/json";

    const response = await fetch(`${apiUrl}${path}`, {
      body: form ?? (json ? JSON.stringify(json) : undefined),
      headers,
      method,
    }).catch(() => {
      throw new Error("The Functions emulator is not running: start it with pnpm dev:backend");
    });

    if (!response.ok) {
      throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
    }

    return response;
  }
}

// ---------------------------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------------------------

function slug(text) {
  return text.toLowerCase().replaceAll(/[^a-zа-яё0-9]+/g, "-");
}

/** Draws a photo of a list and uploads it: an etching, or a painting in the given palette. */
async function uploadArtwork(api, { kind, name, palette, seed, size = [1600, 1200] }) {
  const [width, height] = size;
  const svg =
    kind === "etching"
      ? etchingSvg({ height, seed, width })
      : paintingSvg({ height, palette: palettes[palette], seed, width });

  return api.upload(`${slug(name)}.jpg`, await toJpeg(svg));
}

async function seedHeroes(api) {
  for (const { page, seed } of heroPages) {
    const uploadId = await uploadArtwork(api, {
      kind: "etching",
      name: `hero-${page}`,
      seed,
      size: [1920, 1080],
    });
    await api.put(`/pages/${page}/hero`, { uploadId });
    console.log(`  hero: ${page}`);
  }
}

async function seedAbout(api) {
  await api.put("/about/text", aboutText);

  const portrait = await uploadArtwork(api, {
    kind: "painting",
    name: "portrait",
    palette: "elephant",
    seed: 61,
    size: [1200, 1500],
  });
  await api.put("/about/photo", { alt: "Художница за работой в мастерской", uploadId: portrait });

  const list = [];
  for (const photo of processPhotos) {
    list.push({
      alt: photo.alt,
      uploadId: await uploadArtwork(api, { ...photo, name: photo.alt }),
    });
  }
  await api.put("/about/process-photos", { processPhotos: list });
  console.log(`  about: texts, photo, ${String(list.length)} process photos`);
}

async function seedContacts(api) {
  await api.put("/contacts/links", contactLinks);

  // Landscape, as the frame of the slideshow; the artist may switch it to the gallery.
  const slides = [
    { alt: "Рабочий стол с красками и кистями", palette: "dragonfly", seed: 71 },
    { alt: "Мастерская у окна", palette: "frog", seed: 72 },
    { alt: "Холсты у стены мастерской", palette: "lion", seed: 73 },
  ];
  const photos = [];
  for (const { alt, palette, seed } of slides) {
    photos.push({
      alt,
      uploadId: await uploadArtwork(api, {
        kind: "painting",
        name: `contacts-${String(seed)}`,
        palette,
        seed,
        size: [1500, 1050],
      }),
    });
  }
  await api.put("/contacts/slideshow", { photos, source: "uploaded" });
  console.log(`  contacts: links, ${String(photos.length)} slideshow photos`);
}

async function seedCurrencies(api) {
  await api.put("/currencies", { rates: currencyRates });

  console.log(`  currencies: ${String(Object.keys(currencyRates).length)} rates`);
}

async function seedProjects(api) {
  await api.put("/projects/intro", { text: projectsIntro });

  // A new project goes to the top of the list, so the last one is created first.
  for (const [index, project] of projects.map((project, index) => [index, project]).reverse()) {
    const photos = [];

    for (const [photoIndex, alt] of project.photos.entries()) {
      const uploadId = await uploadArtwork(api, {
        // The first photo of every project is an etching, the others are in its colours.
        kind: photoIndex === 0 && index % 2 === 1 ? "etching" : "painting",
        name: `${project.title}-${alt}`,
        palette: project.palette,
        seed: 1000 + index * 100 + photoIndex,
      });
      photos.push({ alt, uploadId });
    }

    await api.create(`/projects/${randomUUID()}`, {
      description: project.description,
      link: project.link,
      photos,
      title: project.title,
    });
    console.log(`  project: ${project.title} (${String(photos.length)} photos)`);
  }
}

async function seedGallery(api) {
  await api.put("/gallery/intro", { text: galleryIntro });

  // The ids of the sections and subsections by title, for the works to refer to.
  const sectionIds = new Map();

  for (const section of gallerySections) {
    const id = randomUUID();
    const subsections = section.subsections.map((title) => ({ id: randomUUID(), title }));

    await api.create(`/gallery/sections/${id}`, { title: section.title, subsections });
    sectionIds.set(section.title, id);
    for (const subsection of subsections) sectionIds.set(subsection.title, subsection.id);
  }

  const materials = galleryMaterials.map((title) => ({ id: randomUUID(), title }));
  // The ids of the materials by title, for the works to refer to.
  const materialIds = new Map(materials.map(({ id, title }) => [title, id]));

  await api.put("/gallery/materials", { materials });
  const colors = galleryColors.map((color) => ({ id: randomUUID(), ...color }));
  // The ids of the colors by title, for the works to refer to.
  const colorIds = new Map(colors.map(({ id, title }) => [title, id]));

  await api.put("/gallery/colors", { colors });
  const palettes = galleryPalettes.map((title) => ({ id: randomUUID(), title }));
  // The ids of the palettes by title, for the works to refer to.
  const paletteIds = new Map(palettes.map(({ id, title }) => [title, id]));

  await api.put("/gallery/palettes", { palettes });

  // The ids of the collections by title, for the works to refer to. A collection is created empty:
  // each work names its own when it is created.
  const collectionIds = new Map();

  for (const [index, collection] of galleryCollections.entries()) {
    const id = randomUUID();

    await api.create(`/gallery/collections/${id}`, {
      title: collection.title,
      description: `${collection.title}. Серия работ о животных.`,
      cover: {
        alt: collection.title,
        uploadId: await uploadArtwork(api, {
          kind: "painting",
          name: collection.title,
          palette: collection.palette,
          seed: 4000 + index,
        }),
      },
      startYear: collection.startYear,
      endYear: collection.endYear,
      workIds: [],
    });
    collectionIds.set(collection.title, id);
  }

  for (const [index, work] of galleryWorks.entries()) {
    const [width, height] = work.size;
    const kind = index % 3 === 2 ? "etching" : "painting";
    const uploadId = await uploadArtwork(api, {
      kind,
      name: work.title,
      palette: work.palette,
      seed: 3000 + index,
      // The drawing keeps the proportions of the work: 20 px per centimetre.
      size: [width, height].map((side) => Math.round(side * 20)),
    });

    // Every other work shows how it was made: sketches, then the colours of the work.
    const processPhotos = [];

    if (index % 2 === 0) {
      for (const [photoIndex, alt] of ["Наброски карандашом", "Цветовые пробы"].entries()) {
        processPhotos.push({
          alt,
          uploadId: await uploadArtwork(api, {
            kind: photoIndex === 0 ? "etching" : "painting",
            name: `${work.title}-${alt}`,
            palette: work.palette,
            seed: 3100 + index * 10 + photoIndex,
          }),
        });
      }
    }

    await api.create(`/gallery/works/${randomUUID()}`, {
      title: work.title,
      description: `${work.title}. Работа из серии о животных.`,
      size: { width, height },
      year: work.year,
      // Spread over the year, so works of one year have different months.
      month: (index % 12) + 1,
      photo: { alt: work.title, uploadId },
      processPhotos,
      // A work is in a subsection, or a section without them; some are in a second one too.
      sectionIds: [
        workSections[index % workSections.length],
        ...(index % 4 === 0 ? ["Рисунок"] : []),
      ].map((title) => sectionIds.get(title)),
      // An etching is ink on paper; the paintings alternate oil on canvas and watercolour on paper.
      materialIds: (kind === "etching"
        ? workEtchingMaterials
        : workPaintingMaterials[index % workPaintingMaterials.length]
      ).map((title) => materialIds.get(title)),
      colorIds: (kind === "etching" ? workEtchingColors : workPaintingColors[work.palette]).map(
        (title) => colorIds.get(title),
      ),
      paletteIds: (kind === "etching"
        ? workEtchingPalettes
        : workPaintingPalettes[index % workPaintingPalettes.length]
      ).map((title) => paletteIds.get(title)),
      collectionId: work.collection === undefined ? null : collectionIds.get(work.collection),
      format: work.format ?? "single",
      partCount: work.partCount ?? null,
      country: work.country ?? null,
      city: work.city ?? "",
      published: work.published ?? true,
      saleStatus: work.saleStatus ?? "available",
      price:
        work.price === undefined
          ? null
          : { amount: work.price, currency: "USD", discountPercent: work.discountPercent ?? null },
    });
  }

  console.log(
    `  gallery: text, ${String(gallerySections.length)} sections, ${String(galleryMaterials.length)} materials, ${String(galleryColors.length)} colors, ${String(galleryPalettes.length)} palettes, ${String(galleryCollections.length)} collections, ${String(galleryWorks.length)} works`,
  );
}

/**
 * Empties the Firestore emulator, so content saved in an older shape never stops the API, and
 * nothing of the previous run is left. The files of that run stay in the Storage emulator, which
 * forgets them when it stops.
 */
async function clearFirestore() {
  const response = await fetch(firestoreDocumentsUrl, { method: "DELETE" }).catch(() => {
    throw new Error("The Firestore emulator is not running: start it with pnpm dev:backend");
  });

  if (!response.ok) {
    throw new Error(`Cannot clear the Firestore emulator: ${String(response.status)}`);
  }
}

/**
 * Pauses translating, so seeding does not spend the plan of DeepL on test data. The banner of the
 * admin offers to go on.
 */
async function pauseTranslating() {
  const url = `${firestoreDocumentsUrl.replace("/emulator/v1", "/v1")}/site/translation`;
  const response = await fetch(url, {
    body: JSON.stringify({ fields: { halted: { stringValue: "paused" } } }),
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error(`Cannot pause translating: ${String(response.status)}`);
  }
}

const startedAt = Date.now();
const api = new Api();

await clearFirestore();
await pauseTranslating();

await api.signIn();
console.log(`Seeding ${apiUrl} as ${email}`);
await seedHeroes(api);
await seedAbout(api);
await seedContacts(api);
await seedCurrencies(api);
await seedProjects(api);
await seedGallery(api);
console.log(`Done in ${String(Math.round((Date.now() - startedAt) / 1000))} s`);
