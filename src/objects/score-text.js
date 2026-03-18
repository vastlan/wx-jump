// src/objects/score-text.js
import { camera } from '../scene/index'
import sceneConf from '../../confs/scene-conf'

class ScoreText {
  constructor() {
    this.instance = null
    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight
  }

  init() {
    this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)

    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    
    const frustumSize = sceneConf.frustumSize 
    const aspect = this.height / this.width
    const camWidth = frustumSize * 2
    const camHeight = frustumSize * aspect + frustumSize
    const camCenterY = (frustumSize * aspect - frustumSize) / 2

    // this.instance.scale.set(camWidth, camHeight, 1)
    this.baseScale = { x: camWidth, y: camHeight }
    this.instance.scale.set(camWidth, camHeight, 1)
    this.instance.position.set(0, camCenterY, -10) 
    this.instance.renderOrder = 50 
    
    camera.instance.add(this.instance)

    this.updateScore(0)
  }

  updateCameraCompensation() {
    if (!camera || !camera.instance) return
  
    const zoom = camera.instance.zoom || 1
  
    // 🔥 关键：用 1/zoom 抵消
    this.instance.scale.set(
      this.baseScale.x / zoom,
      this.baseScale.y / zoom,
      1
    )
  }

  updateScore(score) {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // 完美复刻照片中的极简黑体数字
    this.ctx.fillStyle = 'rgba(40, 40, 40, 0.85)' // 极深的灰黑色
    const fontSize = Math.floor(this.width * 0.1) // 占比极大，冲击力强
    // 使用标准的黑体/无衬线粗体字
    this.ctx.font = `bold ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    
    // 直接渲染数字，不加任何前缀
    this.ctx.fillText(score.toString(), this.width * 0.08, this.height * 0.08)
    
    this.texture.needsUpdate = true
  }
}

export default new ScoreText()