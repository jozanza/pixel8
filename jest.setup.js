import 'raf/polyfill'
import expect from 'expect'
import { configureToMatchImageSnapshot } from 'jest-image-snapshot'
import UPNG from 'upng-js'

expect.extend({
  toMatchImageSnapshot: configureToMatchImageSnapshot({
    customDiffConfig: { threshold: 0 },
    noColors: true,
  }),
})

global.toPngBuffer = imageData => {
  const { data, width, height } = imageData
  return Buffer.from(UPNG.encode([data.buffer], width, height, 0))
}

global.expectImageDataToMatchSnapshot = imageData => {
  expect(toPngBuffer(imageData)).toMatchImageSnapshot()
}
