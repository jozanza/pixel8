import {
  requestTimeout,
  clearTimer,
  ImageData,
  toUint32,
  draw,
  mod,
  calcBoundingRect,
} from '../utils'
import * as easingUtils from 'easing-utils'

/**
 * ----------------------------------------------------------------------------
 * Typedefs
 * ----------------------------------------------------------------------------
 */

type VNode = {
  type: string,
  props: {
    [string]: any,
  },
  children: Array<VNode>,
}

type VNodeFn = (type: string, props: Object) => VNode

/**
 * ----------------------------------------------------------------------------
 * Virtual Nodes
 * ----------------------------------------------------------------------------
 */

/**
 * Creates a VNode. This is the function to set as the jsx pragma
 * @param {string | VNodeFn} type - the vnode type
 * @param {Object} props - vnode props
 * @param {Array<VNode | Array<VNode> | void>} children - nested vnodes
 * @return {VNode}
 */
export const h = (type, props = {}, ...children) => {
  // console.log(type, props, children)
  return typeof type === 'function'
    ? type(props, children)
    : {
        type,
        props,
        children: children.map(mapChildNode),
      }
}

/**
 * Maps over a VNode child, converting it into a VNode or array of VNodes
 * @param {VNode | Array<VNode> | void} child - item to transform into a VNode
 * @param {string | number} [key] - optional VNode key. Only used as a fallback
 *                                  when props.key is not defined on child of
 *                                  'list' type VNode
 * @return {VNode | Array<VNode>}
 */
export const mapChildNode = (child, key) => {
  const props = key ? { key } : {}
  return !child
    ? nothing(props)
    : Array.isArray(child)
      ? list(props, child)
      : 'function' === typeof child
        ? {
            type: 'callback',
            props: key ? { key, render: child } : { render: child },
            children: [],
          }
        : { ...child, props: { ...child.props, ...props } }
}

/**
 * Creates a VNode that represents an array of VNodes
 * @param {Object} props - typical VNode props object
 * @param {Array<VNode | Array<VNode> | void>} children - items to transform
 *                                                        into VNodes
 * @return {VNode}
 */
export const list = (props, children) => {
  return {
    type: 'list',
    props,
    children: children.map((child, i) => {
      const hasKey = child && child.props && child.props.hasOwnProperty('key')
      return hasKey ? mapChildNode(child) : mapChildNode(child, i)
    }),
  }
}

/**
 * Creates a VNode that represents an empty element (null/false/undefined)
 * @param {Object} props - typical VNode props object
 * @return {VNode}
 */
export const nothing = props => ({ type: 'nothing', props, children: [] })

/**
 * ----------------------------------------------------------------------------
 * Virtual DOM Elements
 * ----------------------------------------------------------------------------
 */

/**
 * Given a VNode, returns a VDOMElement
 * @param {string} type - VNode type
 * @param {Object} props - VNode props
 * @param {Array<VNode>} children - array of VNodes
 * @return {VDOMElement}
 */
export const createElement = ({ type, props, children }) => {
  switch (type) {
    case 'stage':
      return new Stage(props, children)
    case 'rect':
      return new Rect(props, children)
    case 'circ':
      return new Circ(props, children)
    case 'pixel':
      return new Pixel(props, children)
    case 'transition':
      return new Transition(props, children)
    case 'callback':
      return new Callback(props, children)
    case 'list':
      return new List(props, children)
    case 'nothing':
      return new Nothing(props)
    default:
      throw new Error(`type <${type}> is not a valid element`)
  }
}

/**
 * Applies updates to a VDOMElement and its children
 * It does so by diffing an element's current vnode with its next
 * @param {VDOMElement} [parent] - the parent element
 * @param {VDOMElement} [element] - the element being updated
 * @param {VNode} [node] - the current VNode for the element
 * @param {VNode} [nextNode] - the next VNode for the element
 */
const updateElement = (parent, element, node, nextNode) => {
  if (element) element.update()
  // noop
  if (node === nextNode) {
  }
  // add
  if (!node) {
    parent.appendChild(createElement(nextNode))
  }
  // remove
  if (!nextNode) {
    parent.removeChild(element)
  }
  // update existing
  if (node && node.type === nextNode.type) {
    // update props & state
    element.setProps(nextNode.props)
    if (parent && typeof parent.onChildSetProps === 'function') {
      parent.onChildSetProps(element)
    }
    // element.update()
    if (element.type === 'callback') {
      // callbacks have a single child created by props.render() each frame
      const [childElement] = [...element.children]
      updateElement(
        element, // parent
        childElement, // element
        element.lastNode, // node
        element.node, // nextNode
      )
    } else if (element.type === 'list') {
      // updateElement based on keys
      const extra = new Set(element.children)
      const elements = {}
      const nodes = {}
      for (const childElem of element.children) {
        elements[childElem.props.key] = childElem
      }
      for (const childNode of node.children) {
        nodes[childNode.props.key] = childNode
      }
      const len = nextNode.children.length
      for (var i = 0; i < len; i++) {
        const _nextNode = nextNode.children[i]
        const { key } = _nextNode.props
        const _parent = element
        const _element = elements[key]
        const _node = nodes[key]
        extra.delete(_element)
        updateElement(_parent, _element, _node, _nextNode)
      }
      for (const child of extra) element.removeChild(child)
    } else {
      // updateElement based on index
      const len = nextNode.children.length
      const extra = [...element.children]
      const elements = extra.splice(0, len)
      for (var i = 0; i < len; i++) {
        const _parent = element
        const _element = elements[i]
        const _node = node.children[i]
        const _nextNode = nextNode.children[i]
        updateElement(_parent, _element, _node, _nextNode)
      }
      for (const child of extra) element.removeChild(child)
    }
  }
  // replace existing
  if (node && node.type !== nextNode.type) {
    parent.removeChild(element)
    parent.appendChild(createElement(nextNode))
  }
}

/**
 * Virtual DOM element base class
 */
export class VDOMElement {
  /**
   * Element type
   * @type {string}
   */
  type = 'VDOMElement'
  /**
   * Parent element
   * @type {VDOMElement | void}
   */
  parent = null
  /**
   * Set props, and append children
   * @param {Object} props - VNode props
   * @param {Array<VNode>} children - direct child VNodes
   */
  constructor(props = {}, children = []) {
    this.setProps(props)
    this.children = new Set()
    // initialze element
    this.init()
    // create element children
    for (var i = 0; i < children.length; i++) {
      this.appendChild(createElement(children[i]))
    }
  }
  /**
   * Called when element is created
   */
  init() {
    const { onInit } = this.props
    if ('function' !== typeof onInit) return
    onInit()
  }
  /**
   * Called when element is updated
   */
  update() {
    const { onUpdate } = this.props
    if ('function' !== typeof onUpdate) return
    onUpdate()
  }
  /**
   * Called just before element is destroyed
   */
  destroy() {
    const { onDestroy } = this.props
    if ('function' !== typeof onDestroy) return
    onDestroy()
  }
  /**
   * Receives next props and merges them into the current
   * @param {Object} nextProps - the incoming VNode props
   */
  setProps(nextProps) {
    this.props = {
      ...this.props,
      ...nextProps,
    }
  }
  /**
   * Appends a child element and sets its parent prop
   * @param {VDOMElement} child - child virtual DOM element
   */
  appendChild(child) {
    this.children.add(child)
    child.parent = this
    return this
  }
  /**
   * Removes a child element and unsets its parent prop
   * @param {VDOMElement} child - child virtual DOM element
   */
  removeChild(child) {
    this.children.delete(child)
    child.parent = null
    child.destroy()
    return this
  }
  /**
   * Gets the element's bounding rectangle
   * @return {BoundingRect | void}
   */
  getBoundingRect() {
    const { x, y, width, height, position, overflow } = this.props
    return {
      x: parseInt(x || 0, 10),
      y: parseInt(y || 0, 10),
      w: parseInt(width || 0, 10),
      h: parseInt(height || 0, 10),
      repeat: overflow === 'repeat',
      fixed: position === 'fixed',
    }
  }
}

/** Virtual DOM element representing the root of the UI */
export class Stage extends VDOMElement {
  type = 'stage'
}

/** Virtual DOM element representing a rectangle */
export class Rect extends VDOMElement {
  type = 'rect'
}

/** Virtual DOM element representing a circle */
export class Circ extends VDOMElement {
  type = 'circ'
  getBoundingRect() {
    const { x, y, radius, position, overflow } = this.props
    const n = parseInt(radius * 2)
    return {
      x: parseInt(x || 0, 10),
      y: parseInt(y || 0, 10),
      w: n,
      h: n,
      repeat: overflow === 'repeat',
      fixed: position === 'fixed',
    }
  }
}

/** Virtual DOM element representing a pixel */
export class Pixel extends VDOMElement {
  type = 'pixel'
  getBoundingRect() {
    const { x, y, position, overflow } = this.props
    return {
      x: parseInt(x || 0, 10),
      y: parseInt(y || 0, 10),
      w: 1,
      h: 1,
      repeat: overflow === 'repeat',
      fixed: position === 'fixed',
    }
  }
}

/** Virtual DOM element representing a transition */
export class Transition extends VDOMElement {
  type = 'transition'
  transitions = new WeakMap()
  nextChildProps = new WeakMap()
  childCallbackQueue = new WeakMap()
  getTransitionValue(
    child,
    { prop, duration = 1, ease = 'linear', delay = 0, apply },
  ) {
    const { from, to, progress, wait } = this.transitions.get(child)[prop]
    const step = 1 / duration
    const easeFn =
      'function' === typeof ease ? ease : easingUtils[ease] || (x => x)
    const t = easeFn(step * progress)
    // An apply fn is useful for color transitions, etc
    const applyFn =
      apply ||
      ((t, from, to) => {
        const diff = to - from
        const val = Math.round(diff * t)
        return from + val
      })
    // console.log(from, to)
    return applyFn(t, from, to)
  }
  update() {
    const { values } = this.props
    for (const child of this.children) {
      const nextChildProps = {}
      const { props } = child
      for (const value of values) {
        // @note
        // Auto transitionable: x, y, width, height, br, radius
        // other primitive props require a custom 'apply' function
        // object props are tricky...probably need an 'equals' function
        // to detect when the from/to values are actually different
        this.updateChildTransitionKeys(child, value)
        nextChildProps[value.prop] = this.getTransitionValue(child, value)
        // console.log(transitions[key])
        // console.log(this.getTransitionValue(child, key))
      }
      this.nextChildProps.set(child, nextChildProps)
    }
  }
  updateChildTransitionKeys(child, { prop, duration, delay }) {
    if (!this.transitions.has(child)) this.transitions.set(child, {})
    const transitions = this.transitions.get(child)
    const { from, to, progress, wait } = transitions[prop] || {}
    const nextValue = child.props[prop]
    const done = progress === duration && to === nextValue
    const sameTarget = to === nextValue
    if (done || !transitions[prop]) {
      // console.log(from, nextValue)
      // reset
      transitions[prop] = {
        progress: 0,
        wait: delay,
        from: nextValue,
        to: nextValue,
      }
    } else if (from !== nextValue) {
      // decrement wait, increment progress, update from/to
      // is target value has changed, reset progress/wait
      transitions[prop] = {
        // increment progress once wait is 0
        progress: wait < 1 ? (sameTarget ? progress + 1 : 0) : 1,
        // decrement wait by one, floor is 0
        wait: wait > 0 ? (sameTarget ? wait - 1 : delay) : 0,
        // if nextValue has changed, change "from" to current transition value
        from: sameTarget ? from : this.nextChildProps.get(child)[prop],
        // we should always transition to nextValue
        to: nextValue,
      }
      // push transition callback prop execution into queue...
      // can't call at this moment since the child still has last frame's props
      // ...setProps() has yet to be called transition children this frame
      if (progress === 0) {
        const queue = this.childCallbackQueue.get(child) || []
        queue.push({
          name: 'onTransitionStart',
          args: [prop],
        })
        this.childCallbackQueue.set(child, queue)
      }
      if (sameTarget && progress === duration - 1) {
        const queue = this.childCallbackQueue.get(child) || []
        queue.push({
          name: 'onTransitionEnd',
          args: [prop],
        })
        this.childCallbackQueue.set(child, queue)
      }
    }
  }
  onChildSetProps(child) {
    const queue = this.childCallbackQueue.get(child) || []
    // transition callback queue...
    for (const { name, args } of queue) {
      const f = child.props[name]
      if (typeof f === 'function') f(...args)
    }
    this.childCallbackQueue.set(child, [])
  }
  getBoundingRect() {}
}

/** Virtual DOM element representing a callback function */
export class Callback extends VDOMElement {
  type = 'callback'
  ctx = { frame: 0 }
  node = null
  lastNode = null
  update() {
    this.lastNode = this.node
    this.node = this.props.render(this.ctx)
    if (Array.isArray(this.node)) this.node = list({}, this.node)
    this.ctx.frame++
  }
  getBoundingRect() {}
}

/** Virtual DOM element representing a list of virual DOM elements */
export class List extends VDOMElement {
  type = 'list'
  getBoundingRect() {}
}

/** Virtual DOM element representing a nothing */
export class Nothing extends VDOMElement {
  type = 'nothing'
  getBoundingRect() {}
}

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
  ctx.timer = ctx.next(() => render(view, canvas, ctx), 1 / fps * 1000)
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
  const props =
    parent && parent.nextChildProps
      ? { ...element.props, ...parent.nextChildProps.get(element) }
      : element.props
  const [p, s] = bounds
  const e = element.getBoundingRect() || p
  const parentBoundingRect = calcBoundingRect(calcBoundingRect(e, p), s)
  const nextBounds = [parentBoundingRect, s]
  switch (type) {
    case 'stage':
      // clear screen
      screen.fill(toUint32(props.background))
      // clear hitmap
      hitmap.fill(0)
      break
    case 'rect':
      draw.rect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
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
      draw.rect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
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
      draw.rect({
        screen,
        hitmap,
        px: parseInt(p.x, 10),
        py: parseInt(p.y, 10),
        pw: parseInt(p.w, 10),
        ph: parseInt(p.h, 10),
        parentRepeat: p.repeat,
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
