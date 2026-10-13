import { boot, gsap, $, $$, mm, loopTrack } from '../core.js'
import { initLightbox } from '../lightbox.js'

/* a pinned horizontal walk on desktop, a swipeable row on phones */
function initWalk() {
  const track = $('[data-space-track]')
  if (!track) return
  mm.add('(min-width: 801px)', () => {
    const distance = () => track.scrollWidth - innerWidth
    const walk = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '[data-space]', start: 'top top', end: () => '+=' + distance(), scrub: 0.8, pin: true, invalidateOnRefresh: true, anticipatePin: 1 },
    })
    $$('.frame__img img', track).forEach((img) => {
      gsap.fromTo(img, { xPercent: -6 }, {
        xPercent: 6, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: walk, start: 'left right', end: 'right left', scrub: true },
      })
    })
    $$('.frame figcaption', track).forEach((cap) => {
      gsap.from(cap, { y: 20, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: cap, containerAnimation: walk, start: 'left 85%' } })
    })
  })
}

function initGallery() {
  $$('[data-zoom]').forEach((tile, i) => {
    gsap.fromTo(tile, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, delay: (i % 3) * 0.08, ease: 'expo.inOut',
      scrollTrigger: { trigger: tile, start: 'top 90%' },
    })
  })
  initLightbox($$('[data-zoom]'))
}

function initGather() {
  $$('.gather__img').forEach((box) => {
    gsap.fromTo(box, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 3px 3px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 999px 999px 3px 3px)', duration: 1.5, ease: 'expo.inOut',
      scrollTrigger: { trigger: box, start: 'top 88%' },
    })
  })
}

boot({
  setup() {
    initWalk()
    initGallery()
    initGather()
    loopTrack($('[data-gram]'), { speed: 30, reverse: true })
  },
})