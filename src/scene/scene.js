// src/scene/scene.js
import camera from './camera.js'
import light from './light.js'
import background from '../objects/background.js'

class Scene {
  constructor() {
    this.instance = null
  }

  init() {
    const instance = this.instance = new THREE.Scene()
    const renderer = this.renderer = new THREE.WebGLRenderer({
      canvas: typeof wx !== 'undefined' ? canvas : document.createElement('canvas'),
      antialias: true,
      preserveDrawingBuffer: true
    })

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap

    this.camera = camera
    this.light = light
    this.camera.init()
    this.light.init()

    instance.add(this.camera.instance)
    for (let lightType in this.light.instances) {
      instance.add(this.light.instances[lightType])
    }

    this.background = background
    this.background.init()
    background.instance.position.z = -84
    camera.instance.add(background.instance)
  }

  render() {
    // 驱动背景颜色的平滑渐变
    if (this.background) {
      this.background.update()
    }
    this.renderer.render(this.instance, this.camera.instance)
  }
}
export default new Scene()