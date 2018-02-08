
<div align="center">
  <img src="/assets/logo.png" />
  <h1>P I X E L 8</h1>  
</div>

[![NPM Version](https://img.shields.io/npm/v/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![NPM Downloads](https://img.shields.io/npm/dm/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![Join the chat at https://gitter.im/vsmode/pixel8](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vsmode/pixel8?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[pixel8](https://pixel8.vsmode.org/) is a minimal JavaScript library for creating pixel art and games.

- **Easy-to-use:** Simply use JSX to add/update/remove interactive shapes and sprites. With this library, you can create low-res UIs using the same techniques you would in any other application. And since it's just like any other JavaScript app, you can continue to use all of the tools and libraries you do in all your other projects.

- **Performant:** Under the hood, pixel8 avoids Canvas's stateful/mutable API and relies primarily on `ArrayBuffer`s to render bytes representing pixels directly to a `<canvas>` `2dContext`. This low-level architecture gives pixel8 a proper "8-bit" aesthetic, solid performance, and lets future development easily take advantage of new and experimental browser APIs such as `OffscreenCanvas`, `SharedArrayBuffer`, and `WebAssembly`.

- **Customizable:** There are no limitations on color palettes, resolutions, memory/cpu usage, etc. You can make your app look like it was created on a ZX Spectrum or a Game Boy. It's entirely up to you. And it's up to the community to develop an ecosystem of tools and libraries that can enforce tasteful constraints for those who wish to opt-in to them.

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

You should definitely check out the **[interactive documentation](https://pixel8.vsmode.org/)**...but if you're looking for a quick start...

### Option 1 - Vanilla

pixel8 comes with it's own tiny vdom implementation, so it works out-of-the-box without any external libraries like React. If you want to take this approach, here's what it looks like:

```js
import { h, render } from 'pixel8'
// @jsx h

const App = ({ frame }) => {
  return (
    <stage fps={30} width={64} height={64} scale={6} background="#000">
    {/*
      * You can use the following components:
      * <rect>, <circ>, <pixel>, <text>, <sprite>, <transition>, <animation> and <buffer>
      * Read the API documentation at https://pixel8.vsmode.org/#drawing-shapes
      */}
    </stage>
  )
}

// the #root element should be a HTMLCanvasElement
render(App, document.getElementById('root'))

```

### Option 2 - React

If you want to use pixel8 with React, that's cool too! The general idea is that you want to start off with something like this:

```js
import React from 'react'
import { render } from 'react-dom'
import { Stage } from 'pixel8'

const App = () => (
  <Stage fps={30} width={64} height={64} scale={6} background="#000">
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

[![Handling user input example app screenshot](/assets/handling-user-input.png)](https://codesandbox.io/s/r75ymwn34o)

[![Edit pixel8 Demo - Keyboard Interaction](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/r75ymwn34o)


### Simple Pixel Editor

[![Simple pixel editor example app screenshot](/assets/simple-pixel-editor.png)](https://codesandbox.io/s/0pvmw4k20l)

[![Edit pixel8 Demo - Pixel Editor](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/0pvmw4k20l)

## Community

You can join the pixel8 community online in several places:

- [Code Sandbox](https://codesandbox.io/search?query=&refinementList%5Bnpm_dependencies.dependency%5D%5B0%5D=pixel8&page=1)
- [Gitter](https://gitter.im/vsmode/pixel8)
- [Twitter](https://twitter.com/jozanza)

### Issues? Questions? Contributions?

If you **find a bug**, have a cool **idea for a feature**, want to see some specific **code examples/tutorials**, or just want to **say hello**, please get in touch! Feel free to [create an issue](https://github.com/vsmode/pixel8/issues), jump into the [gitter channel](https://gitter.im/vsmode/pixel8), or shoot me a message on [twitter](https://twitter.com/jozanza)

## License

pixel8 is MIT licensed. See [LICENSE](/LICENSE.md).

<p align="center"><strong>♥</strong></p>
