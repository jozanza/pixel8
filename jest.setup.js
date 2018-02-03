import 'raf/polyfill'
import expect from 'expect'
import { configureToMatchImageSnapshot } from 'jest-image-snapshot'
import UPNG from 'upng-js'

global.toPngBuffer = imageData => {
  const { data, width, height } = imageData
  return Buffer.from(UPNG.encode([data.buffer], width, height, 0))
}

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customDiffConfig: { threshold: 0 },
  noColors: true,
})

expect.extend({ toMatchImageSnapshot })
