/**
 * ----------------------------------------------------------------------------
 * Virtual Nodes
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
  // <text>
  if ('string' === typeof child) {
    return text(props, child)
  }
  // <callback>
  if ('function' === typeof child) {
    return callback(props, child)
  }
  // <nothing>
  if (!child) {
    return nothing(props)
  }
  // <list>
  if (Array.isArray(child)) {
    return list(props, child)
  }
  // <*>
  return {
    ...child,
    props: {
      ...child.props,
      ...props,
    },
  }
}

/**
 * Creates a VNode that represents a callback function
 * @param {Object} props - typical VNode props object
 * @param {Function} render - a function that returns a VNode
 * @return {VNode}
 */
const callback = (props, render) => ({
  type: 'callback',
  props: {
    ...props,
    render,
  },
  children: [],
})

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
export const nothing = props => ({
  type: 'nothing',
  props,
  children: [],
})

/**
 * Creates a VNode that represents strings of text
 * @param {Object} props - typical VNode props object
 * @param {string} value - the string value
 * @return {VNode}
 */
export const text = (props, value) => ({
  type: 'text',
  props: {
    ...props,
    value,
  },
  children: [],
})
