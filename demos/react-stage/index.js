import React, { Component } from 'react'
import * as DOM from 'react-dom'
import { render, h } from '../../src/'

const renderPixel8 = render => {
  return ({ frame }) => {
    return toNode(render({ frame }))
  }
}

const toNode = child => {
  if (!child) {
    return h('nothing', {})
  }
  if ('string' === typeof child) {
    return h('text', { value: child })
  }
  if (typeof child === 'function') {
    return h('callback', { render: renderPixel8(child) })
  }
  if (Array.isArray(child)) {
    return h('list', {}, ...child.map(toNode))
  }
  console.log(child.type)
  if ('string' !== typeof child.type) {
    console.log(child, new child.type(child.props))
    return toNode(new child.type(child.props))
  }
  return h(
    child.type,
    { ...child.props, key: child.key },
    child.props.children ? toNode(child.props.children) : undefined,
  )
}

class Pixel8 extends Component {
  componentDidUpdate() {
    return false
  }
  componentDidMount() {
    this.ctx = render(renderPixel8(this.props.children), this.canvas)
  }
  componentWillUnmount() {
    this.ctx.done()
  }
  render() {
    const { children, ...props } = this.props
    return (
      <canvas
        {...props}
        ref={canvas => (this.canvas = canvas)}
        style={{ imageRendering: 'pixelated', ...props.style }}
      />
    )
  }
}

const App = () => {
  return (
    <Pixel8>
      {({ frame }) => {
        // console.log(frame)
        return (
          // <stage fps={60} width={128} height={128} scale={1} background="#000">
          //   <rect
          //     id="a"
          //     overflow=""
          //     x={2}
          //     y={2}
          //     width={40}
          //     height={40}
          //     fill="#f0f"
          //   />
          // </stage>
          <stage
            overflow="repeat"
            fps={60}
            width={256}
            height={256}
            scale={3}
            background="#000"
          >
            <rect
              id="a"
              overflow=""
              x={2}
              y={2}
              width={4}
              height={4}
              fill="#f0f"
            >
              <rect
                id="b"
                overflow="repeat"
                x={-1}
                y={-1}
                width={3}
                height={3}
                fill="#fff"
              >
                {({ frame }) => [
                  <circ
                    key="c"
                    position="fixed"
                    x={frame / 8}
                    y={0}
                    radius={2}
                    fill="#00f"
                  />,
                  <rect
                    key="e"
                    position="fixed"
                    x={0}
                    y={0}
                    width={1}
                    height={1}
                    fill="#f0f"
                  />,
                  <transition
                    key="d"
                    values={[{ prop: 'x', duration: 16, ease: 'linear' }]}
                  >
                    <rect
                      position="fixed"
                      x={frame % 32 < 16 ? 3 : 7}
                      y={0}
                      width={1}
                      height={1}
                      fill="#0ff"
                    />
                  </transition>,
                ]}
              </rect>
            </rect>
            <textbox
              font="Pixel8 Mono"
              x={0}
              y={0}
              width={256}
              height={128}
              padding={8}
              align="left"
              whiteSpace=""
              letterSpacing={0}
              lineHeight={1}
              start={0}
              end={Infinity}
            >
              {`
Pixel8 <textbox> propTypes:
---------------------------
children: string
font: string
x: number
y: number
width: number
height: number
padding: number
align: "left" | "right" | "center"
whiteSpace: void | "pre" | "nowrap"
letterSpacing: number
lineHeight: number`
                .trim()
                .toUpperCase()
              // .substr(0, frame)
              }
            </textbox>
            <Bar y={48 + frame} />
          </stage>
        )
      }}
    </Pixel8>
  )
}

const Foo = ({ y }) => (
  <rect x={64} y={y} height={64} width={64} fill="#fff">
    <rect x={64} y={64} height={64} width={64} fill="#f00" />
  </rect>
)

const Bar = ({ y }) => {
    return (
      <rect x={64} y={this.props.y} height={64} width={64} fill="#fff">
        <Foo y={10} />
      </rect>
    )
  }


DOM.render(<App />, document.getElementById('root'))
