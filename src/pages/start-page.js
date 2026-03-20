// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

export default class StartPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.hitboxes = { play: { x:0,y:0,w:0,h:0 }, rank: { x:0,y:0,w:0,h:0 }, store: { x:0,y:0,w:0,h:0 } }
  }

  init(options) {
    this.scene = options.scene
    this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
    this.canvas.width = this.width; this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')
    this.texture = new THREE.CanvasTexture(this.canvas)
    
    const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
    this.instance = new THREE.Sprite(material)
    
    const frustumSize = sceneConf.frustumSize 
    const aspect = this.height / this.width
    const camWidth = frustumSize * 2
    const camHeight = frustumSize * aspect + frustumSize
    
    this.instance.scale.set(camWidth, camHeight, 1)
    this.instance.position.set(0, (frustumSize * aspect - frustumSize) / 2, -10) 
    this.instance.renderOrder = 200; this.instance.visible = false;
    
    camera.instance.add(this.instance)
    this.bindTouchEvent()
  }

  drawSketchyBox(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK_COLOR;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.moveTo(x+2,y+4); ctx.lineTo(x+w+2,y-2); ctx.lineTo(x+w-2,y+h+3); ctx.lineTo(x-3,y+h-1); ctx.lineTo(x+4,y-2); 
    ctx.stroke();
  }

  drawSketchyOpenBox(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK_COLOR;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.moveTo(x+2, y+h*0.3); ctx.lineTo(x-2, y+h-2); ctx.lineTo(x+w+2, y+h+1); ctx.lineTo(x+w-2, y+h*0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+2, y+h*0.3); ctx.lineTo(x-8, y-4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+w-2, y+h*0.2); ctx.lineTo(x+w+10, y-2); ctx.stroke();
  }

  drawSketchyLine(ctx, x, y, w) {
    ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = INK_COLOR;
    ctx.moveTo(x-5, y); ctx.quadraticCurveTo(x+w/2, y+4, x+w+5, y-2); ctx.stroke();
  }

  drawStickerText(ctx, text, x, y, fontSize) {
    ctx.font = `bold ${fontSize}px ${safeFont}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sOff = Math.max(3, Math.floor(fontSize * 0.08));
    const sWid = Math.max(6, Math.floor(fontSize * 0.18));
    ctx.fillStyle = INK_COLOR; ctx.fillText(text, x+sOff, y+sOff);
    ctx.lineWidth = sWid; ctx.strokeStyle = PAPER_COLOR; ctx.strokeText(text, x, y);
    ctx.fillStyle = INK_COLOR; ctx.fillText(text, x, y);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;

    const titleFontSize = Math.floor(this.width * 0.17);
    const titleY = this.height * 0.25;
    const spacing = titleFontSize * 1.05;
    const logoData = [ { char: '薅', rot: -0.08, dy: 6 }, { char: '薅', rot: 0.05, dy: -8 }, { char: '跳', rot: -0.04, dy: 4 } ];

    logoData.forEach((item, i) => {
        this.ctx.save();
        this.ctx.translate(cx + (i - 1) * spacing, titleY + item.dy);
        this.ctx.rotate(item.rot);
        this.drawStickerText(this.ctx, item.char, 0, 0, titleFontSize);
        if (i === 2) {
            this.ctx.beginPath(); this.ctx.lineWidth = 3; this.ctx.strokeStyle = INK_COLOR;
            const r = titleFontSize * 0.5;
            this.ctx.moveTo(r+5,-r); this.ctx.lineTo(r+20,-r-15);
            this.ctx.moveTo(r+15,-r+10); this.ctx.lineTo(r+35,-r-5);
            this.ctx.moveTo(r+15,-r+30); this.ctx.lineTo(r+30,-r+25);
            this.ctx.stroke();
        }
        this.ctx.restore();
    });

    const scoreFontSize = Math.max(14, Math.floor(this.width * 0.04));
    this.drawStickerText(this.ctx, `最高记录: ${gameModel.highestScore}`, cx, titleY + titleFontSize * 1.1, scoreFontSize);
    this.drawSketchyLine(this.ctx, cx - this.width*0.2, titleY + titleFontSize * 1.1 + 12, this.width*0.4);

    const playW = this.width * 0.45;
    const playH = this.height * 0.07;
    const playY = this.height * 0.55;
    const playX = cx - playW / 2;

    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(playX, playY, playW, playH);
    this.drawSketchyBox(this.ctx, playX, playY, playW, playH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.06)}px ${safeFont}`;
    this.ctx.fillText('开始游戏', cx, playY + playH / 2);
    this.hitboxes.play = { x: playX, y: playY, w: playW, h: playH };

    // ✨ 左右位置互换：左=商城(打开看看)，右=排行榜
    const subBtnW = this.width * 0.28; 
    const subBtnH = this.height * 0.055;
    const subBtnY = playY + playH + this.height * 0.04;
    const btnGap = 20; 
    
    const storeX = cx - subBtnW - btnGap / 2;
    const rankX = cx + btnGap / 2;

    // 左侧：掀开的破纸箱 (打开看看?)
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyOpenBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.038)}px ${safeFont}`; 
    this.ctx.fillText('打开看看?', storeX + subBtnW / 2, subBtnY + subBtnH / 2 + 2); 

    // 右侧：正常的线框 (排行榜)
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.04)}px ${safeFont}`;
    this.ctx.fillText('排行榜', rankX + subBtnW / 2, subBtnY + subBtnH / 2);

    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: subBtnH };

    this.texture.needsUpdate = true;
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

      if (hit(this.hitboxes.play)) { if (this.callbacks?.gameStart) this.callbacks.gameStart(); return; }
      if (hit(this.hitboxes.store)) { if (this.callbacks?.showStore) this.callbacks.showStore(); return; }
      if (hit(this.hitboxes.rank)) { if (this.callbacks?.showRank) this.callbacks.showRank(); return; }
    }
    if (typeof wx !== 'undefined') wx.onTouchEnd(handleTouch);
    else { window.addEventListener('touchend', handleTouch); window.addEventListener('mouseup', handleTouch); }
  }
  show() { this.isVisible = true; this.draw(); this.instance.visible = true; }
  hide() { this.isVisible = false; this.instance.visible = false; }
}