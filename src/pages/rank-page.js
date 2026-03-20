// src/pages/rank-page.js
import { camera } from '../scene/index'
import API from '../services/api'
import sceneConf from '../../confs/scene-conf'

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

export default class RankPage {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.rankData = [];
        this.currentTab = 'friend';
        this.isLoading = true;
        this.isVisible = false;
        this.hasBoundTouch = false;

        this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
        this.width = this.sysInfo.windowWidth
        this.height = this.sysInfo.windowHeight

        this.ui = { modalBox: { x: 0, y: 0, w: 0, h: 0 } };
        this.hitboxes = { close: { x: 0, y: 0, w: 0, h: 0 }, tabFriend: { x: 0, y: 0, w: 0, h: 0 }, tabWorld: { x: 0, y: 0, w: 0, h: 0 } };
        
        // ✨ 新增：滚动系统状态变量
        this.scrollY = 0;
        this.maxScrollY = 0;
        this.isSwiping = false;
    }

    init() {
        this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
        this.canvas.width = this.width; this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d')
        this.texture = new THREE.CanvasTexture(this.canvas)
        const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
        this.instance = new THREE.Sprite(material)
        const frustumSize = sceneConf.frustumSize; const aspect = this.height / this.width;
        this.instance.scale.set(frustumSize * 2, frustumSize * aspect + frustumSize, 1)
        this.instance.position.set(0, (frustumSize * aspect - frustumSize) / 2, -8) 
        this.instance.renderOrder = 220; this.instance.visible = false;
        camera.instance.add(this.instance)
        this.bindTouchEvent()
    }

    async show() {
        this.isVisible = true; this.instance.visible = true;
        this.scrollY = 0; // 每次打开强制重置
        await this.switchTab('friend');
    }
    hide() { this.isVisible = false; this.instance.visible = false; }

    async switchTab(tab) {
        this.currentTab = tab; this.isLoading = true; this.rankData = []; 
        this.scrollY = 0; // ✨ 切换 Tab 时重置滚动条
        this.draw(); 
        try {
            if (tab === 'world') this.rankData = await API.getGlobalRank();
            else this.rankData = await API.getFriendRank();
        } catch (e) { } 
        finally { this.isLoading = false; this.draw(); }
    }

    drawSketchyBox(ctx, x, y, w, h) {
        ctx.beginPath(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK_COLOR; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.moveTo(x+2,y+3); ctx.lineTo(x+w+1,y-1); ctx.lineTo(x+w-1,y+h+2); ctx.lineTo(x-2,y+h-1); ctx.lineTo(x+3,y-2); ctx.stroke();
    }
    drawSketchyLine(ctx, x, y, w) {
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = INK_COLOR;
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y + 3, x + w, y - 1); ctx.stroke();
    }

    draw() {
        if (!this.isVisible) return;
        const w = this.width; const h = this.height;
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; this.ctx.fillRect(0, 0, w, h);

        const modalW = w * 0.85; const modalH = h * 0.70;
        const modalX = (w - modalW) / 2; const modalY = (h - modalH) / 2;
        this.ui.modalBox = { x: modalX, y: modalY, w: modalW, h: modalH };

        this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.drawSketchyBox(this.ctx, modalX, modalY, modalW, modalH);

        this.ctx.fillStyle = INK_COLOR; this.ctx.font = `900 24px ${safeFont}`;
        this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText('卷 王 榜', w / 2, modalY + 30);

        const closeSize = 50;
        this.hitboxes.close = { x: modalX + modalW - closeSize, y: modalY, w: closeSize, h: 50 };
        this.ctx.font = `normal 24px ${safeFont}`; this.ctx.fillText('X', this.hitboxes.close.x + closeSize/2, modalY + 30);
        this.drawSketchyLine(this.ctx, modalX + 10, modalY + 60, modalW - 20);

        const tabW = modalW * 0.4; const tabH = 40; const tabY = modalY + 75;
        const friendX = modalX + modalW * 0.1 - 5; const worldX = modalX + modalW * 0.5 + 5;

        if (this.currentTab === 'friend') this.drawSketchyBox(this.ctx, friendX, tabY, tabW, tabH);
        this.ctx.font = `bold 16px ${safeFont}`; this.ctx.fillStyle = this.currentTab === 'friend' ? INK_COLOR : '#888888';
        this.ctx.fillText('熟人互卷', friendX + tabW / 2, tabY + tabH / 2);
        this.hitboxes.tabFriend = { x: friendX, y: tabY, w: tabW, h: tabH };

        if (this.currentTab === 'world') this.drawSketchyBox(this.ctx, worldX, tabY, tabW, tabH);
        this.ctx.fillStyle = this.currentTab === 'world' ? INK_COLOR : '#888888';
        this.ctx.fillText('全服神仙', worldX + tabW / 2, tabY + tabH / 2);
        this.hitboxes.tabWorld = { x: worldX, y: tabY, w: tabW, h: tabH };

        if (this.isLoading) {
            this.ctx.fillStyle = INK_COLOR; this.ctx.fillText('翻找成绩单中...', w / 2, modalY + modalH / 2 + 20);
            this.texture.needsUpdate = true; return;
        }

        // ✨ 滚动与裁剪核心逻辑
        const listStartY = tabY + tabH + 20;
        const listVisibleH = modalY + modalH - listStartY - 15;
        const itemH = h * 0.08;
        const totalContentH = this.rankData.length * itemH;
        this.maxScrollY = Math.max(0, totalContentH - listVisibleH);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(modalX, listStartY - 10, modalW, listVisibleH + 10); // 设定裁剪区
        this.ctx.clip(); // 执行裁剪

        // 加入 scrollY 偏移
        let startY = listStartY + this.scrollY;

        for (let i = 0; i < this.rankData.length; i++) {
            const item = this.rankData[i];
            this.ctx.textAlign = 'center'; this.ctx.fillStyle = INK_COLOR;
            this.ctx.font = i < 3 ? `900 20px ${safeFont}` : `bold 16px ${safeFont}`;
            this.ctx.fillText(`No.${item.rank}`, modalX + 45, startY + itemH / 2);

            this.ctx.textAlign = 'left'; this.ctx.font = `bold 16px ${safeFont}`;
            this.ctx.fillText(item.name, modalX + 90, startY + itemH / 2);

            this.ctx.textAlign = 'right'; this.ctx.font = `900 18px ${safeFont}`;
            this.ctx.fillText(`${item.score}`, modalX + modalW - 35, startY + itemH / 2); // 为滚动条预留一点右侧空间

            if (i < this.rankData.length - 1) this.drawSketchyLine(this.ctx, modalX + 15, startY + itemH, modalW - 30);
            startY += itemH;
        }
        this.ctx.restore();

        // ✨ 绘制草稿风滚动条
        if (this.maxScrollY > 0) {
            const barX = modalX + modalW - 12;
            const barY = listStartY;
            const barH = listVisibleH;
            
            this.ctx.beginPath(); this.ctx.lineWidth = 1; this.ctx.strokeStyle = '#DDDDDD';
            this.ctx.moveTo(barX, barY); this.ctx.lineTo(barX, barY + barH); this.ctx.stroke();

            const thumbH = Math.max(30, barH * (listVisibleH / totalContentH));
            const thumbY = barY + (-this.scrollY / this.maxScrollY) * (barH - thumbH);
            this.ctx.beginPath(); this.ctx.lineWidth = 4; this.ctx.lineCap = 'round'; this.ctx.strokeStyle = INK_COLOR;
            this.ctx.moveTo(barX, thumbY); this.ctx.lineTo(barX, thumbY + thumbH); this.ctx.stroke();
        }

        this.texture.needsUpdate = true;
    }

    bindTouchEvent() {
        if (this.hasBoundTouch) return
        this.hasBoundTouch = true

        let touchStartY = 0;
        let startScrollY = 0;

        const handleStart = (e) => {
            if (!this.isVisible || this.isLoading) return;
            touchStartY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            startScrollY = this.scrollY;
            this.isSwiping = false;
        };

        const handleMove = (e) => {
            if (!this.isVisible || this.isLoading || this.maxScrollY <= 0) return;
            let currentY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            let dy = currentY - touchStartY;
            
            if (Math.abs(dy) > 5) this.isSwiping = true; // 区分点击和滑动的阈值

            if (this.isSwiping) {
                this.scrollY = startScrollY + dy;
                // 弹性边界阻尼限制
                if (this.scrollY > 0) this.scrollY = 0; 
                if (this.scrollY < -this.maxScrollY) this.scrollY = -this.maxScrollY;
                this.draw();
            }
        };

        const handleEnd = (e) => {
            if (!this.isVisible) return;
            if (this.isSwiping) return; // ✨ 核心：如果是滑动操作，绝不触发点击事件！

            let cX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            let cY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            const hit = (b, pad=15) => cX >= b.x-pad && cX <= b.x+b.w+pad && cY >= b.y-pad && cY <= b.y+b.h+pad;

            const { modalBox } = this.ui;
            const isOutside = (cX < modalBox.x || cX > modalBox.x + modalBox.w || cY < modalBox.y || cY > modalBox.y + modalBox.h);
            
            if (isOutside || hit(this.hitboxes.close)) {
                if (this.callbacks && this.callbacks.onBack) this.callbacks.onBack();
                return;
            }

            if (!this.isLoading) {
                if (hit(this.hitboxes.tabFriend) && this.currentTab !== 'friend') { this.switchTab('friend'); return; }
                if (hit(this.hitboxes.tabWorld) && this.currentTab !== 'world') { this.switchTab('world'); return; }
            }
        };

        if (typeof wx !== 'undefined') {
            wx.onTouchStart(handleStart); wx.onTouchMove(handleMove); wx.onTouchEnd(handleEnd);
        } else {
            window.addEventListener('mousedown', handleStart);
            window.addEventListener('mousemove', (e) => { if(e.buttons > 0) handleMove(e); });
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchstart', handleStart);
            window.addEventListener('touchmove', handleMove);
            window.addEventListener('touchend', handleEnd);
        }
    }
}