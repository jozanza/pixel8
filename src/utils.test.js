import {
  calcBoundingRect,
  clickToCoords,
  getSubPixels,
  mod,
  sprite,
  palette,
  stringToLines,
} from './utils'
import wrap from 'word-wrapper'

it('sprite', () => {
  const heart = sprite`
  . . . . . . . .
  . 1 1 . . 1 2 .
  1 1 1 1 1 1 1 2
  1 1 1 1 1 1 1 2
  . 1 1 1 1 1 1 .
  . . 1 1 1 1 . .
  . . . 1 1 . . .
  . . . . . . . .
  `
  const pixels = heart.palette({
    '.': 'rgba(0, 0, 0, 0)',
    '1': '#f00',
    '2': '#f0f',
  })
  expect(pixels).toMatchSnapshot()
})

it('getSubPixels', () => {
  // prettier-ignore
  const pixels = new Uint32Array([
    0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3, 3, 3,
    4, 4, 4, 4, 4, 4, 4, 4,
    5, 5, 5, 5, 5, 5, 5, 5,
    6, 6, 6, 6, 6, 6, 6, 6,
    7, 7, 7, 7, 7, 7, 7, 7,
  ])
  const subpixels = getSubPixels(pixels, 8, 8, 0, 0, 4, 4)
  expect(subpixels).toMatchSnapshot()
})

it('stringToLines', () => {
  const measureChar = charWidth => (text, start, end, width) => {
    const available = Math.floor(width / charWidth)
    const total = Math.floor((end - start) * charWidth)
    const glyphs = Math.min(end - start, available, total)
    return {
      start,
      end: start + glyphs,
    }
  }
  const expected = 'jozanza rules'
  const actual = wrap.lines('jozanza rules', {
    width: 35,
    measure: measureChar(5),
  })
  // console.log(actual)
})

describe('clickToCoords', () => {
  const getNotScaledCoords = (clientX, clientY, rectWidth, rectHeight, scale) =>
    getCoords(
      clientX,
      clientY,
      rectWidth,
      rectHeight,
      scale,
      rectWidth,
      rectHeight,
    )

  const getCoords = (
    clientX,
    clientY,
    rectWidth,
    rectHeight,
    scale,
    maxWidth,
    maxHeight,
  ) => {
    const e = {
      clientX,
      clientY,
      target: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: rectWidth,
          height: rectHeight,
        }),
      },
    }
    return clickToCoords(e, scale, maxWidth, maxHeight)
  }

  it('get top left', () => {
    const { x, y } = getNotScaledCoords(0, 0, 100, 100, 1)

    expect(x).toBe(0)
    expect(y).toBe(0)
  })

  it('get bottom right', () => {
    const { x, y } = getNotScaledCoords(199, 199, 200, 200, 10)

    expect(x).toBe(19)
    expect(y).toBe(19)
  })

  it('get adjacent left', () => {
    const { x, y } = getNotScaledCoords(9, 0, 100, 100, 10)

    expect(x).toBe(0)
    expect(y).toBe(0)
  })

  it('get adjacent right', () => {
    const { x, y } = getNotScaledCoords(10, 0, 100, 100, 10)

    expect(x).toBe(1)
    expect(y).toBe(0)
  })

  it('get with scaled rect', () => {
    const { x: x1, y: y1 } = getCoords(349, 2, 350, 1050, 10, 100, 300)
    expect(x1).toBe(9)
    expect(y1).toBe(0)

    const { x: x2, y: y2 } = getCoords(182, 211, 200, 300, 10, 100, 300)
    expect(x2).toBe(9)
    expect(y2).toBe(21)

    const { x: x3, y: y3 } = getCoords(44, 211, 50, 300, 10, 100, 300)
    expect(x3).toBe(8)
    expect(y3).toBe(21)
  })
})
