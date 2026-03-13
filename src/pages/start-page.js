// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

export default class StartPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false
    
    this.images = {}
    this.loadedCount = 0

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.playBtnHitbox = { x: 0, y: 0, w: 0, h: 0 }
  }

  init(options) {
    this.scene = options.scene
    
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

    this.instance.scale.set(camWidth, camHeight, 1)
    this.instance.position.set(0, camCenterY, -10) 
    
    this.instance.renderOrder = 200     
    this.instance.visible = false
    
    camera.instance.add(this.instance)

    this.loadImages()
    this.bindTouchEvent()
  }

  loadImages() {
    const assets = {
      title: 'res/images/title.png',
      play: 'res/images/play.png',   
      rank: 'res/images/rank.png'    
    }
    const keys = Object.keys(assets)

    keys.forEach(key => {
      const img = typeof wx !== 'undefined' ? wx.createImage() : new Image()
      img.src = assets[key]
      img.onload = () => {
        this.images[key] = img
        this.loadedCount++
        if (this.loadedCount === keys.length && this.isVisible) {
          this.draw()
        }
      }
    })
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // 沉浸式全屏遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    if (this.loadedCount < 3) {
      this.texture.needsUpdate = true
      return
    }

    // 屏幕中心线 X 坐标
    const cx = this.width / 2

    // 1. 绘制“跳一跳” Logo
    const titleImg = this.images.title
    const titleW = this.width * 0.65 
    const titleH = (titleImg.height / titleImg.width) * titleW 
    const titleY = this.height * 0.18 
    this.ctx.drawImage(titleImg, cx - titleW / 2, titleY, titleW, titleH)

    // 2. 绘制历史最高分
    this.ctx.fillStyle = '#ffffff'
    const fontSize = Math.max(16, Math.floor(this.width * 0.05))
    this.ctx.font = `bold ${fontSize}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`历史最高分: ${gameModel.highestScore}`, cx, titleY + titleH + fontSize * 2.5)

    // 3. 视觉微调：绘制“开始游戏”超大 Play 按钮（放大占比）
    const playImg = this.images.play
    const playW = this.width * 0.48 // 将尺寸从 40% 放大到 48%
    const playH = (playImg.height / playImg.width) * playW
    const playY = this.height * 0.52 // 稍微往上提一点，给下方的排行榜留空间
    this.ctx.drawImage(playImg, cx - playW / 2, playY, playW, playH)

    this.playBtnHitbox = {
      x: cx - playW / 2,
      y: playY,
      w: playW,
      h: playH
    }

    // 4. 视觉微调：绘制“排行榜”图标（按比例缩小，并严格居中对齐）
    const rankImg = this.images.rank
    const rankW = this.width * 0.13 // 相比 playW 显得小巧精致
    const rankH = (rankImg.height / rankImg.width) * rankW
    
    // 将排行榜移到屏幕正中央，位于 Play 按钮下方
    const rankX = cx - rankW / 2
    const rankY = playY + playH + this.height * 0.05 // 距离 Play 底部 5% 屏高
    this.ctx.drawImage(rankImg, rankX, rankY, rankW, rankH)
    
    // 排行榜文字严格居中
    this.ctx.fillStyle = '#e0e0e0'
    this.ctx.font = `${Math.floor(this.width * 0.035)}px Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText('排行榜', cx, rankY + rankH + fontSize * 1.2)

    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleTouch = (e) => {
      if (!this.isVisible) return

      let clientX, clientY
      if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      // 精准碰撞盒检测 (Hitbox)
      const { x, y, w, h } = this.playBtnHitbox
      const padding = 20 

      // 只有点击中央的超大 Play 按钮才能进入游戏
      if (
        clientX >= x - padding &&
        clientX <= x + w + padding &&
        clientY >= y - padding &&
        clientY <= y + h + padding
      ) {
        if (this.callbacks && this.callbacks.gameStart) {
          this.callbacks.gameStart()
        }
      }
    }

    if (typeof wx !== 'undefined') {
      wx.onTouchEnd(handleTouch)
    } else {
      window.addEventListener('touchend', handleTouch)
      window.addEventListener('mouseup', handleTouch)
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