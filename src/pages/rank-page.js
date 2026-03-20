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
        this.currentTab = 'friend'; // 'friend' | 'world'
        this.isLoading = true;
        this.isVisible = false;
        this.hasBoundTouch = false;

        this.sysInfo = typeof wx !== 'undefined' ? wx.getSystemInfoSync() : { windowWidth: window.innerWidth, windowHeight: window.innerHeight }
        this.width = this.sysInfo.windowWidth
        this.height = this.sysInfo.windowHeight

        this.ui = { modalBox: { x: 0, y: 0, w: 0, h: 0 } };
        this.hitboxes = {
            close: { x: 0, y: 0, w: 0, h: 0 },
            tabFriend: { x: 0, y: 0, w: 0, h: 0 },
            tabWorld: { x: 0, y: 0, w: 0, h: 0 }
        };
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
        await this.switchTab('friend');
    }

    hide() {
        this.isVisible = false;
        this.instance.visible = false;
    }

    async switchTab(tab) {
        this.currentTab = tab;
        this.isLoading = true;
        this.rankData = [];
        this.draw(); 
        
        try {
            if (tab === 'world') {
                this.rankData = await API.getGlobalRank();
            } else {
                this.rankData = await API.getFriendRank();
            }
        } catch (error) {
            console.error("加载榜单失败", error);
        } finally {
            this.isLoading = false;
            this.draw(); 
        }
    }

    drawSketchyBox(ctx, x, y, w, h) {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = INK_COLOR;
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
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK_COLOR;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w / 2, y + 3, x + w, y - 1);
        ctx.stroke();
    }

    draw() {
        if (!this.isVisible) return;
        const w = this.width;
        const h = this.height;

        this.ctx.clearRect(0, 0, w, h);
        
        // 外部画纸遮罩
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.fillRect(0, 0, w, h);

        const modalW = w * 0.85;
        const modalH = h * 0.70;
        const modalX = (w - modalW) / 2;
        const modalY = (h - modalH) / 2;
        this.ui.modalBox = { x: modalX, y: modalY, w: modalW, h: modalH };

        // 背景底板
        this.ctx.fillStyle = PAPER_COLOR; 
        this.ctx.fillRect(modalX, modalY, modalW, modalH);
        this.drawSketchyBox(this.ctx, modalX, modalY, modalW, modalH);

        // 标题
        this.ctx.fillStyle = INK_COLOR;
        this.ctx.font = `900 24px ${safeFont}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('卷 王 榜', w / 2, modalY + 30);

        // 关闭 X
        const closeAreaSize = 50;
        this.hitboxes.close = { x: modalX + modalW - closeAreaSize, y: modalY, w: closeAreaSize, h: 50 };
        this.ctx.font = `normal 24px ${safeFont}`;
        this.ctx.fillText('X', this.hitboxes.close.x + closeAreaSize / 2, modalY + 30);

        this.drawSketchyLine(this.ctx, modalX + 10, modalY + 60, modalW - 20);

        // ==========================================
        // ✨ 手绘风 Tab 页签切换
        // ==========================================
        const tabW = modalW * 0.4;
        const tabH = 40;
        const tabY = modalY + 75;
        const friendX = modalX + modalW * 0.1 - 5;
        const worldX = modalX + modalW * 0.5 + 5;

        // 好友榜 Tab
        if (this.currentTab === 'friend') this.drawSketchyBox(this.ctx, friendX, tabY, tabW, tabH);
        this.ctx.font = `bold 16px ${safeFont}`;
        this.ctx.fillStyle = this.currentTab === 'friend' ? INK_COLOR : '#888888';
        this.ctx.fillText('熟人互卷', friendX + tabW / 2, tabY + tabH / 2);
        this.hitboxes.tabFriend = { x: friendX, y: tabY, w: tabW, h: tabH };

        // 世界榜 Tab
        if (this.currentTab === 'world') this.drawSketchyBox(this.ctx, worldX, tabY, tabW, tabH);
        this.ctx.fillStyle = this.currentTab === 'world' ? INK_COLOR : '#888888';
        this.ctx.fillText('全服神仙', worldX + tabW / 2, tabY + tabH / 2);
        this.hitboxes.tabWorld = { x: worldX, y: tabY, w: tabW, h: tabH };

        // ==========================================
        // ✨ 列表渲染
        // ==========================================
        if (this.isLoading) {
            this.ctx.fillStyle = INK_COLOR;
            this.ctx.fillText('翻找成绩单中...', w / 2, modalY + modalH / 2 + 20);
            this.texture.needsUpdate = true;
            return;
        }

        const itemH = h * 0.08;
        let startY = tabY + tabH + 25;

        for (let i = 0; i < this.rankData.length; i++) {
            const item = this.rankData[i];

            // 排名数字 (前三名加粗)
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = INK_COLOR;
            this.ctx.font = i < 3 ? `900 20px ${safeFont}` : `bold 16px ${safeFont}`;
            this.ctx.fillText(`No.${item.rank}`, modalX + 45, startY + itemH / 2);

            // 玩家昵称
            this.ctx.textAlign = 'left';
            this.ctx.font = `bold 16px ${safeFont}`;
            this.ctx.fillText(item.name, modalX + 90, startY + itemH / 2);

            // 分数
            this.ctx.textAlign = 'right';
            this.ctx.font = `900 18px ${safeFont}`;
            this.ctx.fillText(`${item.score}`, modalX + modalW - 20, startY + itemH / 2);

            // 潦草分割线
            if (i < this.rankData.length - 1) {
                this.drawSketchyLine(this.ctx, modalX + 15, startY + itemH, modalW - 30);
            }
            startY += itemH;
        }

        this.texture.needsUpdate = true;
    }

    bindTouchEvent() {
        if (this.hasBoundTouch) return
        this.hasBoundTouch = true

        const handleTouch = async (e) => {
            if (!this.isVisible) return

            let clientX, clientY
            if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX
                clientY = e.changedTouches[0].clientY
            } else {
                clientX = e.clientX
                clientY = e.clientY
            }

            const checkHit = (box, pad = 15) => clientX >= box.x - pad && clientX <= box.x + box.w + pad && clientY >= box.y - pad && clientY <= box.y + box.h + pad;

            // 点击外部遮罩或关闭按钮
            const { modalBox } = this.ui;
            const isOutside = (clientX < modalBox.x || clientX > modalBox.x + modalBox.w || clientY < modalBox.y || clientY > modalBox.y + modalBox.h);
            
            if (isOutside || checkHit(this.hitboxes.close)) {
                if (this.callbacks && this.callbacks.onBack) this.callbacks.onBack();
                return;
            }

            // 切换 Tab
            if (!this.isLoading) {
                if (checkHit(this.hitboxes.tabFriend) && this.currentTab !== 'friend') {
                    this.switchTab('friend');
                    return;
                }
                if (checkHit(this.hitboxes.tabWorld) && this.currentTab !== 'world') {
                    this.switchTab('world');
                    return;
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
}