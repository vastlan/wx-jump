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
    this.isVisible = false; this.hasBoundTouch = false;
    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth; this.height = this.sysInfo.windowHeight;
    this.hitboxes = { replay: {x:0,y:0,w:0,h:0}, share: {x:0,y:0,w:0,h:0}, home: {x:0,y:0,w:0,h:0}, store: {x:0,y:0,w:0,h:0}, rank: {x:0,y:0,w:0,h:0} }
  }

  init(options = {}) {
    this.scene = options.scene || null
    this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    this.canvas.width = this.width; this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    
    const fSize = sceneConf.frustumSize; const aspect = this.height / this.width;
    this.instance.scale.set(fSize*2, fSize*aspect+fSize, 1)
    this.instance.position.set(0, (fSize*aspect-fSize)/2, -10) 
    this.instance.renderOrder = 200; this.instance.visible = false;
    
    camera.instance.add(this.instance)
    this.bindTouchEvent()
  }

  drawSketchyBox(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK_COLOR; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.moveTo(x+2,y+3); ctx.lineTo(x+w+1,y-1); ctx.lineTo(x+w-1,y+h+2); ctx.lineTo(x-2,y+h-1); ctx.lineTo(x+3,y-2); ctx.stroke();
  }

  drawSketchyOpenBox(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK_COLOR; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.moveTo(x+2, y+h*0.3); ctx.lineTo(x-2, y+h-2); ctx.lineTo(x+w+2, y+h+1); ctx.lineTo(x+w-2, y+h*0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+2, y+h*0.3); ctx.lineTo(x-8, y-4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w-2, y+h*0.2); ctx.lineTo(x+w+10, y-2); ctx.stroke();
  }

  drawStickerText(ctx, text, x, y, fSize) {
    ctx.font = `bold ${fSize}px ${safeFont}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sOff = Math.max(3, Math.floor(fSize * 0.08)); const sWid = Math.max(6, Math.floor(fSize * 0.18));
    ctx.fillStyle = INK_COLOR; ctx.fillText(text, x+sOff, y+sOff);
    ctx.lineWidth = sWid; ctx.strokeStyle = PAPER_COLOR; ctx.strokeText(text, x, y);
    ctx.fillStyle = INK_COLOR; ctx.fillText(text, x, y);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    const cx = this.width / 2

    // ==========================================
    // ✨ 1. 右上角草稿风 🏠 (首页按钮)，变更变量名避免冲突
    // ==========================================
    const topHomeW = 32; const topHomeH = 32;
    const safeTop = (this.sysInfo.statusBarHeight || 20) + 10;
    const topHomeX = 20;
    const topHomeY = safeTop;

    this.ctx.beginPath(); this.ctx.lineWidth = 2.5; this.ctx.strokeStyle = INK_COLOR;
    this.ctx.lineJoin = 'round'; this.ctx.lineCap = 'round';
    this.ctx.moveTo(topHomeX + topHomeW/2, topHomeY + 2);
    this.ctx.lineTo(topHomeX - 2, topHomeY + topHomeH/2);
    this.ctx.lineTo(topHomeX + 5, topHomeY + topHomeH/2);
    this.ctx.lineTo(topHomeX + 5, topHomeY + topHomeH);
    this.ctx.lineTo(topHomeX + topHomeW - 5, topHomeY + topHomeH);
    this.ctx.lineTo(topHomeX + topHomeW - 5, topHomeY + topHomeH/2);
    this.ctx.lineTo(topHomeX + topHomeW + 2, topHomeY + topHomeH/2);
    this.ctx.closePath();
    this.ctx.stroke();
    // 画个小门
    this.ctx.beginPath();
    this.ctx.moveTo(topHomeX + topHomeW/2 - 4, topHomeY + topHomeH);
    this.ctx.lineTo(topHomeX + topHomeW/2 - 4, topHomeY + topHomeH - 12);
    this.ctx.lineTo(topHomeX + topHomeW/2 + 4, topHomeY + topHomeH - 12);
    this.ctx.lineTo(topHomeX + topHomeW/2 + 4, topHomeY + topHomeH);
    this.ctx.stroke();

    this.hitboxes.home = { x: topHomeX - 10, y: topHomeY - 10, w: topHomeW + 20, h: topHomeH + 20 };

    // ==========================================
    // 2. 得分展示区
    // ==========================================
    const titleY = this.height * 0.18;
    this.drawStickerText(this.ctx, '本次得分', cx, titleY, Math.floor(this.width * 0.05));
    this.ctx.beginPath(); this.ctx.lineWidth=4; this.ctx.strokeStyle=INK_COLOR; this.ctx.moveTo(cx-50,titleY+5); this.ctx.lineTo(cx+60,titleY-5); this.ctx.stroke();
    this.ctx.save(); this.ctx.translate(cx, titleY + this.height * 0.06); this.ctx.rotate(-0.1); this.drawStickerText(this.ctx, '寄 了', 0, 0, Math.floor(this.width * 0.12)); this.ctx.restore();
    this.drawStickerText(this.ctx, gameModel.score.toString(), cx, this.height * 0.35, Math.floor(this.width * 0.22));

    const baseWidth = this.width * 0.55; const btnHeight = this.height * 0.07; const gap = this.height * 0.03; const baseX = cx - baseWidth / 2;

    // 再来一局 & 分享
    const replayY = this.height * 0.50;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(baseX, replayY, baseWidth, btnHeight);
    this.drawSketchyBox(this.ctx, baseX, replayY, baseWidth, btnHeight);
    this.ctx.fillStyle = INK_COLOR; this.ctx.font = `bold ${Math.floor(this.width * 0.05)}px ${safeFont}`; this.ctx.textAlign='center'; this.ctx.textBaseline='middle'; this.ctx.fillText('再玩一局', cx, replayY + btnHeight / 2);
    this.hitboxes.replay = { x: baseX, y: replayY, w: baseWidth, h: btnHeight };

    const shareY = replayY + btnHeight + gap;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(baseX, shareY, baseWidth, btnHeight);
    this.drawSketchyBox(this.ctx, baseX, shareY, baseWidth, btnHeight);
    this.ctx.fillStyle = INK_COLOR; this.ctx.fillText('分享好友复活', cx, shareY + btnHeight / 2);
    this.hitboxes.share = { x: baseX, y: shareY, w: baseWidth, h: btnHeight };

    // ==========================================
    // ✨ 3. 底部功能矩阵：左=商城(打开看看)，右=排行榜 (双列对称排版)
    // ==========================================
    const subBtnY = shareY + btnHeight + gap * 1.2;
    const btnGap = 20; 
    const subBtnW = this.width * 0.30; 
    const subBtnH = btnHeight * 0.8;
    
    // 以中轴线 cx 对称推开，绝对不会重叠！
    const storeX = cx - subBtnW - btnGap / 2;
    const rankX = cx + btnGap / 2;

    // 左侧：破纸箱
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyOpenBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH); 
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.max(12, Math.floor(this.width * 0.035))}px ${safeFont}`;
    this.ctx.fillText('打开看看?', storeX + subBtnW / 2, subBtnY + subBtnH / 2 + 2);

    // 右侧：排行榜
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.max(14, Math.floor(this.width * 0.04))}px ${safeFont}`;
    this.ctx.fillText('排行榜', rankX + subBtnW / 2, subBtnY + subBtnH / 2);

    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: subBtnH };

    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleTouch = (e) => {
      if (!this.isVisible) return
      let cX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      let cY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const pad = 15;
      const hit = (b) => cX >= b.x-pad && cX <= b.x+b.w+pad && cY >= b.y-pad && cY <= b.y+b.h+pad;

      if (hit(this.hitboxes.share)) { if (typeof wx !== 'undefined' && wx.showShareMenu) wx.showShareMenu({ withShareTicket: true }); return; }
      if (hit(this.hitboxes.replay)) { if (this.callbacks?.gameRestart) this.callbacks.gameRestart(); return; }
      if (hit(this.hitboxes.home)) { if (this.callbacks?.goHome) this.callbacks.goHome(); return; }
      if (hit(this.hitboxes.store)) { if (this.callbacks?.showStore) this.callbacks.showStore(); return; }
      if (hit(this.hitboxes.rank)) { if (this.callbacks?.showRank) this.callbacks.showRank(); return; }
    }
    if (typeof wx !== 'undefined') wx.onTouchEnd(handleTouch);
    else { window.addEventListener('touchend', handleTouch); window.addEventListener('mouseup', handleTouch); }
  }
  show() { this.isVisible = true; this.draw(); this.instance.visible = true; }
  hide() { this.isVisible = false; this.instance.visible = false; }
}