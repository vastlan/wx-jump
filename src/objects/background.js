// src/objects/background.js
import sceneConf from '../../confs/scene-conf'
import * as THREE from '../../libs/three.js'

class Background {
  constructor() {
    this.instance = null
    this.material = null
    this.targetColor = null
  }

  // 🎨 混合方案：程序化绘制背景径向渐变贴图
  createGradientTexture() {
    const canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext('2d')

    // 绘制径向渐变，产生微微的 Vignette (暗角) 效果，突出中心舞台
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 360)
    gradient.addColorStop(0, '#FFFFFF') // 中心纯白
    gradient.addColorStop(0.3, '#FAF9F6') // 微微暖白
    gradient.addColorStop(1, '#E9E7E0')   // 边缘浅灰
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)

    return new THREE.CanvasTexture(canvas)
  }

  init() {
    const geometry = new THREE.PlaneGeometry(300, 300)
    // 使用混合材质：高档的径向渐变贴图
    const tex = this.createGradientTexture()
    this.material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, // 基础色设为白
      map: tex, // 贴上我们的程序化贴图
      transparent: true,
      depthWrite: false // 确保背景永远在最底层
    })
    this.instance = new THREE.Mesh(geometry, this.material)
    
    // 初始化锁定我们自己设计的背景氛围色
    this.targetColor = new THREE.Color(0xF4F1EA) 
  }

  setTargetColor(hexColor) {
    // 强制屏蔽原版 game-page.js 传进来的丑陋死灰 (#E8E8E8)
    this.targetColor = new THREE.Color(0xF4F1EA)
  }

  update() {
    if (this.material && this.targetColor) {
      this.material.color.lerp(this.targetColor, 0.05)
    }
  }
}

export default new Background()