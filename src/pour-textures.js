// Canvas-drawn textures for the pour scene. Small, deliberate imperfections
// (wobbly apple edge, random terrazzo chips) keep it from looking CG-clean.
import * as THREE from 'three'
import { drawTerrazzo } from './terrazzo.js'

const makeCanvas = (w, h = w) => Object.assign(document.createElement('canvas'), { width: w, height: h })
const srgb = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t }

export function ribNormalMap() {
  // vertical facets on the lower wall, like the cut tumbler the coolers come in
  const w = 512, h = 256
  const c = makeCanvas(w, h)
  const g = c.getContext('2d')
  const img = g.createImageData(w, h)
  const ribs = 48
  for (let y = 0; y < h; y++) {
    const v = y / h
    const band = v > 0.12 && v < 0.33 ? 1 : 0
    for (let x = 0; x < w; x++) {
      const nx = band * Math.cos((x / w) * ribs * Math.PI * 2) * 0.55
      const i = (y * w + x) * 4
      img.data[i] = (nx * 0.5 + 0.5) * 255
      img.data[i + 1] = 128
      img.data[i + 2] = 255
      img.data[i + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  return t
}

export function appleTexture() {
  const s = 512, m = s / 2
  const c = makeCanvas(s)
  const g = c.getContext('2d')
  g.fillStyle = '#7d2a1c'
  g.beginPath(); g.arc(m, m, m - 2, 0, Math.PI * 2); g.fill()
  const grad = g.createRadialGradient(m, m, 10, m, m, m)
  grad.addColorStop(0, '#f3e6c4'); grad.addColorStop(0.8, '#ead3a0'); grad.addColorStop(0.95, '#c98c56')
  g.fillStyle = grad
  g.beginPath()
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
    const r = m - 16 - Math.sin(a * 7) * 3 - Math.random() * 2
    g.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r)
  }
  g.fill()
  g.strokeStyle = 'rgba(160,110,60,.35)'; g.lineWidth = 3
  g.beginPath(); g.arc(m, m, m * 0.42, 0, Math.PI * 2); g.stroke()
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    g.save(); g.translate(m + Math.cos(a) * 34, m + Math.sin(a) * 34); g.rotate(a)
    g.fillStyle = '#d8bf8f'; g.beginPath(); g.ellipse(0, 0, 30, 12, 0, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#4a2512'; g.beginPath(); g.ellipse(4, 0, 11, 6, 0, 0, Math.PI * 2); g.fill()
    g.restore()
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(150,100,50,${Math.random() * 0.12})`
    g.fillRect(Math.random() * s, Math.random() * s, 2, 2)
  }
  return srgb(c)
}

export function citrusTexture(peel, flesh) {
  const s = 512, m = s / 2
  const c = makeCanvas(s)
  const g = c.getContext('2d')
  g.fillStyle = peel; g.beginPath(); g.arc(m, m, m - 2, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(m, m, m - 18, 0, Math.PI * 2); g.fill()
  const seg = 10
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2 + 0.05, a1 = ((i + 1) / seg) * Math.PI * 2 - 0.05
    const mid = (a0 + a1) / 2
    g.fillStyle = flesh
    g.beginPath(); g.moveTo(m + Math.cos(mid) * 14, m + Math.sin(mid) * 14)
    g.arc(m, m, m - 30, a0, a1); g.closePath(); g.fill()
  }
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`
    const a = Math.random() * Math.PI * 2, r = Math.random() * (m - 32)
    g.fillRect(m + Math.cos(a) * r, m + Math.sin(a) * r, 3, 1.5)
  }
  return srgb(c)
}

export function terrazzoTexture(size = 1024) {
  return srgb(drawTerrazzo(makeCanvas(size)))
}

export function shadowTexture() {
  const s = 256
  const c = makeCanvas(s)
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(s / 2, s / 2, s * 0.18, s / 2, s / 2, s * 0.5)
  grad.addColorStop(0, 'rgba(40,25,10,.38)'); grad.addColorStop(1, 'rgba(40,25,10,0)')
  g.fillStyle = grad; g.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}
