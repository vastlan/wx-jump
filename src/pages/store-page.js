// src/pages/store-page.js
import { camera } from '../scene/index'
import API from '../services/api'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf'

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

export default class StorePage {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.items = []; this.inventory = []; this.links = []; this.prizes = [];
        this.currentTab = 'store'; 
        this.isLoading = true; this.isVisible = false; this.hasBoundTouch = false;
        this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
        this.width = this.sysInfo.windowWidth; this.height = this.sysInfo.windowHeight;
        this.ui = { modalBox: {x:0,y:0,w:0,h:0}, closeBtn: {x:0,y:0,w:0,h:0}, listRect: {x:0,y:0,w:0,h:0} };
        
        this.tabHitboxes = []; this.buyBtnHitboxes = []; this.descBtnHitboxes = []; this.jokeBtnHitboxes = [];
        this.activeDescItem = null; 
        
        // 滚动状态
        this.scrollY = 0;
        this.maxScrollY = 0;
        this.isSwiping = false;
        this.canScroll = false; // ✨ 新增：用于判断落点是否在可滚动区域
    }

    init() {
        this.canvas = typeof wx !== 'undefined' ? wx.createCanvas() : document.createElement('canvas')
        this.canvas.width = this.width; this.canvas.height = this.height
        this.ctx = this.canvas.getContext('2d')
        this.texture = new THREE.CanvasTexture(this.canvas)
        const material = new THREE.SpriteMaterial({ map: this.texture, depthTest: false })
        this.instance = new THREE.Sprite(material)
        const fSize = sceneConf.frustumSize; const aspect = this.height / this.width;
        this.instance.scale.set(fSize*2, fSize*aspect+fSize, 1)
        this.instance.position.set(0, (fSize*aspect-fSize)/2, -8) 
        this.instance.renderOrder = 220; this.instance.visible = false;
        camera.instance.add(this.instance)
        this.bindTouchEvent()
    }

    async show() {
        this.isVisible = true; this.instance.visible = true; this.isLoading = true; this.activeDescItem = null; 
        this.scrollY = 0; 
        this.draw(); 
        try {
            const [items, inventory, links, prizes] = await Promise.all([
                API.getStoreItems(), API.getUserInventory(), API.getMysteryLinks(), API.getDailyPrizes()
            ]);
            this.items = items; this.inventory = inventory; this.links = links; this.prizes = prizes;
        } catch (e) {} finally {
            this.isLoading = false; this.draw(); 
        }
    }
    hide() { this.isVisible = false; this.instance.visible = false; }

    drawSketchyBox(ctx, x, y, w, h) {
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = INK_COLOR; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.moveTo(x+2,y+3); ctx.lineTo(x+w+1,y-1); ctx.lineTo(x+w-1,y+h+2); ctx.lineTo(x-2,y+h-1); ctx.lineTo(x+3,y-2); ctx.stroke();
    }
    drawSketchyLine(ctx, x, y, w) {
        ctx.beginPath(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK_COLOR;
        ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w / 2, y + 3, x + w, y - 1); ctx.stroke();
    }
    wrapText(ctx, text, maxWidth) {
        let lines = []; let currentLine = '';
        for (let i = 0; i < text.length; i++) {
            let testLine = currentLine + text[i];
            if (ctx.measureText(testLine).width > maxWidth && i > 0) { lines.push(currentLine); currentLine = text[i]; } 
            else currentLine = testLine;
        }
        lines.push(currentLine); return lines;
    }

    draw() {
        if (!this.isVisible) return;
        const w = this.width; const h = this.height;
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; this.ctx.fillRect(0, 0, w, h);

        const modalW = w * 0.90; const modalH = h * 0.75;
        const modalX = (w - modalW) / 2; const modalY = (h - modalH) / 2;
        this.ui.modalBox = { x: modalX, y: modalY, w: modalW, h: modalH };

        this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.drawSketchyBox(this.ctx, modalX, modalY, modalW, modalH);

        this.ctx.fillStyle = INK_COLOR; this.ctx.font = `900 22px ${safeFont}`;
        this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📦 神秘破纸箱', w / 2, modalY + 30);

        const closeAreaSize = 50;
        this.ui.closeBtn = { x: modalX + modalW - closeAreaSize, y: modalY, w: closeAreaSize, h: 50 };
        this.ctx.font = `normal 22px ${safeFont}`; this.ctx.fillText('X', this.ui.closeBtn.x + closeAreaSize / 2, modalY + 30);
        this.drawSketchyLine(this.ctx, modalX + 10, modalY + 55, modalW - 20);

        this.tabHitboxes = [];
        const tabGap = 8; const tabW = (modalW - 30 - tabGap * 2) / 3; const tabH = 34; const tabY = modalY + 65;
        
        // ✨ 已根据修正记录，将“积分商城”统一换成“商城”
        const tabs = [ { id: 'store', text: '商城' }, { id: 'prizes', text: '今日奖品' }, { id: 'links', text: '神秘链接' } ];

        tabs.forEach((tab, index) => {
            const tx = modalX + 15 + index * (tabW + tabGap);
            if (this.currentTab === tab.id) { this.drawSketchyBox(this.ctx, tx, tabY, tabW, tabH); this.ctx.fillStyle = INK_COLOR; } 
            else { this.ctx.fillStyle = '#888888'; }
            this.ctx.font = `bold 14px ${safeFont}`;
            this.ctx.fillText(tab.text, tx + tabW / 2, tabY + tabH / 2);
            this.tabHitboxes.push({ id: tab.id, x: tx, y: tabY, w: tabW, h: tabH });
        });

        if (this.isLoading) {
            this.ctx.fillStyle = INK_COLOR; this.ctx.fillText('找货中...', w / 2, modalY + modalH / 2);
            this.texture.needsUpdate = true; return;
        }

        // ==========================================
        // ✨ 布局重构：分离【固定头部】与【滚动列表】
        // ==========================================
        let fixedHeaderH = 0;
        
        // 将“兜里还剩 xx 分” 固定在裁剪区外部的头部
        if (this.currentTab === 'store') {
            fixedHeaderH = 30;
            this.ctx.fillStyle = INK_COLOR; 
            this.ctx.font = `bold 14px ${safeFont}`;
            this.ctx.textAlign = 'left'; 
            this.ctx.fillText(`兜里还剩: ${gameModel.coins} 分`, modalX + 20, tabY + tabH + 20);
        }

        // 重新计算滚动区域的起始 Y 和可用高度
        const contentStartY = tabY + tabH + 15 + fixedHeaderH;
        const listVisibleH = modalY + modalH - contentStartY - 10;
        this.ui.listRect = { x: modalX, y: contentStartY - 5, w: modalW, h: listVisibleH + 5 };

        // ✨ 开启滚动裁剪区
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(this.ui.listRect.x, this.ui.listRect.y, this.ui.listRect.w, this.ui.listRect.h);
        this.ctx.clip();

        let totalContentH = 0;
        const scrolledY = contentStartY + this.scrollY;

        if (this.currentTab === 'links') totalContentH = this.drawLinksTab(modalX, modalW, scrolledY);
        else if (this.currentTab === 'prizes') totalContentH = this.drawProductGrid(modalX, modalW, scrolledY, this.prizes, true);
        else if (this.currentTab === 'store') totalContentH = this.drawProductGrid(modalX, modalW, scrolledY, this.items, false);

        this.ctx.restore();

        // ✨ 绘制滚动条
        this.maxScrollY = Math.max(0, totalContentH - listVisibleH);
        if (this.maxScrollY > 0 && !this.activeDescItem) {
            const barX = modalX + modalW - 8;
            this.ctx.beginPath(); this.ctx.lineWidth = 1; this.ctx.strokeStyle = '#DDDDDD';
            this.ctx.moveTo(barX, contentStartY); this.ctx.lineTo(barX, contentStartY + listVisibleH); this.ctx.stroke();
            const thumbH = Math.max(30, listVisibleH * (listVisibleH / totalContentH));
            const thumbY = contentStartY + (-this.scrollY / this.maxScrollY) * (listVisibleH - thumbH);
            this.ctx.beginPath(); this.ctx.lineWidth = 4; this.ctx.lineCap = 'round'; this.ctx.strokeStyle = INK_COLOR;
            this.ctx.moveTo(barX, thumbY); this.ctx.lineTo(barX, thumbY + thumbH); this.ctx.stroke();
        }

        if (this.activeDescItem) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; this.ctx.fillRect(modalX, modalY, modalW, modalH);
            const noteW = modalW * 0.85; const noteH = modalH * 0.45;
            const noteX = modalX + (modalW - noteW) / 2; const noteY = modalY + (modalH - noteH) / 2;
            this.ctx.fillStyle = PAPER_COLOR; this.ctx.fillRect(noteX, noteY, noteW, noteH);
            this.drawSketchyBox(this.ctx, noteX, noteY, noteW, noteH);
            this.ctx.fillStyle = INK_COLOR; this.ctx.font = `900 18px ${safeFont}`;
            this.ctx.textAlign = 'center'; this.ctx.fillText(this.activeDescItem.name, w / 2, noteY + 30);
            this.drawSketchyLine(this.ctx, noteX + 20, noteY + 45, noteW - 40);
            this.ctx.font = `normal 15px ${safeFont}`; this.ctx.textAlign = 'left';
            const lines = this.wrapText(this.ctx, this.activeDescItem.desc, noteW - 30);
            lines.forEach((line, idx) => { this.ctx.fillText(line, noteX + 15, noteY + 75 + idx * 22); });
            this.ctx.fillStyle = '#888888'; this.ctx.font = `italic 12px ${safeFont}`;
            this.ctx.textAlign = 'center'; this.ctx.fillText('(点外边关掉)', w / 2, noteY + noteH - 20);
        }
        this.texture.needsUpdate = true;
    }

    drawLinksTab(modalX, modalW, startY) {
        this.jokeBtnHitboxes = [];
        const gap = 15; const padding = 20;
        const boxW = (modalW - padding * 2 - gap * 2) / 3; const boxH = boxW * 1.1;
        let rows = 0;

        this.links.forEach((link, i) => {
            rows = Math.max(rows, Math.floor(i / 3) + 1);
            const col = i % 3;
            const x = modalX + padding + col * (boxW + gap);
            const y = startY + Math.floor(i / 3) * (boxH + gap);

            this.drawSketchyBox(this.ctx, x, y, boxW, boxH);
            this.ctx.fillStyle = '#EAEAEA'; this.ctx.fillRect(x + 5, y + 5, boxW - 10, boxH * 0.55);
            this.ctx.fillStyle = '#888888'; this.ctx.font = `12px ${safeFont}`; this.ctx.textAlign = 'center';
            this.ctx.fillText(link.logo ? '图' : 'Logo', x + boxW/2, y + 5 + (boxH*0.55)/2);
            this.ctx.fillStyle = INK_COLOR; this.ctx.font = `bold 13px ${safeFont}`;
            this.ctx.fillText(link.name, x + boxW/2, y + boxH - 15);
            this.jokeBtnHitboxes.push({ msg: `前往 ${link.name} (API预留)`, x, y, w: boxW, h: boxH });
        });
        return rows * (boxH + gap);
    }

    drawProductGrid(modalX, modalW, startY, dataList, isPrize) {
        this.buyBtnHitboxes = []; this.descBtnHitboxes = [];
        const cols = 2; const gap = 15; const padding = 20;
        const itemW = (modalW - padding * 2 - gap) / 2; const itemH = itemW * 1.45; 
        let rows = 0;

        dataList.forEach((item, i) => {
            rows = Math.max(rows, Math.floor(i / 2) + 1);
            const col = i % 2;
            const x = modalX + padding + col * (itemW + gap);
            const y = startY + Math.floor(i / 2) * (itemH + gap);

            this.drawSketchyBox(this.ctx, x, y, itemW, itemH);
            const imgH = itemW * 0.65;
            this.ctx.fillStyle = '#F5F5F5'; this.ctx.fillRect(x + 6, y + 6, itemW - 12, imgH);
            this.drawSketchyBox(this.ctx, x + 5, y + 5, itemW - 10, imgH);
            
            this.ctx.fillStyle = '#AAAAAA'; this.ctx.font = `12px ${safeFont}`; this.ctx.textAlign = 'center';
            this.ctx.fillText(item.image ? '图' : '暂无图', x + itemW/2, y + 5 + imgH/2);

            const iconR = 8; const iconX = x + itemW - 5 - iconR; const iconY = y + 5 + iconR;
            this.ctx.fillStyle = PAPER_COLOR; this.ctx.beginPath(); this.ctx.arc(iconX, iconY, iconR, 0, Math.PI*2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.arc(iconX, iconY, iconR, 0, Math.PI*1.8); this.ctx.stroke();
            this.ctx.fillStyle = INK_COLOR; this.ctx.font = `bold 12px ${safeFont}`; this.ctx.fillText('?', iconX, iconY + 1);
            this.descBtnHitboxes.push({ item, x: iconX - 15, y: iconY - 15, w: 30, h: 30 });

            this.ctx.fillStyle = INK_COLOR; this.ctx.font = `900 14px ${safeFont}`;
            let dName = item.name; if (this.ctx.measureText(dName).width > itemW - 10) dName = dName.substring(0, 5) + '..'; 
            this.ctx.fillText(dName, x + itemW/2, y + imgH + 22);

            const btnW = itemW - 16; const btnH = 26; const btnX = x + 8; const btnY = y + itemH - btnH - 8;
            if (this.inventory.includes(item.id) && !isPrize) {
                this.ctx.fillStyle = '#888888'; this.ctx.font = `bold 14px ${safeFont}`;
                this.ctx.fillText('已拥有', btnX + btnW/2, btnY + btnH/2);
                this.drawSketchyLine(this.ctx, btnX, btnY + btnH/2, btnW);
            } else {
                this.drawSketchyBox(this.ctx, btnX, btnY, btnW, btnH);
                this.ctx.fillStyle = INK_COLOR; this.ctx.font = `bold 13px ${safeFont}`;
                this.ctx.fillText(isPrize ? `抽: ${item.price}` : `${item.price} 分`, btnX + btnW/2, btnY + btnH/2);
                this.buyBtnHitboxes.push({ item, x: btnX, y: btnY, w: btnW, h: btnH });
            }
            this.ctx.textAlign = 'left';
        });
        return rows * (itemH + gap);
    }

    bindTouchEvent() {
        if (this.hasBoundTouch) return
        this.hasBoundTouch = true

        let touchStartY = 0; let startScrollY = 0;

        const handleStart = (e) => {
            if (!this.isVisible || this.isLoading) return;
            let clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            let clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            
            // ✨ 判断手指起点是否在滚动裁剪区域内，防止误触发背景滑动
            const r = this.ui.listRect;
            if (r && clientY >= r.y && clientY <= r.y + r.h && clientX >= r.x && clientX <= r.x + r.w) {
                this.canScroll = true;
                touchStartY = clientY;
                startScrollY = this.scrollY;
            } else {
                this.canScroll = false;
            }
            this.isSwiping = false;
        };

        const handleMove = (e) => {
            if (!this.isVisible || this.isLoading || this.activeDescItem || this.maxScrollY <= 0 || !this.canScroll) return;
            let currentY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
            let dy = currentY - touchStartY;
            
            if (Math.abs(dy) > 5) this.isSwiping = true;
            
            if (this.isSwiping) {
                this.scrollY = startScrollY + dy;
                if (this.scrollY > 0) this.scrollY = 0;
                if (this.scrollY < -this.maxScrollY) this.scrollY = -this.maxScrollY;
                this.draw();
            }
        };

        const handleEnd = (e) => {
            if (!this.isVisible) return;
            if (this.isSwiping) return; // 滑动动作绝对不触发点击购买

            let cX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            let cY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

            if (this.activeDescItem) { this.activeDescItem = null; this.draw(); return; }

            const { modalBox, closeBtn, listRect } = this.ui;
            const isOutside = (cX < modalBox.x || cX > modalBox.x + modalBox.w || cY < modalBox.y || cY > modalBox.y + modalBox.h);
            const isClickingClose = (cX >= closeBtn.x-15 && cX <= closeBtn.x+closeBtn.w+15 && cY >= closeBtn.y-15 && cY <= closeBtn.y+closeBtn.h+15);

            if (isOutside || isClickingClose) { if (this.callbacks?.onBack) this.callbacks.onBack(); return; }

            const hit = (b, pad=15) => cX >= b.x-pad && cX <= b.x+b.w+pad && cY >= b.y-pad && cY <= b.y+b.h+pad;

            for (let i = 0; i < this.tabHitboxes.length; i++) {
                if (hit(this.tabHitboxes[i])) {
                    if (this.currentTab !== this.tabHitboxes[i].id) { 
                        this.currentTab = this.tabHitboxes[i].id; 
                        this.scrollY = 0; // 切换Tab强制重置滚动
                        this.draw(); 
                    } return;
                }
            }
            
            // ✨ 如果落点在滚动区之外，直接拦截后续的商品点击事件，防止穿透
            if (cY < listRect.y || cY > listRect.y + listRect.h || cX < listRect.x || cX > listRect.x + listRect.w) return;

            for (let i = 0; i < this.jokeBtnHitboxes.length; i++) {
                if (hit(this.jokeBtnHitboxes[i])) { if (typeof wx !== 'undefined') wx.showToast({ title: this.jokeBtnHitboxes[i].msg, icon: 'none' }); return; }
            }
            for (let i = 0; i < this.descBtnHitboxes.length; i++) {
                if (hit(this.descBtnHitboxes[i])) { this.activeDescItem = this.descBtnHitboxes[i].item; this.draw(); return; }
            }
            for (let i = 0; i < this.buyBtnHitboxes.length; i++) {
                if (hit(this.buyBtnHitboxes[i])) { this.buyItem(this.buyBtnHitboxes[i].item); break; }
            }
        };

        if (typeof wx !== 'undefined') { wx.onTouchStart(handleStart); wx.onTouchMove(handleMove); wx.onTouchEnd(handleEnd); } 
        else {
            window.addEventListener('mousedown', handleStart); window.addEventListener('mousemove', (e)=>{if(e.buttons>0)handleMove(e)}); window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchstart', handleStart); window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleEnd);
        }
    }

    async buyItem(item) {
        if (gameModel.coins < item.price) { if (typeof wx !== 'undefined') wx.showToast({ title: '分不够，去跳！', icon: 'none' }); return; }
        if (typeof wx !== 'undefined') wx.showLoading({ title: '交易中...', mask: true });
        const res = await API.buyItem(item.id, item.price);
        if (typeof wx !== 'undefined') wx.hideLoading();
        if (res.success) {
            this.inventory = res.inventory;
            if (typeof wx !== 'undefined') wx.showToast({ title: '血赚！', icon: 'success' });
            this.draw(); 
        } else {
            if (typeof wx !== 'undefined') wx.showToast({ title: res.msg, icon: 'none' });
        }
    }
}