// The interactive menu: kitchen / bar tabs, Jain-chef-spicy filters, and a search
// that highlights matches. Typeset to echo the printed menu (olive rules, Garamond).
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const ICON_CHEF = '<svg viewBox="0 0 20 18" aria-hidden="true"><path d="M5 15h10v2H5zM4.5 13.5C2 13 1 11 1.5 9S4 6 5.5 6.5C6 4 8 2.5 10 2.5S14 4 14.5 6.5C16 6 18 7 18.5 9s-.5 4-3 4.5z"/></svg>'
const ICON_CHILLI = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14 3c1 1 1.5 2 1 3.2C17 8 17 12 13.5 15.5 10 19 4 18.5 3 17.5c3-.5 6-2.5 7.5-5.5 1.2-2.4 1.5-4.3 2.4-5.4C12.5 5 13 4 14 3z"/></svg>'

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function initMenu(root, { kitchen, bar, onChange, scrollTo }) {
  const body = root.querySelector('[data-menu-body]')
  const jump = root.querySelector('[data-jump]')
  const empty = root.querySelector('[data-menu-empty]')
  const tabs = [...root.querySelectorAll('[data-tab]')]
  const ink = root.querySelector('.tabs__ink')
  const filterBtns = [...root.querySelectorAll('[data-filter]')]
  const search = root.querySelector('[data-search]')

  const state = { tab: 'kitchen', filters: new Set(), q: '' }
  const data = { kitchen, bar }

  function itemHTML([name, price, flags = '', desc = ''], hit) {
    const tags = [
      flags.includes('s') ? `<i class="tag tag--s" title="Spicy">${ICON_CHILLI}</i>` : '',
      flags.includes('c') ? `<i class="tag tag--c" title="Chef's special">${ICON_CHEF}</i>` : '',
      flags.includes('j') ? '<i class="tag tag--j" title="Can be made Jain">J</i>' : '',
    ].join('')
    return `<div class="mitem${hit ? ' is-hit' : ''}">
      <span class="mitem__name">${esc(name)}${tags}</span>
      <span class="mitem__price">${price}</span>
      ${desc ? `<span class="mitem__desc">${esc(desc)}</span>` : ''}
    </div>`
  }

  function render(animate = true) {
    const q = state.q.trim().toLowerCase()
    const sections = data[state.tab]
      .map((sec) => {
        const items = sec.items.filter(([name, , flags = '', desc = '']) => {
          for (const f of state.filters) if (!flags.includes(f)) return false
          if (!q) return true
          return (name + ' ' + desc + ' ' + sec.title).toLowerCase().includes(q)
        })
        return { ...sec, items }
      })
      .filter((s) => s.items.length)

    body.classList.toggle('menu__body--bar', state.tab === 'bar')
    body.innerHTML = sections.map((s) => `
      <section class="mcat" id="m-${slug(s.title)}">
        <h3>${esc(s.title)}</h3>
        ${s.items.map((it) => itemHTML(it, q && it[0].toLowerCase().includes(q))).join('')}
      </section>`).join('')
    jump.innerHTML = sections.map((s) => `<a href="#m-${slug(s.title)}">${esc(s.title)}</a>`).join('')
    empty.hidden = sections.length > 0

    if (animate) gsap.from(body.querySelectorAll('.mcat'), { y: 18, opacity: 0, duration: 0.7, stagger: 0.04, ease: 'power3.out' })
    onChange?.()
  }

  jump.addEventListener('click', (e) => {
    const a = e.target.closest('a')
    if (!a) return
    e.preventDefault()
    scrollTo(a.getAttribute('href'))
  })

  function moveInk() {
    const active = tabs.find((t) => t.dataset.tab === state.tab)
    ink.style.width = active.offsetWidth + 'px'
    ink.style.transform = `translateX(${active.offsetLeft}px)`
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    if (state.tab === t.dataset.tab) return
    state.tab = t.dataset.tab
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)))
    // Jain / chef / spicy markings only exist on the kitchen side
    filterBtns.forEach((b) => { b.disabled = state.tab === 'bar'; b.style.opacity = state.tab === 'bar' ? 0.35 : '' })
    if (state.tab === 'bar') { state.filters.clear(); filterBtns.forEach((b) => b.setAttribute('aria-pressed', 'false')) }
    moveInk()
    render()
  }))

  filterBtns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter
    state.filters.has(f) ? state.filters.delete(f) : state.filters.add(f)
    b.setAttribute('aria-pressed', String(state.filters.has(f)))
    render()
  }))

  let t = 0
  search.addEventListener('input', () => {
    clearTimeout(t)
    t = setTimeout(() => {
      state.q = search.value
      // drinks are a common search; hop tabs if the kitchen has no match
      const q = state.q.trim().toLowerCase()
      if (q.length > 2) {
        const has = (list) => list.some((s) => s.items.some(([n, , , d = '']) => (n + d + s.title).toLowerCase().includes(q)))
        const other = state.tab === 'kitchen' ? 'bar' : 'kitchen'
        if (!has(data[state.tab]) && has(data[other])) { tabs.find((x) => x.dataset.tab === other).click(); return }
      }
      render(false)
    }, 120)
  })

  addEventListener('resize', moveInk)
  document.fonts.ready.then(moveInk)
  moveInk()
  render(false)
  ScrollTrigger.refresh()
}
