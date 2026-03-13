// src/objects/score-text-3d.js
import { CustomAnimation } from '../../libs/animation'

class ScoreText3D {
  showScore(scene, score, position) {
    // 兼容微信小游戏与浏览器测试环境
    const canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, 256, 256)
    
    // 动态色彩：连击越多，颜色越热烈（白 -> 金 -> 橙）
    ctx.fillStyle = score >= 6 ? '#FF4500' : (score >= 4 ? '#FFD700' : '#FFFFFF')
    ctx.font = 'bold 100px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 增加文字阴影，让 3D 空间里的数字更立体清晰
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 4
    ctx.fillText(`+${score}`, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true, 
      depthTest: false // 取消深度测试，保证分数不会被方块遮挡
    })
    const sprite = new THREE.Sprite(material)
    
    sprite.scale.set(6, 6, 1)
    // 初始位置设在命中方块的正上方
    sprite.position.set(position.x, position.y + 6, position.z)
    sprite.renderOrder = 100 
    scene.add(sprite)

    // 组合动画：向上飘动 8 个单位的同时，透明度逐渐归零，最后销毁释放内存
    CustomAnimation.to(sprite.position, { y: sprite.position.y + 8 }, 0.8)
    CustomAnimation.to(material, { opacity: 0 }, 0.8, 'Linear', () => {
      scene.remove(sprite)
      texture.dispose()
      material.dispose()
    })
  }
}

export default new ScoreText3D()