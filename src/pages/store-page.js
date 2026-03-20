// src/pages/store-page.js
import { camera } from '../scene/index'
import API from '../services/api'
import gameModel from '../game/model'
import sceneConf from '../../confs/scene-conf'

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;

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

    drawSketchyBox(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(x + 2, y + 3);
        ctx.lineTo(x + w + 1, y - 1);
        ctx.lineTo(x + w - 1, y + h + 2);
        ctx.lineTo(x - 2, y + h - 1);
        ctx.lineTo(x + 3, y - 2); 
        ctx.stroke();
    }

    drawSketchyLine(ctx, x, y, w) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.moveTo(x, y);
        // 画一条微弯的分割线
        ctx.quadraticCurveTo(x + w / 2, y + 3, x + w, y - 1);
        ctx.stroke();
    }

    draw() {
        if (!this.isVisible) return;

        const w = this.width;
        const h = this.height;

        this.ctx.clearRect(0, 0, w, h);

        // 外部画纸遮罩 (轻微变暗)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(0, 0, w, h);

        // 像一张便签纸一样的模态框
        const modalW = w * 0.85;
        const modalH = h * 0.70;
        const modalX = (w - modalW) / 2;
        const modalY = (h - modalH) / 2;

        this.ui.modalBox = { x: modalX, y: modalY, w: modalW, h: modalH };

        this.ctx.fillStyle = '#FFFFFF'; 
        this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.drawSketchyBox(this.ctx, modalX, modalY, modalW, modalH);

        // 标题区分割线
        this.drawSketchyLine(this.ctx, modalX + 10, modalY + 60, modalW - 20);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = `900 24px ${safeFont}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('黑心小卖部', w / 2, modalY + 30);

        // 粗糙的关闭符号
        const closeAreaSize = 60;
        this.ui.closeBtn = { 
            x: modalX + modalW - closeAreaSize, 
            y: modalY, 
            w: closeAreaSize, 
            h: 60 
        };
        this.ctx.font = `normal 24px ${safeFont}`;
        this.ctx.fillText('X', this.ui.closeBtn.x + closeAreaSize / 2, modalY + 30);

        this.ctx.font = `bold 16px ${safeFont}`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`资产: ${gameModel.coins}`, modalX + 20, modalY + 90);

        if (this.isLoading) {
            this.ctx.textAlign = 'center';
            this.ctx.fillText('找货中...', w / 2, modalY + modalH / 2);
            this.texture.needsUpdate = true;
            return;
        }

        this.buyBtnHitboxes = [];
        const itemH = h * 0.12;
        const itemSpacing = 15;
        let startY = modalY + 120;

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const isOwned = this.inventory.includes(item.id);

            // 商品不再用框包起来，而是用极简的分割线隔开
            this.ctx.fillStyle = '#000000'; 
            this.ctx.font = `900 18px ${safeFont}`;
            this.ctx.fillText(item.name, modalX + 20, startY + itemH * 0.35);

            this.ctx.fillStyle = '#555555'; // 铅笔灰描述
            this.ctx.font = `normal 14px ${safeFont}`;
            this.ctx.fillText(item.desc, modalX + 20, startY + itemH * 0.7);

            const btnW = 75;
            const btnH = 36;
            const btnX = modalX + modalW - 20 - btnW;
            const btnY = startY + (itemH - btnH) / 2;

            if (isOwned) {
                this.ctx.fillStyle = '#888888';
                this.ctx.font = `bold 16px ${safeFont}`;
                this.ctx.textAlign = 'center';
                // 用横线划掉价格代表已拥有
                this.ctx.fillText('已拥有', btnX + btnW / 2, btnY + btnH / 2);
                this.drawSketchyLine(this.ctx, btnX, btnY + btnH / 2, btnW);
            } else {
                // 购买框
                this.drawSketchyBox(this.ctx, btnX, btnY, btnW, btnH);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = `bold 16px ${safeFont}`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${item.price}`, btnX + btnW / 2, btnY + btnH / 2);
                
                this.buyBtnHitboxes.push({ item, x: btnX, y: btnY, w: btnW, h: btnH });
            }

            this.ctx.textAlign = 'left';
            
            // 底部画一条随意的分割线
            if (i < this.items.length - 1) {
                this.drawSketchyLine(this.ctx, modalX + 15, startY + itemH + itemSpacing / 2, modalW - 30);
            }
            
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

            // 外部遮罩或关闭按钮
            const { modalBox, closeBtn } = this.ui;
            const isOutside = (clientX < modalBox.x || clientX > modalBox.x + modalBox.w || clientY < modalBox.y || clientY > modalBox.y + modalBox.h);
            const isClickingClose = (clientX >= closeBtn.x - 15 && clientX <= closeBtn.x + closeBtn.w + 15 && clientY >= closeBtn.y - 15 && clientY <= closeBtn.y + closeBtn.h + 15);

            if (isOutside || isClickingClose) {
                if (this.callbacks && this.callbacks.onBack) this.callbacks.onBack();
                return;
            }

            const padding = 20;
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
            if (typeof wx !== 'undefined') wx.showToast({ title: '太穷了', icon: 'none' });
            return;
        }
        if (typeof wx !== 'undefined') wx.showLoading({ title: '交易中...', mask: true });
        
        const res = await API.buyItem(item.id, item.price);
        if (typeof wx !== 'undefined') wx.hideLoading();

        if (res.success) {
            this.inventory = res.inventory;
            if (typeof wx !== 'undefined') wx.showToast({ title: '买到了！', icon: 'success' });
            this.draw(); 
        } else {
            if (typeof wx !== 'undefined') wx.showToast({ title: res.msg, icon: 'none' });
        }
    }
}