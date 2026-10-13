import { boot, gsap, $, $$, queueRefresh } from '../core.js'
import { initReserve } from '../reserve.js'

// FAQ: <details> that open and close with a height animation instead of a jump
function initFaq() {
  $$('.qa').forEach((d) => {
    const summary = $('summary', d), body = $('.qa__a', d)
    summary.addEventListener('click', (e) => {
      e.preventDefault()
      if (d.open) {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); queueRefresh() } })
      } else {
        d.open = true
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.55, ease: 'power3.out', onComplete: () => { gsap.set(body, { clearProps: 'all' }); queueRefresh() } })
      }
    })
  })
  gsap.from('.qa', { y: 24, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } })
}

function initMedia() {
  const media = $('.reserve__media img')
  if (media) gsap.fromTo(media, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.reserve', start: 'top bottom', end: 'bottom top', scrub: true } })
  gsap.from('.amenities li', { y: 14, opacity: 0, duration: 0.7, stagger: 0.04, ease: 'power3.out', scrollTrigger: { trigger: '.amenities', start: 'top 90%' } })
  gsap.fromTo('.visit__map', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 4px 4px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 999px 999px 4px 4px)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.visit__map', start: 'top 85%' },
  })
}

initReserve($('[data-reserve]'))
boot({ setup() { initFaq(); initMedia() } })