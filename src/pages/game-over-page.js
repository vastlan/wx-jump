// src/pages/game-over-page.js
import { camera } from '../scene/index'

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
  }

  init(options) {
    this.scene = options.scene
    
    // 使用 Canvas 绘制一张带半透明遮罩的 GameOver 贴图
    this.canvas = document.createElement('canvas')
    this.canvas.width = 512
    this.canvas.height = 512
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    this.instance.scale.set(30, 30, 1)
    this.instance.position.set(0, 0, -10) // 放在相机正前方居中
    this.instance.renderOrder = 200     // 层级最高，遮挡一切
    this.instance.visible = false
    
    camera.instance.add(this.instance)

    this.bindTouchEvent()
  }

  draw() {
    this.ctx.clearRect(0, 0, 512, 512)
    // 半透明黑底遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, 512, 512)
    
    // 绘制文案
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 60px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('游戏结束', 256, 180)
    
    this.ctx.font = '40px Arial'
    this.ctx.fillText('点击屏幕重新开始', 256, 300)
    
    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    wx.onTouchEnd(() => {
      // 只有在结算页面显示时，点击屏幕才会触发重开
      if (this.isVisible) {
        if (this.callbacks && this.callbacks.gameRestart) {
          this.callbacks.gameRestart()
        }
      }
    })
  }

  show() {
    this.isVisible = true
    this.draw()
    this.instance.visible = true
  }

  hide() {
    this.isVisible = false
    this.instance.visible = false
  }
}