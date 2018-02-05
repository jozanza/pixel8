import { linear, easeInSine, easeInOutCubic } from 'easing-utils'
import { h, render, utils } from './src/index'
// @jsx h

const { Timer } = utils
const timer = new Timer({
  progress: 0,
  duration: 8,
  delay: 1,
  reverse: true,
})

const App = ({ frame }) => {
  // console.log(
  //   Timer.format(+timer),
  //   '--->',
  //   Timer.format(easeInOutCubic(+timer)),
  // )
  // timer.next()
  return (
    <stage fps={2} width={32} height={32} scale={8} background="#000">
      <pixel
        x={(Math.floor(frame / 16) * 4) - 1}
        y={0}
        color="#f00"
        transition={{
          x: { duration: 8, ease: 'linear', delay: 0 },
          // y: { duration: 8, ease: 'linear', delay: 0 },
        }}
      />
    </stage>
  )
}

render(App, document.getElementById('root'))
