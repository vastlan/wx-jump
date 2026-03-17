// src/objects/score-text-3d.js
import { CustomAnimation } from '../../libs/animation'

class ScoreText3D {
  constructor() {
    // 核心修复：将 Canvas 实例化移到构造函数中！
    // 全局生命周期内只创建一个 Canvas 实例，绝不重复占用原生内存
    this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    this.canvas.width = 256
    this.canvas.height = 256
    this.ctx = this.canvas.getContext('2d')
  }

  showScore(scene, score, position) {
    // 每次绘制前，清理这个唯一画布的上一帧内容
    this.ctx.clearRect(0, 0, 256, 256)
    
    // 重新绘制新分数
    this.ctx.fillStyle = score >= 6 ? '#FF4500' : (score >= 4 ? '#FFD700' : '#FFFFFF')
    this.ctx.font = 'bold 100px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    this.ctx.shadowBlur = 10
    this.ctx.shadowOffsetX = 4
    this.ctx.shadowOffsetY = 4
    this.ctx.fillText(`+${score}`, 128, 128)

    // 从画布抓取像素生成 WebGL 材质 (Texture 可以在动画结束后销毁)
    const texture = new THREE.CanvasTexture(this.canvas)
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      depthTest: false 
    })
    const sprite = new THREE.Sprite(material)
    
    sprite.scale.set(6, 6, 1)
    sprite.position.set(position.x, position.y + 6, position.z)
    sprite.renderOrder = 100 
    scene.add(sprite)

    CustomAnimation.to(sprite.position, { y: sprite.position.y + 8 }, 0.8)
    CustomAnimation.to(material, { opacity: 0 }, 0.8, 'Linear', () => {
      scene.remove(sprite)
      texture.dispose()  // 释放 WebGL Texture 内存
      material.dispose() // 释放 Material 内存
    })
  }
}

export default new ScoreText3D()