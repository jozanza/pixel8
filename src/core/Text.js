import Pixel8Element from './Element'
import { drawUint32, stringToBytes } from '../utils'
import fonts from '../fonts'

export default class Text extends Pixel8Element {
  static defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    text: '',
    fill: 0,
    font: 'micro',
    yOffset: 0,
  }
  draw(f = x => x) {
    this.computedProps = f(this.props)
    const {
      x,
      y,
      text,
      lineHeight,
      font,
      fill,
      width,
      height,
      yOffset,
    } = this.computedProps
    // console.log(text)
    const data = stringToBytes(text, {
      lineHeight: lineHeight || font.height,
      font:
        'string' === typeof font
          ? // font is string
            fonts[font]
          : // font is object
            font,
      fill,
      boxWidth: width,
      boxHeight: height,
      yOffset,
    })
    drawUint32(this.ctx, {
      id: this.id,
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(width),
      h: Math.round(height),
      data,
    })
  }
}
