// src/components/revive-free.js
const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

class ReviveFree {
    constructor() {
        this.maxRevives = 5;
        this.currentRevives = 5;
    }

    draw(ctx, x, y, w, h, drawSketchyBox) {
        ctx.fillStyle = PAPER_COLOR; 
        ctx.fillRect(x, y, w, h);
        drawSketchyBox(ctx, x, y, w, h);
        
        if (this.currentRevives > 0) {
            ctx.fillStyle = INK_COLOR; 
            ctx.font = `bold ${Math.floor(w * 0.08)}px ${safeFont}`;
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle';
            ctx.fillText(`原地复活 (${this.currentRevives}/5)`, x + w / 2, y + h / 2);
        } else {
            ctx.fillStyle = '#AAAAAA'; 
            ctx.font = `bold ${Math.floor(w * 0.08)}px ${safeFont}`;
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle';
            ctx.fillText('复活已用尽', x + w / 2, y + h / 2);
            
            // 充满嘲讽意味的删除线
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#AAAAAA';
            ctx.moveTo(x + w * 0.2, y + h / 2);
            ctx.lineTo(x + w * 0.8, y + h / 2);
            ctx.stroke();
        }
        return { x, y, w, h };
    }

    drawOverlay() {
        // 原地复活没有倒计时遮罩层，直接返回
    }

    isBlocking() {
        return false;
    }

    handleClick(callbacks, pageInstance) {
        if (this.currentRevives > 0) {
            this.currentRevives--;
            if (callbacks?.gameRevive) callbacks.gameRevive();
        } else {
            if (typeof wx !== 'undefined' && wx.showToast) {
                wx.showToast({ title: '只能重新开始啦', icon: 'none' });
            }
        }
    }

    reset() {}
    
    // ✨ 新开一局游戏时，重置5次机会
    onGameStart() {
        this.currentRevives = this.maxRevives;
    }
}
export default new ReviveFree();