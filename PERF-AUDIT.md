# Аудит скорости portfolio.lednique.ru

Дата: 28.11.2026 · ветка `arena/ab97484e-portfolio-ver2` · стек: Vite 6 + React 19 + framer-motion + matter-js + dotlottie + Godot (iframe)

Все цифры ниже — замеры по реальным файлам репозитория (`du`, `identify`, `gzip`, прод-сборка `vite build`), а не оценки «на глаз».
Готовые замеры «до/после» из экспериментов — в разделе 6.

---

## 1. TL;DR — что даёт больше всего

| # | Приоритет | Что делать | Экономия |
|---|---|---|---|
| 1 | **P0** | Пересобрать `mask-image` героя из 2830×2197 RGBA в чистую альфу | **1.85 МБ → ~12 КБ** |
| 2 | **P0** | Шейдеру нужен только канал `.r` текстур: `height.webp` и `aluminum.jpg` пережать/уменьшить | **1.63 МБ → ~0.21 МБ** |
| 3 | **P0** | `profile_pic_made_with_love_trim.png` (PNG 904×932) → WebP | **776 КБ → ~88 КБ** |
| 4 | **P0** | Убрать гейт `.is-loaded` от события `window.load` (прячет весь герой!) | LCP −1…3 с |
| 5 | **P0** | Code-split: `manualChunks` + `React.lazy` для роутов + ленивый dotlottie | **256 КБ → 178 КБ gz** на входе (−31 %) и без 481 КБ wasm на старте |
| 6 | **P1** | `roll.jpg` 1400×12903 (2.7 МБ) используется как превью карточки на главной | 2.7 МБ → ~150 КБ |
| 7 | **P1** | Godot-игра во `/ar`: iframe грузит 37 МБ wasm + 16 МБ pck при любом скролле | сделать click-to-play |
| 8 | **P1** | Свои шрифты (2 семейства × 4 начертания через Google Fonts, блокирующий CSS) | −1 RTT к стороннему домену, −50…70 КБ |
| 9 | **P2** | `cache: 'no-store'` при загрузке `lang/*.json` и `content/site-data.json` + `?t=Date.now()` | повторные визиты перестают качать 26 КБ и 8 КБ зря |
| 10 | **P2** | Постоянные RAF-циклы шейдера и Matter.js без проверки видимости | −CPU/GPU, лучше INP и батарея |

Итог: первый экран главной сейчас тянет **≈ 5.8 МБ** (без шрифтов) — после P0 это **≈ 0.5 МБ**, т.е. примерно ×10.

---

## 2. Что грузится сейчас на главной (critical path)

| Ресурс | Размер | Зачем |
|---|---|---|
| `assets/figma/_dc/hero/c07ae181aa…webp` | **1855 КБ** | CSS `mask-image` на `.hero__bg` (в первом экране, блокирует отрисовку) |
| `bg/height.webp` | 910 КБ | текстура высот для шейдера, используется **только `.r`** |
| `assets/figma/_dc/stickers_full/profile_pic_made_with_love_trim.png` | 776 КБ | фото-стикер в герое, PNG, без `loading` |
| `bg/aluminum.jpg` | 725 КБ | текстура металла, канал RGB, но выборка грубая |
| `assets/figma/_dc/hero/6b2c4945…webp` | 460 КБ | fallback-фон героя (`<img>`, без `fetchpriority`) |
| `assets/app-Df-m1Y0u.js` | **1085 КБ** (257 КБ gz) | весь сайт одним чанком: Home + Ai + Ar + Design + **Админка** + framer-motion + matter-js + dotlottie |
| `js/dotlottie/dotlottie-player.wasm` | 1196 КБ (481 КБ gz) | плеер Lottie на главной |
| `assets/figma/_dc/branding/45-seconds.lottie` | 1714 КБ | Lottie-анимация (JSON внутри 12.7 МБ) |
| `assets/app-BP8pjJKp.css` | 106 КБ (18.5 КБ gz) | всё CSS разом, включая `admin.css` |
| Google Fonts (2 семейства × 4 начертания) | блокирующий CSS + ~8 woff2 (latin/cyrillic) | внешний домен в критическом пути |
| **Итого первый экран** | **≈ 5.8 МБ** | |

Плюс по сайту: 104 изображения на **28.4 МБ**, 30 файлов тяжелее 300 КБ, видео `assets/vid` — 8.7 МБ, `game/` — 81 МБ, PNG-иконки в `assets/figma` — 3.1 МБ.

---

## 3. P0 — обязательно

### 3.1. Маска героя: 1.85 МБ → ~12 КБ

В `src/styles/v2-core.css` (и в мобильном медиазапросе) файл используется **только как маска**:

```css
.hero__bg{ -webkit-mask-image:url(../../assets/figma/_dc/hero/c07ae181….webp); mask-image:…; }
```

Браузер грузит полноразмерный RGBA-WebP 2830×2197 и берёт из него альфу. Проверено: картинка — это «рваный» прямоугольник с рамкой по краям, т.е. информации там на 10 КБ.

```bash
# альфа 1920px (хватает для 2× на 960px контейнере)
magick in.webp -resize 1920x -alpha extract -quality 80 mask-hero.webp   # 1 855 КБ → 11.7 КБ
# мобильная маска 834×1121
magick mob.webp -resize 900x -alpha extract -quality 80 mask-hero-m.webp # 391 КБ → 7.7 КБ
```

⚠️ После конвертации откройте страницу и сравните край: если в Safari/WebKit рамка начнёт «светиться», добавьте `mask-mode: alpha` (`-webkit-mask-source-type: alpha`). У исходника альфа уже честная, поэтому по умолчанию должно совпасть.

### 3.2. Текстуры шейдера: 1.63 МБ → ~0.21 МБ

В `shader.js`:

```js
float getH(vec2 uv){ return texture2D(u_height,uv).r*u_bgBoost + texture2D(u_paint,uv).r; }
vec3 alu = texture2D(u_aluminum,aUV).rgb;   // сэмплится для яркости/roughness
```

- `height.webp` 2224×1668 → **1024–1800 px, grayscale, q80**: 910 КБ → **55 КБ** (при 1800×1350) / ~19 КБ при 1024×768;
- `aluminum.jpg` 1024×1024 → WebP q80: 725 КБ → **155 КБ** (можно до 512×512 → 37 КБ, металл всё равно размывается через `roughness`).

Плюс сам шейдер рисует при `devicePixelRatio` до 2 — на 4K это дорого; ограничьте `Math.min(devicePixelRatio, 1.5)` для слабых GPU и оставьте 2 для `navigator.hardwareConcurrency > 4`.

### 3.3. Стикер в герое: PNG 776 КБ → WebP 88 КБ

`src/pages/HomePage.jsx`:

```jsx
const STICKERS_PHOTO = './assets/figma/_dc/stickers_full/profile_pic_made_with_love_trim.png';
```

```bash
magick profile_pic_made_with_love_trim.png -resize 760x -quality 82 stickers.webp  # 776 КБ → 87.8 КБ
```

Плюс это элемент первого экрана — ему нужен `fetchpriority="high"`, а не `loading="lazy"` (сейчас нет ни того, ни другого).

### 3.4. Убрать гейт `.is-loaded` от `window.load` — это главный убийца LCP

`src/App.jsx`:

```js
const timer = window.setTimeout(triggerFade, 500);
if (document.readyState === 'complete') triggerFade();
else window.addEventListener('load', triggerFade, { once: true });
```

`window.load` ждёт **все** ресурсы — включая 5.8 МБ картинок, preload видео и wasm. А в CSS:

```css
.hero,.feature--ai{opacity:0}
.is-loaded .hero,.is-loaded .feature--ai{opacity:1}
```

То есть первый экран буквально невидим, пока не докачается всё остальное → LCP = полная загрузка страницы.

**Фикс:** показывать герой после первого кадра React (и не ждать картинок):

```js
useEffect(() => {
  let raf = requestAnimationFrame(() =>
    requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'))
  );
  return () => cancelAnimationFrame(raf);
}, []);
```

Если нужен «плавный» вход — оставьте CSS-transition, но не привязывайте его к `load`. Как страховка от «белого мига» можно добавить `animation: fade .5s ease both` вместо ожидания события.

### 3.5. Code-splitting: 257 КБ → 178 КБ gz на входе

Сейчас один чанк 1.1 МБ с **всей** админкой (`AdminPage.jsx` — 1599 строк) и всеми страницами. В `App.jsx` всё статически:

```js
import { AdminPage } from './pages/AdminPage';
import { AiPage } from './pages/AiPage';
import { ArPage } from './pages/ArPage';
import { DesignPage } from './pages/DesignPage';
```

Предлагается (проверено сборкой, см. раздел 6):

```js
// App.jsx
const AdminPage  = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AiPage     = React.lazy(() => import('./pages/AiPage').then(m => ({ default: m.AiPage })));
const ArPage     = React.lazy(() => import('./pages/ArPage').then(m => ({ default: m.ArPage })));
const DesignPage = React.lazy(() => import('./pages/DesignPage').then(m => ({ default: m.DesignPage })));

<main><React.Suspense fallback={null}>{renderPage()}</React.Suspense></main>
```

```js
// vite.config.js → build.rollupOptions.output
manualChunks(id) {
  if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'vendor-react';
  if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion';
  if (id.includes('matter-js')) return 'vendor-matter';   // нужен только футеру
  if (id.includes('dotlottie')) return 'vendor-lottie';
}
```

И dotlottie — грузить по `IntersectionObserver` у блока «Брендинг» (сейчас `import` статический в `HomePage.jsx`):

```js
const { DotLottie } = await import('@lottiefiles/dotlottie-web');
DotLottie.setWasmUrl(DOTLOTTIE_WASM);
```

Это убирает с первого экрана **481 КБ gz wasm + 1.7 МБ .lottie** и делает их условными.

Дополнительно: `import './styles/admin.css'` в `main.jsx` — вынести в `import('./styles/admin.css')` внутри `AdminPage`, это −18 КБ CSS на всех обычных страницах (сейчас 106 КБ CSS, 18.5 КБ gz — целиком).

---

## 4. P1 — заметно и быстро

### 4.1. `roll.jpg`: 2.7 МБ как превью карточки
`defaultCms.js:55` — `preview: './assets/gfx/roll.jpg'`, картинка **1400×12903** (полный кейс BKA вертикально), показывается в маленькой карточке/лайтбоксе. Сделайте отдельное превью 800–1000 px (WebP q70 ≈ 120–150 КБ), а полноразмер оставьте только для лайтбокса. Аналогично `design-hero.jpg` 883 КБ → WebP 1200 px q65 = **146 КБ**.

### 4.2. Godot-игра на `/ar` = 66 МБ на мобильном трафике
`ArPage.jsx` рендерит `<iframe src="./game/index.html" loading="lazy">`. В `game/index.html`: `fileSizes: { "index.pck": 17 282 464, "index.wasm": 39 514 754 }`. Даже «lazy» iframe стартует, когда секция в 1–2 экрана от вьюпорта, и тянет **54 МБ** (в репо лежат ещё и `.gz`-копии — 27 МБ лишнего в git).

Что делать:
1. Click-to-play: `<img>`-постер + кнопка, iframe подставляется по клику (`src` в state).
2. Проверить, отдаёт ли хостинг `Content-Encoding: gzip` для `.wasm`. GitHub Pages сжимает не всё; если заголовка нет, Godot качает 37 МБ несжатых. Надёжнее — CDN (Cloudflare/Bunny) с Brotli: wasm 37 МБ → ~9 МБ, pck 16.5 МБ → ~6 МБ.
3. `index.html` игры — 167 КБ, тоже кандидат на минификацию/вынос инлайн-скриптов.

### 4.3. Шрифты
`index.html` / `app.html` подключают **блокирующий** CSS с Google Fonts: Montserrat 400/500/600/700 + Roboto Condensed 400/500/600/700.

- Скачать нужные woff2 (latin + cyrillic) в `assets/fonts`, подключить `@font-face` c `font-display: swap`, `unicode-range`;
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` только для 2 начертаний, которые реально на первом экране (Montserrat 400/600);
- Убрать неиспользуемые веса (в CSS 400/500/600/700, но 500 и 700 — точечно; при переходе на 2 веса экономия ~50–70 КБ);
- Итог: нет второго DNS+TLS+RTT к `fonts.googleapis.com`, нет внешней точки отказа.

### 4.4. Кэширование данных CMS и переводов
`src/i18n/I18nContext.jsx` и `src/data/cmsStore.js`:

```js
const res = await fetch(url, { cache: 'no-store' });          // lang/*.json
await fetch(`./content/site-data.json?t=${Date.now()}`, { cache: 'no-store' });
```

`no-store` + `?t=` = **каждый** визит заново качает 26 КБ gz словаря и 8 КБ контента, полностью обходя HTTP-кэш и офлайн-кэш браузера. И `CmsProvider` ждёт этот запрос перед `ready`.

Фикс: обычный `fetch(url)` (+ `cache: 'no-cache'` максимум, чтобы работал ETag) для публичного чтения; `?t=`/`no-store` оставить **только** в админке при явной перезагрузке переводов. Версионирование можно сделать через хэш сборки в имени (`lang/en.<hash>.json`) или заголовок `ETag` — GitHub Pages отдаёт `ETag`/`Last-Modified` сам.

### 4.5. `<img>` без размеров → CLS
Из 29 `<img>` в JSX только у **одного** есть `width`/`height`. У остальных нет ни `width/height`, ни `aspect-ratio` в CSS → layout shift и нестабильный LCP. Правило: либо `width`/`height` (браузер посчитает `aspect-ratio` сам), либо `style={{aspectRatio}}` + `loading="lazy"` для всего ниже первого экрана. Сейчас `loading="lazy"` есть всего у 12 тегов, а у ключевых героев его нет вовсе.

### 4.6. Видео
`assets/vid` — 8.7 МБ, `oscar_frank_web.mp4` 2.6 МБ, `anime3d_web.mp4` 1.3 МБ. `VideoCarousel` предзагружает **2 слайда вперёд** (`PRELOAD_AHEAD = 2`, `preload="auto"`), т.е. на входе во `/ar` — до 2–3 МБ видео. Рекомендации: `PRELOAD_AHEAD = 1`, `preload="metadata"` до активации, WebM/VP9 или AV1 рядом с mp4 (`<source>`), и постеры 400 px WebP (`assets/poster` уже есть — 300 КБ, можно вдвое меньше).

---

## 5. P2 — гигиена и инфраструктура

1. **Дубликаты в репозитории.** `assets/app-2vp-NIce.webp` (1.9 МБ) и `assets/app-Dzo4U_oa.webp` (391 КБ) — побайтовые копии hero-маски и мобильной маски, никем не используются (сгенерированы прошлыми сборками). Удалить: −2.2 МБ. Старые `app-*.js/css` от предыдущих сборок тоже копятся в `assets/` — добавьте в `scripts/sync-build.mjs` очистку по манифесту, а не по regexp.
2. **PNG-иконки 3.1 МБ** (`assets/figma/*.png`): 6 «паков» футера — 1.9 МБ PNG, после WebP ~300 КБ; часть иконок лучше перевести в инлайн-SVG (Menu уже использует SVG).
3. **AI-фото 5.8 МБ**: `ph-14.jpg` 810 КБ / `ph-14` 1344×1800. WebP 1100 px q45 = 354 КБ, AVIF q45 = **313 КБ** (−60 %). Прогнать всю папку скриптом (`sharp`/`vite-plugin-image-optimizer`) на билде, а не руками.
4. **RAF-циклы без проверки видимости.** В `shader.js` нет ни `IntersectionObserver`, ни `visibilitychange` — цикл `requestAnimationFrame` живёт всю сессию, даже когда герой уехал (0 упоминаний в файле). То же у `usePuckPhysics` в `Footer.jsx` (Matter.js, 2 суб-шага на кадр, `positionIterations: 16`). Добавьте паузу при `!isIntersecting` и `document.hidden` — это прямой плюс к INP и батарее на мобильных.
5. **Preload LCP-изображения.** Добавить в `<head>` (после оптимизации!):
   ```html
   <link rel="preload" as="image" href="./assets/figma/_dc/hero/6b2c4945….webp" fetchpriority="high">
   ```
   и `fetchpriority="high"` на сам `<img>`, а не `lazy`.
6. **Кэш-заголовки GitHub Pages.** GH Pages отдаёт `Cache-Control: max-age=600` для **всего**, включая хэшированные `assets/*`, и менять это нельзя. Ставится Cloudflare (бесплатно) впереди: правило `assets/*` → `max-age=31536000, immutable` + Brotli; HTML оставить коротким. Это даёт «мгновенные» повторные визиты и сжатие wasm/JS.
7. **Метаданные.** В `index.html` нет `description`, `og:*`, `twitter:*` — на скорость не влияет, но на превью ссылок и SEO влияет сильно (на GH Pages это единственный «rich snippet»).
8. **Service worker.** Сайт почти статичен; простой SW (precache HTML/CSS/JS/шрифтов, stale-while-revalidate для картинок) даст повторные визиты практически без сети. Careful: обновлять кэш по хэшу сборки.

---

## 6. Что я проверил экспериментально (и откатил)

Собирал проект (`npm ci && npx vite build`), измерил варианты, затем вернул файлы в исходное состояние — в репозитории только этот документ.

**Сборка «как есть»:**

```
dist/assets/app-Df-m1Y0u.js   1 111.01 kB │ gzip: 256.55 kB
dist/assets/app-BP8pjJKp.css    108.80 kB │ gzip:  18.50 kB
(!) Some chunks are larger than 500 kB after minification.
```

**После `manualChunks` + `React.lazy` по роутам:**

```
entry  app-*.js          109.84 kB │ gzip:  38.49 kB
static vendor-react      223.34 kB │ gzip:  69.27 kB
static vendor-motion     129.29 kB │ gzip:  42.50 kB
static footer/matter      85.57 kB │ gzip:  27.51 kB
─────────────────────────────────────────────────
вход                     547.7  kB │ gzip: 177.8 kB   (−51 % raw, −31 % gz)
lazy vendor-lottie       472.06 kB │ gzip:  53.20 kB   (только по IO)
+ 9 ленивых чанков страниц (0.4 – 38 kB)
```

**Ленивый `import('@lottiefiles/dotlottie-web')` по IntersectionObserver** — dotlottie полностью ушёл из начального графа (вход 109.5 КБ), а 1.19 МБ wasm + 1.7 МБ `.lottie` больше не конкурируют с героем.

**Конвертация ассетов (замерено):**

| Файл | Было | Стало | Способ |
|---|---|---|---|
| hero mask 2830×2197 | 1855 КБ | **11.7 КБ** | `-resize 1920x -alpha extract -quality 80` |
| mobile mask 834×1121 | 391 КБ | **7.7 КБ** | `-resize 900x -alpha extract` |
| `height.webp` 2224×1668 | 910 КБ | **55 КБ** | 1800×1350, grayscale, q80 (или 19 КБ при 1024×768) |
| `aluminum.jpg` 1024² | 725 КБ | **155 КБ** | WebP q80 (512² → 37 КБ) |
| sticker PNG 904×932 | 776 КБ | **88 КБ** | WebP 760 px q82 |
| hero fallback 1024×884 | 460 КБ | **221 КБ** | WebP q68 |
| `design-hero.jpg` 1400×736 | 883 КБ | **146 КБ** | WebP 1200 px q65 |
| `ph-14.jpg` 1344×1800 | 810 КБ | **354 КБ** WebP / **313 КБ** AVIF | 1100 px q45 |
| puck PNG ×1 | 212 КБ | **48 КБ** | WebP q82 |

**Итог первого экрана:** ≈ 5.8 МБ → ≈ 0.5 МБ (маска 12 КБ + fallback 221 КБ + текстуры 271 КБ + стикер 88 КБ + JS 178 КБ + CSS 18.5 КБ + шрифты после сабсета).

---

## 7. Порядок внедрения

1. **День 1 (2–3 часа, самый большой эффект):** маска героя, текстуры шейдера, стикер, снятие гейта `.is-loaded`, `fetchpriority`/`preload` для LCP-картинки.
2. **День 2:** code-split (`manualChunks` + `React.lazy` + ленивый dotlottie), `admin.css` — в ленивый чанк.
3. **День 3:** массовая конвертация изображений скриптом + `width/height` у всех `<img>`; `roll.jpg` → отдельное превью.
4. **Итерация 2:** click-to-play для Godot + CDN с Brotli, свои шрифты, кэширование CMS/переводов, пауза RAF-циклов.
5. **Проверка:** Lighthouse mobile + PageSpeed Insights по `https://portfolio.lednique.ru`, ориентиры — LCP < 2.5 с, CLS < 0.1, INP < 200 мс, «передано» на главной < 700 КБ.

*Хотите — реализую шаги 1–2 прямо в этой ветке и покажу diff + новые замеры сборки.*

---

## 8. Внедрено в этой ветке (28.11.2026)

Все пункты ниже уже в коде, сборка `npm run build` проходит, прод-сборка синхронизирована в `index.html` + `assets/`.

| Область | Что сделано | Эффект |
|---|---|---|
| Маска героя | `assets/figma/_dc/hero/hero-mask.webp` (альфа 1920 px), мобильная — `hero-mask-mobile.webp`; CSS переключён | 1855 КБ → **12 КБ**, мобильная 391 → **8 КБ** |
| Текстуры шейдера | `bg/height.webp` 1800×1350 grayscale q80, `bg/aluminum.jpg` q78 | 910 + 725 КБ → **55 + 175 КБ** |
| Стикер героя | `profile_pic_made_with_love_trim.webp` 760 px | 776 → **88 КБ** |
| Фон героя | тот же файл, перепакован q68 + `width/height` + `fetchpriority="high"` + `preload` в `<head>` | 460 → **221 КБ**, LCP известен браузеру заранее |
| Гейт `.is-loaded` | больше не ждёт `window.load` — показ после первого кадра | герой больше не висит на opacity:0 до загрузки всех картинок |
| Code-split | `manualChunks` (react / motion / matter / lottie) + `React.lazy` для `/design`, `/ai`, `/ar`, `/admin` + `Suspense` | вход **257 → 179 КБ gz** (сильно меньше главный чанк, админка больше не в стартовом бандле) |
| Lottie | `import('@lottiefiles/dotlottie-web')` по `IntersectionObserver` (rootMargin 700px) | −472 КБ чанк, −481 КБ gz wasm, −1.7 МБ `.lottie` с первого экрана |
| CSS | `admin.css` подключается только внутри `AdminPage` | 104 → **13.8 КБ** CSS (+18 КБ лишь в админке) |
| Шрифты | self-hosted `@fontsource` (4 начертания × subsets) + `fonts.css`, Google Fonts удалён | нет второго домена в критическом пути, `font-display: swap`, `unicode-range` |
| Godot-игра | click-to-play: iframe монтируется по клику, до него — постер-кнопка с ценой загрузки | `/ar` больше не тянет 54 МБ сам по себе |
| Кэш данных | `site-data.json` и `lang/*.json` читаются обычным `fetch` (ETag), `no-store` остался только для админского «обновить» | повторные визиты не качают 8 + 26 КБ заново |
| RAF-циклы | шейдер: пауза вне вьюпорта и в скрытой вкладке (`IntersectionObserver` + `visibilitychange`); то же для Matter.js в футере | −CPU/GPU, лучше INP и батарея |
| Изображения | конвертированы в WebP: `assets/ai/*` (24 файла), `assets/gfx/*`, `assets/ar/*`, `assets/figma/*` (22 иконки/карточки), `assets/clients/*`, `assets/invitation/*`, крупные `_dc`; исходники удалены после обновления ссылок в `src/` и `content/site-data.json` | `assets/` **45 → 29 МБ** |
| Мусор | удалены 45 файлов старых сборок (`app-*.js/css`, `chunk-*`, дубликаты `app-2vp-NIce.webp`, `app-Dzo4U_oa.webp`) | −3.4 МБ |
| Метаданные | `description`, `og:title/url/description/image`, `twitter:card`, `assets/poster/og-cover.jpg` 1200×630 | нормальные превью в мессенджерах/соцсетях |

Что осознанно **не** делалось в этом PR (нужен отдельный шаг): вынос игры на CDN с Brotli/gzip, service worker, `vite-plugin-image-optimizer` в билде, физическое разбиение `roll.jpg` на тайлы (лимит ImageMagick в песочнице), ресайз `aluminum.jpg` до 512².

Проверка: в jsdom-прогоне прод-бандла рендерятся `/`, `/design`, `/ai`, `/ar`, `/admin`, `/resume`; на `/ar` iframe появляется только после клика; ошибок в консоли нет.
