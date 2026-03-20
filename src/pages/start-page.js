// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

// 移动端绝对安全字体栈，保证复杂汉字完美渲染
const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; // 略微偏软的墨黑色，比纯黑更有质感
const PAPER_COLOR = '#FFFFFF'; // 纯白底色

export default class StartPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.hitboxes = {
        play: { x: 0, y: 0, w: 0, h: 0 },
        rank: { x: 0, y: 0, w: 0, h: 0 },
        store: { x: 0, y: 0, w: 0, h: 0 }
    }
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
    this.bindTouchEvent()
  }

  // 漫画风矩形绘制器
  drawSketchyBox(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK_COLOR;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + w + 2, y - 2);
    ctx.lineTo(x + w - 2, y + h + 3);
    ctx.lineTo(x - 3, y + h - 1);
    ctx.lineTo(x + 4, y - 2); 
    ctx.stroke();
  }

  drawSketchyLine(ctx, x, y, w) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK_COLOR;
    ctx.moveTo(x - 5, y);
    ctx.quadraticCurveTo(x + w / 2, y + 4, x + w + 5, y - 2);
    ctx.stroke();
  }

  // ✨ 核心视觉算法：完美防糊的贴纸字渲染器
  drawStickerText(ctx, text, x, y, fontSize) {
    ctx.font = `bold ${fontSize}px ${safeFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const shadowOffset = Math.max(3, Math.floor(fontSize * 0.08));
    const strokeWidth = Math.max(6, Math.floor(fontSize * 0.18));

    // 1. 底层：硬实黑阴影
    ctx.fillStyle = INK_COLOR;
    ctx.fillText(text, x + shadowOffset, y + shadowOffset);

    // 2. 中层：极粗的纯白描边垫片（向外撑开，绝对不挤压内芯）
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = PAPER_COLOR;
    ctx.strokeText(text, x, y);

    // 3. 顶层：极度纯净的黑色内芯（一笔一画完美保留）
    ctx.fillStyle = INK_COLOR;
    ctx.fillText(text, x, y);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // ✨ 高透视野：透明度骤降至 0.35，游戏场景一览无余
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;

    // ==========================================
    // ✨ 1. 静态艺术 Logo："薅薅跳"
    // ==========================================
    const titleFontSize = Math.floor(this.width * 0.17);
    const titleY = this.height * 0.25;
    const spacing = titleFontSize * 1.05;

    // 精心设计的静态排版数据：字符, 旋转弧度, Y轴微调
    const logoData = [
        { char: '薅', rot: -0.08, dy: 6 },
        { char: '薅', rot: 0.05, dy: -8 },
        { char: '跳', rot: -0.04, dy: 4 }
    ];

    for (let i = 0; i < logoData.length; i++) {
        this.ctx.save();
        const charX = cx + (i - 1) * spacing;
        const item = logoData[i];
        
        this.ctx.translate(charX, titleY + item.dy);
        this.ctx.rotate(item.rot);
        
        this.drawStickerText(this.ctx, item.char, 0, 0, titleFontSize);
        
        // 艺术点缀：在最后一个字旁边画三条“漫画强调线”
        if (i === 2) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = INK_COLOR;
            const r = titleFontSize * 0.5;
            // 右上角三条射线
            this.ctx.moveTo(r + 5, -r); this.ctx.lineTo(r + 20, -r - 15);
            this.ctx.moveTo(r + 15, -r + 10); this.ctx.lineTo(r + 35, -r - 5);
            this.ctx.moveTo(r + 15, -r + 30); this.ctx.lineTo(r + 30, -r + 25);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    // 2. 历史记录 (极简线条托底)
    const scoreFontSize = Math.max(14, Math.floor(this.width * 0.04));
    const scoreY = titleY + titleFontSize * 1.1;
    this.drawStickerText(this.ctx, `最高记录: ${gameModel.highestScore}`, cx, scoreY, scoreFontSize);
    // 粗糙下划线
    const lineW = this.ctx.measureText(`最高记录: ${gameModel.highestScore}`).width * 1.2;
    this.drawSketchyLine(this.ctx, cx - lineW/2, scoreY + 12, lineW);

    // ==========================================
    // 3. 主按钮：开始游戏
    // ==========================================
    const playW = this.width * 0.45;
    const playH = this.height * 0.07;
    const playY = this.height * 0.55;
    const playX = cx - playW / 2;

    // 白底垫片
    this.ctx.fillStyle = PAPER_COLOR;
    this.ctx.fillRect(playX, playY, playW, playH);
    this.drawSketchyBox(this.ctx, playX, playY, playW, playH);
    
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.06)}px ${safeFont}`;
    this.ctx.fillText('开始游戏', cx, playY + playH / 2);
    
    this.hitboxes.play = { x: playX, y: playY, w: playW, h: playH };

    // ==========================================
    // 4. 副按钮组：商城 & 排行榜
    // ==========================================
    const subBtnW = this.width * 0.18;
    const subBtnH = this.height * 0.055;
    const subBtnY = playY + playH + this.height * 0.04;
    
    // 严格两端对齐
    const storeX = playX;
    const rankX = playX + playW - subBtnW;

    this.ctx.fillStyle = PAPER_COLOR;
    this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);

    this.drawSketchyBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);

    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.04)}px ${safeFont}`;
    this.ctx.fillText('商城', storeX + subBtnW / 2, subBtnY + subBtnH / 2);
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

      let clientX, clientY
      if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX
        clientY = e.changedTouches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      // 胖手指保护
      const padding = 20 
      const checkHit = (box) => clientX >= box.x - padding && clientX <= box.x + box.w + padding && clientY >= box.y - padding && clientY <= box.y + box.h + padding;

      if (checkHit(this.hitboxes.play)) {
        if (this.callbacks && this.callbacks.gameStart) this.callbacks.gameStart()
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