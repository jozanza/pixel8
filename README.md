
<div align="center">
  <img src="/assets/logo.png" />
  <h1>P I X E L 8</h1>  
</div>

[![NPM Version](https://img.shields.io/npm/v/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![NPM Downloads](https://img.shields.io/npm/dm/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![Join the chat at https://gitter.im/vsmode/pixel8](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vsmode/pixel8?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[Pixel8](https://pixel8.vsmode.org/) is a JavaScript library for creating pixel art and games using JSX.

- **Easy-to-use:** Most game frameworks require a lot of reading and experimentation to get up-to-speed. Pixel8 puts JSX at its core so you create low-res UIs just like you would any other. Not to mention, you can still use all of the tools and libraries you do in all your other projects.

- **Performant:** Under the hood, Pixel8 avoids Canvas's stateful/mutable API and relies primarily on `ArrayBuffer`s to render bytes representing pixels directly to a `<canvas>` `2dContext`. This low-level architecture gives Pixel8 a proper "8-bit" aesthetic, solid performance, and lets future development easily take advantage of new and experimental browser APIs such as `OffscreenCanvas`, `SharedArrayBuffer`, and `WebAssembly`.

- **Customizable:** As much as possible, Pixel8 doesn't make any assumptions about what you're going for. There are no limitations on color palettes, resolutions, memory/cpu usage, etc. You can make your canvas look like it was created on a ZX Spectrum or a Game Boy. It's entirely up to you. And it's up to the community to develop an ecosystem of tools and libraries that can enforce tasteful constraints for those who wish to opt-in to them.

___

- [Installation](#installation)
- [Usage](#usage)
- [Examples](#examples)
- [Community](#community)
- [License](#license)

## Installation

Install with `yarn` or `npm`

```bash
yarn add pixel8
```

## Usage

You should definitely check out the **[interactive documentation](https://pixel8.vsmode.org/)**...but if you're looking for a quick start, the general idea is that you want to start off with something like this:

```js
import React from 'react'
import { render } from 'react-dom'
import { Stage } from 'pixel8'

const App = () => (
  <Stage width={64} height={64} scale={6} fps={30} background="#000">
    {/*
      * You can use the following components:
      * <rect>, <circ>, <pixel>, <text>, <sprite>, <transition>, <animation> and <buffer>
      * Read the API documentation at https://pixel8.vsmode.org/#drawing-shapes
      */}
  </Stage>
)

render(<App />, document.getElementById('root'))

```

But seriously, [check out the docs](https://pixel8.vsmode.org/). They are very detailed + easy to understand ;)

## Examples

In addition to the examples in the docs, here are a couple more

- [Handling User Input](#handling-user-input)
- [Simple Pixel Editor](#simple-pixel-editor)
- More coming soon...

### Handling User Input

[![Edit Pixel8 Demo - Keyboard Interaction](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/r75ymwn34o)

```js
import React from 'react'
import { render } from 'react-dom'
import { Stage } from 'pixel8'

class App extends React.Component {
  /** constants */
  static U_BUTTON = 38 // up
  static D_BUTTON = 40 // down
  static L_BUTTON = 37 // left
  static R_BUTTON = 39 // right
  static A_BUTTON = 90 // A
  static B_BUTTON = 88 // B
  /** state */
  x = 60
  y = 60
  size = 8
  speed = 2
  /** actions */
  move = ({ keyCode }) => {
    switch (keyCode) {
      case App.U_BUTTON: this.y -= this.speed; break
      case App.D_BUTTON: this.y += this.speed; break
      case App.L_BUTTON: this.x -= this.speed; break
      case App.R_BUTTON: this.x += this.speed; break
      default: break
    }
  }
  /** draw */
  render() {
    const { x, y, size } = this
    return (
      <Stage
        fps={30}
        background="#000"
        width={128}
        height={128}
        scale={3}
        tabIndex={0 /* need this for onKeyDown to work */}
        onTick={() => this.forceUpdate() /* re-render each frame */}
        onKeyDown={this.move}>
        <circ fill="#fff" radius={Math.round(size / 2)} x={x} y={y} />
      </Stage>
    )
  }
}

render(<App />, document.getElementById('root'))

```

### Simple Pixel Editor

[![Edit Pixel8 Demo - Pixel Editor](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/0pvmw4k20l)

```js
import React from 'react'
import { render } from 'react-dom'
import { Stage } from 'pixel8'

class App extends React.Component {
  /** constants */
  static HEIGHT = 128
  static WIDTH = 128
  static SCALE = 3
  /** state */
  activeColor = 0
  mousedown = false
  // DB32 (http://privat.bahnhof.se/wb364826/pic/db32.pal)  
  palette = ['rgb(0,0,0)','rgb(34,32,52)','rgb(69,40,60)','rgb(102,57,49)','rgb(143,86,59)','rgb(223,113,38)','rgb(217,160,102)','rgb(238,195,154)','rgb(251,242,54)','rgb(153,229,80)','rgb(106,190,48)','rgb(55,148,110)','rgb(75,105,47)','rgb(82,75,36)','rgb(50,60,57)','rgb(63,63,116)','rgb(48,96,130)','rgb(91,110,225)','rgb(99,155,255)','rgb(95,205,228)','rgb(203,219,252)','rgb(255,255,255)','rgb(155,173,183)','rgb(132,126,135)','rgb(105,106,106)','rgb(89,86,82)','rgb(118,66,138)','rgb(172,50,50)','rgb(217,87,99)','rgb(215,123,186)','rgb(143,151,74)','rgb(138,111,48)']
  pixels = Array(16 * 16).fill(21)
  size = [16, 16]
  /** actions */
  selectColor = i => {
    this.activeColor = i
  }
  setPixel = i => {
    this.pixels[i] = this.activeColor
  }
  /** draw */
  render() {
    const { activeColor, pixels, palette } = this
    const [width, height] = this.size
    return (
      <Stage
        fps={30}
        background="#000"
        width={App.WIDTH}
        height={App.HEIGHT}
        scale={3}
        tabIndex={0 /* need this for onKeyDown to work */}
        onTick={() => this.forceUpdate() /* re-render each frame */}>
        {/* canvas */}
        <rect x={30} y={22} width={68} height={68} fill="#fff" />
        <rect x={31} y={23} width={66} height={66} fill="#000" />
        <rect x={32} y={24} width={64} height={64} fill="#fff">
          {pixels.map((color, i) => {
            const size = 4
            const fill = palette[color]
            return (
              <rect
                key={i}
                width={size}
                height={size}
                x={(i % width) * size}
                y={Math.floor(i / width) * size}
                fill={fill}
                onClick={() => this.setPixel(i)}
              />
            )
          })}
        </rect>
        {/* palette */}
        {palette.map((fill, i) => {
          return i === activeColor ? (
            <rect
              key={i}
              width={8}
              height={8}
              x={(i * 8) % App.WIDTH}
              y={112 + Math.floor(i * 8 / App.WIDTH) * 8}
              fill="#fff">
              <rect width={6} height={6} x={1} y={1} fill={fill} />
            </rect>
          ) : (
            <rect
              key={i}
              width={8}
              height={8}
              x={(i * 8) % App.WIDTH}
              y={112 + Math.floor(i * 8 / App.WIDTH) * 8}
              fill={fill}
              onClick={() => this.selectColor(i)}
            />
          )
        })}
      </Stage>
    )
  }
}

render(<App />, document.getElementById('root'))

```

## Community

You can join the pixel8 community online in several places:

- [Code Sandbox](https://codesandbox.io/search?query=&refinementList%5Bnpm_dependencies.dependency%5D%5B0%5D=pixel8&page=1)
- [Gitter](https://gitter.im/vsmode/pixel8)
- [Twitter](https://twitter.com/jozanza)

### Issues? Questions? Contributions?

If you **find a bug**, have a cool **idea for a feature**, want to see some specific **code examples/tutorials**, or just want to **say hello**, please get in touch! Feel free to [create an issue](https://github.com/vsmode/pixel8/issues), jump into the [gitter channel](https://gitter.im/vsmode/pixel8), or shoot me a message on [twitter](https://twitter.com/jozanza)

## License

Pixel8 is MIT licensed. See [LICENSE](/LICENSE.md).

**♥**
