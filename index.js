import { createElement, drawElement, h, render, utils } from './src/index'
import layout from 'layout-bmfont-text'
import pixel8Regular from './src/fonts/pixel8-regular-7.json'
import pixel8Mono from './src/fonts/pixel8-mono-7.json'
import { Sprite } from './src/vdom/elements'
// @jsx h

// console.log(utils, pixel8FontUrl, pixel8Font)

// console.log(<textbox>foo bar</textbox>)

// console.log(createElement(<textbox>foo bar</textbox>))

// render(({ frame }) => {
//   return (
//     <stage
//       overflow="repeat"
//       fps={10}
//       width={8}
//       height={8}
//       scale={16 * 3}
//       background="#000"
//     >
//       <rect id="a" overflow="" x={2} y={2} width={4} height={4} fill="#f0f">
//         <rect
//           id="b"
//           overflow="repeat"
//           x={-1}
//           y={-1}
//           width={3}
//           height={3}
//           fill="#fff"
//         >
//           {({ frame }) => [
//             <circ
//               key="c"
//               position="fixed"
//               x={frame / 8}
//               y={0}
//               radius={2}
//               fill="#00f"
//             />,
//             <rect
//               key="e"
//               position="fixed"
//               x={0}
//               y={0}
//               width={1}
//               height={1}
//               fill="#f0f"
//             />,
//             <transition
//               key="d"
//               values={[{ prop: 'x', duration: 16, ease: 'linear' }]}
//             >
//               <rect
//                 position="fixed"
//                 x={frame % 32 < 16 ? 3 : 7}
//                 y={0}
//                 width={1}
//                 height={1}
//                 fill="#0ff"
//               />
//             </transition>,
//           ]}
//         </rect>
//       </rect>
//     </stage>
//   )
// }, document.getElementById('root0'))

// const drawText = (canvas, text, image) => {
//   const ctx = canvas.getContext('2d')
//   // ctx.globalAlpha = 1
//   // console.log(text)
//   text.glyphs.forEach(glyph => {
//     const { data, position, line } = glyph
//     const [x, y] = position
//     //some characters like space/tab might be empty
//     //FireFox will error out if we try clipping with 0x0 rects
//     if (data.width * data.height === 0) return
//     //draw the sprite from texture atlas
//     ctx.drawImage(
//       image,
//       data.x,
//       data.y,
//       data.width,
//       data.height,
//       (8 + x + data.xoffset) * 3,
//       (8 + y + data.yoffset + (text._height - text._lineHeight)) * 3,
//       data.width * 3,
//       data.height * 3,
//     )
//   })
// }

// utils
//   .loadImage(pixel8Regular.pages[0])
//   .catch(console.error)
//   .then(image => {
//     const txt = layout({
//       font: pixel8Regular,
//       align: 'left',
//       mode: 'pre',
//       letterSpacing: 0,
//       text: `
// Pixel8 <textbox> API:
// ---------------------
// propTypes = {
//   children: string,
//   width: number,
//   height: number,
//   padding: number,
//   align: "left" | "right" | "center",
//   whiteSpace: "default" | "pre" | "nowrap",
//   letterSpacing: number,
//   lineHeight: number,
//   scrollTop: number,
//   start: number,
//   end: number,
// }
// `, //.toUpperCase(),
//       // 'Pixel8 Text API:\n----------\n<text /> candy = \n\t\tcanes liquorice ice cream topping cheesecake biscuit fruitcake. Tiramisu sesame snaps chocolate bar ice cream candy. Cake croissant liquorice. Biscuit fruitcake sweet roll fruitcake pastry. Dessert biscuit macaroon muffin tart liquorice marzipan tootsie roll. Biscuit croissant carrot cake bonbon marzipan jujubes gummi bears cake. Souffle pastry candy canes. Muffin chocolate lollipop cotton candy carrot cake chocolate bar candy. Jelly beans chupa chups bear claw jelly beans fruitcake tiramisu.',
//       width: 256 - 8,
//       height: 128 - 8,
//     })
//     // console.log(image)
//     render(({ frame }) => {
//       return (
//         <stage
//           overflow="repeat"
//           fps={0}
//           width={256}
//           height={128}
//           scale={3}
//           background="#000"
//         >
//           {/* <rect
//             id="a"
//             x={-1}
//             y={-0}
//             width={4}
//             height={4}
//             fill="#f0f"
//             overflow="repeat"
//           >
//             <rect id="c" x={-1} y={-1} width={1} height={1} fill="#00f" />
//           </rect> */}
//         </stage>
//       )
//     }, document.getElementById('root1'))
//     drawText(document.getElementById('root1'), txt, image)
//   })

const heart0 = utils.sprite`
. . . . . . . .
. 1 1 . . 1 1 .
1 1 1 1 1 1 1 1
1 1 1 1 1 1 1 1
. 1 1 1 1 1 1 .
. . 1 1 1 1 . .
. . . 1 1 . . .
. . . . . . . .
`
const heart1 = utils.sprite`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . 1 1 1 . . . . 1 1 1 . . .
. . 1 1 1 1 1 . . 1 1 1 1 1 . .
. 1 1 1 1 1 1 1 1 1 1 1 1 1 1 .
. 1 1 1 1 1 1 1 1 1 1 1 1 1 1 .
. 1 1 1 1 1 1 1 1 1 1 1 1 1 1 .
. 1 1 1 1 1 1 1 1 1 1 1 1 1 1 .
. . 1 1 1 1 1 1 1 1 1 1 1 1 . .
. . . 1 1 1 1 1 1 1 1 1 1 . . .
. . . . 1 1 1 1 1 1 1 1 . . . .
. . . . . 1 1 1 1 1 1 . . . . .
. . . . . . 1 1 1 1 . . . . . .
. . . . . . . 1 1 . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
`
const spr0 = heart0.palette({
  '.': 'rgba(0, 0, 0, 0)',
  '1': '#f00',
})
const spr1 = heart0.palette({
  '.': 'rgba(0, 0, 0, 0)',
  '1': '#f0f',
})
const spr2 = heart1.palette({
  '.': 'rgba(0, 0, 0, 0)',
  '1': '#f00',
})
const spr3 = heart1.palette({
  '.': 'rgba(0, 0, 0, 0)',
  '1': '#f0f',
})

const heartTile = ({ x, y }) => ({ frame }) => (
  <rect
    overflow="repeat"
    fill="rgba(0, 0, 0, 0)"
    x={x}
    y={y}
    width={8}
    height={8}
    br={0}
  >
    <sprite
      src={frame % 32 >= 16 ? spr2 : spr3}
      x={-frame}
      y={0}
      width={8}
      height={8}
    />
  </rect>
)

const heartTile2 = ({ x, y, size }) => (
  <rect
    overflow="hidden"
    fill="rgba(0, 100, 100, .75)"
    x={x}
    y={y}
    width={size}
    height={size}
    br={0}
  >
    <sprite src={spr2} x={0} y={0} width={size} height={size} />
    {/* <circ fill="#f0f" radius={8} x={4} y={8} /> */}
  </rect>
)

{
  const W = 16
  const H = 16
  const S = 16
  const bg = Array(W * H)
    .fill(0)
    .map((_, i) => {
      let x = i % W
      let y = (i - x) / W
      x *= S
      y *= S
      return heartTile2({ x, y, size: S })
    })

  render(({ frame }) => {
    return (
      <stage
        overflow="repeat"
        fps={60}
        width={256}
        height={256}
        scale={2}
        background="#000"
      >
        {bg}
        <rect
          overflow="hidden"
          x={0}
          y={0}
          width={256}
          height={128}
          fill="rgba(0,0,0,.75)"
        >
          {({ frame }) => (
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
              end={frame}
            >
              {`
Pixel8 <textbox> propTypes:
---------------------------
children: string
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
          )}
        </rect>
      </stage>
    )
  }, document.getElementById('root1'))
}

// render(({ frame }) => {
//   return (
//     <stage fps={0.1} width={8} height={8} scale={20} background="#000">
//       <rect
//         id="a"
//         x={-0}
//         y={-0}
//         width={4}
//         height={4}
//         fill="#f0f"
//         overflow="repeat"
//       />
//     </stage>
//   )
// }, document.getElementById('root3'))

// const { draw, toUint32 } = utils
// const screenData = new ImageData(8, 8)
// const hitmapData = new ImageData(8, 8)
// const screen = new Uint32Array(screenData.data.buffer)
// const hitmap = new Uint32Array(hitmapData.data.buffer)
// const canvas = document.getElementById('root')

// console.log(
//   createElement(<rect x={0} y={0} width={4} height={4} fill="#fff" />),
// )

// draw.rect({
//   screen,
//   hitmap,
//   pw: 8,
//   ph: 8,
//   px: 0,
//   py: 0,
//   sw: 8,
//   sh: 8,
//   w: 4,
//   h: 4,
//   x: 2,
//   y: -1,
//   fill: toUint32('#f0f'),
//   radius: 0,
//   blend: null,
//   repeat: true,
//   absolute: true,
// })

// draw.rect({
//   screen,
//   hitmap,
//   pw: 4,
//   ph: 4,
//   px: 2,
//   py: -1,
//   sw: 8,
//   sh: 8,
//   w: 3,
//   h: 1,
//   x: -2,
//   y: -4,
//   fill: toUint32('#fff'),
//   radius: 0,
//   blend: false,
//   repeat: true,
//   absolute: true,
// })

// draw.rect({
//   screen,
//   hitmap,
//   pw: 6,
//   ph: 6,
//   px: 2,
//   py: 0,
//   sw: 8,
//   sh: 8,
//   w: 4,
//   h: 1,
//   x: 0,
//   y: 2,
//   fill: toUint32('#fff'),
//   radius: 0,
//   blend: null,
//   repeat: true,
// })

// draw.rect({
//   screen,
//   hitmap,
//   pw: 8,
//   ph: 8,
//   px: 0,
//   py: 0,
//   sw: 8,
//   sh: 8,
//   w: 4,
//   h: 4,
//   x: -4,
//   y: 4,
//   fill: toUint32('#f0f'),
//   radius: 0,
//   blend: null,
//   repeat: true,
// })

// canvas.width = canvas.height = 8
// canvas.style.imageRendering = 'pixelated'
// canvas.style.transformOrigin = '0 0'
// canvas.style.transform = `scale(20)`
// canvas.style.background = '#000'
// canvas.style.boxShadow = '0 0 1px rgba(0, 0, 0, .3)'
// canvas.getContext('2d').putImageData(screenData, 0, 0)

// const MyCircle = (() => {
//   const refs = {}
//   return ({ id, color, x, y, to, from, duration }, children) => {
//     if (!(id in refs)) refs[id] = 0
//     // console.log(id, refs[id])
//     return (
//       <circ
//         radius={Math.max(from, Math.sin(refs[id] / (duration / 2))) * to}
//         x={x}
//         y={y}
//         fill={color}
//         onInit={() => {
//           console.log('INIT', id, children)
//         }}
//         onUpdate={() => refs[id]++}
//         onDestroy={() => delete ref[id]}
//       >
//         {children}
//       </circ>
//     )
//   }
// })()

// const foo = ({ frame }) => {
//   // yellow
//   return <circ radius={16} x={0} y={0} fill="rgba(255, 255, 0, .75)" />
// }

// const bar = ({ frame }) => {
//   // blue
//   const x = Math.round(1 * Math.max(-16, Math.sin(frame / 16)) * 16)
//   return (
//     <circ radius={16} x={x} y={0} fill="rgba(0, 0, 255, .75)">
//       <circ radius={8} x={x} y={12} fill="rgba(255, 0, 255, .75)" />
//     </circ>
//   )
// }

// const App = ({ frame }) => {
//   const n = 8 * Math.floor(frame / 16)
//   const x = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
//   const y = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
//   const radius = Math.max(0, Math.sin(frame / 8)) * 8
//   // console.log(Math.round(radius))
//   // console.log('frame:', frame, 'n:', n)
//   // console.log(frame % 32 >= 16)
//   return (
//     <stage
//       overflow="repeat"
//       fps={60}
//       width={8}
//       height={8}
//       scale={20}
//       background="#000"
//     >
//       {({ frame }) => (
//         <rect x={-frame} y={0} width={4} height={4} fill="#fff">
//           <rect x={-1} y={2} width={2} height={2} fill="#f0f">
//             <rect x={-1} y={1} width={1} height={1} fill="#00f" />
//           </rect>
//         </rect>
//       )}
//       {/* {frame % 32 >= 16 ? foo : null} */}
//       {/* {foo} */}
//       {/* {bar} */}
//       {/* {() => <rect x={0} y={0} width={8} height={8} fill="#fff" br={0} />} */}

//       {/* {() => <circ radius={radius} x={32} y={32} fill="#f0f" />} */}

//       {/* <MyCircle id="foo" color="#f0f" x={0} y={0} from={0} to={1} duration={8}>
//         <MyCircle
//           id="bar"
//           color="#fff"
//           x={16}
//           y={0}
//           from={0}
//           to={16}
//           duration={8}
//         />
//       </MyCircle> */}

//       {/* <circ radius={radius} x={32} y={32} fill="#f0f" />
//       <rect x={4} y={1} width={8} height={1} fill="#fff">
//         <rect x={0} y={10} width={8} height={1} fill="#ccc">
//           <transition
//             values={[
//               { prop: 'x', duration: 8, ease: 'linear' },
//               { prop: 'y', duration: 8, ease: 'linear' },
//             ]}
//           >
//             <rect
//               x={n}
//               y={n}
//               height={1}
//               width={1}
//               fill="#f00"
//               onTransitionStart={key => {
//                 console.log('start transition', frame, key, n)
//                 // debugger
//               }}
//               onTransitionEnd={key => {
//                 console.log('end transition', frame, key, n)
//                 // debugger
//               }}
//             >
//               <rect x={0} y={1} height={4} width={4} fill="#0ca">
//                 <rect x={1} y={1} height={8} width={8} br={1} fill="#00f" />
//               </rect>
//             </rect>
//           </transition>
//         </rect>
//       </rect> */}

//       {/* <pixel x={0} y={1} color="#aaa" />
//       <pixel x={8} y={1} color="#aaa" />
//       <pixel x={16} y={1} color="#aaa" />
//       <pixel x={24} y={1} color="#aaa" />
//       <pixel x={32} y={1} color="#aaa" /> */}
//     </stage>
//   )
// }

// render(App, document.getElementById('root'))
