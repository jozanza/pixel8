import * as easingUtils from 'easing-utils'
import wrap from 'word-wrapper'

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
  rect({
    screen,
    hitmap,
    pw,
    ph,
    px,
    py,
    sw,
    sh,
    x,
    y,
    w,
    h,
    fill,
    radius,
    blend,
    repeat,
    stageRepeat,
    absolute,
  }) {
    // skip totally transparent fills
    // @todo - skip fills where only the alpha channel is 0
    if (uint32IsTransparent(fill)) return
    // calculate coordinates to skip due to border-radius
    // secret bonus: also useful for drawing circles ( ͡° ͜ʖ ͡°)
    const skips = calcBorderRadiusSkips(w, h, radius)
    // console.log(repeat)
    for (let row = 0; row < h; row++) {
      let _y = row + y
      if (absolute) _y += py
      if (repeat) _y = mod(mod(_y, ph) - py, ph) + py
      if (stageRepeat) _y = mod(_y, sh)
      // if (repeat) _y = mod(mod(_y, ph) - py, ph) + py
      if (_y < 0 || _y >= sh) continue // off-screen
      for (let col = 0; col < w; col++) {
        let _x = col + x
        if (absolute) _x += px
        // if (repeat) _x = mod(mod(mod(_x, pw) - px, pw) + px, sw)
        if (repeat) _x = mod(mod(_x, pw) - px, pw) + px
        if (stageRepeat) _x = mod(_x, sw)
        if (_x < 0 || _x >= sw) continue // off-screen
        // if (clip) continue // detect clip via parent id + hitmap? use a Set?
        // skip border-radius coords
        if (skips[row]) {
          const s = skips[row]
          if (col > s[0] || col < s[1]) continue
        }
        // pixel index
        const idx = _y * sw + _x
        // write visible pixels to uint32 array
        screen[idx] =
          (blend && blend(fill, screen[idx])) || uint32IsOpaque(fill)
            ? fill
            : compositeUint32(fill, screen[idx])
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
export const chord = (cache => (a, b) => {
  const key = `${[a, b]}`
  if (key in cache) return cache[key]
  cache[key] = Math.sqrt(Math.pow(a, 2) + -Math.pow(b, 2)) * 2
  return cache[key]
})({})

export const calcBorderRadiusSkips = (cache => (w, h, br) => {
  const key = `${[w, h, br]}`
  if (key in cache) return cache[key]
  let i = br
  const skips = []
  while (i) {
    const val = w + chord(br, i--) / 2 - (br + 1)
    const xs = [val, w - 1 - val]
    skips[br - (i + 1)] = xs
    skips[h - (br - i)] = xs
  }
  cache[key] = skips
  return cache[key]
})({})

export const fromHex = (cache => hex => {
  if (hex in cache) return cache[hex]
  const isBigEndian = false // @todo: endianness detection
  const len = hex.length - 1
  let str = ''
  if (len === 3) {
    for (const x of hex.substr(1)) {
      str = isBigEndian ? '???' : x.repeat(2) + str
    }
  } else {
    for (let i = len - 1; i > 0; i -= 2) {
      if (isBigEndian) {
        // ? -> str = hex[i] + hex[i + 1] + str
      } else {
        str += hex[i] + hex[i + 1]
      }
    }
  }
  str = 'ff' + str.substr(0, 6)
  cache[hex] = parseInt(str, 16)
  return cache[hex]
})({})

export const rgbaStringToUint32 = (cache => rgba => {
  if (rgba in cache) return cache[rgba]
  const [red, green, blue, alpha = 1] = rgba
    .split('(')[1]
    .split(')')[0]
    .split(',')
    .map(Number)
  const a = (alpha * 255) & 0xff
  const b = blue & 0xff
  const g = green & 0xff
  const r = red & 0xff
  cache[rgba] = rgbaToUint32(r, g, b, a)
  return cache[rgba]
})({})

export const mod = (cache => (a, b) => {
  const key = `${[a, b]}`
  if (key in cache) return cache[key]
  cache[key] = (a % b + b) % b
  return cache[key]
})({})

export const modulo = (cache => (a, b) => {
  const key = `${[a, b]}`
  if (key in cache) return cache[key]
  cache[key] = a - Math.floor(a / b) * b
  return cache[key]
})({})

export const rgbaToUint32 = (cache => (r, g, b, a) => {
  const key = `${[r, g, b, a]}`
  if (key in cache) return cache[key]
  const isBigEndian = false // @todo: endianness detection
  cache[key] = isBigEndian
    ? (r << 24) | (g << 16) | (b << 8) | a
    : (a << 24) | (b << 16) | (g << 8) | r
  return cache[key]
})({})

export const uint32ToRGBA = (cache => n => {
  if (n in cache) return cache[n]
  const isBigEndian = false // @todo: endianness detection
  let a, b, g, r
  if (isBigEndian) {
    r = (n >> 24) & 0xff
    g = (n >> 16) & 0xff
    b = (n >> 8) & 0xff
    a = n & 0xff
  } else {
    a = (n >> 24) & 0xff
    b = (n >> 16) & 0xff
    g = (n >> 8) & 0xff
    r = n & 0xff
  }
  cache[n] = [r, g, b, a]
  return cache[n]
})({})

export const uint32IsTransparent = (cache => n => {
  if (n in cache) return cache[n]
  cache[n] = uint32ToRGBA(n)[3] === 0
  return cache[n]
})({})

export const uint32IsOpaque = (cache => n => {
  if (n in cache) return cache[n]
  cache[n] = uint32ToRGBA(n)[3] === 255
  return cache[n]
})({})

export const compositeUint32 = (cache => (_a, _b) => {
  const key = `${_a}|${_b}`
  if (key in cache) return cache[key]
  const a = uint32ToRGBA(_a)
  const aa = a[3] / 255
  if (aa === 1) cache[key] = _a
  else if (aa === 0) cache[key] = _b
  else {
    const b = uint32ToRGBA(_b)
    const ab = b[3] / 255
    const c = [a[0], a[1], a[2], aa + ab * (1 - aa)]
    const ac = c[3] / 255
    for (var i = 0; i <= 2; i++) {
      c[i] = Math.round((a[i] * aa + b[i] * ab * (1 - aa)) / ac) / 255
    }
    c[3] *= 255
    // convert r, g, b, a to uint32
    const val = rgbaToUint32(...c)
    cache[key] = val
  }
  return cache[key]
})({})

export const toUint32 = (cache => x => {
  if (x in cache) return cache[x]
  let val = null
  if (Number.isInteger(x)) val = x
  else if ('string' === typeof x && x[0] === '#') val = fromHex(x)
  else if ('string' === typeof x && x.substring(0, 3) === 'rgb')
    val = rgbaStringToUint32(x)
  if (val === null) throw new Error(`Unsupported format: ${x}`)
  cache[x] = mod(val, Math.pow(2, 32))
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
  draw,
  drawRect,
  drawUint32,
  chord,
  calcBorderRadiusSkips,
  fromHex,
  rgbaStringToUint32,
  toUint32,
  createContext,
  loadImage,
  toImageData,
  loadImageData,
  stringToLines,
  stringToBytes,
  clickToCoords,
}
