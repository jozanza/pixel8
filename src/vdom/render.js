import {
  createElement,
  updateElement,
  Callback,
  Circ,
  List,
  Nothing,
  Pixel,
  Rect,
  Stage,
  Transition,
} from './elements'
import {
  requestTimeout,
  clearTimer,
  ImageData,
  toUint32,
  drawRect,
  drawUint32,
  calcBoundingRect,
  getSubPixels,
} from '../utils'

/**
 * ----------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------------
 */

/**
 * Converts VNodes -> VDOMElements -> ImageData, and possibly dumps the
 * the pixels onto a <canvas> element...and it repeats all that once per frame
 * @param {VNode | Function} view - A VNode or function that returns a VNode.
 *                                  VNode type must be 'stage'
 * @param {HTMLCanvasElement} [canvas]
 */
export const render = (view, canvas, ctx = {}) => {
  if (ctx.cancelled) return ctx
  if (canvas) autoCancelRender(canvas, ctx)
  ctx.next = ctx.next || requestTimeout
  ctx.cancel = ctx.cancel || clearTimer
  ctx.done = () => ctx.cancel(ctx.timer)
  ctx.frame = ctx.frame + 1 || 0
  const stage = typeof view === 'function' ? view({ frame: ctx.frame }) : view
  if (stage.type !== 'stage') throw new Error('root element must be <stage>')
  const { fps, width, height, scale, background } = stage.props
  // update elements
  ctx.rootElement = ctx.rootElement || createElement(stage)
  ctx.lastNode = ctx.lastNode || stage
  updateElement(
    null, // parent
    ctx.rootElement, // element
    ctx.lastNode, // node
    stage, // nextNode
  )
  ctx.lastNode = stage
  // update UI
  updateScreenAndHitmap(ctx)
  if (canvas) {
    // if canvas element specified, write imageData to it
    const ctx2d = canvas.getContext('2d')
    const s = parseInt(scale)
    const w = parseInt(width)
    const h = parseInt(height)
    const sw = w * s
    const sh = h * s
    canvas.width = sw
    canvas.height = sh
    ctx2d.imageSmoothingEnabled = false
    // put image data 1:1 scale
    ctx2d.putImageData(ctx.screen, 0, 0)
    // scale up/down to specified value
    if (s !== 1) {
      // alternatively, we could use css scaling
      // and imageRendering: pixelated
      ctx2d.drawImage(canvas, 0, 0, w, h, 0, 0, sw, sh)
    }
  }
  // repeat :)
  const nextLoop = () => render(view, canvas, ctx)
  ctx.timer = ctx.next(nextLoop, 1 / fps * 1000)
  return ctx
}

/**
 * If multiple render calls target the same <canvas> DOM element,
 * this function automatically cancels all render loops execept for the latest
 * @param {HTMLCanvasElement} canvas - <canvas> DOM element to render to
 * @param {Object} ctx - pixel8 render() ctx argument
 */
export const autoCancelRender = (() => {
  const elems = new WeakMap()
  return (canvas, ctx) => {
    const oldCtx = elems.get(canvas)
    if (oldCtx && ctx !== elems.get(canvas)) {
      oldCtx.cancelled = true
      if (oldCtx.done) oldCtx.done()
    }
    elems.set(canvas, ctx)
    return oldCtx && oldCtx.cancelled
  }
})()

/**
 * Draws elements into screen and hitmap ImageData
 * @param {Object} ctx - a render context object
 * @param {ImageData} [screen] - screen ImageData
 * @param {ImageData} [hitmap] - hitmap ImageData
 * @param {VDOMElement} rootElement - the element to draw
 */
export const updateScreenAndHitmap = ctx => {
  const { width, height, overflow } = ctx.rootElement.props
  const noData = !ctx.screen
  const widthChanged = ctx.screen && ctx.screen.width !== width
  const heightChanged = ctx.screen && ctx.screen.height !== height
  const shouldReset = noData || widthChanged || heightChanged
  // reset screenData
  if (shouldReset) {
    ctx.screen = new ImageData(width, height)
    ctx.hitmap = new ImageData(width, height)
  }
  // draw elements into screen + hitmap
  drawElement({
    screen: new Uint32Array(ctx.screen.data.buffer),
    hitmap: new Uint32Array(ctx.hitmap.data.buffer),
    element: ctx.rootElement,
    bounds: Array(2).fill(ctx.rootElement.getBoundingRect()),
  })
}

/**
 * Writes virtual DOM element pixels onto screen/hitmap buffers
 * @param {Uint32Array} screen - screen buffer view
 * @param {Uint32Array} hitmap - hitmap buffer view
 * @param {VDOMElement} element - the VDOMElement to be drawn
 */
export const drawElement = ({ screen, hitmap, element, bounds }) => {
  const { type, children, parent } = element
  // skip all drawing / bounding rect calculations for callbacks
  if ('callback' === type) {
    for (const child of children) {
      drawElement({
        screen,
        hitmap,
        element: child,
        bounds,
      })
    }
    return
  }
  // otherwise, draw element
  const props =
    parent && parent.nextChildProps
      ? { ...element.props, ...parent.nextChildProps.get(element) }
      : element.props
  let [p, s] = bounds
  const e = element.getBoundingRect() || p
  const nextParentBoundingRect = calcBoundingRect(calcBoundingRect(e, p), s)
  const nextBounds = [nextParentBoundingRect, s]
  switch (type) {
    case 'stage':
      // clear screen
      screen.fill(toUint32(props.background))
      // clear hitmap
      hitmap.fill(0)
      break
    case 'rect':
      drawRect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
        parentMask: p.mask,
        sw: parseInt(s.w, 10),
        sh: parseInt(s.h, 10),
        stageRepeat: s.repeat,
        w: parseInt(props.width || 0, 10),
        h: parseInt(props.height || 0, 10),
        x: parseInt(props.x || 0, 10),
        y: parseInt(props.y || 0, 10),
        radius: parseInt(props.br || 0, 10),
        fill: toUint32(props.fill),
        fixed: props.position === 'fixed',
        blend: props.blend,
      })
      break
    case 'circ':
      drawRect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
        parentMask: p.mask,
        sw: parseInt(s.w, 10),
        sh: parseInt(s.h, 10),
        stageRepeat: s.repeat,
        x: parseInt(props.x - 1, 10),
        y: parseInt(props.y - 1, 10),
        w: Math.round(((props.radius || 0) + 1) * 2),
        h: Math.round(((props.radius || 0) + 1) * 2),
        radius: Math.round((props.radius || 0) + 2),
        fill: toUint32(props.fill),
        fixed: props.position === 'fixed',
        blend: props.blend,
      })
      break
    case 'pixel':
      drawRect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
        parentMask: p.mask,
        sw: parseInt(s.w, 10),
        sh: parseInt(s.h, 10),
        stageRepeat: s.repeat,
        w: 1,
        h: 1,
        x: parseInt(props.x || 0, 10),
        y: parseInt(props.y || 0, 10),
        radius: parseInt(props.br || 0, 10),
        fill: toUint32(props.color),
        fixed: props.position === 'fixed',
        blend: props.blend,
      })
      break
    case 'sprite':
      drawUint32({
        screen,
        hitmap,
        data: element.pixels,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
        parentMask: p.mask,
        sw: parseInt(s.w, 10),
        sh: parseInt(s.h, 10),
        stageRepeat: s.repeat,
        w: parseInt(props.width || 0, 10),
        h: parseInt(props.height || 0, 10),
        x: parseInt(props.x || 0, 10),
        y: parseInt(props.y || 0, 10),
        fixed: props.position === 'fixed',
        blend: props.blend,
      })
      break
    case 'textbox':
      const { textLayout, font } = element
      if (!textLayout) break
      const { scrollTop = 0, start = 0, end = Infinity } = props
      const { glyphs, lineHeight } = textLayout
      let n = 0
      for (const g of glyphs) {
        if (start > n) {
          n++
          continue
        }
        if (end < n) break
        const d = g.data
        const [x, y] = g.position
        const pixels = getSubPixels(
          font.data,
          font.width,
          font.height,
          d.x,
          d.y,
          d.width,
          d.height,
        )
        drawUint32({
          screen,
          hitmap,
          data: pixels,
          px: parseInt(p.x, 10),
          py: parseInt(p.y, 10),
          pw: parseInt(p.w, 10),
          ph: parseInt(p.h, 10),
          parentRepeat: p.repeat,
          parentMask: p.mask,
          sw: parseInt(s.w, 10),
          sh: parseInt(s.h, 10),
          stageRepeat: s.repeat,
          w: parseInt(d.width || 0, 10),
          h: parseInt(d.height || 0, 10),
          x: parseInt(props.padding + props.x + x + d.xoffset, 10),
          y: parseInt(
            props.padding + props.y + y + d.yoffset + textLayout.height,
            10,
          ),
          fixed: props.position === 'fixed',
          blend: props.blend,
        })
        n++
      }
      break
    default:
      break
  }
  for (const child of children) {
    drawElement({
      screen,
      hitmap,
      element: child,
      bounds: nextBounds,
    })
  }
}
