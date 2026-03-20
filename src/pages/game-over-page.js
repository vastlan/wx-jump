// src/pages/game-over-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

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

  drawSketchyBox(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK_COLOR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(x + 2, y + 3);
    ctx.lineTo(x + w + 1, y - 1);
    ctx.lineTo(x + w - 1, y + h + 2);
    ctx.lineTo(x - 2, y + h - 1);
    ctx.lineTo(x + 3, y - 2); 
    ctx.stroke();
  }

  drawStickerText(ctx, text, x, y, fontSize) {
    ctx.font = `bold ${fontSize}px ${safeFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const shadowOffset = Math.max(3, Math.floor(fontSize * 0.08));
    const strokeWidth = Math.max(6, Math.floor(fontSize * 0.18));

    ctx.fillStyle = INK_COLOR;
    ctx.fillText(text, x + shadowOffset, y + shadowOffset);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = PAPER_COLOR;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = INK_COLOR;
    ctx.fillText(text, x, y);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // ✨ 高透视野：死也要死得明白
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    const cx = this.width / 2

    // ==========================================
    // 1. 嘲讽式贴纸排版
    // ==========================================
    const titleY = this.height * 0.18;
    const titleSize = Math.floor(this.width * 0.05);
    this.drawStickerText(this.ctx, '本次得分', cx, titleY, titleSize);
    
    // 乱划线
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = INK_COLOR;
    this.ctx.moveTo(cx - 50, titleY + 5);
    this.ctx.lineTo(cx + 60, titleY - 5);
    this.ctx.stroke();

    // 旁边写着大大的“寄了”
    this.ctx.save();
    this.ctx.translate(cx, titleY + this.height * 0.06);
    this.ctx.rotate(-0.1);
    this.drawStickerText(this.ctx, '寄 了', 0, 0, Math.floor(this.width * 0.12));
    this.ctx.restore();

    // 分数展示
    const scoreFontSize = Math.floor(this.width * 0.22);
    this.drawStickerText(this.ctx, gameModel.score.toString(), cx, this.height * 0.35, scoreFontSize);

    // ==========================================
    // 2. 主按钮布局 (白底垫片 + 线框)
    // ==========================================
    const baseWidth = this.width * 0.55;
    const btnHeight = this.height * 0.07;
    const gap = this.height * 0.03;
    const baseX = cx - baseWidth / 2;

    const replayY = this.height * 0.50;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(baseX, replayY, baseWidth, btnHeight);
    this.drawSketchyBox(this.ctx, baseX, replayY, baseWidth, btnHeight);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.05)}px ${safeFont}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('再玩一局', cx, replayY + btnHeight / 2);
    this.hitboxes.replay = { x: baseX, y: replayY, w: baseWidth, h: btnHeight };

    const shareY = replayY + btnHeight + gap;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(baseX, shareY, baseWidth, btnHeight);
    this.drawSketchyBox(this.ctx, baseX, shareY, baseWidth, btnHeight);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.fillText('分享好友复活', cx, shareY + btnHeight / 2);
    this.hitboxes.share = { x: baseX, y: shareY, w: baseWidth, h: btnHeight };

    // ==========================================
    // 3. 底部功能矩阵 (三等分，完美对齐)
    // ==========================================
    const subBtnY = shareY + btnHeight + gap * 1.2;
    const subGap = 12; 
    const subBtnW = (baseWidth - subGap * 2) / 3;
    const subBtnH = btnHeight * 0.8;
    
    const homeX = baseX;
    const storeX = baseX + subBtnW + subGap;
    const rankX = baseX + baseWidth - subBtnW;

    this.ctx.fillStyle = PAPER_COLOR;
    this.ctx.fillRect(homeX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);

    this.drawSketchyBox(this.ctx, homeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);

    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.max(14, Math.floor(this.width * 0.038))}px ${safeFont}`;
    const textY = subBtnY + subBtnH / 2;
    
    this.ctx.fillText('首页', homeX + subBtnW / 2, textY);
    this.ctx.fillText('商城', storeX + subBtnW / 2, textY);
    this.ctx.fillText('排行', rankX + subBtnW / 2, textY);

    this.hitboxes.home = { x: homeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: subBtnH };

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
        if (typeof wx !== 'undefined' && wx.showToast) wx.showToast({ title: '还在画...', icon: 'none' })
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
    this.isVisible = true;
    this.draw();
    this.instance.visible = true;
  }

  hide() {
    this.isVisible = false;
    this.instance.visible = false;
  }
}