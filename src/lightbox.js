// Full-screen photo viewer for the gallery: click a tile, arrow keys or swipe
// to move, Esc or click outside to close. Focus is kept inside while open.
import { gsap } from 'gsap'
import { lenis } from './core.js'

export function initLightbox(tiles) {
  if (!tiles.length) return
  const box = document.createElement('div')
  box.className = 'lightbox'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.setAttribute('aria-label', 'Photo viewer')
  box.hidden = true
  box.innerHTML = `
    <button class="lightbox__close" aria-label="Close photo">×</button>
    <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous photo">←</button>
    <figure class="lightbox__fig"><img alt="" /><figcaption></figcaption></figure>
    <button class="lightbox__nav lightbox__nav--next" aria-label="Next photo">→</button>
    <p class="lightbox__count" aria-live="polite"></p>`
  document.body.append(box)

  const img = box.querySelector('img'), cap = box.querySelector('figcaption'), count = box.querySelector('.lightbox__count')
  let index = 0, opener = null

  const show = (i, dir = 0) => {
    index = (i + tiles.length) % tiles.length
    const t = tiles[index], src = t.querySelector('img')
    gsap.to(img, {
      opacity: 0, x: -30 * dir, duration: dir ? 0.2 : 0,
      onComplete: () => {
        img.src = t.dataset.zoom || src.currentSrc || src.src
        img.alt = src.alt
        cap.textContent = t.querySelector('figcaption')?.textContent || src.alt
        count.textContent = `${index + 1} / ${tiles.length}`
        const reveal = () => gsap.fromTo(img, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' })
        img.complete ? reveal() : (img.onload = reveal)
      },
    })
  }

  const open = (i) => {
    opener = document.activeElement
    box.hidden = false
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.4 })
    show(i)
    box.querySelector('.lightbox__close').focus()
  }
  const close = () => {
    gsap.to(box, {
      opacity: 0, duration: 0.3,
      onComplete: () => { box.hidden = true; document.documentElement.style.overflow = ''; lenis?.start(); opener?.focus() },
    })
  }

  tiles.forEach((t, i) => {
    t.tabIndex = 0
    t.setAttribute('role', 'button')
    t.setAttribute('aria-label', `Open photo: ${t.querySelector('img').alt}`)
    t.addEventListener('click', () => open(i))
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i) } })
  })
  box.querySelector('.lightbox__close').addEventListener('click', close)
  box.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(index - 1, -1))
  box.querySelector('.lightbox__nav--next').addEventListener('click', () => show(index + 1, 1))
  box.addEventListener('click', (e) => { if (e.target === box) close() })
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowRight') show(index + 1, 1)
    if (e.key === 'ArrowLeft') show(index - 1, -1)
    if (e.key === 'Tab') {
      const f = [...box.querySelectorAll('button')]
      const i = f.indexOf(document.activeElement)
      e.preventDefault()
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus()
    }
  })
  let sx = 0
  box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX }, { passive: true })
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
  })
}