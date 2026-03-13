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
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true
    })

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap

    this.camera = camera
    this.light = light
    this.camera.init()
    this.light.init()

    // 升级四：移除测试用的 AxesHelper，让画面彻底干净
    // this.axesHelper = new THREE.AxesHelper(100)
    // instance.add(this.axesHelper)

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
    this.renderer.render(this.instance, this.camera.instance)
  }
}
export default new Scene()