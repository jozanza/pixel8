import {
  requestTimeout,
  clearTimer,
  ImageData,
  toUint32,
  draw,
  mod,
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
        ? { type: 'callback', props: { key, render: child }, children: [] }
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
  // console.log(type, props, children)
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
    if (parent && typeof parent.childSetProps === 'function') {
      parent.childSetProps(element)
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
   * Maps over child props to apply relative positioning, etc
   * @param {Object} childProps - the props object being mapped
   * @param {Object} child - child to map props of
   */
  mapChildProps(childProps, child) {
    const props = this.parent.mapChildProps(this.props, this)
    return props
    // let { x, y } = childProps
    // if (childProps.position !== 'fixed') {
    //   x = props.x + childProps.x
    //   y = props.y + childProps.y
    // }
    // // console.log(childProps.x, x)
    // return {
    //   ...childProps,
    //   x,
    //   y,
    // }
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
  get width() {
    return this.props.width || 0
  }
  get height() {
    return this.props.height || 0
  }
  get x() {
    const { x: px, width: pw, overflow: poverflow } = this.parent
    const { x, position, overflow, id } = this.props
    const absolute = position !== 'fixed'
    const repeat = poverflow === 'repeat' || overflow === 'repeat'
    let _x = x || 0
    if (absolute) _x += px
    if (repeat) _x = mod(mod(_x, pw) - px, pw) + px
    // if (id) console.log(id, 'x', x, '->', _x)
    return _x
  }
  get y() {
    const { y: py, height: ph, overflow: poverflow } = this.parent
    const { y, position, overflow, id } = this.props
    const absolute = position !== 'fixed'
    const repeat = poverflow === 'repeat' || overflow === 'repeat'
    let _y = y || 0
    if (absolute) _y += py
    if (repeat) _y = mod(mod(_y, ph) - py, ph) + py
    // if (id) console.log(id, 'y', y, '->', _y)
    return _y
  }
  get overflow() {
    return this.props.overflow
    // inherit overflow="repeat"
    return this.parent && this.parent.overflow === 'repeat'
      ? 'repeat'
      : this.props.overflow || 'visible'
  }
}

/** Virtual DOM element representing the root of the UI */
export class Stage extends VDOMElement {
  type = 'stage'
  mapChildProps(childProps) {
    return childProps
  }
  get width() {
    return this.props.width || 0
  }
  get height() {
    return this.props.height || 0
  }
  get x() {
    return 0
  }
  get y() {
    return 0
  }
}

/** Virtual DOM element representing a rectangle */
export class Rect extends VDOMElement {
  type = 'rect'
}

/** Virtual DOM element representing a circle */
export class Circ extends VDOMElement {
  type = 'circ'
  get width() {
    return this.props.radius * 2
  }
  get height() {
    return this.props.radius * 2
  }
}

/** Virtual DOM element representing a pixel */
export class Pixel extends VDOMElement {
  type = 'pixel'
}

/** Virtual DOM element representing a transition */
export class Transition extends VDOMElement {
  type = 'transition'
  transitions = new WeakMap()
  nextProps = new WeakMap()
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
      const nextProps = {}
      const { props } = child
      for (const value of values) {
        // @note
        // Auto transitionable: x, y, width, height, br, radius
        // other primitive props require a custom 'apply' function
        // object props are tricky...probably need an 'equals' function
        // to detect when the from/to values are actually different
        this.updateChildTransitionKeys(child, value)
        nextProps[value.prop] = this.getTransitionValue(child, value)
        // console.log(transitions[key])
        // console.log(this.getTransitionValue(child, key))
      }
      this.nextProps.set(child, nextProps)
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
        from: sameTarget ? from : this.nextProps.get(child)[prop],
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
  childSetProps(child) {
    const queue = this.childCallbackQueue.get(child) || []
    // transition callback queue...
    for (const { name, args } of queue) {
      const f = child.props[name]
      if (typeof f === 'function') f(...args)
    }
    this.childCallbackQueue.set(child, [])
  }
  mapChildProps(props, child) {
    const nextProps = {
      ...props,
      ...this.nextProps.get(child),
    }
    // console.log(nextProps.x, nextProps.y)
    return this.parent.mapChildProps(nextProps, child)
  }
  get overflow() {
    return this.parent.overflow
  }
  get width() {
    return this.parent.width
  }
  get height() {
    return this.parent.height
  }
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
    this.ctx.frame++
  }
  mapChildProps(childProps, child) {
    return this.parent.mapChildProps(childProps, child)
  }
  get overflow() {
    return this.parent.overflow
  }
  get width() {
    return this.parent.width
  }
  get height() {
    return this.parent.height
  }
}

/** Virtual DOM element representing a list of virual DOM elements */
export class List extends VDOMElement {
  type = 'list'
  mapChildProps(childProps, child) {
    return this.parent.mapChildProps(childProps, child)
  }
  get overflow() {
    return this.parent.overflow
  }
  get width() {
    return this.parent.width
  }
  get height() {
    return this.parent.height
  }
}

/** Virtual DOM element representing a nothing */
export class Nothing extends VDOMElement {
  type = 'nothing'
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
  const { width, height } = ctx.rootElement.props
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
    rootElement: ctx.rootElement,
    element: ctx.rootElement,
    offset: {
      x: 0,
      y: 0,
      width,
      height,
    },
  })
}

/**
 * Writes virtual DOM element pixels onto screen/hitmap buffers
 * @param {Uint32Array} screen - screen buffer view
 * @param {Uint32Array} hitmap - hitmap buffer view
 * @param {VDOMElement} rootElement - the root VDOMElement
 * @param {VDOMElement} element - the VDOMElement to be drawn
 */
export const drawElement = ({
  screen,
  hitmap,
  rootElement,
  element,
  offset,
}) => {
  const { width, height } = rootElement.props
  const { type, children, parent, props } = element
  const fixedPosition = props.position && props.position === 'fixed'
  const nextOffset = fixedPosition
    ? {
        x: props.x,
        y: props.y,
        width: props.width || width,
        height: props.height || height,
      }
    : offset
  switch (type) {
    case 'stage':
      // clear screen
      screen.fill(toUint32(props.background))
      // clear hitmap
      hitmap.fill(0)
      break
    case 'rect':
      // console.log(
      //   parent.width,
      //   parent.height,
      //   parent.x,
      //   parent.y,
      //   parent.overflow === 'repeat',
      //   props.position !== 'fixed',
      // )
      draw.rect({
        screen,
        hitmap,
        pw: parent.width,
        ph: parent.height,
        px: parent.x,
        py: parent.y,
        sw: width,
        sh: height,
        w: props.width || 0,
        h: props.height || 0,
        x: props.x,
        y: props.y,
        fill: toUint32(props.fill),
        radius: props.br || 0,
        repeat: parent.overflow === 'repeat', // | 'hidden' | 'visible'
        stageRepeat: rootElement.props.overflow === 'repeat', // | 'hidden'
        absolute: props.position !== 'fixed', // | 'absolute'
        blend: props.blend,
      })
      break
    case 'circ':
      // console.log(parent, parent.width, parent.height)
      draw.rect({
        repeat: parent.overflow === 'repeat', // 'hidden' | 'visible'
        screen,
        hitmap,
        pw: parent.width,
        ph: parent.height,
        px: parent.x || 0,
        py: parent.y || 0,
        sw: width,
        sh: height,
        x: props.x - 1,
        y: props.y - 1,
        w: Math.round(((props.radius || 0) + 1) * 2),
        h: Math.round(((props.radius || 0) + 1) * 2),
        fill: toUint32(props.fill),
        radius: Math.round((props.radius || 0) + 2),
      })
      break
    case 'pixel':
      draw.rect({
        repeat: parent.overflow === 'repeat', // 'hidden' | 'visible'
        screen,
        hitmap,
        sw: width,
        sh: height,
        x: props.x,
        y: props.y,
        w: 1,
        h: 1,
        fill: toUint32(props.color),
        radius: 0,
      })
      break
    default:
      break
  }
  for (const child of children) {
    drawElement({
      screen,
      hitmap,
      rootElement,
      element: child,
      offset: nextOffset,
    })
  }
}
