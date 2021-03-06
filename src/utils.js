import UPNG from 'upng-js'
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

export const drawRect = ({
  screen,
  hitmap,
  px,
  py,
  pw,
  ph,
  parentRepeat,
  parentMask,
  sw,
  sh,
  stageRepeat,
  x,
  y,
  w,
  h,
  radius,
  fill,
  fixed,
  blend,
}) => {
  const alpha = (fill >> 24) & 0xff
  const transparent = 0 === alpha
  const opaque = 255 === alpha
  // skip totally transparent fills
  if (transparent) return
  // calculate coordinates to skip due to border-radius
  // secret bonus: also useful for drawing circles ( ͡° ͜ʖ ͡°)
  let skips = radius > 0 ? calcBorderRadiusSkips(w, h, radius) : []
  // console.log(repeat)
  for (let row = 0; row < h; row++) {
    let _y = row + y
    if (!fixed) {
      if (parentMask && (_y < 0 || _y >= ph)) continue
      _y += py
      if (parentRepeat) {
        _y = mod(mod(_y, ph) - py, ph) + py
      }
    } else {
      if (parentMask && (_y < py || _y >= py + ph)) continue
    }
    if (stageRepeat) _y = mod(_y, sh)
    // if (repeat) _y = mod(mod(_y, ph) - py, ph) + py
    if (_y < 0 || _y >= sh) continue // off-screen
    for (let col = 0; col < w; col++) {
      let _x = col + x
      if (!fixed) {
        if (parentMask && (_x < 0 || _x >= pw)) continue
        _x += px
        if (parentRepeat) _x = mod(mod(_x, pw) - px, pw) + px
      } else {
        if (parentMask && (_x < px || _x >= px + pw)) continue
      }
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
      screen[idx] = blend
        ? blend(fill, screen[idx])
        : opaque ? fill : compositeUint32(fill, screen[idx])
      // write id to hitmap
      // hitmap[idx] = id
    }
  }
}

export const drawUint32 = ({
  screen,
  hitmap,
  data,
  px,
  py,
  pw,
  ph,
  parentRepeat,
  parentMask,
  sw,
  sh,
  stageRepeat,
  x,
  y,
  w,
  h,
  fixed,
  blend,
}) => {
  for (let i = 0; i < h; i++) {
    let _y = y + i
    if (!fixed) {
      if (parentMask && (_y < 0 || _y >= ph)) continue
      _y += py
      if (parentRepeat) {
        _y = mod(mod(_y, ph) - py, ph) + py
      }
    } else {
      if (parentMask && (_y < py || _y >= py + ph)) continue
    }
    if (stageRepeat) _y = mod(_y, sh)
    if (_y < 0 || _y >= sh) continue
    for (let j = 0; j < w; j++) {
      let _x = x + j
      if (!fixed) {
        if (parentMask && (_x < 0 || _x >= pw)) continue
        _x += px
        if (parentRepeat) _x = mod(mod(_x, pw) - px, pw) + px
      } else {
        if (parentMask && (_x < px || _x >= px + pw)) continue
      }
      if (stageRepeat) _x = mod(_x, sw)
      if (_x < 0 || _x >= sw) continue
      // source index
      const idx0 = i * w + j
      // dest index
      const idx1 = _y * sw + _x
      // uint32 color
      const c0 = data[idx0]
      const alpha = (c0 >> 24) & 0xff
      const c1 = screen[idx1]
      screen[idx1] = blend
        ? // use given blending function
          blend(c0, c1)
        : // if is opaque or transparent, no need for blending
          255 === alpha
          ? c0
          : 0 === alpha
            ? c1
            : // otherwise, use default compositing func to blend
              compositeUint32(c0, c1)
      // hitmap[idx1] = id
    }
  }
}

export const sprite = _string => {
  const string = Array.isArray(_string) ? _string.join('') : _string
  return {
    palette: (cache => pal => {
      const key = `${JSON.stringify(pal)}|${string}`
      if (cache.hasOwnProperty(key)) return cache[key]
      // support use as normal function call or tagged template
      // trim all whitespace
      let chars = [...string].reduce((a, b) => {
        const c = b.trim()
        return c ? a + b : a
      }, '')
      // map each char to actual uint32 color
      // convert char to int if not in palette
      cache[key] = Uint32Array.from(chars, palette(pal))
      return cache[key]
    })({}),
  }
}

export const palette = palette => x =>
  x in palette ? toUint32(palette[x]) : toCharCode(x)

export const getSubPixels = (pixels, w, h, sx, sy, sw, sh) => {
  const px = new Uint32Array(sw * sh)
  for (let i = 0; i < sh; i++) {
    const y = sy + i
    for (let j = 0; j < sw; j++) {
      const x = sx + j
      px[i * sw + j] = pixels[y * w + x]
    }
  }
  return px
}

// hypotenuse, side => other side
export const chord = (cache => (a, b) => {
  return Math.sqrt(Math.pow(a, 2) + -Math.pow(b, 2)) * 2
  const key = `${[a, b]}`
  if (cache.hasOwnProperty(key)) return cache[key]
  cache[key] = Math.sqrt(Math.pow(a, 2) + -Math.pow(b, 2)) * 2
  return cache[key]
})({})

export const calcBorderRadiusSkips = (cache => (w, h, br) => {
  const key = `${w},${h},${br}`
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

type BoundingRect = {
  x: number,
  y: number,
  w: number,
  h: number,
  repeat: boolean, // repeat child overflow
  mask: boolean, // hide child overflow
  fixed: boolean, // ignore parent relativity
}

export const calcBoundingRect = (elem, parent) => {
  if (elem.fixed) return elem // @todo - don't call if elem is fixed
  let x = elem.x || 0
  let y = elem.y || 0
  x += parent.x
  y += parent.y
  if (parent.repeat) {
    x = mod(mod(x, parent.w) - parent.x, parent.w) + parent.x
    y = mod(mod(y, parent.h) - parent.y, parent.h) + parent.y
  }
  // elem.x = x
  // elem.y = y
  // return elem
  return {
    w: elem.w,
    h: elem.h,
    fixed: elem.fixed,
    mask: elem.mask,
    repeat: elem.repeat,
    x,
    y,
  }
}

export const fromHex = (cache => hex => {
  // if (hex in cache) return cache[hex]
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

export const mod = (a, b) => (a % b + b) % b // a - Math.floor(a / b) * b

// @todo figure out why memoization is slower
// object allocation / property lookup? :/
// export const mmod = ((values, keys) =>
//   function mmod(a, b) {
//     const key = `${a},${b}`
//     if (keys.has(key)) return values[key]
//     keys.add(key)
//     values[key] = (a % b + b) % b
//     return values[key]
//   })({}, new Set())

export const rgbaToUint32 = (cache => (r, g, b, a) => {
  const key = `${r},${g},${b},${a}`
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

export const compositeUint32 = (cache => (_a, _b) => {
  const key = `${_a}|${_b}`
  if (cache.hasOwnProperty(key)) return cache[key]
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
  if (cache.hasOwnProperty(x)) return cache[x]
  let val = null
  if (Number.isInteger(x)) val = x
  else if ('string' === typeof x && x[0] === '#') val = fromHex(x)
  else if ('string' === typeof x && x.substring(0, 3) === 'rgb')
    val = rgbaStringToUint32(x)
  if (val === null) throw new Error(`Unsupported format: ${x}`)
  cache[x] = mod(val, Math.pow(2, 32))
  return cache[x]
})({})

export const toCharCode = (cache => x => {
  if (cache.hasOwnProperty(x)) return cache[x]
  cache[x] = x.charCodeAt(0)
  return cache[x]
})({})

export const dataUriToUint32Array = (cache => uri => {
  if (cache.hasOwnProperty(uri)) return cache[uri]
  const [, type, b64] = uri.match('data:image/(.*);base64,(.*)')
  const { buffer } = Uint8Array.from(atob(b64), toCharCode)
  switch (type) {
    case 'png':
      const [rgba] = UPNG.toRGBA8(UPNG.decode(buffer))
      cache[uri] = new Uint32Array(rgba)
      return cache[uri]
    default:
      throw new Error(`type ${type} is not supported`)
      break
  }
})({})

export const createContext = (w, h) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = w
  canvas.height = h
  return ctx
}

export const toImageData = img => {
  const ctx = createContext(img.width, img.height)
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

export const loadImage = path =>
  new Promise((okay, nope) => {
    const img = new Image()
    img.onload = () => okay(img)
    img.onerror = x => nope(x)
    img.src = path
  })

export const loadImageData = async path => toImageData(await loadImage(path))

export const clickToCoords = (e, scale, maxWidth, maxHeight) => {
  const rect = e.target.getBoundingClientRect()
  const scaleX = scale * (rect.width / maxWidth)
  const scaleY = scale * (rect.height / maxHeight)
  const x = Math.floor((e.clientX - rect.left) / scaleX)
  const y = Math.floor((e.clientY - rect.top) / scaleY)
  return { x, y }
}

export default {
  clickToCoords,
  drawRect,
  drawUint32,
  fromHex,
  loadImage,
  loadImageData,
  palette,
  sprite,
  toImageData,
  toUint32,
}
