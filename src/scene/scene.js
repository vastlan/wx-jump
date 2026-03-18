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
      antialias: true, // 开启底层抗锯齿
      preserveDrawingBuffer: true
    })

    // ==========================================
    // 【核心修复】：视网膜高清渲染自适应
    // 彻底解决真机模糊、边缘马赛克、画质发虚的问题！
    // ==========================================
    let width = window.innerWidth
    let height = window.innerHeight
    let dpr = window.devicePixelRatio || 2

    // 兼容微信小程序的原生系统 API 获取
    if (typeof wx !== 'undefined') {
      const sysInfo = wx.getSystemInfoSync()
      width = sysInfo.windowWidth
      height = sysInfo.windowHeight
      // 获取真实像素比，为了防止部分低端安卓机性能暴跌，最高限制为 3
      dpr = Math.min(sysInfo.pixelRatio, 3) 
    }

    // 1. 强制渲染器覆盖全屏真实尺寸
    renderer.setSize(width, height)
    // 2. 注入物理高清像素比（这是干掉马赛克的灵魂代码！）
    renderer.setPixelRatio(dpr)
    // ==========================================

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