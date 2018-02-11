import { h, render } from './src/index'
// @jsx h

const MyCircle = (() => {
  const refs = {}
  return ({ id, color, x, y, to, from, duration }, children) => {
    if (!(id in refs)) refs[id] = 0
    // console.log(id, refs[id])
    return (
      <circ
        radius={Math.max(from, Math.sin(refs[id] / (duration / 2))) * to}
        x={x}
        y={y}
        fill={color}
        onInit={() => {
          console.log('INIT', id, children)
        }}
        onUpdate={() => refs[id]++}
        onDestroy={() => delete ref[id]}
      >
        {children}
      </circ>
    )
  }
})()

const foo = ({ frame }) => {
  // yellow
  return <circ radius={16} x={0} y={0} fill="rgba(255, 255, 0, .75)" />
}

const bar = ({ frame }) => {
  // blue
  const x = Math.round(1 * Math.max(0, Math.sin(frame / 16)) * 16)
  return <circ radius={16} x={x} y={0} fill="rgba(0, 0, 255, .75)" />
}

const App = ({ frame }) => {
  const n = 8 * Math.floor(frame / 16)
  const x = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
  const y = Math.round(1 * Math.max(0, Math.sin(frame / 8)) * 8)
  const radius = Math.max(0, Math.sin(frame / 8)) * 8
  // console.log(Math.round(radius))
  // console.log('frame:', frame, 'n:', n)
  // console.log(frame % 32 >= 16)
  return (
    <stage fps={60} width={64} height={64} scale={4} background="#000">
      {/* {frame % 32 >= 16 ? foo : null} */}
      {foo}
      {bar}
      {/* {() => <rect x={0} y={0} width={8} height={8} fill="#fff" br={0} />} */}

      {/* {() => <circ radius={radius} x={32} y={32} fill="#f0f" />} */}

      {/* <MyCircle id="foo" color="#f0f" x={0} y={0} from={0} to={1} duration={8}>
        <MyCircle
          id="bar"
          color="#fff"
          x={16}
          y={0}
          from={0}
          to={16}
          duration={8}
        />
      </MyCircle> */}

      {/* <circ radius={radius} x={32} y={32} fill="#f0f" />
      <rect x={4} y={1} width={8} height={1} fill="#fff">
        <rect x={0} y={10} width={8} height={1} fill="#ccc">
          <transition
            values={[
              { prop: 'x', duration: 8, ease: 'linear' },
              { prop: 'y', duration: 8, ease: 'linear' },
            ]}
          >
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
            >
              <rect x={0} y={1} height={4} width={4} fill="#0ca">
                <rect x={1} y={1} height={8} width={8} br={1} fill="#00f" />
              </rect>
            </rect>
          </transition>
        </rect>
      </rect> */}

      {/* <pixel x={0} y={1} color="#aaa" />
      <pixel x={8} y={1} color="#aaa" />
      <pixel x={16} y={1} color="#aaa" />
      <pixel x={24} y={1} color="#aaa" />
      <pixel x={32} y={1} color="#aaa" /> */}
    </stage>
  )
}

render(App, document.getElementById('root'))
