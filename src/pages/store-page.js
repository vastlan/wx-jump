// src/pages/store-page.js
import { camera } from '../scene/index'
import API from '../services/api'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf'

const comicFont = `"Comic Sans MS", "Chalkboard SE", "Marker Felt", "PingFang SC", "Microsoft YaHei", sans-serif`;
const INK_COLOR = '#2A2A2A'; 
const PAPER_COLOR = '#FDF9F1'; 

export default class StorePage {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.items = [];
        this.inventory = [];
        this.isLoading = true;
        this.isVisible = false;
        this.hasBoundTouch = false;

        this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
        this.width = this.sysInfo.windowWidth
        this.height = this.sysInfo.windowHeight

        this.ui = { 
            modalBox: { x: 0, y: 0, w: 0, h: 0 },
            closeBtn: { x: 0, y: 0, w: 0, h: 0 }
        };
        this.buyBtnHitboxes = [];
    }

    init() {
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
        this.instance.position.set(0, camCenterY, -8) 
        this.instance.renderOrder = 220     
        this.instance.visible = false
        
        camera.instance.add(this.instance)
        this.bindTouchEvent()
    }

    async show() {
        this.isVisible = true;
        this.instance.visible = true;
        this.isLoading = true;
        this.draw(); 
        
        try {
            const [items, inventory] = await Promise.all([
                API.getStoreItems(),
                API.getUserInventory()
            ]);
            this.items = items;
            this.inventory = inventory;
        } catch (error) {
            console.error("加载商城失败", error);
        } finally {
            this.isLoading = false;
            this.draw(); 
        }
    }

    hide() {
        this.isVisible = false;
        this.instance.visible = false;
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
        if (!this.isVisible) return;

        const w = this.width;
        const h = this.height;

        this.ctx.clearRect(0, 0, w, h);

        this.ctx.fillStyle = 'rgba(253, 249, 241, 0.85)';
        this.ctx.fillRect(0, 0, w, h);

        const modalW = w * 0.85;
        const modalH = h * 0.70;
        const modalX = (w - modalW) / 2;
        const modalY = (h - modalH) / 2;

        this.ui.modalBox = { x: modalX, y: modalY, w: modalW, h: modalH };

        // 核心商城面板 (手绘风格)
        this.drawSketchBox(this.ctx, modalX, modalY, modalW, modalH, 16);

        // 顶栏分隔线
        this.ctx.beginPath();
        this.ctx.moveTo(modalX, modalY + 60);
        this.ctx.lineTo(modalX + modalW, modalY + 60);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = INK_COLOR;
        this.ctx.stroke();

        this.ctx.fillStyle = INK_COLOR;
        this.ctx.font = `bold 22px ${comicFont}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('商城', w / 2, modalY + 30);

        // 关闭文字按钮
        const closeAreaSize = 60;
        this.ui.closeBtn = { 
            x: modalX + modalW - closeAreaSize, 
            y: modalY, 
            w: closeAreaSize, 
            h: 60 
        };
        this.ctx.font = `bold 16px ${comicFont}`;
        this.ctx.fillText('关闭', this.ui.closeBtn.x + closeAreaSize / 2, modalY + 30);

        this.ctx.font = `bold 16px ${comicFont}`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`拥有积分: ${gameModel.coins}`, modalX + 20, modalY + 85);

        if (this.isLoading) {
            this.ctx.textAlign = 'center';
            this.ctx.fillText('装载中...', w / 2, modalY + modalH / 2);
            this.texture.needsUpdate = true;
            return;
        }

        this.buyBtnHitboxes = [];
        const itemH = h * 0.12;
        const itemSpacing = 15;
        let startY = modalY + 115;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const isOwned = this.inventory.includes(item.id);

            // 卡片项手绘框
            this.drawSketchBox(this.ctx, modalX + 15, startY, modalW - 30, itemH, 10);

            this.ctx.fillStyle = INK_COLOR; 
            this.ctx.font = `bold 18px ${comicFont}`;
            this.ctx.fillText(item.name, modalX + 35, startY + itemH * 0.35);

            this.ctx.fillStyle = '#666666'; 
            this.ctx.font = `12px ${comicFont}`;
            this.ctx.fillText(item.desc, modalX + 35, startY + itemH * 0.7);

            const btnW = 75;
            const btnH = 34;
            const btnX = modalX + modalW - 15 - btnW - 10;
            const btnY = startY + (itemH - btnH) / 2;

            if (isOwned) {
                // 已拥有：去掉硬底阴影
                this.ctx.fillStyle = '#DDDDDD';
                this.roundRect(this.ctx, btnX, btnY, btnW, btnH, 8);
                this.ctx.fill();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = INK_COLOR;
                this.ctx.stroke();

                this.ctx.fillStyle = '#888888';
                this.ctx.font = `bold 14px ${comicFont}`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('已拥有', btnX + btnW / 2, btnY + btnH / 2);
            } else {
                // 购买按钮：硬核漫画边框
                this.drawSketchBox(this.ctx, btnX, btnY, btnW, btnH, 8);

                this.ctx.fillStyle = INK_COLOR;
                this.ctx.font = `bold 14px ${comicFont}`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${item.price} 积分`, btnX + btnW / 2, btnY + btnH / 2);
                
                this.buyBtnHitboxes.push({ item, x: btnX, y: btnY, w: btnW, h: btnH });
            }
            this.ctx.textAlign = 'left';
            startY += itemH + itemSpacing;
        }

        this.texture.needsUpdate = true;
    }

    bindTouchEvent() {
        if (this.hasBoundTouch) return
        this.hasBoundTouch = true

        const handleTouch = async (e) => {
            if (!this.isVisible || this.isLoading) return

            let clientX, clientY
            if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX
                clientY = e.changedTouches[0].clientY
            } else {
                clientX = e.clientX
                clientY = e.clientY
            }

            const { modalBox, closeBtn } = this.ui;
            const isOutside = (clientX < modalBox.x || clientX > modalBox.x + modalBox.w || clientY < modalBox.y || clientY > modalBox.y + modalBox.h);
            const isClickingClose = (clientX >= closeBtn.x - 10 && clientX <= closeBtn.x + closeBtn.w + 10 && clientY >= closeBtn.y - 10 && clientY <= closeBtn.y + closeBtn.h + 10);

            if (isOutside || isClickingClose) {
                if (this.callbacks && this.callbacks.onBack) this.callbacks.onBack();
                return;
            }

            const padding = 15;
            for (let i = 0; i < this.buyBtnHitboxes.length; i++) {
                const btn = this.buyBtnHitboxes[i];
                if (clientX >= btn.x - padding && clientX <= btn.x + btn.w + padding &&
                    clientY >= btn.y - padding && clientY <= btn.y + btn.h + padding) {
                    this.buyItem(btn.item);
                    break;
                }
            }
        }

        if (typeof wx !== 'undefined') {
            wx.onTouchEnd(handleTouch)
        } else {
            window.addEventListener('touchend', handleTouch)
            window.addEventListener('mouseup', handleTouch)
        }
    }

    async buyItem(item) {
        if (gameModel.coins < item.price) {
            if (typeof wx !== 'undefined') wx.showToast({ title: '积分不足', icon: 'none' });
            return;
        }
        if (typeof wx !== 'undefined') wx.showLoading({ title: '兑换中...', mask: true });
        
        const res = await API.buyItem(item.id, item.price);
        if (typeof wx !== 'undefined') wx.hideLoading();

        if (res.success) {
            this.inventory = res.inventory;
            if (typeof wx !== 'undefined') wx.showToast({ title: '兑换成功！', icon: 'success' });
            this.draw(); 
        } else {
            if (typeof wx !== 'undefined') wx.showToast({ title: res.msg, icon: 'none' });
        }
    }
}