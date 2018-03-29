import layoutText from 'layout-bmfont-text'
import * as EASING from 'easing-utils'
import FONTS from '../fonts'
import { list } from './nodes'
import { dataUriToUint32Array, toUint32 } from '../utils'

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
    case 'callback':
      return new Callback(props, children)
    case 'circ':
      return new Circ(props, children)
    case 'list':
      return new List(props, children)
    case 'nothing':
      return new Nothing(props)
    case 'pixel':
      return new Pixel(props, children)
    case 'rect':
      return new Rect(props, children)
    case 'sprite':
      return new Sprite(props, children)
    case 'stage':
      return new Stage(props, children)
    case 'text':
      return new Text(props, children)
    case 'textbox':
      return new Textbox(props, children)
    case 'transition':
      return new Transition(props, children)
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
export const updateElement = (parent, element, node, nextNode) => {
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
    if (parent) parent.onChildSetProps(element)
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
      for (let i = 0; i < len; i++) {
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
      const elements = [...element.children]
      const { length } = elements
      for (let i = 0; i < len; i++) {
        const _parent = element
        const _element = elements[i]
        const _node = node.children[i]
        const _nextNode = nextNode.children[i]
        updateElement(_parent, _element, _node, _nextNode)
      }
      for (let i = len; i < length; i++) {
        element.removeChild(elements[i])
      }
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
    this.props = nextProps
  }
  /**
   * Callback that is fired after an element's child's props have been updated
   * @param {VDOMElement} child - child that wqas updated
   */
  onChildSetProps(child) {}
  /**
   * Appends a child element and sets its parent prop
   * @param {VDOMElement} child - child virtual DOM element
   */
  appendChild(child) {
    child.parent = this
    this.children.add(child)
    return this
  }
  /**
   * Removes a child element and unsets its parent prop
   * @param {VDOMElement} child - child virtual DOM element
   */
  removeChild(child) {
    this.children.delete(child)
    child.destroy()
    child.parent = null
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
      mask: overflow === 'hidden',
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
      mask: overflow === 'hidden',
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
      mask: overflow === 'hidden',
      fixed: position === 'fixed',
    }
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

/** Virtual DOM element representing nothing */
export class Nothing extends VDOMElement {
  type = 'nothing'
  getBoundingRect() {}
}

/** Virtual DOM element representing a sprite */
export class Sprite extends VDOMElement {
  type = 'sprite'
  currentSrc = null
  init() {
    const { onInit } = this.props
    this.setPixels()
    if ('function' !== typeof onInit) return
    onInit()
  }
  update() {
    const { onUpdate, src } = this.props
    if (this.currentSrc !== src) this.setPixels()
    if ('function' !== typeof onUpdate) return
    onUpdate()
  }
  setPixels() {
    const { src, onUpdate } = this.props
    // Uint32Array
    if (src instanceof Uint32Array) {
      this.pixels = src
    } else if ('string' === typeof src) {
      // string
      this.pixels = dataUriToUint32Array(src)
    } else if (ArrayBuffer.isView(src)) {
      // TypedArray or DataView
      this.pixels = new Uint32Array(src.buffer)
    } else {
      // Anything else
      this.pixels = Uint32Array.from(src)
    }
    this.currentSrc = src
  }
}

/** Virtual DOM element representing a box of text */
// Only valid child element is <text>
export class Textbox extends VDOMElement {
  type = 'textbox'
  constructor(...args) {
    super(...args)
    const [child] = [...this.children]
    this.onChildSetProps(child)
  }
  updateLayout(opts) {
    if (this.textLayout) this.textLayout.update(opts)
    else this.textLayout = layoutText(opts)
  }
  onChildSetProps(child = '') {
    const {
      align = 'left',
      color = '#fff',
      font = 'Pixel8 Mono',
      letterSpacing = 0,
      lineHeight = 1,
      padding = 0,
      scrollTop = 0,
      tabSize = 2,
      whiteSpace = '',
      width = 0,
      start = 0,
      end = child.length,
      // height = 0,
    } = this.props
    const bmfont = FONTS[font]
    const pad = parseInt(padding * 2, 10)
    const [datauri] = bmfont.pages
    // Maybe move this part into a drawText util function?
    this.updateLayout({
      text: child.props.value,
      font: bmfont,
      align,
      mode: whiteSpace,
      letterSpacing,
      lineHeight: parseInt(bmfont.common.lineHeight * lineHeight, 10),
      tabSize,
      width: parseInt(Math.max(0, width - pad), 10),
      // start,
      // end,
      // height: parseInt(Math.max(0, height - pad), 10),
    })
    // Create a Uint8Array from b64 image string
    if (this.datauri !== datauri) {
      this.datauri = datauri
      this.font = {
        width: bmfont.common.scaleW,
        height: bmfont.common.scaleH,
        data: dataUriToUint32Array(datauri),
        // map every non-transparent pixel to props.color
        //.map(x => (x === 0 ? x : toUint32(color))),
      }
      // console.log(this.font.data)
    }
    // console.log(this.textLayout)
    // console.log('onChildSetProps', child, this.layout)
  }
}

/** Virtual DOM element representing text */
// jsx strings are converted to <text>
export class Text extends VDOMElement {
  type = 'text'
  getBoundingRect() {}
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
    const easeFn = 'function' === typeof ease ? ease : EASING[ease] || (x => x)
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
