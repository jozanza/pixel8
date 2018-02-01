export const {
  // ImageData polyfill
  ImageData = class ImageData {
    constructor(w, h, data) {
      this.width = w
      this.height = h
      this.data = data || new Uint8ClampedArray(new ArrayBuffer(w * h * 4))
    }
  },
} = window

export default class Pixel8Context {
  static createElement = ctx => ([El, props, children = []]) => {
    return new El(props, children.map(Pixel8Context.createElement(ctx)), ctx)
  }
  static createElements = (ctx, elems) => {
    return elems.map(Pixel8Context.createElement(ctx))
  }
  static stringifyImageData(imageData: ImageData): string {
    const pixels = new Uint32Array(imageData.data.buffer)
    const px = []
    let i = 0
    for (let y = 0; y < imageData.height; y++) {
      px.push([])
      for (let x = 0; x < imageData.width; x++) {
        px[y].push(pixels[i])
        i++
      }
    }
    return '\n' + px.map(x => x.join(' ')).join('\n') + '\n'
  }
  constructor({ width, height } = {}) {
    this.resize(width, height)
  }
  children = new Set() // shallow set of children
  registry = new Map() // all children
  resize = (w: number, h: number): Pixel8Context => {
    this.screenData = new ImageData(w, h)
    this.hitmapData = new ImageData(w, h)
    this.screen = new Uint32Array(this.screenData.data.buffer)
    this.hitmap = new Uint32Array(this.hitmapData.data.buffer)
    return this
  }
  getPixel = (x: number, y: number): number => {
    const { width } = this.screenData
    const color = this.screen[y * width + x]
    return color
  }
  getChild = (x: number, y: number): Pixel8Element | void => {
    const { registry, hitmap, hitmapData } = this
    const { width } = hitmapData
    const id = hitmap[y * width + x]
    return registry.get(id)
  }
  getChildById(id: number): Pixel8Element | void {
    const { registry } = this
    return registry.get(id)
  }
  clear = (): Pixel8Context => {
    this.screen.fill(0)
    this.hitmap.fill(0)
    return this
  }
  draw = (): Pixel8Context => {
    const { children } = this
    for (const child of children) child.draw()
    return this
  }
  paint = (ctx): Pixel8Context => {
    ctx.putImageData(this.screenData, 0, 0)
    return this
  }
  appendChild = (child: Pixel8Element): Pixel8Context => {
    this.children.add(child)
    return this.registerChild(child)
  }
  removeChild = (child: Pixel8Element): Pixel8Context => {
    this.children.delete(child)
    return this.unregisterChild(child)
  }
  registerChild = (child: Pixel8Element): Pixel8Context => {
    this.registry.set(child.id, child)
    return this
  }
  unregisterChild = (child: Pixel8Element): Pixel8Context => {
    this.registry.delete(child.id)
    return this
  }
  toString = (): string => {
    return Pixel8Context.stringifyImageData(this.screenData)
  }
}

export const scaleImageData = ({ width, height, data }, scale) => {
  const scaledWidth = scale * width
  const scaledHeight = scale * height
  const scaled = new Uint8Array(new ArrayBuffer(scaledWidth * scaledHeight * 4))
  for (let y = 0; y < scaledHeight; y++) {
    for (let x = 0; x < scaledWidth; x++) {
      const index = (Math.floor(y / scale) * width + Math.floor(x / scale)) * 4
      const scaledIndex = (y * scaledWidth + x) * 4
      scaled[scaledIndex] = data[index]
      scaled[scaledIndex + 1] = data[index + 1]
      scaled[scaledIndex + 2] = data[index + 2]
      scaled[scaledIndex + 3] = data[index + 3]
    }
  }
  return new ImageData(scaledWidth, scaledHeight, scaled)
}
