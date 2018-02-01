import Pixel8Element from './Element'
import { drawRect, toUint32 } from '../utils'

export default class Circle extends Pixel8Element {
  static defaultProps = {
    x: 0,
    y: 0,
    radius: 0,
    fill: 0,
  }
  draw(f = x => x) {
    this.computedProps = f(this.props)
    const { x, y, radius, fill } = this.computedProps
    drawRect(this.ctx, {
      id: this.id,
      x: Math.round(x) - 1,
      y: Math.round(y) - 1,
      w: Math.round((radius + 1) * 2),
      h: Math.round((radius + 1) * 2),
      fill: toUint32(fill),
      radius: Math.round(radius + 2),
    })
    for (const child of this.children) {
      child.draw(x => this.mapChildProps(f(x)))
    }
  }
}
