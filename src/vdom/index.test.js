import { h, render } from './index'
// @jsx h

it('should render rectangles and circles and pixels', () => {
  const ctx = { next: () => {} } // avoid the render loop; just render once
  render(
    ({ frame }) => {
      return (
        <stage
          fps={60}
          width={128}
          height={128}
          scale={1}
          background="rgba(0,0,0,0)"
        >
          <rect x={0} y={0} width={8} height={8} fill="#f0f" />
          <circ x={32} y={32} radius={8} fill="#f0f" />
          <pixel x={0} y={16} color="#0f0" />
          <pixel x={4} y={16} color="#0f0" />
          <pixel x={8} y={16} color="#0f0" />
        </stage>
      )
    },
    null,
    ctx,
  )
  expect(toPngBuffer(ctx.imageData)).toMatchImageSnapshot()
})
