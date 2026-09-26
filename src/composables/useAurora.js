// useAurora — THE SKY ON A FRIEZE (2026-09-26, user ask: "take a good pastel
// color palette from all the -11 quasar tones of our color palette and then
// build a gradient that slowly twists in a pretty loop of random smooth slow
// gradients of those colors transmutating into another. like a
// sunrise-sunset endless thing … apply it onto the friezebar svg inside the
// top header nav bar. make it move smooth to my eyes").
//
// A host mounts this on the element that carries a FriezeBar (or any band
// that spends a `-paint` dial) and gets ONE inline custom property on it,
// `--aurora-paint` by default: a nine-stop `linear-gradient(90deg, …)`
// re-drawn at ≤ 30 fps. The host's own CSS hands that property to the band —
// `.media-tabs__frieze { --frieze-bar-wave-two-paint: var(--aurora-paint,
// none) }` — so the gradient fills the motif through the mask and touches
// nothing else. Unset (before the first frame, script-less, unmounted) the
// dial falls back to `none` and the band draws its flat ink exactly as it
// did before this existed.
//
// THE WHEEL. The palette's -11 tones are Quasar's A100 accents — the light,
// saturated pastel of each hue family. Nine of the families this platform
// has minted carry one (five of them minted for this: `$red-11`,
// `$deep-orange-11`, `$orange-11`, `$yellow-11`, `$lime-11`; the other four
// have older jobs), and in HUE ORDER they close into a wheel:
//
//   red → deep-orange → orange → yellow → lime → teal → cyan → indigo →
//   deep-purple → (red)
//
// Every gradient the sky shows is an ARC of that wheel — three-ish
// neighbouring tones across the width — which is what keeps it a sky and
// not a rainbow: neighbours blend through pastels (orange→yellow, indigo→
// deep-purple→pink), never through the brown a complement pair meets in.
// "Transmutation" is the arc turning round the wheel: warm (sunrise) → lime/
// teal/cyan (day) → indigo/deep-purple (dusk) → red (night's edge) → warm.
// The tokens are read off `:root` at mount (`--red-11` …), with Quasar's own
// hexes as the fallback, so `_tokens.scss` stays the one colour source.
//
// THE MOTION, all of it smooth by construction:
//   colour(x, t) = wheel( φ(t) − s(t)·(x − ½) + b(t)·sin 2πx )
//   · φ, the PHASE, turns the wheel once per `period` seconds and never
//     backwards — its speed wobbles ±40 % on a smooth noise, and φ is that
//     speed's ANALYTIC integral (the noise is a sum of sines), so the phase
//     is a pure function of wall time: no per-frame integration, no drift,
//     and a tab that was hidden for an hour comes back to where the sky
//     would be, like a real one.
//   · s, the SPAN, is the width of the visible arc in tones — `span` at
//     rest, breathing ±30 % on a second noise.
//   · b, the BEND, warps the arc along the strip (|b| < s/2π keeps it
//     monotone) so the bands stretch and squeeze as they drift — the
//     "twist" a 13px strip can actually show. Rotating the gradient's angle
//     cannot: on a 1400×13 box ±10° moves a stop ~2px.
//   The wheel is sampled through a uniform Catmull-Rom spline on the CLOSED
//   ring, so colour velocity is continuous through every pure tone (linear
//   segments would visibly change pace at each node); the eight segments
//   between the nine stops are the browser's own sRGB ramps, ~175px each at
//   1440 wide, well under what the eye reads as a kink. Frames are capped at
//   30 fps because at these speeds a channel moves under one 8-bit step per
//   frame anyway — 60 would paint the same pixels twice.
//
// `prefers-reduced-motion: reduce` paints ONE frame and holds it (the sky
// stands still; it does not vanish), and follows the media query live.
// Cleanup removes the property, so an unmounted host is a flat band again.
//
// It is a composable and not a FriezeBar prop because the vertical family
// (FriezeBarVertical / -B) spends the same kind of dial: any band that wants
// the sky is two lines on its host — mount this, wire the dial.

import { onMounted, onBeforeUnmount, unref } from 'vue'

const TAU = Math.PI * 2

// The wheel, in hue order. [token on :root, Quasar's hex as the fallback].
export const AURORA_WHEEL = [
  ['--red-11', '#ff8a80'],
  ['--deep-orange-11', '#ff9e80'],
  ['--orange-11', '#ffd180'],
  ['--yellow-11', '#ffff8d'],
  ['--lime-11', '#f4ff81'],
  ['--teal-11', '#a7ffeb'],
  ['--cyan-11', '#84ffff'],
  ['--indigo-11', '#8c9eff'],
  ['--deep-purple-11', '#b388ff']
]

function parseHex (value) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(value || '').trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// The wheel as rgb triples: each token read off :root, Quasar's hex when the
// token is missing or not a plain hex.
export function resolveWheel (wheel = AURORA_WHEEL) {
  const root = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement)
    : null
  return wheel.map(([token, fallback]) =>
    parseHex(root && root.getPropertyValue(token)) || parseHex(fallback))
}

// Uniform Catmull-Rom through the closed ring at position u (in tones; any
// real number — the ring wraps). Channels clamped: the spline may overshoot
// a node by a few units where a channel turns sharply.
function sampleWheel (tones, u) {
  const n = tones.length
  const i = Math.floor(u)
  const f = u - i
  const at = (k) => tones[((k % n) + n) % n]
  const p0 = at(i - 1)
  const p1 = at(i)
  const p2 = at(i + 1)
  const p3 = at(i + 2)
  const out = [0, 0, 0]
  for (let c = 0; c < 3; c++) {
    const v = 0.5 * (
      (2 * p1[c]) +
      (-p0[c] + p2[c]) * f +
      (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * f * f +
      (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * f * f * f
    )
    out[c] = Math.max(0, Math.min(255, Math.round(v)))
  }
  return out
}

// A smooth "random" signal in [−1, 1]: three sines at incommensurate
// periods (seconds, each jittered ±15 %) with phases drawn once. `integral`
// is its exact antiderivative, which is what lets the phase be a function
// of wall time instead of a running sum.
function makeNoise (rand, periods) {
  const parts = periods.map(p => ({
    w: TAU / (p * (0.85 + 0.3 * rand())),
    a: TAU * rand()
  }))
  const k = 1 / parts.length
  const noise = (t) => parts.reduce((s, q) => s + Math.sin(q.w * t + q.a), 0) * k
  noise.integral = (t) => parts.reduce((s, q) => s - Math.cos(q.w * t + q.a) / q.w, 0) * k
  return noise
}

// The painter: (wall-time ms) → the gradient string. Seeds drawn here, once
// per mount, so every page load is its own sky.
export function makeAuroraPainter (tones, { period = 240, span = 3, stops = 9, rand = Math.random } = {}) {
  const speedNoise = makeNoise(rand, [67, 101, 149])
  const spanNoise = makeNoise(rand, [83, 127, 173])
  const bendNoise = makeNoise(rand, [59, 113, 191])
  const n = tones.length
  const rate = n / period // tones per second, at rest
  const phi0 = rand() * n // begin anywhere on the wheel
  const born = typeof performance !== 'undefined' ? performance.now() : 0
  return (nowMs) => {
    const t = (nowMs - born) / 1000
    // speed = rate · (1 + 0.4·noise) ∈ [0.6, 1.4]·rate — forward only
    const phi = phi0 + rate * (t + 0.4 * speedNoise.integral(t))
    const s = span * (1 + 0.3 * spanNoise(t))
    const b = (s / TAU) * 0.6 * bendNoise(t)
    const parts = []
    for (let k = 0; k < stops; k++) {
      const x = k / (stops - 1)
      const u = phi - s * (x - 0.5) + b * Math.sin(TAU * x)
      const [r, g, bl] = sampleWheel(tones, u)
      parts.push(`rgb(${r}, ${g}, ${bl}) ${Math.round(x * 1000) / 10}%`)
    }
    return `linear-gradient(90deg, ${parts.join(', ')})`
  }
}

/**
 * Mount the sky on a host element.
 * @param host  a template ref — an element, or a component (its `$el` is used)
 * @param options
 *   property  the inline custom property written on the host (`--aurora-paint`)
 *   period    seconds for one full turn of the wheel (240)
 *   span      tones visible across the width, at rest (3)
 *   stops     colour stops sampled across the width (9)
 *   fps       frame cap (30)
 *   wheel     [[token, fallbackHex], …] in hue order (AURORA_WHEEL)
 */
export function useAurora (host, {
  property = '--aurora-paint',
  period = 240,
  span = 3,
  stops = 9,
  fps = 30,
  wheel = AURORA_WHEEL
} = {}) {
  let el = null
  let raf = 0
  let last = -Infinity
  let media = null
  let painter = null

  // The host may be an element or a component. ⚠ A component's `$el` is NOT
  // always its root element: a template that opens with a comment (FriezeBar
  // does) mounts as a FRAGMENT in dev builds, which keep comments, and `$el`
  // is that comment node — production strips comments and `$el` is the div.
  // Walk forward to the first element node, so both builds land on the band.
  const elementOf = (h) => {
    const v = unref(h)
    if (!v) return null
    let n = v.$el !== undefined ? v.$el : v
    while (n && n.nodeType !== 1) n = n.nextSibling
    return n || null
  }

  const paint = (now) => {
    if (el && painter) el.style.setProperty(property, painter(now))
  }

  const loop = (now) => {
    raf = requestAnimationFrame(loop)
    if (now - last < 1000 / fps) return
    last = now
    paint(now)
  }

  // One frame always; the loop only when motion is welcome.
  const run = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (!el) return
    paint(performance.now())
    if (!(media && media.matches)) raf = requestAnimationFrame(loop)
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    el = elementOf(host)
    if (!el || !(el instanceof Element)) return
    painter = makeAuroraPainter(resolveWheel(wheel), { period, span, stops })
    media = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    if (media && media.addEventListener) media.addEventListener('change', run)
    run()
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    if (media && media.removeEventListener) media.removeEventListener('change', run)
    if (el) el.style.removeProperty(property)
    el = null
    painter = null
  })

  return { property }
}
