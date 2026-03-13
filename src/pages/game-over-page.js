// src/pages/game-over-page.js
import { camera } from '../scene/index'

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false // 防止事件重复绑定
  }

  init(options) {
    this.scene = options.scene
    
    // 核心修复：兼容微信小游戏环境与浏览器测试环境的 Canvas 创建
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
    this.ctx.fillText('游戏结束', 256, 180)
    
    this.ctx.font = '40px Arial'
    this.ctx.fillText('点击屏幕重新开始', 256, 300)
    
    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleRestart = () => {
      if (this.isVisible) {
        console.log('GameOverPage: 触发重新开始')
        if (this.callbacks && this.callbacks.gameRestart) {
          this.callbacks.gameRestart()
        }
      }
    }

    // 核心修复：多环境触摸事件绑定，确保结算页面的点击能被准确拦截
    if (typeof wx !== 'undefined') {
      wx.onTouchEnd(handleRestart)
    } else {
      window.addEventListener('touchend', handleRestart)
      window.addEventListener('mouseup', handleRestart) // 兼容电脑端鼠标点击
    }
  }

  show() {
    console.log('GameOverPage: 显示结算界面')
    this.isVisible = true
    this.draw()
    this.instance.visible = true
  }

  hide() {
    console.log('GameOverPage: 隐藏结算界面')
    this.isVisible = false
    this.instance.visible = false
  }
}