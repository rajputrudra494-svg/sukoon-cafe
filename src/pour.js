// The Pour — a procedural highball of one of Sukoon's coolers.
// Glass is a lathe, liquid is a sloshing shader, ice is transmissive.
// Nothing here is loaded from a model file; it's all built at runtime.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { gsap } from 'gsap'
import { ribNormalMap, appleTexture, citrusTexture, terrazzoTexture, shadowTexture } from './pour-textures.js'

const BASE_Y = 0.34 // inner floor of the glass
const RIM_Y = 2.77
const innerRadiusAt = (y) => 0.96 + (y - BASE_Y) * (0.115 / (RIM_Y - BASE_Y))

export function createPour(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 3.1, 9.4)
  const lookAt = new THREE.Vector3(0, 1.35, 0)

  // warm "pendant lamp" key + cool rim, like the hall at night
  const key = new THREE.SpotLight(0xffd29a, 60, 20, 0.6, 0.6)
  key.position.set(-3, 7, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x9fc4ff, 1.4)
  rim.position.set(4, 3, -5)
  scene.add(rim)
  scene.add(new THREE.AmbientLight(0xfff1e0, 0.25))

  const drink = new THREE.Group()
  scene.add(drink)

  /* ---------- glass ---------- */
  const profile = [
    [0.001, 0], [0.98, 0], [1.0, 0.03], [1.13, 2.75], [1.11, 2.8],
    [1.075, RIM_Y], [0.96, BASE_Y], [0.001, 0.32],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, side: THREE.DoubleSide,
    depthWrite: false, normalMap: ribNormalMap(), normalScale: new THREE.Vector2(0.9, 0.9),
    specularIntensity: 1, ior: 1.5,
  })
  const glass = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), glassMat)
  glass.renderOrder = 5
  drink.add(glass)

  // the heavy base, the bit that catches the light
  const baseGeo = new THREE.CylinderGeometry(0.97, 0.99, 0.3, 96, 1)
  baseGeo.translate(0, 0.16, 0)
  drink.add(new THREE.Mesh(baseGeo, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 0.6, ior: 1.5, envMapIntensity: 1.6,
  })))

  /* ---------- liquid ---------- */
  const fullLevel = 2.15
  const liquidH = fullLevel - BASE_Y
  const liquidGeo = new THREE.CylinderGeometry(innerRadiusAt(fullLevel) - 0.02, 0.945, liquidH, 96, 1, false)
  liquidGeo.translate(0, liquidH / 2, 0)
  const liquidUniforms = {
    uTop: { value: new THREE.Color('#dbe995') },
    uBottom: { value: new THREE.Color('#8fb532') },
    uH: { value: liquidH },
    uTilt: { value: new THREE.Vector2(0, 0) },
    uTime: { value: 0 },
  }
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: liquidUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: LIQUID_VERT,
    fragmentShader: LIQUID_FRAG,
  })
  const liquid = new THREE.Mesh(liquidGeo, liquidMat)
  liquid.position.y = BASE_Y
  liquid.renderOrder = 2
  drink.add(liquid)

  /* ---------- ice ---------- */
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2fbff, roughness: 0.14, transmission: 1, thickness: 0.55, ior: 1.31,
    envMapIntensity: 1.3, clearcoat: 0.6,
  })
  const ice = []
  const icePlaces = [[-0.35, 0.2, 0.4, 0.3], [0.38, -0.25, 1.4, -0.2], [0.05, 0.45, -0.6, 0.5]]
  icePlaces.forEach(([x, z, ry, rz], i) => {
    const cube = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.58, 0.6, 4, 0.09), iceMat)
    cube.position.set(x, fullLevel - 0.18 - i * 0.12, z)
    cube.rotation.set(rz, ry, rz * 0.5)
    cube.userData = { baseY: cube.position.y, phase: i * 1.7 }
    drink.add(cube)
    ice.push(cube)
  })

  /* ---------- bubbles ---------- */
  const BUBBLES = 90
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.02, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }),
    BUBBLES,
  )
  bubbles.renderOrder = 3
  const bubbleData = Array.from({ length: BUBBLES }, () => ({
    a: Math.random() * Math.PI * 2, r: Math.sqrt(Math.random()) * 0.85,
    y: BASE_Y + Math.random() * liquidH, v: 0.25 + Math.random() * 0.5, s: 0.5 + Math.random(),
  }))
  drink.add(bubbles)

  /* ---------- condensation ---------- */
  const DROPS = 260
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.03, 10, 8),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transparent: true, opacity: 0.5, envMapIntensity: 3, depthWrite: false }),
    DROPS,
  )
  drops.renderOrder = 6
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3()
    for (let i = 0; i < DROPS; i++) {
      const y = 0.25 + Math.pow(Math.random(), 0.8) * 1.85
      const a = Math.random() * Math.PI * 2
      const r = 1.0 + (y / 2.75) * 0.13 + 0.012
      p.set(Math.cos(a) * r, y, Math.sin(a) * r)
      q.setFromEuler(new THREE.Euler(0, -a, 0))
      const k = 0.4 + Math.random() * 0.9
      s.set(0.45 * k, 1.25 * k, k)
      m.compose(p, q, s)
      drops.setMatrixAt(i, m)
    }
  }
  drink.add(drops)

  /* ---------- garnishes ---------- */
  const garnishes = {
    apple: wheel(appleTexture(), '#a4472f', 0.46),
    orange: wheel(citrusTexture('#f39a2b', '#ffd27a'), '#e67c12', 0.5),
    lime: wheel(citrusTexture('#5f9e2a', '#c9e58a'), '#4c8a1f', 0.44),
    flower: blueFlower(),
  }
  garnishes.apple.position.set(0.1, fullLevel + 0.22, 0.15)
  garnishes.apple.rotation.set(-0.32, 0.4, 0.12)
  for (const k of ['orange', 'lime']) {
    garnishes[k].position.set(0.8, 2.6, 0.55)
    garnishes[k].rotation.set(Math.PI / 2, 0, -0.65)
  }
  garnishes.flower.position.set(-0.15, fullLevel + 0.06, 0.2)
  Object.values(garnishes).forEach((g) => { g.visible = false; drink.add(g) })
  garnishes.apple.visible = true
  let currentGarnish = 'apple'

  /* ---------- pour stream ---------- */
  const streamMat = new THREE.MeshBasicMaterial({ color: 0xdbe995, transparent: true, opacity: 0.85 })
  const streamGeo = new THREE.CylinderGeometry(0.055, 0.075, 1, 16, 1, true)
  streamGeo.translate(0, -0.5, 0)
  const stream = new THREE.Mesh(streamGeo, streamMat)
  stream.position.set(0, 6, 0)
  stream.scale.set(1, 0.001, 1)
  stream.renderOrder = 4
  stream.visible = false
  scene.add(stream)

  /* ---------- coaster: terrazzo, like their tables ---------- */
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 0.12, 96),
    [
      new THREE.MeshStandardMaterial({ color: 0xd9d0c2, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ map: terrazzoTexture(), roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: 0xd9d0c2 }),
    ],
  )
  coaster.position.y = -0.065
  scene.add(coaster)
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.002
  scene.add(shadow)

  /* ---------- interaction ---------- */
  let dragging = false, lastX = 0, velocity = 0.0035, spin = 0
  const tilt = new THREE.Vector2(), tiltV = new THREE.Vector2()
  const pointer = new THREE.Vector2()

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    lastX = e.clientX
    canvas.setPointerCapture(e.pointerId)
    canvas.classList.add('is-grabbing')
  })
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect()
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
    if (!dragging) return
    velocity = (e.clientX - lastX) * 0.006
    lastX = e.clientX
  })
  const release = () => { dragging = false; canvas.classList.remove('is-grabbing') }
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)
  canvas.addEventListener('pointerleave', () => pointer.set(0, 0))

  /* ---------- drain + refill ---------- */
  const state = { level: 1, stream: 0 }
  let fizz = 1
  let tl = null

  function applyColours(p) {
    liquidUniforms.uTop.value.set(p.top)
    liquidUniforms.uBottom.value.set(p.bottom)
    streamMat.color.set(p.top)
    fizz = p.fizz
    swapGarnish(p.garnish)
  }

  function setPour(p, instant = false) {
    if (instant) { applyColours(p); return }
    if (tl) tl.kill()
    tl = gsap.timeline()
    tl.to(state, { level: 0.04, duration: 0.55, ease: 'power2.in' })
      .add(() => applyColours(p))
      .to(state, { stream: 1, duration: 0.25, ease: 'power1.out' })
      .to(state, { level: 1, duration: 1.3, ease: 'power2.out' }, '<0.1')
      .to(state, { stream: 0, duration: 0.3, ease: 'power1.in' }, '-=0.35')
      .add(() => { tiltV.x += 0.05 }, '-=0.2')
  }

  function swapGarnish(name) {
    if (name === currentGarnish) return
    const out = garnishes[currentGarnish], inn = garnishes[name]
    gsap.to(out.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.25, onComplete: () => { out.visible = false; out.scale.set(1, 1, 1) } })
    inn.visible = true
    inn.scale.set(0.001, 0.001, 0.001)
    gsap.to(inn.scale, { x: 1, y: 1, z: 1, duration: 0.9, delay: 1.1, ease: 'back.out(2)' })
    currentGarnish = name
  }

  /* ---------- loop ---------- */
  let running = false, raf = 0
  const clock = new THREE.Clock()
  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), qI = new THREE.Quaternion(), sc = new THREE.Vector3()

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.position.z = w / h < 0.8 ? 12.5 : 9.4
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(canvas)
  resize()

  function frame() {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    liquidUniforms.uTime.value = t

    // spin with inertia, settling back to a slow idle turn
    if (!dragging) velocity += (0.0035 - velocity) * 0.025
    spin += velocity
    drink.rotation.y = spin

    // the surface lags the spin and springs back
    tiltV.x += (-velocity * 2.2 - tilt.x) * 0.08
    tiltV.y += (Math.sin(t * 0.7) * 0.01 - tilt.y) * 0.08
    tiltV.multiplyScalar(0.9)
    tilt.add(tiltV)
    liquidUniforms.uTilt.value.copy(tilt)

    const lv = Math.max(state.level, 0.001)
    liquid.scale.y = lv
    liquid.visible = lv > 0.01
    const surface = BASE_Y + liquidH * lv
    ice.forEach((c, i) => {
      const target = Math.min(c.userData.baseY, surface - 0.2 - i * 0.05)
      c.position.y = Math.max(BASE_Y + 0.31 + i * 0.05, target) + Math.sin(t * 1.4 + c.userData.phase) * 0.025
      c.rotation.y += 0.0015
    })
    garnishes.apple.position.y = Math.max(surface + 0.24, BASE_Y + 0.9)
    garnishes.flower.position.y = Math.max(surface + 0.05, BASE_Y + 0.4)
    garnishes.flower.rotation.y += 0.003

    stream.visible = state.stream > 0.01
    stream.scale.y = Math.max(0.001, (6 - surface) * state.stream)

    for (let i = 0; i < BUBBLES; i++) {
      const b = bubbleData[i]
      b.y += b.v * dt * (0.4 + fizz)
      if (b.y > surface - 0.03) { b.y = BASE_Y + 0.02; b.a = Math.random() * Math.PI * 2 }
      const rr = b.r * (innerRadiusAt(b.y) - 0.08)
      v3.set(Math.cos(b.a + b.y) * rr, b.y, Math.sin(b.a + b.y) * rr)
      const s = lv > 0.1 ? b.s * fizz : 0
      sc.set(s, s, s)
      m4.compose(v3, qI, sc)
      bubbles.setMatrixAt(i, m4)
    }
    bubbles.instanceMatrix.needsUpdate = true

    // a little camera breath toward the pointer
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04
    camera.position.y += (3.1 - pointer.y * 0.4 - camera.position.y) * 0.04
    camera.lookAt(lookAt)

    renderer.render(scene, camera)
  }

  return {
    setPour,
    drink,
    start() {
      if (running) return
      running = true
      clock.getDelta()
      frame()
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
  }
}

function wheel(tex, rimColor, radius) {
  const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.03, 64),
    [new THREE.MeshStandardMaterial({ color: rimColor, roughness: 0.6 }), face, face],
  )
  const g = new THREE.Group()
  g.add(mesh)
  return g
}

function blueFlower() {
  const group = new THREE.Group()
  const petal = new THREE.Shape()
  petal.moveTo(0, 0)
  petal.bezierCurveTo(0.12, 0.08, 0.16, 0.3, 0, 0.38)
  petal.bezierCurveTo(-0.16, 0.3, -0.12, 0.08, 0, 0)
  const geo = new THREE.ShapeGeometry(petal, 16)
  const mat = new THREE.MeshStandardMaterial({ color: '#2b3fb8', roughness: 0.5, side: THREE.DoubleSide })
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(geo, mat)
    m.rotation.set(-Math.PI / 2 + 0.25, 0, 0)
    const holder = new THREE.Group()
    holder.rotation.y = (i / 5) * Math.PI * 2
    holder.add(m)
    group.add(holder)
  }
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), new THREE.MeshStandardMaterial({ color: '#f2d36b' }))
  eye.rotation.x = -Math.PI / 2
  eye.position.y = 0.02
  group.add(eye)
  group.scale.setScalar(1.4)
  return group
}

const LIQUID_VERT = /* glsl */ `
  uniform float uH;
  uniform vec2 uTilt;
  uniform float uTime;
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  varying float vCap;
  void main() {
    vec3 p = position;
    float t = p.y / uH;
    // slosh: the surface tilts against the spin, the walls follow linearly
    p.y += (p.x * uTilt.x + p.z * uTilt.y) * t;
    p.y += sin(p.x * 3.0 + uTime * 2.2) * 0.012 * t;
    vY = t;
    vCap = step(0.95, normal.y);
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const LIQUID_FRAG = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying float vY;
  varying vec3 vN;
  varying vec3 vView;
  varying float vCap;
  void main() {
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, vY));
    float fres = pow(1.0 - abs(dot(normalize(vN), vView)), 2.2);
    col = mix(col, col * 0.5, fres * 0.8);
    col += vec3(0.08) * (1.0 - fres);          // light through the core
    col = mix(col, uTop * 1.18 + 0.05, vCap * 0.85); // meniscus
    float a = mix(0.8, 0.95, fres);
    a = mix(a, 0.72, vCap);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`
