// src/pages/game-over-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model' // 引入 model 以获取分数

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false 
  }

  init(options) {
    this.scene = options.scene
    
    this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    this.canvas.width = 512
    this.canvas.height = 512
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    this.instance.scale.set(30, 30, 1)
    this.instance.position.set(0, 0, -10) 
    this.instance.renderOrder = 200     
    this.instance.visible = false
    
    camera.instance.add(this.instance)

    this.bindTouchEvent()
  }

  draw() {
    this.ctx.clearRect(0, 0, 512, 512)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, 512, 512)
    
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 60px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('游戏结束', 256, 150)
    
    // 核心升级：死亡结算展示本次得分与历史最高分
    this.ctx.font = '35px Arial'
    this.ctx.fillText(`本次得分: ${gameModel.score}`, 256, 230)
    this.ctx.fillText(`历史最高: ${gameModel.highestScore}`, 256, 280)
    
    this.ctx.font = '40px Arial'
    this.ctx.fillText('点击屏幕重新开始', 256, 380)
    
    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleRestart = () => {
      if (this.isVisible) {
        if (this.callbacks && this.callbacks.gameRestart) {
          this.callbacks.gameRestart()
        }
      }
    }

    if (typeof wx !== 'undefined') {
      wx.onTouchEnd(handleRestart)
    } else {
      window.addEventListener('touchend', handleRestart)
      window.addEventListener('mouseup', handleRestart) 
    }
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