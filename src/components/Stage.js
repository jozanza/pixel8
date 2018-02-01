import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import AutoScale from 'react-auto-scale'
import Pixel8Context from '../core/Context'
import createRenderer from '../renderer'
import createElement from '../createElement'
import { clickToCoords, requestInterval, clearTimer } from '../utils'
const { render, unmount } = createRenderer(createElement)

const StageBackground = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ bgColor }) => bgColor};
  ${({ gridType, gridColor, gridSize }) => {
    if (!gridType || gridType === 'none') return ''
    if (gridType === 'dotted')
      return `
background-position: 0 0;
background-image:
  url('data:image/svg+xml;utf8,
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="${gridSize}"
      height="${gridSize}">
      <rect
        x="0"
        y="0"
        width="1"
        height="1"
        fill="${gridColor}"></rect>
    </svg>');`.replace(/\n/g, ' ')
    if (gridType === 'checkered')
      return `
background-position: 0 0;
background-image:
  url('data:image/svg+xml;utf8,
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      width="${gridSize * 2}"
      height="${gridSize * 2}">
      <rect
        x="0"
        y="0"
        width="${gridSize}"
        height="${gridSize}"
        fill="${gridColor}"></rect>
      <rect
        x="${gridSize - 1}"
        y="${gridSize - 1}"
        width="${gridSize}"
        height="${gridSize}"
        fill="${gridColor}"></rect>
    </svg>');`.replace(/\n/g, ' ')
  }};
`

/**
 * ## `<Stage>`
 * The magical gateway into the world of pixel awesomeness (づ￣ ³￣)づ
 */
export default class Stage extends Component {
  static propTypes = {
    /** Stage width in pixels */
    width: PropTypes.number,
    /** Stage height in pixels */
    height: PropTypes.number,
    /** Stage scale. Basically, the zoom level */
    scale: PropTypes.number,
    /** Stage background color */
    background: PropTypes.string,
    /** Distance between grid dots on the stage. If `0`, then no dots appear */
    gridSize: PropTypes.number,
    /** Stage grid color */
    gridColor: PropTypes.string,
    /** The grid style */
    gridType: PropTypes.oneOf(['checkered', 'dotted']),
    /** How often to redraw the stage (frames per second) */
    fps: PropTypes.number,
    /** Called once after initialization, before the first draw/tick
     * 
     * `function onInit(stage: pixel8.Stage): void` */
    onInit: PropTypes.func,
    /** Called every tick (frame)
     * 
     * `function onTick(stage: pixel8.Stage): void` */
    onTick: PropTypes.func,
    /** Called right after the stage pixel buffer gets redrawn
     * 
     * `function onDraw(stage: pixel8.Stage): void` */
    onDraw: PropTypes.func,
  }
  static defaultProps = {
    width: 128,
    height: 128,
    scale: 1,
    background: 'transparent',
    gridSize: 2, // scaled pixels
    gridType: 'checkered',
    gridColor: 'transparent',
    fps: 0,
    onInit: () => {},
    onTick: () => {},
    onDraw: () => {},
    onClick: () => {},
  }
  tick = 0
  pixel8 = new Pixel8Context({
    width: this.props.width,
    height: this.props.height,
  })
  appendChild = this.pixel8.appendChild
  removeChild = this.pixel8.removeChild
  init() {
    this.ctx = this.canvas.getContext('2d')
    this.ctx.globalAlpha = 0
    // draw + update loop
    this.timer = requestInterval(() => {
      this.props.onTick(this)
      this.tick++
      this.pixel8
        .clear()
        .draw()
        .paint(this.ctx)
      this.props.onDraw(this)
    }, 1 / this.props.fps * 1000)
    // onInit() callback
    this.props.onInit(this)
  }
  componentDidMount() {
    this.init()
    render(this)
    this.pixel8
      .clear()
      .draw()
      .paint(this.ctx)
  }
  componentWillUnmount() {
    clearTimer(this.timer)
    unmount(this)
  }
  componentDidUpdate() {
    render(this)
  }
  render() {
    const {
      fps,
      children,
      background,
      gridType,
      gridSize,
      gridColor,
      palette,
      width,
      height,
      scale,
      onInit,
      onDraw,
      onTick,
      onClick,
      ...props
    } = this.props
    const maxWidth = width * scale
    const maxHeight = height * scale
    return (
      <div
        style={{
          width: '100%',
          maxWidth,
          display: 'inline-block',
        }}
      >
        <AutoScale maxWidth={maxWidth} maxHeight={maxHeight} maxScale={1}>
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: maxWidth,
              height: maxHeight,
            }}
          >
            <StageBackground
              bgColor={background}
              gridType={gridType}
              gridColor={gridColor}
              gridSize={scale * gridSize}
            />
            <canvas
              ref={ref => (this.canvas = ref)}
              width={width}
              height={height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                imageRendering: 'pixelated',
                transform: `scale(${scale})`,
                transformOrigin: '0 0',
                outline: 'none',
              }}
              onClick={e => {
                e.persist()
                onClick(e)
                const { x, y } = clickToCoords(e, scale, maxWidth, maxHeight)
                const child = this.pixel8.getChild(x, y)
                if (child && child.props.onClick) {
                  child.props.onClick(e)
                }
              }}
              {...props}
            />
          </div>
        </AutoScale>
      </div>
    )
  }
}
