import { configureToMatchImageSnapshot } from 'jest-image-snapshot'
import UPNG from 'upng-js'
import blobUtil from 'blob-util'
import Rectangle from './Rectangle'
import Transition from './Transition'
import Pixel8Context from './Context'

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customDiffConfig: {
    threshold: 0,
  },
  noColors: true,
})

expect.extend({ toMatchImageSnapshot })

const base64 = data => btoa(String.fromCharCode.apply(null, data))

const imageDataToPngBuffer = imageData => {
  const { data, width, height } = imageData
  return UPNG.encode([data.buffer], width, height, 0)
}

it('works')

// it('[0, 0] 1x1', async () => {
//   const root = new Pixel8Context({ width: 128, height: 128 })
//   const rect = new Rectangle(
//     {
//       width: 128,
//       height: 128,
//       fill: '#000',
//     },
//     null,
//     root,
//   )
//   root.appendChild(rect).draw()
//   // expect(root.getPixel(0, 0)).toBe(1)
//   expect(root.getChild(0, 0)).toBe(rect)
//   // expect(root.toString()).toMatchSnapshot()
//   const buffer = Buffer.from(root.toPNG('png'))
//   expect(buffer).toMatchImageSnapshot()
// })

// it('elements nested in transition', () => {
//   const root = new Pixel8Context({ width: 8, height: 8 })
//   const tran = new Transition(
//     {
//       frames: 4,
//     },
//     null,
//     root,
//   )
//   const rect1 = new Rectangle(
//     {
//       width: 4,
//       height: 4,
//       fill: 1,
//     },
//     null,
//     root,
//   )
//   const rect2 = new Rectangle(
//     {
//       width: 2,
//       height: 2,
//       fill: 2,
//     },
//     null,
//     root,
//   )
//   root.appendChild(tran)
//   tran.appendChild(rect1)
//   rect1.appendChild(rect2)
//   root.clear().draw()
//   expect(root.toString()).toMatchSnapshot()
//   rect1.setProps({ x: 4 })
//   for (let i = 0; i < 4; i++) {
//     root.clear().draw()
//     expect(root.toString()).toMatchSnapshot()
//   }
// })
