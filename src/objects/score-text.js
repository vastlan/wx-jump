// src/objects/score-text.js
import { camera } from '../scene/index'

class ScoreText {
  constructor() {
    this.instance = null
  }

  init() {
    // 借用 HTML5 Canvas 绘制 2D 文字
    this.canvas = document.createElement('canvas')
    this.canvas.width = 512
    this.canvas.height = 512
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)

    // 创建精灵材质，关闭深度测试保证 UI 永远在最上层显示
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    
    // 缩放尺寸适配相机视锥体
    this.instance.scale.set(15, 15, 1)
    // 放到屏幕左上方 (正交相机视野内)
    this.instance.position.set(-10, 20, -20) 
    this.instance.renderOrder = 100 
    
    // 将计分板直接挂载到相机上，这样不管相机怎么移动，分数永远固定在屏幕左上角
    camera.instance.add(this.instance)

    this.updateScore(0)
  }

  // 对外暴露的更新分数方法
  updateScore(score) {
    this.ctx.clearRect(0, 0, 512, 512)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.font = 'bold 80px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(`得分: ${score}`, 20, 20)
    
    // 通知 Three.js 纹理已更新，需要重新渲染
    this.texture.needsUpdate = true
  }
}

export default new ScoreText()