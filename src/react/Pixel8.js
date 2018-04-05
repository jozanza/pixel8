import React, { Component } from 'react'
import { render, h } from '../index'
const createElement = React.createElement

export class Pixel8 extends Component {
  componentDidUpdate() {
    return false
  }
  componentDidMount() {
    this.canvas.focus()
    this.ctx = render(props => {
      React.createElement = h
      const node = this.props.children(props)
      React.createElement = createElement
      return node
    }, this.canvas)
  }
  componentWillUnmount() {
    this.ctx.done()
  }
  render() {
    const { children, ...props } = this.props
    return (
      <canvas
        {...props}
        tabIndex="0"
        ref={canvas => (this.canvas = canvas)}
        style={{
          imageRendering: 'pixelated',
          outline: 'none',
          ...props.style,
        }}
      />
    )
  }
}

export default Pixel8
