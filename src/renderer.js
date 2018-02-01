import Reconciler from 'react-reconciler'

export default createElement => {
  /** Reconciler */
  const Pixel8Renderer = Reconciler({
    /**
     * Host context getters
     */
    getRootHostContext: root => root,
    getChildHostContext: root => root,
    /**
     * Component instance creation
     */
    createInstance: function createInstance(type, props, root, host, fiber) {
      return createElement(type, props, root.pixel8, null)
    },
    appendInitialChild: (parent, child) => {
      parent.appendChild(child)
    },
    /**
     * Manage prop updates
     */
    finalizeInitialChildren: (host, type, props) => {
      return false
    },
    prepareForCommit: () => {},
    resetAfterCommit: () => {},
    prepareUpdate: (instance, type, props, nextProps) => {
      return { ...props, ...nextProps }
    },
    /**
     * Text handling
     */
    createTextInstance: (text, root, fiber) => {
      throw new Error('Raw text children are not supported by <Stage>')
    },
    commitTextUpdate: () => {
      throw new Error('Raw text children are not supported by <Stage>')
    },
    resetTextContent: elem => {
      throw new Error('Raw text children are not supported by <Stage>')
    },
    shouldSetTextContent: () => false,
    /**
     * Other stuff
     */
    getPublicInstance: inst => inst,
    shouldDeprioritizeSubtree: (type, props) => false,
    now: () => {},
    useSyncScheduling: true,
    /**
     * Mutations
     */
    mutation: {
      appendChild: (parent, child) => {
        parent.appendChild(child)
      },
      appendChildToContainer: (parent, child) => {
        parent.appendChild(child)
      },
      insertBefore: (parent, child, beforeChild) => {
        parent.appendChild(child)
      },
      insertInContainerBefore: (parent, child, beforeChild) => {
        parent.appendChild(child)
      },
      removeChild: (parent, child) => {
        parent.removeChild(child)
      },
      removeChildFromContainer: (parent, child) => {
        parent.removeChild(child)
      },
      commitUpdate: (inst, payload, type, props, nextProps) => {
        inst.setProps(payload)
      },
      commitMount: (inst, payload, type, props, nextProps) => {},
      commitTextUpdate: (inst, text, nextText) => {
        throw new Error('Raw text children are not supported by <Stage>')
      },
    },
  })

  let injected = false
  const injectIntoDevTools = () => {
    if (injected) return
    injected = true
    Pixel8Renderer.injectIntoDevTools({
      bundleType: 1, // 0 for PROD, 1 for DEV
      version: '0.0.0', // version for your renderer
      rendererPackageName: 'pixel8-renderer', // package name
      findHostInstanceByFiber: Pixel8Renderer.findHostInstance, // host instance (root)
    })
  }

  const render = stage => {
    injectIntoDevTools()
    stage.root =
      stage.root || Pixel8Renderer.createContainer(stage, stage.canvas)
    Pixel8Renderer.updateContainer(stage.props.children, stage.root, stage)
  }

  const unmount = stage => {
    Pixel8Renderer.updateContainer(null, stage.root, stage)
  }

  return {
    injectIntoDevTools,
    render,
    unmount,
    Pixel8Renderer,
  }
}
