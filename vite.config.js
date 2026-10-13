import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

// Where the site lives in production. Change this one line when the domain is final;
// canonical links, og:url, og:image, robots.txt and the sitemap all follow from it.
const SITE = (process.env.SITE_URL || 'https://sukoonsurat.com').replace(/\/$/, '')

const PAGES = {
  'index.html': { path: '/', priority: '1.0' },
  'menu.html': { path: '/menu.html', priority: '0.9' },
  'space.html': { path: '/space.html', priority: '0.8' },
  'visit.html': { path: '/visit.html', priority: '0.9' },
}

// Tiny HTML include: <!-- @include top.html --> pulls in partials/top.html.
// Keeps the shared chrome (nav, drawer, footer) in one place across pages.
// Also resolves %SITE% and gives each page its canonical / og:url pair.
const includes = () => ({
  name: 'html-includes',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      const out = html
        .replace(/<!--\s*@include\s+([\w-]+)(?:\.html)?\s*-->/g, (_, name) =>
          readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf-8'))
        .replaceAll('%SITE%', SITE)

      const page = PAGES[basename(ctx.filename)]
      if (!page) return out // 404 stays out of the index
      const url = SITE + page.path
      return out.replace('</head>',
        `  <link rel="canonical" href="${url}" />\n  <meta property="og:url" content="${url}" />\n</head>`)
    },
  },
})

// robots.txt + sitemap.xml, built from the same page list as the HTML inputs.
const seoFiles = () => ({
  name: 'seo-files',
  apply: 'build',
  generateBundle() {
    const today = new Date().toISOString().slice(0, 10)
    const urls = Object.values(PAGES).map((p) =>
      `  <url><loc>${SITE}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`).join('\n')

    this.emitFile({
      type: 'asset', fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    })
    this.emitFile({
      type: 'asset', fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
    })
  },
})

export default defineConfig({
  plugins: [includes(), seoFiles()],
  server: { host: true },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        space: resolve(__dirname, 'space.html'),
        visit: resolve(__dirname, 'visit.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
})
