import { requestTimeout, clearTimer, ImageData, toUint32, draw } from '../utils'

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
 * Given a VNode, returns a VirtualDOMElement
 * @param {string} type - VNode type
 * @param {Object} props - VNode props
 * @param {Array<VNode>} children - array of VNodes
 * @return {VirtualDOMElement}
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
    case 'list':
      return new List(props, children)
    case 'nothing':
      return new Nothing(props)
    default:
      throw new Error(`type <${type}> is not a valid element`)
  }
}

/**
 * Applies updates to a VirtualDOMElement and its children
 * It does so by diffing an element's current vnode with its next
 * @param {VirtualDOMElement} [parent] - the parent element
 * @param {VirtualDOMElement} [element] - the element being updated 
 * @param {VNode} [node] - the current VNode for the element
 * @param {VNode} [nextNode] - the next VNode for the element
 */
const updateElement = (parent, element, node, nextNode) => {
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
    // element.update()
    if (element.type === 'list') {
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
export class VirtualDOMElement {
  /**
   * Element type
   * @type {string}
   */
  type = ''
  /**
   * Parent element
   * @type {VirtualDOMElement | void}
   */
  parent = null
  /**
   * Set props, and append children
   * @param {Object} props - VNode props
   * @param {Array<VNode>} children - direct child VNodes
   */
  constructor(props = {}, children = []) {
    this.props = props
    this.children = new Set()
    // set element props
    this.setProps(props)
    // create element children
    for (var i = 0; i < children.length; i++) {
      this.appendChild(createElement(children[i]))
    }
  }
  // Considering adding some lifcycle methods...
  // init() {}
  // update() {}
  // destroy() {}
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
   * @param {VirtualDOMElement} child - child virtual DOM element
   */
  appendChild(child) {
    this.children.add(child)
    child.parent = this
    // child.init()
    return this
  }
  /**
   * Removes a child element and unsets its parent prop
   * @param {VirtualDOMElement} child - child virtual DOM element
   */
  removeChild(child) {
    this.children.delete(child)
    child.parent = null
    // child.destroy()
    return this
  }
}

/** Virtual DOM element representing the root of the UI */
export class Stage extends VirtualDOMElement {
  type = 'stage'
}

/** Virtual DOM element representing a rectangle */
export class Rect extends VirtualDOMElement {
  type = 'rect'
}

/** Virtual DOM element representing a circle */
export class Circ extends VirtualDOMElement {
  type = 'circ'
}

/** Virtual DOM element representing a pixel */
export class Pixel extends VirtualDOMElement {
  type = 'pixel'
}

/** Virtual DOM element representing a list of virual DOM elements */
export class List extends VirtualDOMElement {
  type = 'list'
}

/** Virtual DOM element representing a nothing */
export class Nothing extends VirtualDOMElement {
  type = 'nothing'
}

/**
 * ----------------------------------------------------------------------------
 * Rendering
 * ----------------------------------------------------------------------------
 */

/**
 * Converts VNodes -> VirtualDOMElements -> ImageData, and possibly dumps the
 * the pixels onto a <canvas> element...and it repeats all that once per frame
 * @param {VNode | Function} view - A VNode or function that returns a VNode.
 *                                  VNode type must be 'stage'
 * @param {HTMLCanvasElement} [canvas]
 */
export const render = (view, canvas, ctx = {}) => {
  ctx.next = ctx.next || requestTimeout
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
  ctx.imageData = elementToImageData(
    ctx.imageData,
    ctx.rootElement,
    ctx.rootElement,
  )
  if (canvas) {
    // if canvas element specified, write imageData to it
    canvas.width = width
    canvas.height = height
    canvas.style.imageRendering = 'pixelated'
    canvas.style.transform = `scale(${scale})`
    canvas.style.background = background
    canvas.getContext('2d').putImageData(ctx.imageData, 0, 0)
  }
  // repeat :)
  ctx.next(() => render(view, canvas, ctx), 1 / fps * 1000)
  return ctx
}

/**
 * Converts a VirtualDOMElement and its children into ImageData
 * @param {ImageData} [oldImageData] - previous ImageData, if any
 * @param {VirtualDOMElement} rootElement - the element to draw
 * @return {ImageData}
 */
export const elementToImageData = (oldImageData, rootElement) => {
  const { width, height } = rootElement.props
  let imageData = oldImageData
  const noData = !imageData
  const didResize =
    noData || (imageData.width !== width || imageData.height !== height)
  // reset imageData
  if (didResize) imageData = new ImageData(width, height)
  // create buffer view
  const { buffer } = imageData.data
  const screen = new Uint32Array(buffer)
  // draw nodes into buffer
  drawElement({
    screen,
    hitmap: null,
    rootElement,
    element: rootElement,
  })
  return imageData
}

/**
 * Writes virtual DOM element pixels onto screen/hitmap buffers
 * @param {Uint32Array} screen - screen buffer view
 * @param {Uint32Array} hitmap - hitmap buffer view
 * @param {VirtualDOMElement} rootElement - the root VirtualDOMElement
 * @param {VirtualDOMElement} element - the VirtualDOMElement to be drawn
 */
export const drawElement = ({ screen, hitmap, rootElement, element }) => {
  const { width, height } = rootElement.props
  const parentProps = element.parent && element.parent.props
  const { type, props, children, parent } = element
  switch (type) {
    case 'stage':
      // clear screen
      screen.fill(toUint32(props.background))
      // clear hitmap
      // hitmap.fill(0)
      break
    case 'rect':
      draw.rect({
        screen,
        hitmap,
        sw: width,
        sh: height,
        x: (parentProps.x || 0) + (props.x || 0),
        y: (parentProps.y || 0) + (props.y || 0),
        w: props.width || 0,
        h: props.height || 0,
        fill: toUint32(props.fill),
        radius: props.radius || 0,
      })
      break
    case 'circ':
      draw.rect({
        screen,
        hitmap,
        sw: width,
        sh: height,
        x: (parentProps.x || 0) + Math.round((props.x || 0) - 1),
        y: (parentProps.y || 0) + Math.round((props.y || 0) - 1),
        w: Math.round(((props.radius || 0) + 1) * 2),
        h: Math.round(((props.radius || 0) + 1) * 2),
        fill: toUint32(props.fill),
        radius: Math.round((props.radius || 0) + 2),
      })
      break
    case 'pixel':
      draw.rect({
        screen,
        hitmap,
        sw: width,
        sh: height,
        x: (parentProps.x || 0) + (props.x || 0),
        y: (parentProps.y || 0) + (props.y || 0),
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
    })
  }
}
