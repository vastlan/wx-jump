// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 

// ✨ 核心修复：采用全平台绝对兼容的系统级最高级字体栈，杜绝在 Android/iOS 上降级变形
const systemFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", "STHeiti", "Microsoft YaHei", Tahoma, Arial, sans-serif`;

const INK_COLOR = '#2A2A2A'; // 暖黑色墨水
const PAPER_COLOR = '#FDF9F1'; // 暖白纸张底色

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

    this.draw()
    this.bindTouchEvent()
  }

  // 漫画风矩形绘制器 (带偏移硬底阴影 + 粗描边)
  drawSketchBox(ctx, x, y, w, h, radius) {
    // 1. 硬质手绘阴影 (绝对偏移 4px)
    ctx.fillStyle = INK_COLOR;
    this.roundRect(ctx, x + 4, y + 4, w, h, radius);
    ctx.fill();

    // 2. 纸张底色填充
    ctx.fillStyle = PAPER_COLOR;
    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fill();

    // 3. 粗黑线条描边
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
    
    // 半透明治愈系暖白遮罩，透出背后 3D 世界
    this.ctx.fillStyle = 'rgba(253, 249, 241, 0.85)'
    this.ctx.fillRect(0, 0, this.width, this.height)

    const cx = this.width / 2

    // ==========================================
    // ✨ 1. 手机端原生自适应 Logo 渲染器
    // ==========================================
    const titleText = '省一跳';
    const titleFontSize = Math.floor(this.width * 0.16); // 稍微缩减基准字号，防止粗描边撑爆
    const titleY = this.height * 0.22;

    // 强制使用系统最粗字重 900
    this.ctx.font = `900 ${titleFontSize}px ${systemFont}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 强制圆润拐角，防止在 Android 上产生尖锐毛刺
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.miterLimit = 2; 

    // A. 绘制深色硬实立体阴影 (比例精调)
    const shadowOffset = Math.max(3, Math.floor(this.width * 0.012));
    this.ctx.lineWidth = titleFontSize * 0.12; // 调整描边厚度，防止糊字
    this.ctx.strokeStyle = INK_COLOR;
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.strokeText(titleText, cx + shadowOffset, titleY + shadowOffset);
    this.ctx.fillText(titleText, cx + shadowOffset, titleY + shadowOffset);

    // B. 绘制前景纯白粗边框 (形成贴纸底色垫片)
    this.ctx.lineWidth = titleFontSize * 0.08; // 保证白边比黑阴影细一圈，层次分明
    this.ctx.strokeStyle = '#FFFFFF'; 
    this.ctx.strokeText(titleText, cx, titleY);

    // C. 绘制前景墨色内核
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.fillText(titleText, cx, titleY);
    // ==========================================

    // 2. 历史最高分 (使用统一的系统字体)
    this.ctx.fillStyle = '#888888';
    const scoreFontSize = Math.max(14, Math.floor(this.width * 0.042));
    this.ctx.font = `bold ${scoreFontSize}px ${systemFont}`;
    this.ctx.fillText(`最高记录: ${gameModel.highestScore}`, cx, titleY + titleFontSize * 1.2);

    // 3. 漫画风主按钮：开始游戏
    const playW = this.width * 0.55;
    const playH = this.height * 0.075;
    const playY = this.height * 0.54;
    const playX = cx - playW / 2;

    this.drawSketchBox(this.ctx, playX, playY, playW, playH, playH / 2);

    this.ctx.fillStyle = INK_COLOR; 
    this.ctx.font = `bold ${Math.floor(this.width * 0.055)}px ${systemFont}`;
    this.ctx.fillText('开始游戏', cx, playY + playH / 2);
    this.hitboxes.play = { x: playX, y: playY, w: playW, h: playH }

    // 4. 漫画风副按钮矩阵
    const subBtnW = this.width * 0.25;
    const subBtnH = this.height * 0.06;
    const subBtnY = playY + playH + this.height * 0.035;
    
    const storeX = playX;
    const rankX = playX + playW - subBtnW;

    this.drawSketchBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH, subBtnH / 2);
    this.drawSketchBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH, subBtnH / 2);

    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.04)}px ${systemFont}`;
    this.ctx.fillText('商城', storeX + subBtnW / 2, subBtnY + subBtnH / 2);
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

      if (checkHit(this.hitboxes.play)) {
        if (this.callbacks && this.callbacks.gameStart) this.callbacks.gameStart()
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