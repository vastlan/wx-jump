// src/objects/score-text.js
import { camera } from '../scene/index'
import sceneConf from '../../confs/scene-conf'

// ✨ 同步使用草稿风专属安全字体和颜色
const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF';

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

    this.baseScale = { x: camWidth, y: camHeight }
    this.instance.scale.set(camWidth, camHeight, 1)
    this.instance.position.set(0, camCenterY, -10) 
    this.instance.renderOrder = 50 
    
    // ✨ 默认初始化时不显示，由视图控制器统一调度
    this.instance.visible = false 
    
    camera.instance.add(this.instance)

    this.updateScore(0)
  }

  // ✨ 暴露给控制器的方法
  show() {
    if (this.instance) this.instance.visible = true;
  }

  hide() {
    if (this.instance) this.instance.visible = false;
  }

  updateCameraCompensation() {
    if (!camera || !camera.instance) return
    const zoom = camera.instance.zoom || 1
    this.instance.scale.set(
      this.baseScale.x / zoom,
      this.baseScale.y / zoom,
      1
    )
  }

  updateScore(score) {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    const fontSize = Math.floor(this.width * 0.12) // 稍微放大一点增加张力
    this.ctx.font = `900 ${fontSize}px ${safeFont}`
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.lineJoin = 'round'
    this.ctx.lineCap = 'round'
    
    const text = score.toString()
    const startX = this.width * 0.08
    const startY = this.height * 0.08

    // ✨ 绘制贴纸感：底层纯白粗描边（防场景颜色遮挡），顶层墨水黑字
    const strokeWidth = Math.max(4, Math.floor(fontSize * 0.15))
    this.ctx.lineWidth = strokeWidth
    this.ctx.strokeStyle = PAPER_COLOR
    this.ctx.strokeText(text, startX, startY)
    
    this.ctx.fillStyle = INK_COLOR 
    this.ctx.fillText(text, startX, startY)
    
    this.texture.needsUpdate = true
  }
}

export default new ScoreText()