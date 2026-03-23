// src/pages/game-over-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

import reviveModule from '../components/revive-free' 
// ✨ 未来需要恢复分享时，在此处 import shareModule from '../components/share-btn' 即可

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

export default class GameOverPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false; 
    this.hasBoundTouch = false;

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth; 
    this.height = this.sysInfo.windowHeight;
    // ✨ 移除了 share 的碰撞盒声明
    this.hitboxes = { replay: {x:0,y:0,w:0,h:0}, revive: {x:0,y:0,w:0,h:0}, home: {x:0,y:0,w:0,h:0}, store: {x:0,y:0,w:0,h:0}, rank: {x:0,y:0,w:0,h:0} }
    
    this.animTime = 0
    this.animFrame = null
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

    if (reviveModule.init) reviveModule.init();
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

  animate() {
    if (!this.isVisible) return;
    this.animTime += 0.08;

    // ✨ 未来恢复分享时，在此处调用 shareModule.updateMarquee() 即可

    this.draw();
    const reqAnim = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : setTimeout;
    this.animFrame = reqAnim(this.animate.bind(this), 16);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    const cx = this.width / 2

    const topHomeW = 32; const topHomeH = 32;
    const safeTop = (this.sysInfo.statusBarHeight || 20) + 10;
    const topHomeX = 25; 
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
    this.ctx.closePath(); this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(topHomeX + topHomeW/2 - 4, topHomeY + topHomeH);
    this.ctx.lineTo(topHomeX + topHomeW/2 - 4, topHomeY + topHomeH - 12);
    this.ctx.lineTo(topHomeX + topHomeW/2 + 4, topHomeY + topHomeH - 12);
    this.ctx.lineTo(topHomeX + topHomeW/2 + 4, topHomeY + topHomeH);
    this.ctx.stroke();
    this.hitboxes.home = { x: topHomeX - 10, y: topHomeY - 10, w: topHomeW + 20, h: topHomeH + 20 };

    const titleY = this.height * 0.15;
    this.drawStickerText(this.ctx, '本次得分', cx, titleY, Math.floor(this.width * 0.05));
    this.ctx.beginPath(); this.ctx.lineWidth=4; this.ctx.strokeStyle=INK_COLOR; this.ctx.moveTo(cx-50,titleY+5); this.ctx.lineTo(cx+60,titleY-5); this.ctx.stroke();
    this.ctx.save(); this.ctx.translate(cx, titleY + this.height * 0.05); this.ctx.rotate(-0.1); this.drawStickerText(this.ctx, '寄 了', 0, 0, Math.floor(this.width * 0.12)); this.ctx.restore();
    this.drawStickerText(this.ctx, gameModel.score.toString(), cx, this.height * 0.30, Math.floor(this.width * 0.22));

    const baseWidth = this.width * 0.60; 
    const btnHeight = this.height * 0.065; 
    const gap = this.height * 0.020;      
    const baseX = cx - baseWidth / 2;

    const replayY = this.height * 0.43;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(baseX, replayY, baseWidth, btnHeight);
    this.drawSketchyBox(this.ctx, baseX, replayY, baseWidth, btnHeight);
    this.ctx.fillStyle = INK_COLOR; this.ctx.font = `bold ${Math.floor(this.width * 0.05)}px ${safeFont}`; 
    this.ctx.textAlign='center'; this.ctx.textBaseline='middle'; 
    this.ctx.fillText('再玩一局', cx, replayY + btnHeight / 2);
    this.hitboxes.replay = { x: baseX, y: replayY, w: baseWidth, h: btnHeight };

    const reviveY = replayY + btnHeight + gap;
    this.hitboxes.revive = reviveModule.draw(this.ctx, baseX, reviveY, baseWidth, btnHeight, this.drawSketchyBox.bind(this));

    // ✨ 因为移除了分享按钮，底部的子按钮矩阵直接紧贴在复活按钮下方
    const subBtnY = reviveY + btnHeight + gap * 1.2;
    const btnGap = 20; 
    const subBtnW = this.width * 0.30; 
    const subBtnH = btnHeight * 0.8;
    const storeX = cx - subBtnW - btnGap / 2;
    const rankX = cx + btnGap / 2;

    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyOpenBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH); 
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.textAlign = 'center';
    this.ctx.font = `bold ${Math.max(12, Math.floor(this.width * 0.035))}px ${safeFont}`;
    this.ctx.fillText('打开看看?', storeX + subBtnW / 2, subBtnY + subBtnH / 2 + 2);

    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.max(14, Math.floor(this.width * 0.04))}px ${safeFont}`;
    this.ctx.fillText('排行榜', rankX + subBtnW / 2, subBtnY + subBtnH / 2);

    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: subBtnH };

    if(reviveModule.drawOverlay) reviveModule.drawOverlay(this.ctx, this.width, this.height, cx, this.drawSketchyBox.bind(this));

    this.texture.needsUpdate = true
  }

  bindTouchEvent() {
    if (this.hasBoundTouch) return
    this.hasBoundTouch = true

    const handleTouch = (e) => {
      if (!this.isVisible) return
      if (reviveModule.isBlocking && reviveModule.isBlocking()) return;

      let cX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      let cY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const pad = 15;
      const hit = (b) => cX >= b.x-pad && cX <= b.x+b.w+pad && cY >= b.y-pad && cY <= b.y+b.h+pad;

      if (hit(this.hitboxes.replay)) { if (this.callbacks?.gameRestart) this.callbacks.gameRestart(); return; }
      if (hit(this.hitboxes.home)) { if (this.callbacks?.goHome) this.callbacks.goHome(); return; }
      if (hit(this.hitboxes.store)) { if (this.callbacks?.showStore) this.callbacks.showStore(); return; }
      if (hit(this.hitboxes.rank)) { if (this.callbacks?.showRank) this.callbacks.showRank(); return; }

      if (hit(this.hitboxes.revive)) { 
          reviveModule.handleClick(this.callbacks, this); 
          return; 
      }
      
      // ✨ 未来恢复分享时，在此处调用：
      // if (hit(this.hitboxes.share)) { shareModule.handleClick(); return; }
    }
    if (typeof wx !== 'undefined') wx.onTouchEnd(handleTouch);
    else { window.addEventListener('touchend', handleTouch); window.addEventListener('mouseup', handleTouch); }
  }
  
  show() { 
      this.isVisible = true; 
      this.animTime = 0; 
      
      // ✨ 未来恢复分享时，取消注释以下这行
      // if (shareModule.loadData) shareModule.loadData();
      
      this.animate(); 
      this.instance.visible = true; 
  }
  
  hide() { 
      this.isVisible = false; 
      this.instance.visible = false; 
      const cancelAnim = typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame : clearTimeout;
      if (this.animFrame) cancelAnim(this.animFrame);
      if (reviveModule.reset) reviveModule.reset();
  }
}