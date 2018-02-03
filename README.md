
<div align="center">
  <img src="/assets/logo.png" />
  <h1>P I X E L 8</h1>  
</div>

[![NPM Version](https://img.shields.io/npm/v/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![NPM Downloads](https://img.shields.io/npm/dm/pixel8.svg?style=flat)](https://www.npmjs.org/package/pixel8)
[![Join the chat at https://gitter.im/vsmode/pixel8](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vsmode/pixel8?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A collection of low-res primitives for creating art and games in JSX

- **Easy-to-use:** Most game frameworks require a lot of reading and experimentation to get up-to-speed. Pixel8 puts JSX at its core so you create low-res UIs just like you would any other. Not to mention, you can still use all of the tools and libraries you do in all your other projects.

- **Performant:** Under the hood, Pixel8 avoids Canvas's stateful/mutable API and relies primarily on `ArrayBuffer`s to render bytes representing pixels directly to a `<canvas>` `2dContext`. This low-level architecture gives Pixel8 a proper "8-bit" aesthetic, solid performance, and lets future development easily take advantage of new and experimental browser APIs such as `OffscreenCanvas`, `SharedArrayBuffer`, and `WebAssembly`.

- **Customizable:** As much as possible, Pixel8 doesn't make any assumptions about what you're going for. There are no limitations on color palettes, resolutions, memory/cpu usage, etc. You can make your canvas look like it was created on a ZX Spectrum or a Game Boy. It's entirely up to you. And it's up to the community to develop an ecosystem of tools and libraries that can enforce tasteful constraints for those who wish to opt-in to them.

## Installation

```bash
yarn add pixel8
```

## Getting Started

Definitely check out the interactive documentation at [https://pixel8.vsmode.org/](https://pixel8.vsmode.org/). But if you're looking for a quick start, you probably want to do something like this:

```js
import React from 'react'
import { render } from 'react-dom'
import { Stage } from 'pixel8'

const App = () => (
  <Stage
    width={64}
    height={64}
    scale={8}
    fps={0}
    gridColor="#f4f4f4"
    background="#fff">
    {/*
      * Insert your code here!
      */}
  </Stage>
)

render(<App />, document.getElementById('root'))

```

## Issues? Questions? Contributions?

Feel free to [create an issue](https://github.com/vsmode/pixel8/issues), jump into the [gitter channel](https://gitter.im/vsmode/pixel8), or shoot me a message on [twitter](https://twitter.com/jozanza)
