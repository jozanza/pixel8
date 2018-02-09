import { h, render } from './src/index'
// @jsx h

const App = ({ frame }) => {
  const n = 8 * Math.floor(frame / 16)
  const x = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
  const y = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
  const radius = Math.max(0, Math.sin(frame / 8)) * 8
  // console.log(Math.round(radius))
  console.log('frame:', frame, 'n:', n)
  return (
    <stage fps={2} width={64} height={64} scale={4} background="#000">
      <circ radius={radius} x={32} y={32} fill="#f0f" />
      <rect x={0} y={1} width={0} height={0} fill={0}>
        <rect x={4} y={0} width={0} height={0} fill={0}>
          <transition props="x,y" duration={8} ease="linear">
            <rect
              x={n}
              y={n}
              height={1}
              width={1}
              fill="#f00"
              onTransitionStart={key => {
                console.log('start transition', frame, key, n)
                // debugger
              }}
              onTransitionEnd={key => {
                console.log('end transition', frame, key, n)
                // debugger
              }}
            />
          </transition>
        </rect>
      </rect>
      {/*
      <pixel x={0} y={1} color="#aaa" />
      <pixel x={8} y={1} color="#aaa" />
      <pixel x={16} y={1} color="#aaa" />
      <pixel x={24} y={1} color="#aaa" />
      <pixel x={32} y={1} color="#aaa" />
      */}
    </stage>
  )
}

render(App, document.getElementById('root'))
