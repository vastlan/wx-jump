// src/pages/game-over-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false 

    this.images = {}
    this.loadedCount = 0

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.hitboxes = {
      replay: { x: 0, y: 0, w: 0, h: 0 },
      rank: { x: 0, y: 0, w: 0, h: 0 },
      share: { x: 0, y: 0, w: 0, h: 0 }
    }

    this.animFrame = null
    this.animTime = 0
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
      replay: 'res/images/replay.png', 
      rank: 'res/images/rank.png',      
      share: 'res/images/pure_share.png' 
    }
    const keys = Object.keys(assets)

    keys.forEach(key => {
      const img = typeof wx !== 'undefined' ? wx.createImage() : new Image()
      img.src = assets[key]
      img.onload = () => {
        this.images[key] = img
        this.loadedCount++
      }
    })
  }

  animate() {
    if (!this.isVisible) return
    
    this.animTime += 0.06 
    this.draw() 
    
    const reqAnim = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout
    this.animFrame = reqAnim(this.animate.bind(this), 16)
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    if (this.loadedCount < 3) {
      this.texture.needsUpdate = true
      return
    }

    const cx = this.width / 2

    // 1. 顶部得分信息
    this.ctx.fillStyle = '#cccccc'
    this.ctx.font = `${Math.floor(this.width * 0.05)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('本次得分', cx, this.height * 0.14)

    this.ctx.fillStyle = '#ffffff'
    const scoreFontSize = Math.floor(this.width * 0.28) 
    this.ctx.font = `bold ${scoreFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    this.ctx.fillText(gameModel.score.toString(), cx, this.height * 0.26)

    this.ctx.fillStyle = '#888888' 
    const highScoreFontSize = Math.floor(this.width * 0.04)
    this.ctx.font = `${highScoreFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    this.ctx.fillText(`历史最高分: ${gameModel.highestScore}`, cx, this.height * 0.38)

    // ========================================================
    // 核心重构：垂直居中布局 (Vertical Stack)
    // ========================================================
    const baseWidth = this.width * 0.55 // 确立“再玩一局”和“分享”的统一宽度标准 (屏宽55%)
    const gap = this.height * 0.035     // 垂直间距

    // 2. 顶部：“再来一局”按钮（纯图片）
    const replayImg = this.images.replay
    const replayW = baseWidth
    // 核心算法：读取原图宽高比，动态计算高度，绝对不压扁拉伸图片！
    const replayH = (replayImg.height / replayImg.width) * replayW 
    const replayY = this.height * 0.46 // 放置在分数下方
    const replayX = cx - replayW / 2
    
    this.ctx.drawImage(replayImg, replayX, replayY, replayW, replayH)
    this.hitboxes.replay = { x: replayX, y: replayY, w: replayW, h: replayH }
    // 备注：根据你的要求，去除了多余的“再玩一局”文字。

    // 3. 中部：“分享好友复活”按钮（翠绿色 + 呼吸动画）
    const shareY = replayY + replayH + gap // 紧贴再来一局按钮下方
    const scale = 1 + 0.05 * Math.sin(this.animTime) 
    const baseShareH = this.width * 0.13
    
    const shareW = baseWidth * scale // 宽度跟随动画呼吸
    const shareH = baseShareH * scale
    const shareX = cx - shareW / 2
    const shareDrawY = shareY - (shareH - baseShareH) / 2 
    
    // 鲜艳诱导的圆角背景
    this.ctx.fillStyle = '#07C160' 
    const radius = shareH / 2
    this.ctx.beginPath()
    this.ctx.moveTo(shareX + radius, shareDrawY)
    this.ctx.arcTo(shareX + shareW, shareDrawY, shareX + shareW, shareDrawY + shareH, radius)
    this.ctx.arcTo(shareX + shareW, shareDrawY + shareH, shareX, shareDrawY + shareH, radius)
    this.ctx.arcTo(shareX, shareDrawY + shareH, shareX, shareDrawY, radius)
    this.ctx.arcTo(shareX, shareDrawY, shareX + shareW, shareDrawY, radius)
    this.ctx.closePath()
    this.ctx.fill()

    // Icon 和文案
    this.ctx.fillStyle = '#ffffff'
    const shareFontSize = Math.floor(this.width * 0.045 * scale)
    this.ctx.font = `bold ${shareFontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`
    
    const shareIcon = this.images.share
    const iconH = shareH * 0.45
    const iconW = (shareIcon.width / shareIcon.height) * iconH
    const textW = this.ctx.measureText('分享好友复活').width
    const contentW = iconW + 10 + textW
    const contentStartX = cx - contentW / 2

    this.ctx.drawImage(shareIcon, contentStartX, shareDrawY + (shareH - iconH) / 2, iconW, iconH)
    this.ctx.textAlign = 'left'
    this.ctx.fillText('分享好友复活', contentStartX + iconW + 10, shareDrawY + shareH / 2)

    this.hitboxes.share = { x: cx - baseWidth/2, y: shareY, w: baseWidth, h: baseShareH }

    // 4. 底部：“排行榜”按钮（尺寸适中）
    const rankImg = this.images.rank
    const rankW = this.width * 0.1 // 尺寸明显小于上面的两个巨头，克制适中
    const rankH = (rankImg.height / rankImg.width) * rankW
    const rankY = shareY + baseShareH + gap + this.height * 0.02
    const rankX = cx - rankW / 2
    
    this.ctx.drawImage(rankImg, rankX, rankY, rankW, rankH)
    this.hitboxes.rank = { x: rankX, y: rankY, w: rankW, h: rankH }

    // 排行榜文字
    this.ctx.fillStyle = '#aaaaaa'
    this.ctx.font = `${Math.floor(this.width * 0.035)}px "Helvetica Neue", Arial`
    this.ctx.textAlign = 'center'
    this.ctx.fillText('排行榜', cx, rankY + rankH + this.height * 0.035)

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

      const padding = 20 

      const shareb = this.hitboxes.share
      if (clientX >= shareb.x - padding && clientX <= shareb.x + shareb.w + padding && clientY >= shareb.y - padding && clientY <= shareb.y + shareb.h + padding) {
        if (typeof wx !== 'undefined' && wx.showShareMenu) {
            wx.showShareMenu({ withShareTicket: true }) 
        } else if (typeof wx !== 'undefined' && wx.showToast) {
            wx.showToast({ title: '分享成功！即将复活...', icon: 'none' })
        }
        return
      }

      const rb = this.hitboxes.replay
      if (clientX >= rb.x - padding && clientX <= rb.x + rb.w + padding && clientY >= rb.y - padding && clientY <= rb.y + rb.h + padding) {
        if (this.callbacks && this.callbacks.gameRestart) this.callbacks.gameRestart()
        return
      }

      const rankb = this.hitboxes.rank
      if (clientX >= rankb.x - padding && clientX <= rankb.x + rankb.w + padding && clientY >= rankb.y - padding && clientY <= rankb.y + rankb.h + padding) {
        if (typeof wx !== 'undefined' && wx.showToast) wx.showToast({ title: '查看好友排行...', icon: 'none' })
        return
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
    this.animTime = 0
    this.animate() 
    this.instance.visible = true
  }

  hide() {
    this.isVisible = false
    this.instance.visible = false
    const cancelAnim = typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout
    if (this.animFrame) cancelAnim(this.animFrame)
  }
}