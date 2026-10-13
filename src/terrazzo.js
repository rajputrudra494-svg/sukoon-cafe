// Terrazzo chips, drawn on a canvas. Used for the 3D coaster and behind the menu card,
// so the two match the actual tabletops at Sukoon.
export function drawTerrazzo(c, { base = '#ece5d8', density = 2.5 } = {}) {
  const g = c.getContext('2d')
  const { width: w, height: h } = c
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  const chips = ['#b9ad9c', '#8f8576', '#c98f6b', '#6d665e', '#d8cfc1', '#a7a08f', '#9a5a3c']
  const count = ((w * h) / 1e6) * 2600 * density
  for (let i = 0; i < count; i++) {
    g.fillStyle = chips[(Math.random() * chips.length) | 0]
    g.globalAlpha = 0.45 + Math.random() * 0.5
    const x = Math.random() * w, y = Math.random() * h
    const r = Math.random() < 0.92 ? 1 + Math.random() * 4 : 5 + Math.random() * 9
    const n = 5 + ((Math.random() * 4) | 0)
    g.beginPath()
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, rr = r * (0.6 + Math.random() * 0.6)
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    }
    g.fill()
  }
  g.globalAlpha = 1
  return c
}
