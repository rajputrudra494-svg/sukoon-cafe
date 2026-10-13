# Sukoon — Café, Studio & Turf

Marketing site for Sukoon, an all-day pure-vegetarian café on Second VIP Road, Vesu, Surat.
Five static pages built with Vite, GSAP and Lenis, with a three.js "pour" scene on the home page.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home — hero, the pour (3D cooler), reviews rail |
| `menu.html` | The full menu board, driven by `src/menu-data.js` |
| `space.html` | Photo tour of the rooms, terrace and turf |
| `visit.html` | Hours, directions and the reservation form |
| `404.html` | Not found |

## Running it

```bash
npm install
npm run dev      # vite dev server
npm run build    # static output in dist/
npm run preview  # serve the build
```

## How it is put together

- **Shared chrome** lives in `partials/` and is pulled into each page by the `@include` plugin in `vite.config.js`, so the nav, drawer and footer are written once.
- **Canonical URLs, `og:url`, `og:image`, `robots.txt` and `sitemap.xml`** all derive from the `SITE` constant at the top of `vite.config.js`. Change that one line when the domain is final, or set `SITE_URL` in the environment at build time.
- **Reservations** have no backend: `src/reserve.js` validates the form and opens WhatsApp with the booking already written out.
- **The 3D pour** (`src/pour.js`, three.js) is dynamically imported only as its section approaches, and falls back to a photograph if WebGL is unavailable.
- **Images** ship as `-sm`/`-lg` webp pairs in `public/img/`, served through `srcset`. The unoptimised originals are kept in `raw/`.

## Browser support

Tested from 320px to 1920px. Breakpoints at 520px, 800px and 1100px.
