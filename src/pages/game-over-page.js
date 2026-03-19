// src/pages/game-over-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

const comicFont = `"Comic Sans MS", "Chalkboard SE", "Marker Felt", "PingFang SC", "Microsoft YaHei", sans-serif`;
const INK_COLOR = '#2A2A2A'; 
const PAPER_COLOR = '#FDF9F1'; 

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false 

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.hitboxes = {
      replay: { x: 0, y: 0, w: 0, h: 0 },
      share: { x: 0, y: 0, w: 0, h: 0 },
      home: { x: 0, y: 0, w: 0, h: 0 },
      store: { x: 0, y: 0, w: 0, h: 0 },
      rank: { x: 0, y: 0, w: 0, h: 0 }
    }
  }

  init(options = {}) {
    this.scene = options.scene || null
    
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
    this.bindTouchEvent()
  }

  drawSketchBox(ctx, x, y, w, h, radius) {
    ctx.fillStyle = INK_COLOR;
    this.roundRect(ctx, x + 4, y + 4, w, h, radius);
    ctx.fill();

    ctx.fillStyle = PAPER_COLOR;
    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = INK_COLOR;
    ctx.stroke();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    this.ctx.fillStyle = 'rgba(253, 249, 241, 0.90)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    const cx = this.width / 2

    this.ctx.fillStyle = INK_COLOR
    this.ctx.font = `bold ${Math.floor(this.width * 0.05)}px ${comicFont}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('本次得分', cx, this.height * 0.15)

    const scoreFontSize = Math.floor(this.width * 0.30) 
    this.ctx.font = `bold ${scoreFontSize}px ${comicFont}`
    this.ctx.fillText(gameModel.score.toString(), cx, this.height * 0.28)

    this.ctx.fillStyle = '#888888' 
    const highScoreFontSize = Math.floor(this.width * 0.045)
    this.ctx.font = `${highScoreFontSize}px ${comicFont}`
    this.ctx.fillText(`最高记录: ${gameModel.highestScore}`, cx, this.height * 0.40)

    const baseWidth = this.width * 0.60 
    const btnHeight = this.height * 0.075     
    const gap = this.height * 0.035     
    const baseX = cx - baseWidth / 2;

    // ✨ 1. 再玩一局 
    const replayY = this.height * 0.48;
    this.drawSketchBox(this.ctx, baseX, replayY, baseWidth, btnHeight, btnHeight / 2);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.05)}px ${comicFont}`;
    this.ctx.fillText('再玩一局', cx, replayY + btnHeight / 2);
    this.hitboxes.replay = { x: baseX, y: replayY, w: baseWidth, h: btnHeight };

    // ✨ 2. 分享复活
    const shareY = replayY + btnHeight + gap;
    this.drawSketchBox(this.ctx, baseX, shareY, baseWidth, btnHeight, btnHeight / 2);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.fillText('分享好友复活', cx, shareY + btnHeight / 2);
    this.hitboxes.share = { x: baseX, y: shareY, w: baseWidth, h: btnHeight };

    // ✨ 3. 底部功能矩阵 (三等分，完美对齐 baseWidth 两端！)
    const subBtnY = shareY + btnHeight + gap * 1.5;
    const subGap = 12; // 按钮间距
    const subBtnW = (baseWidth - subGap * 2) / 3;
    
    const homeX = baseX;
    const storeX = baseX + subBtnW + subGap;
    const rankX = baseX + baseWidth - subBtnW;

    this.drawSketchBox(this.ctx, homeX, subBtnY, subBtnW, btnHeight * 0.75, (btnHeight * 0.75) / 2);
    this.drawSketchBox(this.ctx, storeX, subBtnY, subBtnW, btnHeight * 0.75, (btnHeight * 0.75) / 2);
    this.drawSketchBox(this.ctx, rankX, subBtnY, subBtnW, btnHeight * 0.75, (btnHeight * 0.75) / 2);

    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.035)}px ${comicFont}`;
    const textY = subBtnY + (btnHeight * 0.75) / 2;
    
    this.ctx.fillText('首页', homeX + subBtnW / 2, textY);
    this.ctx.fillText('商城', storeX + subBtnW / 2, textY);
    this.ctx.fillText('排行榜', rankX + subBtnW / 2, textY);

    this.hitboxes.home = { x: homeX, y: subBtnY, w: subBtnW, h: btnHeight * 0.75 };
    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: btnHeight * 0.75 };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: btnHeight * 0.75 };

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

      const padding = 15 
      const checkHit = (box) => clientX >= box.x - padding && clientX <= box.x + box.w + padding && clientY >= box.y - padding && clientY <= box.y + box.h + padding;

      if (checkHit(this.hitboxes.share)) {
        if (typeof wx !== 'undefined' && wx.showShareMenu) wx.showShareMenu({ withShareTicket: true }) 
        return
      }
      if (checkHit(this.hitboxes.replay)) {
        if (this.callbacks && this.callbacks.gameRestart) this.callbacks.gameRestart()
        return
      }
      if (checkHit(this.hitboxes.home)) {
        if (this.callbacks && this.callbacks.goHome) this.callbacks.goHome()
        return
      }
      if (checkHit(this.hitboxes.store)) {
        if (this.callbacks && this.callbacks.showStore) this.callbacks.showStore()
        return
      }
      if (checkHit(this.hitboxes.rank)) {
        if (typeof wx !== 'undefined' && wx.showToast) wx.showToast({ title: '排行榜开发中', icon: 'none' })
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
    this.draw() 
    this.instance.visible = true
  }

  hide() {
    this.isVisible = false
    this.instance.visible = false
  }
}