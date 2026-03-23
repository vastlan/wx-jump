// src/pages/start-page.js
import { camera } from '../scene/index'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf' 
// ✨ 引入难度配置文件用于渲染列表
import gameDiffConf from '../../confs/game-diff-conf' 

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

export default class StartPage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.isVisible = false
    this.hasBoundTouch = false
    
    // ✨ 控制难度弹窗的开关
    this.isShowingDiffModal = false 

    this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
    this.width = this.sysInfo.windowWidth
    this.height = this.sysInfo.windowHeight

    this.hitboxes = { play: { x:0,y:0,w:0,h:0 }, rank: { x:0,y:0,w:0,h:0 }, store: { x:0,y:0,w:0,h:0 }, diffBtn: { x:0,y:0,w:0,h:0 } }
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

    // ==========================================
    // ✨ 核心布局重构：左侧开始游戏 + 右侧难度筛选按钮
    // ==========================================
    const playY = this.height * 0.55;
    const playH = this.height * 0.07;
    const playW = this.width * 0.38; 
    const diffW = this.width * 0.30; 
    const gapBtn = 15; 
    const totalRowW = playW + diffW + gapBtn;
    const startX = cx - totalRowW / 2; 

    // 1. 绘制开始游戏按钮 (左侧)
    const playX = startX;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(playX, playY, playW, playH);
    this.drawSketchyBox(this.ctx, playX, playY, playW, playH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.055)}px ${safeFont}`;
    this.ctx.fillText('开始游戏', playX + playW / 2, playY + playH / 2);
    this.hitboxes.play = { x: playX, y: playY, w: playW, h: playH };

    // 2. 绘制难度筛选按钮 (右侧)
    const diffX = startX + playW + gapBtn;
    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(diffX, playY, diffW, playH);
    this.drawSketchyBox(this.ctx, diffX, playY, diffW, playH);
    
    // 获取当前选中的难度 Label
    const curDiffKey = gameModel.currentDifficulty;
    const curDiffConf = gameDiffConf[curDiffKey] || gameDiffConf['defaultDiff'];
    const diffLabel = curDiffConf.label || curDiffConf.lebel || '正常';
    
    this.ctx.fillStyle = INK_COLOR;
    // ✨ 为了给右侧的小标记留出空间，稍微缩小字号并测量主标题宽度
    this.ctx.font = `bold ${Math.floor(this.width * 0.042)}px ${safeFont}`;
    const labelW = this.ctx.measureText(diffLabel).width;
    
    // 计算文本和右侧符号矩阵的坐标
    const textCenter = diffX + diffW / 2 - 12; // 主文本向左挪一点点
    const iconCenter = textCenter + labelW / 2 + 16; // 符号紧贴在主文本右侧

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 绘制主难度标题
    this.ctx.fillText(diffLabel, textCenter, playY + playH / 2);
    
    // ✨ 绘制右上角极小的“难度”二字作为认知引导
    this.ctx.font = `900 ${Math.max(9, Math.floor(this.width * 0.022))}px ${safeFont}`;
    this.ctx.fillText('难度', iconCenter, playY + playH / 2 - 8);
    
    // ✨ 绘制下方的下拉符号
    this.ctx.font = `900 ${Math.max(10, Math.floor(this.width * 0.028))}px ${safeFont}`;
    this.ctx.fillText('▼', iconCenter, playY + playH / 2 + 8);

    this.hitboxes.diffBtn = { x: diffX, y: playY, w: diffW, h: playH };

    // 底部次级按钮矩阵
    const subBtnW = this.width * 0.28; 
    const subBtnH = this.height * 0.055;
    const subBtnY = playY + playH + this.height * 0.04;
    const subBtnGap = 20; 
    
    const storeX = cx - subBtnW - subBtnGap / 2;
    const rankX = cx + subBtnGap / 2;

    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(storeX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyOpenBox(this.ctx, storeX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.038)}px ${safeFont}`; 
    this.ctx.fillText('打开看看?', storeX + subBtnW / 2, subBtnY + subBtnH / 2 + 2); 

    this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(rankX, subBtnY, subBtnW, subBtnH);
    this.drawSketchyBox(this.ctx, rankX, subBtnY, subBtnW, subBtnH);
    this.ctx.fillStyle = INK_COLOR;
    this.ctx.font = `bold ${Math.floor(this.width * 0.04)}px ${safeFont}`;
    this.ctx.fillText('排行榜', rankX + subBtnW / 2, subBtnY + subBtnH / 2);

    this.hitboxes.store = { x: storeX, y: subBtnY, w: subBtnW, h: subBtnH };
    this.hitboxes.rank = { x: rankX, y: subBtnY, w: subBtnW, h: subBtnH };

    // ==========================================
    // ✨ 弹窗：难度选项列表渲染
    // ==========================================
    if (this.isShowingDiffModal) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const keys = Object.keys(gameDiffConf);
        const modalW = this.width * 0.7;
        const itemH = 50;
        const padding = 20;
        const modalH = keys.length * itemH + padding * 2 + 50; 
        const modalX = (this.width - modalW) / 2;
        const modalY = (this.height - modalH) / 2;

        // 弹窗背景
        this.ctx.fillStyle = PAPER_COLOR;
        this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.drawSketchyBox(this.ctx, modalX, modalY, modalW, modalH);

        // 弹窗标题
        this.ctx.fillStyle = INK_COLOR;
        this.ctx.font = `900 ${Math.floor(this.width * 0.055)}px ${safeFont}`;
        this.ctx.fillText('选择游戏难度', cx, modalY + 35);
        this.drawSketchyLine(this.ctx, modalX + 20, modalY + 55, modalW - 40);

        this.hitboxes.diffOptions = [];
        
        // 渲染遍历选项
        keys.forEach((key, index) => {
            const itemY = modalY + 75 + index * itemH;
            const conf = gameDiffConf[key];
            const label = conf.label || conf.lebel || key;

            // 选中高亮状态
            if (key === gameModel.currentDifficulty) {
                this.ctx.fillStyle = '#EAEAEA';
                this.ctx.fillRect(modalX + 15, itemY - 22, modalW - 30, 44);
                this.drawSketchyBox(this.ctx, modalX + 15, itemY - 22, modalW - 30, 44);
            }

            this.ctx.fillStyle = INK_COLOR;
            this.ctx.font = `bold ${Math.floor(this.width * 0.045)}px ${safeFont}`;
            this.ctx.fillText(label, cx, itemY);
            
            this.hitboxes.diffOptions.push({ key: key, x: modalX + 15, y: itemY - 22, w: modalW - 30, h: 44 });
        });

        // 弹窗点击遮罩（点外部关闭）
        this.hitboxes.diffModalBg = { x: 0, y: 0, w: this.width, h: this.height, exclude: {x: modalX, y: modalY, w: modalW, h: modalH} };
    }

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

      // ✨ 如果弹窗打开，优先劫持弹窗内部的操作
      if (this.isShowingDiffModal) {
          // 点击某个难度选项
          if (this.hitboxes.diffOptions) {
              for (let i = 0; i < this.hitboxes.diffOptions.length; i++) {
                  if (hit(this.hitboxes.diffOptions[i])) {
                      gameModel.setDifficulty(this.hitboxes.diffOptions[i].key); // 保存新难度
                      this.isShowingDiffModal = false;
                      this.draw();
                      return;
                  }
              }
          }
          // 点击弹窗外部遮罩关闭
          const ex = this.hitboxes.diffModalBg.exclude;
          if (cX < ex.x || cX > ex.x + ex.w || cY < ex.y || cY > ex.y + ex.h) {
              this.isShowingDiffModal = false;
              this.draw();
          }
          return; // 拦截底层按钮点击
      }

      // ✨ 主页面按钮操作
      if (hit(this.hitboxes.diffBtn)) { this.isShowingDiffModal = true; this.draw(); return; }
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