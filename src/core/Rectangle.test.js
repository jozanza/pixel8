import { configureToMatchImageSnapshot } from 'jest-image-snapshot'
import UPNG from 'upng-js'
import Rectangle from './Rectangle'
import Pixel8Context, { ImageData, scaleImageData } from './Context'

expect.extend({
  toMatchImageSnapshot: configureToMatchImageSnapshot({
    customDiffConfig: {
      threshold: 0,
    },
  }),
})

const toPNGBuffer = (imageData: ImageData): ArrayBuffer => {
  const { data, width, height } = imageData
  return UPNG.encode([data.buffer], width, height, 0)
}

it('should fill entire stage', () => {
  // create context
  const ctx = new Pixel8Context({ width: 16, height: 16 })
  // create children
  const children = Pixel8Context.createElements(ctx, [
    [Rectangle, { width: 16, height: 16, fill: '#000' }],
    [Rectangle, { width: 1, height: 1, fill: '#fff' }],
  ])
  // append children
  for (const child of children) ctx.appendChild(child)
  // draw
  ctx.clear().draw()
  // create image data (upscaled)
  const imageData = scaleImageData(ctx.screenData, 10)
  const image = Buffer.from(toPNGBuffer(imageData))
  // diff snapshot
  expect(image).toMatchImageSnapshot()
})

it('should relatively position', () => {
  // create context
  const ctx = new Pixel8Context({ width: 16, height: 16 })
  // create children
  const children = Pixel8Context.createElements(ctx, [
    [Rectangle, { x: 0, y: 0, width: 16, height: 16, fill: '#000' }],
    [
      Rectangle,
      { x: 7, y: 7, width: 4, height: 4, fill: '#fff' },
      [[Rectangle, { x: 1, y: 1, width: 1, height: 1, fill: '#f0f' }]],
    ],
  ])
  // append children
  for (const child of children) ctx.appendChild(child)
  // draw
  ctx.clear().draw()
  // create image data (upscaled)
  const imageData = scaleImageData(ctx.screenData, 10)
  const image = Buffer.from(toPNGBuffer(imageData))
  // diff snapshot
  expect(image).toMatchImageSnapshot()
})
