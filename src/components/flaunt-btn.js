// src/components/flaunt-btn.js
import API from '../services/api'
import gameModel from '../game/model'

const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

class ShareButton {
    constructor() {
        this.shareDescs = [];
        this.shareTemplates = {};
        this.currentShareDesc = "";
        
        // 轮播算法状态
        this.marqueeX = null;
        this.scrollWait = 0;
        this.textW = 0;
        this.viewW = 0;
        this.marqueeStartX = 0;
        this.isTextLong = false;
    }

    // 初始化时拉取后端动态文案
    async loadData() {
        try {
            const [descs, templates] = await Promise.all([ 
                API.getShareDescs(gameModel.score), 
                API.getShareTemplates() 
            ]);
            this.shareDescs = descs; 
            this.shareTemplates = templates;
            
            if (this.shareDescs && this.shareDescs.length > 0) {
                this.currentShareDesc = this.shareDescs[Math.floor(Math.random() * this.shareDescs.length)];
                this.marqueeX = null; 
            }
        } catch (e) { console.error("分享文案加载失败", e) }
    }

    // 独立管理跑马灯动画状态
    updateMarquee() {
        if (this.marqueeX !== null && this.isTextLong) {
            if (this.scrollWait > 0) {
                this.scrollWait -= 16; 
            } else {
                this.marqueeX -= 1; 
                if (this.marqueeX < this.marqueeStartX - this.textW) {
                    this.marqueeX = this.marqueeStartX + this.viewW;
                }
            }
        }
    }

    // 绘制 UI 组件
    draw(ctx, x, y, w, h, drawSketchyBox, cx) {
        ctx.fillStyle = PAPER_COLOR; 
        ctx.fillRect(x, y, w, h);
        drawSketchyBox(ctx, x, y, w, h);
        
        // 1. 主标题
        ctx.fillStyle = INK_COLOR; 
        ctx.font = `900 ${Math.floor(w / 0.6 * 0.048)}px ${safeFont}`;
        ctx.textAlign = 'center';
        ctx.fillText('炫耀战绩', cx, y + h * 0.40); 

        // 2. 轮播走马灯小字
        const descY = y + h * 0.76;
        ctx.font = `normal ${Math.max(12, Math.floor(w / 0.6 * 0.032))}px ${safeFont}`;
        ctx.fillStyle = '#555555';
        
        const descText = this.currentShareDesc || "看看谁能打破我的最高记录...";
        const clipPad = 15;
        
        if (this.marqueeX === null) {
            this.textW = ctx.measureText(descText).width;
            this.viewW = w - clipPad * 2;
            this.marqueeStartX = x + clipPad; 
            this.marqueeX = this.marqueeStartX;
            this.scrollWait = 500; 
            this.isTextLong = this.textW > this.viewW;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(this.marqueeStartX, y + h * 0.55, this.viewW, h * 0.45);
        ctx.clip();

        ctx.textAlign = 'left';
        if (this.isTextLong) {
            ctx.fillText(descText, this.marqueeX, descY);
        } else {
            ctx.textAlign = 'center'; 
            ctx.fillText(descText, cx, descY); 
        }
        ctx.restore();

        return { x, y, w, h };
    }

    getRandomShareText() {
        if (!this.shareTemplates || Object.keys(this.shareTemplates).length === 0) return "发现一个宝藏小游戏，快上车！";
        const keys = Object.keys(this.shareTemplates);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const list = this.shareTemplates[randomKey];
        return list[Math.floor(Math.random() * list.length)].replace(/\{score\}/g, gameModel.score);
    }

    // 触发微信分享 API
    handleClick() {
        const shareText = this.getRandomShareText();
        if (typeof wx !== 'undefined' && wx.shareAppMessage) {
            wx.shareAppMessage({ title: shareText }); 
        } else {
            console.log("【PC端触发分享】:", shareText);
        }
    }

    reset() {
        this.marqueeX = null;
        this.scrollWait = 0;
    }
}

export default new ShareButton();