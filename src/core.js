// Shared by every page: smooth scroll, nav + drawer, page curtain, cursor,
// text reveals and the little things (open/closed status, footer year).
import './style.css'
import './pages.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)
document.documentElement.classList.add('js')

export { gsap, ScrollTrigger, SplitText }
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
export const mm = gsap.matchMedia()
export const page = document.body.dataset.page || 'home'

/* ---------------- smooth scroll ---------------- */
export let lenis = null
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3.2), smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  lenis.stop()
}

export function scrollToTarget(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  const offset = el.matches?.('[data-menu], .menu') ? 0 : -70
  if (lenis) lenis.scrollTo(el, { offset, duration: immediate ? 0 : 1.6, immediate, force: true })
  else el.scrollIntoView({ behavior: immediate || reduced ? 'auto' : 'smooth' })
}

let refreshTimer = 0
export const queueRefresh = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150) }

/* ---------------- storage that never throws ---------------- */
const store = {
  get(k) { try { return sessionStorage.getItem(k) } catch { return null } },
  set(k, v) { try { sessionStorage.setItem(k, v) } catch { /* private mode */ } },
}

/* ---------------- links: same-page hashes scroll, other pages get the curtain ---------------- */
const loader = $('.loader')

function samePage(url) {
  const norm = (p) => p.replace(/index\.html$/, '').replace(/\/$/, '') || '/'
  return url.origin === location.origin && norm(url.pathname) === norm(location.pathname)
}

function initLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]')
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (a.target === '_blank' || a.hasAttribute('download')) return
    const url = new URL(a.getAttribute('href'), location.href)
    if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return

    if (samePage(url)) {
      e.preventDefault()
      closeDrawer()
      if (url.hash.length > 1) { scrollToTarget(url.hash); history.replaceState(null, '', url.hash) }
      else scrollToTarget(document.body)
      return
    }
    e.preventDefault()
    closeDrawer()
    leaveTo(url.href)
  })
}

function leaveTo(href) {
  if (reduced) { location.href = href; return }
  lenis?.stop()
  loader.classList.add('is-quick')
  gsap.set(loader, { display: 'grid', clipPath: 'inset(100% 0% 0% 0%)' })
  gsap.timeline({ onComplete: () => { location.href = href } })
    .to(loader, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' })
    .from('.loader__mark', { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' }, 0.3)
}

// coming back with the browser's back button restores a covered page from bfcache
addEventListener('pageshow', (e) => {
  if (!e.persisted) return
  gsap.set(loader, { display: 'none' })
  lenis?.start()
})

/* ---------------- loader / curtain on arrival ---------------- */
function arrive() {
  const first = !store.get('sk-seen')
  store.set('sk-seen', '1')
  // hard safety net: never leave the page covered
  const failsafe = setTimeout(() => { loader.style.display = 'none'; lenis?.start() }, 7000)
  const finish = () => { clearTimeout(failsafe); lenis?.start(); document.body.classList.remove('is-loading') }

  if (reduced) { loader.style.display = 'none'; finish(); return Promise.resolve() }
  if (!first) return quickReveal().then(finish)
  return fullLoader().then(finish)
}

function quickReveal() {
  loader.classList.add('is-quick')
  return document.fonts.ready.then(() => new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to('.loader__mark', { opacity: 0, y: -20, duration: 0.35, delay: 0.15, ease: 'power2.in' })
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
      .set(loader, { display: 'none' })
  }))
}

function fullLoader() {
  const word = $('.loader__word')
  // split by grapheme so the matras stay attached to their consonants
  const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' })
  word.innerHTML = [...seg.segment(word.textContent)].map((s) => `<span class="ch">${s.segment}</span>`).join('')
  const bar = $('.loader__line span'), count = $('.loader__count')
  const critical = $$('[fetchpriority="high"]')
  const waits = [document.fonts.ready, ...critical.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))]
  const progress = { v: 0 }
  const paint = () => { bar.style.width = progress.v + '%'; count.textContent = String(Math.round(progress.v)).padStart(2, '0') }
  let done = 0

  gsap.to('.loader__word .ch', { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out' })
  waits.forEach((p) => p.then(() => { done++; gsap.to(progress, { v: (done / waits.length) * 100, duration: 0.6, onUpdate: paint }) }))

  const minTime = new Promise((r) => setTimeout(r, 1500))
  const maxTime = new Promise((r) => setTimeout(r, 5000))
  return Promise.race([Promise.all([...waits, minTime]), maxTime]).then(() => new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to(progress, { v: 100, duration: 0.35, onUpdate: paint })
      .to('.loader__inner', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' })
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, '-=0.1')
      .set(loader, { display: 'none' })
  }))
}

/* ---------------- nav ---------------- */
const nav = $('[data-nav]')
const drawer = $('[data-drawer]'), burger = $('[data-burger]')

function initNav() {
  $$(`[data-link="${page}"]`).forEach((a) => a.setAttribute('aria-current', 'page'))
  // pages without a dark hero start with the solid bar
  const darkTop = !!$('.hero, .phero')
  let last = 0
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll()
      nav.classList.toggle('is-solid', !darkTop || y > innerHeight * 0.6)
      if (y > last + 4 && y > innerHeight * 0.8 && !drawer.classList.contains('is-open')) nav.classList.add('is-hidden')
      if (y < last - 4) nav.classList.remove('is-hidden')
      last = y
    },
  })
  nav.classList.toggle('is-solid', !darkTop)

  burger.addEventListener('click', () => (drawer.classList.contains('is-open') ? closeDrawer() : openDrawer()))
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer() })
}

function openDrawer() {
  drawer.classList.add('is-open')
  drawer.setAttribute('aria-hidden', 'false')
  burger.setAttribute('aria-expanded', 'true')
  burger.setAttribute('aria-label', 'Close menu')
  nav.classList.remove('is-hidden')
  nav.classList.add('is-over-drawer')
  lenis?.stop()
  gsap.fromTo('.drawer nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.8, delay: 0.25, ease: 'power3.out' })
}

export function closeDrawer() {
  if (!drawer?.classList.contains('is-open')) return
  drawer.classList.remove('is-open')
  drawer.setAttribute('aria-hidden', 'true')
  burger.setAttribute('aria-expanded', 'false')
  burger.setAttribute('aria-label', 'Open menu')
  nav.classList.remove('is-over-drawer')
  lenis?.start()
}

/* ---------------- open / closed, in Surat time ---------------- */
function initStatus() {
  const els = $$('[data-status]')
  const update = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date())
    const h = +parts.find((p) => p.type === 'hour').value % 24, m = +parts.find((p) => p.type === 'minute').value
    const mins = h * 60 + m
    const open = mins >= 12 * 60 && mins < 23 * 60 + 30
    const soon = open && mins >= 22 * 60 + 45
    const text = open ? (soon ? 'Closing soon · 11:30 PM' : 'Open now · till 11:30 PM') : 'Closed · opens 12 PM'
    els.forEach((el) => {
      el.classList.toggle('is-open', open)
      el.classList.toggle('is-closed', !open)
      el.querySelector('span').textContent = text
    })
  }
  update()
  setInterval(update, 60_000)
}

/* ---------------- text + element reveals ---------------- */
function initSplits() {
  $$('[data-split]').forEach((el) => {
    if (el.closest('.hero, .phero')) return // those animate with their page intro
    const split = new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'line' })
    gsap.from(split.lines, { yPercent: 105, duration: 1.25, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
  })
}

function initReveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
  })
}

function initWordScrub() {
  $$('[data-words]').forEach((el) => {
    const split = new SplitText(el, { type: 'words', wordsClass: 'w' })
    gsap.to(split.words, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: true } })
  })
}

function initCounts() {
  $$('[data-count]').forEach((el) => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0)
    const o = { v: 0 }
    el.textContent = (0).toFixed(dec)
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec) } }),
    })
  })
}

// a horizontal ribbon that loops forever and speeds up with scroll velocity
export function loopTrack(track, { speed = 40, reverse = false } = {}) {
  if (!track) return
  track.innerHTML += track.innerHTML
  ;[...track.children].slice(track.children.length / 2).forEach((n) => n.setAttribute('aria-hidden', 'true'))
  let x = 0, boost = 0
  const dir = reverse ? 1 : -1
  lenis?.on('scroll', (e) => { boost = Math.min(Math.abs(e.velocity) * 0.6, 12) })
  gsap.ticker.add((_, dt) => {
    const half = track.scrollWidth / 2
    if (!half) return
    x += dir * (speed + boost * 30) * (dt / 1000)
    boost *= 0.94
    if (x <= -half) x += half
    if (x > 0) x -= half
    track.style.transform = `translate3d(${x}px,0,0)`
  })
}

/* ---------------- cursor + magnetic buttons ---------------- */
const cursorZones = [['[data-pour-canvas]', 'spin'], ['[data-rail]', 'drag'], ['.plate__img', 'yum'], ['.frame__img', 'look'], ['[data-zoom]', 'open']]

function initCursor() {
  if (!finePointer) return
  const c = $('.cursor'), label = $('.cursor__label')
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my
  addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; c.classList.add('is-on') })
  document.documentElement.addEventListener('pointerleave', () => c.classList.remove('is-on'))
  gsap.ticker.add(() => {
    cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
  })
  // delegated, so it also works for things rendered later
  document.addEventListener('pointerover', (e) => {
    const hit = cursorZones.find(([sel]) => e.target.closest(sel))
    if (hit) { label.textContent = hit[1]; c.classList.add('is-big') } else c.classList.remove('is-big')
  })
}

function initMagnetic() {
  if (!finePointer) return
  $$('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * 0.28)
      yTo((e.clientY - r.top - r.height / 2) * 0.35)
    })
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
  })
  $$('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      gsap.to(el, {
        rotateY: ((e.clientX - r.left) / r.width - 0.5) * 16,
        rotateX: -((e.clientY - r.top) / r.height - 0.5) * 16,
        transformPerspective: 600, duration: 0.5,
      })
    })
    el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1,.5)' }))
  })
}

/* ---------------- inner-page header ---------------- */
function pheroIntro() {
  const hero = $('[data-phero]')
  if (!hero) return
  const title = new SplitText($('.phero__title', hero), { type: 'lines', mask: 'lines', linesClass: 'line' })
  $$('[data-reveal]', hero).forEach((el) => el.removeAttribute('data-reveal'))
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.phero__frame', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 3px 3px)', duration: 1.5, ease: 'expo.inOut' }, 0)
    .from('.phero__frame img', { scale: 1.4, duration: 2 }, 0)
    .from('.crumbs', { y: 16, opacity: 0, duration: 1 }, 0.3)
    .from(title.lines, { yPercent: 110, duration: 1.4, stagger: 0.12 }, 0.35)
    .from('.phero__lede', { y: 20, opacity: 0, duration: 1.1 }, 0.7)
    .from('.phero__ghost', { opacity: 0, x: 80, duration: 2 }, 0.3)
    .from('.phero__index', { opacity: 0, duration: 1 }, 1)
  gsap.to('.phero__frame img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
  gsap.to('.phero__ghost', { xPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
}

function initFooter() {
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear() })
  const word = $('.foot__word')
  if (word) gsap.from(word, { yPercent: 30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'top 35%', scrub: true } })
  $$('.next').forEach((n) => gsap.from($('.next__title', n), { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 80%' } }))
}

/* ---------------- boot ----------------
   Pages call boot({ setup, intro }): `setup` builds scroll-driven bits once fonts
   are in (so line splits measure correctly), `intro` runs as the curtain lifts. */
export function boot({ setup, intro } = {}) {
  document.body.classList.add('is-loading')
  initLinks()
  initNav()
  initStatus()
  initCursor()
  initMagnetic()

  const ready = document.fonts.ready.then(() => {
    setup?.()
    initSplits()
    initWordScrub()
    initReveals()
    initCounts()
    initFooter()
    ScrollTrigger.refresh()
  })

  Promise.all([arrive(), ready]).then(() => {
    pheroIntro()
    intro?.()
    // arriving on visit.html#reserve and the like
    if (location.hash.length > 1) {
      const target = document.querySelector(decodeURIComponent(location.hash))
      if (target) setTimeout(() => scrollToTarget(target), 350)
    }
  })
  addEventListener('load', queueRefresh)
}
