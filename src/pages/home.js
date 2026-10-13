import { boot, gsap, ScrollTrigger, SplitText, $, $$, mm, finePointer, loopTrack } from '../core.js'
import { pours } from '../menu-data.js'

/* ---------------- hero: the arch window opens as you scroll ---------------- */
function heroIntro() {
  const frame = $('.hero__frame')
  // rise the arch up from below, whatever shape this breakpoint gave it
  const frameFrom = getComputedStyle(frame).clipPath.replace(/inset\(\s*[^\s]+/, 'inset(100vh')
  const title = new SplitText('.hero__title > *', { type: 'lines', mask: 'lines', linesClass: 'line' })
  $$('.hero__copy [data-reveal]').forEach((el) => el.removeAttribute('data-reveal'))
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__frame img', { scale: 1.35, duration: 2.2, ease: 'power3.out' }, 0)
    .from(frame, { clipPath: frameFrom, duration: 1.6, ease: 'expo.inOut' }, 0)
    .from(title.lines, { yPercent: 110, duration: 1.4, stagger: 0.12 }, 0.45)
    .from('.hero__copy .eyebrow, .hero__lede, .hero__ctas', { y: 24, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.75)
    .from('.hero__ghost', { opacity: 0, x: -60, duration: 2 }, 0.4)
    .from('.hero__facts li', { y: 20, opacity: 0, duration: 1, stagger: 0.07 }, 0.9)
    .from('.note--hero', { opacity: 0, rotate: -12, y: 10, duration: 1 }, 1.3)
  const arrow = $('.note--hero path')
  if (arrow) {
    const len = arrow.getTotalLength()
    gsap.set(arrow, { strokeDasharray: len, strokeDashoffset: len })
    tl.to(arrow, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 1.5)
  }
}

function heroScroll() {
  mm.add({ desk: '(min-width: 801px)', mob: '(max-width: 800px)' }, (ctx) => {
    gsap.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '+=90%', scrub: 0.6, pin: true, anticipatePin: 1 } })
      .to('.hero__frame', { clipPath: 'inset(0vh 0vw 0vh 0vw round 0vw 0vw 0vw 0vw)', ease: 'none' }, 0)
      .to('.hero__frame img', { scale: 1, ease: 'none' }, 0)
      .to('.hero__copy', { y: ctx.conditions.desk ? -60 : -30, ease: 'none' }, 0)
      .to('.hero__ghost', { xPercent: -12, opacity: 0, ease: 'none' }, 0)
      .to('.note--hero', { opacity: 0, y: -40, ease: 'none' }, 0)
  })
}

/* ---------------- images that drift / unveil ---------------- */
function initImages() {
  // move the whole figure so the photo never slides over its caption
  $$('[data-parallax]').forEach((fig) => {
    gsap.fromTo(fig, { y: 70 }, { y: -70, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } })
  })
  $$('[data-plate]').forEach((plate, i) => {
    const box = $('.plate__img', plate)
    const st = { trigger: plate, start: 'top 88%' }
    gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st })
    gsap.from($('img', box), { scale: 1.3, duration: 1.8, ease: 'expo.out', scrollTrigger: { ...st } })
    gsap.from($('figcaption', plate), { y: 16, opacity: 0, duration: 1, delay: 0.4, ease: 'power3.out', scrollTrigger: { ...st } })
    if (finePointer && i % 2) {
      gsap.to(plate, { y: -40, ease: 'none', scrollTrigger: { trigger: plate, start: 'top bottom', end: 'bottom top', scrub: true } })
    }
  })
  gsap.from('.door', { y: 40, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.doors__grid', start: 'top 85%' } })
}

/* ---------------- the pour (3D, loaded only when it is close) ---------------- */
function initPour() {
  const section = $('[data-pour]')
  if (!section) return
  const list = $('[data-pour-list]'), canvas = $('[data-pour-canvas]')
  const nameEl = $('[data-pour-name]'), noteEl = $('[data-pour-note]'), priceEl = $('[data-pour-price]')
  const polaroid = $('.polaroid'), glow = $('.pour__glow')
  let api = null, current = pours[0]

  list.innerHTML = pours.map((p, i) => `
    <li><button role="option" aria-selected="${i === 0}" data-id="${p.id}">
      <span class="sw" style="background:linear-gradient(160deg, ${p.top}, ${p.bottom})"></span>
      <span>${p.name}</span><small>₹${p.price}</small>
    </button></li>`).join('')
  noteEl.textContent = current.note

  const showInfo = (p) => {
    gsap.timeline()
      .to([nameEl, noteEl, priceEl], { opacity: 0, y: -10, duration: 0.25, stagger: 0.04, ease: 'power2.in' })
      .add(() => { nameEl.textContent = p.name; noteEl.textContent = p.note; priceEl.textContent = p.price })
      .to([nameEl, noteEl, priceEl], { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' })
    const real = p.id === 'nature-chill'
    gsap.to(polaroid, { autoAlpha: real ? 1 : 0, rotate: real ? 4 : 12, duration: 0.6 })
    glow.style.background = `radial-gradient(closest-side, ${p.top}38, ${p.bottom}14 55%, transparent 72%)`
  }

  const select = (btn) => {
    const p = pours.find((x) => x.id === btn.dataset.id)
    if (!p || p === current) return
    current = p
    $$('button', list).forEach((b) => b.setAttribute('aria-selected', String(b === btn)))
    showInfo(p)
    api?.setPour(p)
  }
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(b) })
  list.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const btns = $$('button', list), i = btns.indexOf(document.activeElement)
    const next = btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]
    next.focus()
    select(next)
  })

  const supportsGL = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
  })()
  const fallback = () => { canvas.hidden = true; $('[data-pour-fallback]').hidden = false; $('.note--pour').hidden = true }
  if (!supportsGL) return fallback()

  const bootGL = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return
    bootGL.disconnect()
    try {
      const { createPour } = await import('../pour.js')
      api = createPour(canvas)
    } catch (err) {
      console.warn('3D pour unavailable, showing the photo instead', err)
      return fallback()
    }
    api.setPour(current, true)
    new IntersectionObserver(([en]) => (en.isIntersecting ? api.start() : api.stop())).observe(canvas)
    const arrive = { trigger: section, start: 'top 60%', once: true }
    gsap.fromTo(api.drink.position, { y: -4.5 }, { y: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: arrive })
    gsap.fromTo(api.drink.rotation, { z: 0.35 }, { z: 0, duration: 2, ease: 'elastic.out(1, .5)', scrollTrigger: { ...arrive } })
  }, { rootMargin: '900px 0px' })
  bootGL.observe(section)
}

/* ---------------- reviews: drag the rail ---------------- */
function initRail() {
  const rail = $('[data-rail]'), track = $('[data-rail-track]')
  if (!rail) return
  let x = 0, target = 0, down = false, startX = 0, startT = 0, v = 0, lastX = 0
  const max = () => Math.max(0, track.scrollWidth - rail.clientWidth)
  const clamp = (n) => Math.min(0, Math.max(-max(), n))

  rail.addEventListener('pointerdown', (e) => {
    down = true; startX = lastX = e.clientX; startT = target
    rail.setPointerCapture(e.pointerId)
    rail.classList.add('is-grabbing')
  })
  rail.addEventListener('pointermove', (e) => {
    if (!down) return
    v = e.clientX - lastX; lastX = e.clientX
    target = clamp(startT + (e.clientX - startX) * 1.2)
  })
  const up = () => { if (!down) return; down = false; rail.classList.remove('is-grabbing'); target = clamp(target + v * 14) }
  rail.addEventListener('pointerup', up)
  rail.addEventListener('pointercancel', up)
  // keyboard: arrow keys nudge the cards along
  rail.tabIndex = 0
  rail.setAttribute('aria-label', 'Guest reviews, use arrow keys to scroll')
  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); target = clamp(target - 320) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); target = clamp(target + 320) }
  })

  // drift with page scroll, but only once the rail is well into view
  ScrollTrigger.create({
    trigger: rail, start: 'top 70%', end: 'bottom top',
    onUpdate: (self) => { if (!down) target = clamp(target - self.getVelocity() * 0.01) },
  })
  gsap.ticker.add(() => {
    x += (target - x) * 0.09
    track.style.transform = `translate3d(${x}px,0,0)`
  })
}

boot({
  setup() {
    heroScroll()
    initImages()
    initPour()
    initRail()
    loopTrack($('[data-marquee]'), { speed: 45 })
    loopTrack($('[data-gram]'), { speed: 30, reverse: true })
  },
  intro: heroIntro,
})