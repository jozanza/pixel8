import { h, render } from './src/index'
// @jsx h

const getTransitionValue = (
  from,
  to,
  { progress = 0, duration = 1, ease = x => x } = {},
) => {
  const step = 1 / duration
  const t = ease(step * progress)
  const diff = to - from
  const val = diff * t
  return from + val
}

const App = ({ frame }) => {
  const x = frame > 0 ? 8 : 0
  // const n = Math.floor(frame / 16)
  // const x = n * 8
  const val = getTransitionValue(0, x, {
    progress: Math.min(8, Math.max(0, frame - 1)),
    duration: 8,
  })
  console.log('frame:', frame, 'x:', val)
  return (
    <stage fps={2} width={32} height={32} scale={8} background="#000">
      <rect x={0} y={1} width={0} height={0} fill={0}>
        <rect x={4} y={0} width={0} height={0} fill={0}>
          <pixel
            id="foo"
            x={val}
            y={0}
            color="#f00"
            xTransition={{ duration: 8, ease: 'linear', delay: 0 }}
            onTransitionStart={key => {
              console.log('start transition', key, x)
              debugger
            }}
            onTransitionEnd={key => {
              console.log('end transition', key, x)
              debugger
            }}
          />
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
