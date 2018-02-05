import * as easingUtils from 'easing-utils'

export const {
  // ImageData polyfill for node
  ImageData = class ImageData {
    constructor(w, h, data) {
      this.width = w
      this.height = h
      this.data = data || new Uint8ClampedArray(new ArrayBuffer(w * h * 4))
    }
  },
} = window

export const {
  // window.perforance pollyfill for node
  performance = {
    now() {
      const time = process.hrtime()
      return time[0] * 1e3 + time[1] / 1e6
    },
  },
} = window

export class Timer {
  static forwards = 1
  static backwards = -1
  static format(t) {
    return (t * 100).toFixed(2) + '%'
  }
  constructor({
    progress = 0,
    duration = 1,
    delay = 0,
    iterations = Infinity,
    reverse = false,
    ease = 'linear',
  } = {}) {
    this.direction = Timer.forwards
    this.iterations = iterations
    this.reverse = reverse
    this.duration = duration
    this.delay = delay
    this.wait = delay
    this.progress = progress
    this.step = 1 / (duration - 1)
    this.ease = ease
  }
  next() {
    if (this.disabled) return
    if (this.wait > 0) this.wait--
    else if (this.direction === Timer.forwards) {
      this.progress += this.step
      if (this.progress >= 1) {
        if (this.reverse) {
          this.direction = Timer.backwards
          this.reset()
          if (this.delay === 0) this.progress -= this.step
          else {
            this.wait--
          }
        } else {
          this.reset()
        }
      }
    } else if (this.direction === Timer.backwards) {
      this.progress -= this.step
      if (this.progress <= 0) {
        if (this.reverse) {
          this.direction = Timer.forwards
          this.reset()
          if (this.delay === 0) this.progress += this.step
          else {
            this.wait--
          }
        } else {
          this.reset()
        }
      }
    }
  }
  on() {
    this.disabled = false
    return this
  }
  off() {
    this.disabled = true
    return this
  }
  reset() {
    this.wait = this.delay
    this.progress = this.direction === Timer.forwards ? 0 : 1
  }
  toString() {
    return Timer.format(this.progress)
  }
  valueOf() {
    const f = easingUtils[this.ease]
    return f ? f(this.progress) : this.progress
  }
  [Symbol.toPrimitive](hint) {
    return hint == 'number' ? this.valueOf() : this.toString()
  }
}

export const requestTimeout = (f, delay) => {
  const start = performance.now()
  const self = {
    value: requestAnimationFrame(function loop() {
      const current = performance.now()
      const delta = current - start
      if (delta >= delay) return f()
      self.value = requestAnimationFrame(loop)
    }),
  }
  return self
}

export const requestInterval = (f, delay) => {
  let start = performance.now()
  const self = {
    value: requestAnimationFrame(function loop() {
      const current = performance.now()
      const delta = current - start
      if (delta >= delay) {
        f()
        start = performance.now()
      }
      self.value = requestAnimationFrame(loop)
    }),
  }
  return self
}

export const clearTimer = ({ value }) => cancelAnimationFrame(value)

export const draw = {
  rect({ screen, hitmap, sw, sh, x, y, w, h, fill, radius }) {
    // skip totally transparent fills
    // @todo - skip fills where only the alpha channel is 0
    if (fill === 0) return
    // calculate coordinates to skip due to border-radius
    // secret bonus: also useful for drawing circles
    const skips = calcBorderRadiusSkips(w, h, radius)
    for (let row = 0; row < h; row++) {
      const _y = row + y
      if (_y < 0 || _y >= sh) continue // off-screen
      for (let col = 0; col < w; col++) {
        const _x = col + x
        if (_x < 0 || _x >= sw) continue // off-screen
        // skip border-radius coords
        if (skips[row]) {
          const s = skips[row]
          if (col > s[0] || col < s[1]) continue
        }
        // pixel index
        const idx = _y * sw + _x
        // write visible pixels to uint32 array
        screen[idx] = fill
        // write id to hitmap
        // hitmap[idx] = id
      }
    }
  },
}

export const drawRect = (
  // pixel8 context
  { hitmap, screen, screenData },
  // input data
  { id, x, y, w, h, fill, radius },
) => {
  const { width, height } = screenData
  // skip transparent fills
  if (fill === 0) return
  // calculate coordinates to skip due to border-radius
  // secret bonus: also useful for drawing circles
  const skips = calcBorderRadiusSkips(w, h, radius)
  for (let row = 0; row < h; row++) {
    const _y = row + y
    if (_y < 0 || _y >= height) continue // off-screen
    for (let col = 0; col < w; col++) {
      const _x = col + x
      if (_x < 0 || _x >= width) continue // off-screen
      // skip border-radius coords
      if (skips[row]) {
        const s = skips[row]
        if (col > s[0] || col < s[1]) continue
      }
      // pixel index
      const idx = _y * width + _x
      // write visible pixels to uint32 array
      screen[idx] = fill
      // write id to hitmap
      hitmap[idx] = id
    }
  }
}

export const drawUint32 = (
  // pixel8 context
  { hitmap, screen, screenData },
  // input data
  { id, x, y, w, h, data },
) => {
  const { width, height } = screenData
  for (let i = 0; i < h; i++) {
    const _y = y + i
    if (_y < 0 || _y >= height) continue
    for (let j = 0; j < w; j++) {
      const _x = x + j
      if (_x < 0 || _x >= width) continue
      // source index
      const idx0 = i * w + j
      // dest index
      const idx1 = _y * width + _x
      // uint32 color
      const color = data[idx0]
      if (color === 0) continue
      screen[idx1] = color
      hitmap[idx1] = id
    }
  }
}

// hypotenuse, side => other side
export const chord = (a, b) => Math.sqrt(Math.pow(a, 2) + -Math.pow(b, 2)) * 2

export const calcBorderRadiusSkips = (w, h, br) => {
  let i = br
  const skips = []
  while (i) {
    const val = w + chord(br, i--) / 2 - (br + 1)
    const xs = [val, w - 1 - val]
    skips[br - (i + 1)] = xs
    skips[h - (br - i)] = xs
  }
  return skips
}

export const fromHex = hex => {
  const len = hex.length - 1
  let str = ''
  if (len === 3) {
    for (const x of hex.substr(1)) {
      // little-endian
      str = x.repeat(2) + str
      // big-endian
      // str += x.repeat(2)
    }
  } else {
    for (let i = len - 1; i > 0; i -= 2) {
      // little-endian
      str += hex[i] + hex[i + 1]
      // big-endian
      // str = hex[i] + hex[i + 1] + str
    }
  }
  str = 'ff' + str.substr(0, 6)
  return parseInt(str, 16)
}

export const fromRGBA = rgba => {
  const [red, green, blue, alpha = 1] = rgba
    .split('(')[1]
    .split(')')[0]
    .split(',')
    .map(Number)
  const a = (alpha * 255) & 0xff
  const b = blue & 0xff
  const g = green & 0xff
  const r = red & 0xff
  return toABGR(r, g, b, a)
}

export const modulo = (a, b) => a - Math.floor(a / b) * b

// for big-endian
export const toRGBA = (r, g, b, a) => (r << 24) | (g << 16) | (b << 8) | a

// for little-endian
export const toABGR = (r, g, b, a) => (a << 24) | (b << 16) | (g << 8) | r

export const toUint32 = (cache => x => {
  if (x in cache) return cache[x]
  let val = null
  if (Number.isInteger(x)) val = x
  else if ('string' === typeof x && x[0] === '#') val = fromHex(x)
  else if ('string' === typeof x && x.substring(0, 3) === 'rgb')
    val = fromRGBA(x)
  if (val === null) throw new Error(`Unsupported format: ${x}`)
  cache[x] = modulo(val, Math.pow(2, 32))
  return cache[x]
})({})

export const createContext = (w, h) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h
  return ctx
}

export const loadImage = path =>
  new Promise((okay, nope) => {
    const img = new Image()
    img.onload = () => okay(img)
    img.onerror = x => nope(x)
    img.src = path
  })

export const toImageData = img => {
  const ctx = createContext(img.width, img.height)
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

export const loadImageData = async path => toImageData(await loadImage(path))

import wrap from 'word-wrapper'
const measureChar = charWidth => (text, start, end, width) => {
  const available = Math.floor(width / charWidth)
  const total = Math.floor((end - start) * charWidth)
  const glyphs = Math.min(end - start, available, total)
  return {
    start,
    end: start + glyphs,
  }
}
export const stringToLines = (text, a, b) => {
  return wrap(text, {
    width: b,
    measure: measureChar(a),
  }).split(/\n/g)
}

export const stringToBytes = (
  text,
  {
    boxWidth,
    boxHeight,
    fill,
    lineHeight,
    yOffset,
    font: { width, height, charmap, data },
  },
) => {
  const color = 'undefined' !== typeof fill ? toUint32(fill) : toUint32('#000')
  const lines = stringToLines(text || '', width, boxWidth)
  // create pixel array
  const bytes = new Uint32Array(boxWidth * boxHeight)
  // iterate lines
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i]
    const y = i * lineHeight + yOffset
    const chars = [...row]
    if (y >= boxHeight) break
    if (y < -height) continue
    // iterate letters
    for (let j = 0; j < chars.length; j++) {
      const char = chars[j]
      const x = (j % boxWidth) * width
      const start = charmap[char] * width * height
      const end = start + width * height
      const pixels = data.slice(start, end)
      let n = 0
      pixels.forEach((px, i) => {
        const eol = i % width === width - 1
        const _y = y + n
        const _x = x + i % width - 1
        bytes[_y * boxWidth + _x] = px ? color : px
        if (eol) n++
      })
    }
  }
  return bytes
}

export const clickToCoords = (e, scale, maxWidth, maxHeight) => {
  const rect = e.target.getBoundingClientRect()
  const scaleX = scale * (rect.width / maxWidth)
  const scaleY = scale * (rect.height / maxHeight)
  const x = Math.floor((e.clientX - rect.left) / scaleX)
  const y = Math.floor((e.clientY - rect.top) / scaleY)
  return { x, y }
}

export default {
  Timer,
  drawRect,
  drawUint32,
  chord,
  calcBorderRadiusSkips,
  fromHex,
  fromRGBA,
  toUint32,
  createContext,
  loadImage,
  toImageData,
  loadImageData,
  stringToLines,
  stringToBytes,
  clickToCoords,
}
