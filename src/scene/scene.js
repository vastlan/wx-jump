import camera from './camera'
import light from './light'
import background from '../objects/background'

class Scene {
  constructor() {
    this.instance = null
  }

  init() {
    const instance = this.instance = new THREE.Scene()
    const renderer = this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      // 开启抗锯齿
      antilias: true,
      preserveDrawingBuffer: true
    })

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap

    this.camera = camera
    this.light = light
    this.camera.init()
    this.light.init()

    this.axesHelper = new THREE.AxesHelper(100)

    instance.add(this.axesHelper)
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