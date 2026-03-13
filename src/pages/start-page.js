// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'

export default class StartPage {
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
    
    // 半透明背景，透出后面准备好的游戏场景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    this.ctx.fillRect(0, 0, 512, 512)
    
    // 游戏标题
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 80px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('跳 一 跳', 256, 160)
    
    // 展示历史最高分
    this.ctx.font = '30px Arial'
    this.ctx.fillStyle = '#cccccc'
    this.ctx.fillText(`历史最高分: ${gameModel.highestScore}`, 256, 240)
    
    // 核心修复：弃用具有兼容性风险的 roundRect，使用原生 arcTo 绘制绝对安全的圆角按钮
    this.ctx.fillStyle = '#F4A460' 
    const btnX = 136, btnY = 320, btnW = 240, btnH = 70, radius = 35

    this.ctx.beginPath()
    this.ctx.moveTo(btnX + radius, btnY)
    this.ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + btnH, radius)
    this.ctx.arcTo(btnX + btnW, btnY + btnH, btnX, btnY + btnH, radius)
    this.ctx.arcTo(btnX, btnY + btnH, btnX, btnY, radius)
    this.ctx.arcTo(btnX, btnY, btnX + btnW, btnY, radius)
    this.ctx.closePath()
    this.ctx.fill()
    
    // 按钮文字
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 36px Arial'
    this.ctx.fillText('开始游戏', 256, 368) 
    
    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleStart = () => {
      if (this.isVisible) {
        if (this.callbacks && this.callbacks.gameStart) {
          this.callbacks.gameStart()
        }
      }
    }

    if (typeof wx !== 'undefined') {
      wx.onTouchEnd(handleStart)
    } else {
      window.addEventListener('touchend', handleStart)
      window.addEventListener('mouseup', handleStart)
    }
  }

  show() {
    this.isVisible = true
    this.draw() // 每次显示时重新获取最新分数
    this.instance.visible = true
  }

  hide() {
    this.isVisible = false
    this.instance.visible = false
  }
}