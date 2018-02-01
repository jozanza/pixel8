import { configureToMatchImageSnapshot } from 'jest-image-snapshot'
import UPNG from 'upng-js'
import {
  requestTimeout,
  clearTimer,
  imageDataToPngBuffer,
  ImageData,
  toUint32,
  draw,
} from './utils'

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customDiffConfig: {
    threshold: 0,
  },
  noColors: true,
})

expect.extend({ toMatchImageSnapshot })

const nothing = props => ({ type: 'nothing', props, children: [] })
const list = (props, children) => {
  return {
    type: 'list',
    props,
    children: children.map((child, i) => {
      const hasKey = child && child.props && child.props.hasOwnProperty('key')
      return hasKey ? mapChildNode(child) : mapChildNode(child, i)
    }),
  }
}
const mapChildNode = (child, key) => {
  const props = key ? { key } : {}
  return !child
    ? nothing(props)
    : Array.isArray(child)
      ? list(props, child)
      : { ...child, props: { ...child.props, ...props } }
}
const h = (type, props = {}, ...children) => {
  return typeof type === 'function'
    ? type(props, children)
    : {
        type,
        props,
        children: children.map(mapChildNode),
      }
}
// @jsx h

class Pixel8 {
  static Element = class Element {
    parent = null
    constructor(props = {}, children = []) {
      this.props = props
      this.children = new Set()
      // set element props
      this.setProps(props)
      // create element children
      for (var i = 0; i < children.length; i++) {
        this.appendChild(Pixel8.createElement(children[i]))
      }
    }
    // init() {}
    // update() {}
    // destroy() {}
    setProps(nextProps) {
      this.props = {
        ...this.props,
        ...nextProps,
      }
    }
    appendChild(child) {
      this.children.add(child)
      child.parent = this
      // child.init()
      return this
    }
    removeChild(child) {
      this.children.delete(child)
      child.parent = null
      // child.destroy()
      return this
    }
  }
  static elements = {
    Stage: class Stage extends Pixel8.Element {
      type = 'stage'
    },
    Rect: class Rect extends Pixel8.Element {
      type = 'rect'
    },
    Circ: class Circ extends Pixel8.Element {
      type = 'circ'
    },
    Pixel: class Pixel extends Pixel8.Element {
      type = 'pixel'
    },
    List: class List extends Pixel8.Element {
      type = 'list'
    },
    Nothing: class Nothing extends Pixel8.Element {
      type = 'nothing'
    },
  }
  static createElement = ({ type, props, children }) => {
    switch (type) {
      case 'stage':
        return new Pixel8.elements.Stage(props, children)
      case 'rect':
        return new Pixel8.elements.Rect(props, children)
      case 'circ':
        return new Pixel8.elements.Circ(props, children)
      case 'pixel':
        return new Pixel8.elements.Pixel(props, children)
      case 'list':
        return new Pixel8.elements.List(props, children)
      case 'nothing':
        return new Pixel8.elements.Nothing(props)
      default:
        throw new Error(`type <${type}> is not a valid element`)
    }
  }
  static render = (view, canvas, ctx = {}) => {
    ctx.next = ctx.next || requestTimeout
    ctx.frame = ctx.frame + 1 || 0
    const stage = typeof view === 'function' ? view({ frame: ctx.frame }) : view
    if (stage.type !== 'stage') throw new Error('root element must be <stage>')
    const { fps, width, height, scale, background } = stage.props
    // update elements
    ctx.rootElement = ctx.rootElement || Pixel8.createElement(stage)
    ctx.lastNode = ctx.lastNode || stage
    Pixel8.patch(
      null, // parent
      ctx.rootElement, // element
      ctx.lastNode, // node
      stage, // nextNode
    )
    ctx.lastNode = stage
    // update UI
    ctx.imageData = Pixel8.toImageData(
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
  static patch = (parent, element, node, nextNode) => {
    // noop
    if (node === nextNode) {
    }
    // add
    if (!node) {
      parent.appendChild(Pixel8.createElement(nextNode))
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
        // patch based on keys
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
          Pixel8.patch(_parent, _element, _node, _nextNode)
        }
        for (const child of extra) element.removeChild(child)
      } else {
        // patch based on index
        const len = nextNode.children.length
        const extra = [...element.children]
        const elements = extra.splice(0, len)
        for (var i = 0; i < len; i++) {
          const _parent = element
          const _element = elements[i]
          const _node = node.children[i]
          const _nextNode = nextNode.children[i]
          Pixel8.patch(_parent, _element, _node, _nextNode)
        }
        for (const child of extra) element.removeChild(child)
      }
    }
    // replace existing
    if (node && node.type !== nextNode.type) {
      parent.removeChild(element)
      parent.appendChild(Pixel8.createElement(nextNode))
    }
  }
  static toImageData = (oldImageData, rootElement) => {
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
    Pixel8.draw(screen, rootElement, rootElement)
    return imageData
  }
  static draw = (screen, rootElement, element) => {
    const { width, height } = rootElement.props
    const parentProps = element.parent && element.parent.props
    const { type, props, children, parent } = element
    switch (type) {
      case 'stage':
        screen.fill(toUint32(props.background))
        break
      case 'rect':
        draw.rect({
          screen,
          hitmap: null,
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
          hitmap: null,
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
          hitmap: null,
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
      Pixel8.draw(screen, rootElement, child)
    }
  }
}

it('should render rectangles and circles and pixels', () => {
  const ctx = { next: () => {} } // avoid the render loop; just render once
  Pixel8.render(
    ({ frame }) => {
      return (
        <stage
          fps={60}
          width={128}
          height={128}
          scale={1}
          background="rgba(0,0,0,0)"
        >
          <rect x={0} y={0} width={8} height={8} fill="#f0f" />
          <circ x={32} y={32} radius={8} fill="#f0f" />
          <pixel x={0} y={16} color="#0f0" />
          <pixel x={4} y={16} color="#0f0" />
          <pixel x={8} y={16} color="#0f0" />
        </stage>
      )
    },
    null,
    ctx,
  )
  const buffer = Buffer.from(imageDataToPngBuffer(UPNG.encode, ctx.imageData))
  expect(buffer).toMatchImageSnapshot()
})

it('should render arrays with different kinds of elements', () => {
  const ctx = { next: () => {} } // avoid the render loop; just render once
  Pixel8.render(
    ({ frame }) => (
      <stage fps={60} width={128} height={128} scale={1} background="#fff">
        {[
          [
            <circ key="foo" x={0} y={0} radius={4} fill="#000" />,
            frame === 0 && (
              <circ key="bar" x={8} y={0} radius={4} fill="#222" />
            ),
            frame === 1 && (
              <circ key="bar" x={8} y={0} radius={4} fill="#222" />
            ),
            <circ key="baz" x={16} y={0} radius={4} fill="#444" />,
          ],
          <circ key="foo" x={24} y={0} radius={4} fill="#666" />,
          frame === 0 && <circ key="bar" x={32} y={0} radius={4} fill="#888" />,
          frame === 1 && <circ key="bar" x={32} y={0} radius={4} fill="#888" />,
          <circ key="baz" x={40} y={0} radius={4} fill="#aaa" />,
        ]}
      </stage>
    ),
    null,
    ctx,
  )
  const buffer = Buffer.from(imageDataToPngBuffer(UPNG.encode, ctx.imageData))
  expect(buffer).toMatchImageSnapshot()
})

// Pixel8.render(n => (
//   <stage fps={60} width={128} height={128} fill="#000">
//     {[
//       <circ key="foo" x={0} y={0} radius={16} fill="#000" />,
//       <circ key="bar" x={0} y={0} radius={16} fill="#111" />,
//       <rect key="baz">
//         {[
//           <circ key="_foo" x={0} y={0} radius={16} fill="#222" />,
//           <circ key="_bar" x={0} y={0} radius={16} fill="#333" />,
//         ]}
//       </rect>,
//       [
//         <circ key="_foo" x={0} y={0} radius={16} fill="#222" />,
//         <circ key="_bar" x={0} y={0} radius={16} fill="#333" />,
//       ],
//     ]}
//     {n === 0 && <pixel x={0} y={0} fill="#f00" />}
//     {n === 1 && <pixel x={1} y={1} fill="#0f0" />}
//     {n === 2 && <pixel x={2} y={2} fill="#00f" />}
//     <rect x={0} y={0} width={8} height={8} fill="#fff">
//       <circ x={n} y={0} radius={4} fill="#f0f" />
//     </rect>
//   </stage>
// ))
