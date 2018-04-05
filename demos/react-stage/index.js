import React, { Component } from 'react'
import * as DOM from 'react-dom'
import { Pixel8 } from '../../src/react/Pixel8'

const App = ({ state, mutations }) => (
  <Pixel8 onKeyDown={e => mutations.moveN(e.key, 8)}>
    {({ frame }) => {
      const { x, y } = state
      for (const iter of mutations.moveN) {
        // console.log(iter)
        iter.next()
      }
      return (
        <stage
          fps={60}
          width={128}
          height={128}
          scale={3}
          background="#000"
          overflow="repeat"
        >
          <Bar x={10} y={10}>
            {/* <rect x={0} y={10} height={64} width={64} fill="#fff"> */}
            <circ x={x} y={y} radius={4} fill="#f00" />
            {/* </rect> */}
          </Bar>
          {/* <circ x={x} y={y} radius={8} fill="#f0f" /> */}
        </stage>
      )
    }}
  </Pixel8>
)

const Foo = ({ x = 0, y = 0, children }) => (
  <rect x={x} y={y} height={64} width={64} fill="#fff" overflow="repeat">
    {children}
  </rect>
)

const Bar = ({ x = 0, y = 0, children }) => (
  <rect x={x} y={y} height={64} width={64} fill="#f0f">
    <Foo x={10} y={10}>
      {children}
    </Foo>
  </rect>
)

async function move(state, key) {
  switch (key) {
    case 'ArrowUp':
      state.y -= 1
      break
    case 'ArrowDown':
      state.y += 1
      break
    case 'ArrowLeft':
      state.x -= 1
      break
    case 'ArrowRight':
      state.x += 1
      break
  }
}
move.isAsync = true

function* moveN(state, key, n) {
  // console.log(state, key, n)
  switch (key) {
    case 'ArrowUp':
      while (n--) yield (state.y -= 1)
      break
    case 'ArrowDown':
      while (n--) yield (state.y += 1)
      break
    case 'ArrowLeft':
      while (n--) yield (state.x -= 1)
      break
    case 'ArrowRight':
      while (n--) yield (state.x += 1)
      break
  }
}

const bindMutations = (state, mutations, { debug = new Set() } = {}) =>
  mutations.reduce(
    (a, b) => ({
      ...a,
      [b.name]:
        b.constructor.name === 'GeneratorFunction' || b.isGenerator
          ? (() => {
              const iters = new Set()
              const callIterMethod = (iter, k, iterProxy) => (...args) => {
                const res = iter[k](...args)
                if (res.done) iters.delete(iterProxy)
                return res
              }
              const proxy = new Proxy(b, {
                apply(target, ctx, args) {
                  const iter = target.call(ctx, state, ...args)
                  const iterProxy = new Proxy(iter, {
                    get(target, key) {
                      return 'function' === typeof target[key]
                        ? callIterMethod(target, key, iterProxy)
                        : target[key]
                    },
                  })
                  iters.add(iterProxy)
                },
              })
              proxy[Symbol.iterator] = () => iters[Symbol.iterator]()
              return proxy
            })()
          : b.constructor.name === 'AsyncFunction' || b.isAsync
            ? new Proxy(b, {
                async apply(target, ctx, args) {
                  const id = Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1)
                  try {
                    if (debug.has(target)) {
                      console.groupCollapsed(
                        `✨ ${target.name} (1/2) ${id} | ${args.map(x =>
                          JSON.stringify(x),
                        )}`,
                      )
                      console.log('[in]', JSON.stringify(state))
                      console.groupEnd()
                    }
                    const out = await target.call(ctx, state, ...args)
                    if (debug.has(target)) {
                      console.groupCollapsed(
                        `✨ ${target.name} (2/2) ${id} | ${args.map(x =>
                          JSON.stringify(x),
                        )}`,
                      )
                      console.log('[success]', JSON.stringify(state))
                      console.groupEnd()
                    }
                  } catch (err) {
                    if (debug.has(target)) {
                      console.groupCollapsed(
                        `✨ ${target.name} (1/2) | ${args.map(x =>
                          JSON.stringify(x),
                        )}`,
                      )
                      console.log('[error]', err)
                      console.groupEnd()
                    }
                  }
                },
              })
            : new Proxy(b, {
                apply(target, ctx, args) {
                  if (debug.has(target)) {
                    console.groupCollapsed(
                      `✨ ${target.name} | ${args.map(x => JSON.stringify(x))}`,
                    )
                    console.log('[in]', JSON.stringify(state))
                    // console.log('[args]', ...args)
                  }
                  const out = target.call(ctx, state, ...args)
                  if (debug.has(target)) {
                    console.log('[out]', JSON.stringify(state))
                    console.groupEnd()
                  }
                  return out
                },
              }),
    }),
    {},
  )

const initialize = (state, mutations, options) => ({
  state,
  mutations: bindMutations(state, mutations, options),
})

const appProps = initialize({ x: 0, y: 0 }, [move, moveN], {
  debug: new Set([move, moveN]),
})

console.clear()
console.log(appProps)

DOM.render(<App {...appProps} />, document.getElementById('root'))
