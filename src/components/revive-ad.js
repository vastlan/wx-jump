// // src/components/revive-ad.js
// const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
// const INK_COLOR = '#1A1A1A'; 
// const PAPER_COLOR = '#FFFFFF'; 

// class ReviveAd {
//     constructor() {
//         this.isWatchingAd = false;
//         this.adCountdown = 0;
//         this.adTimer = null;
//     }

//     draw(ctx, x, y, w, h, drawSketchyBox) {
//         ctx.fillStyle = PAPER_COLOR; ctx.fillRect(x, y, w, h);
//         drawSketchyBox(ctx, x, y, w, h);
//         ctx.fillStyle = INK_COLOR; 
//         ctx.font = `bold ${Math.floor(w * 0.08)}px ${safeFont}`;
//         ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
//         ctx.fillText('看广告复活', x + w / 2, y + h / 2);
//         return { x, y, w, h };
//     }

//     drawOverlay(ctx, width, height, cx, drawSketchyBox) {
//         if (!this.isWatchingAd) return;
//         ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
//         ctx.fillRect(0, 0, width, height);
        
//         const modalW = width * 0.75;
//         const modalH = height * 0.25;
//         const modalX = (width - modalW) / 2;
//         const modalY = (height - modalH) / 2;

//         ctx.fillStyle = PAPER_COLOR;
//         ctx.fillRect(modalX, modalY, modalW, modalH);
//         drawSketchyBox(ctx, modalX, modalY, modalW, modalH);

//         ctx.fillStyle = INK_COLOR;
//         ctx.font = `900 ${Math.floor(width * 0.055)}px ${safeFont}`;
//         ctx.textAlign = 'center';
//         ctx.fillText('正在看广告...', cx, modalY + modalH * 0.3);
        
//         ctx.font = `normal ${Math.floor(width * 0.038)}px ${safeFont}`;
//         ctx.fillStyle = '#555555';
//         ctx.fillText('暂时没有金主光照，感谢介绍', cx, modalY + modalH * 0.55);

//         ctx.fillStyle = '#D32F2F'; 
//         ctx.font = `900 ${Math.floor(width * 0.06)}px ${safeFont}`;
//         ctx.fillText(`离复活还有 (${this.adCountdown}s)`, cx, modalY + modalH * 0.85);
//     }

//     isBlocking() {
//         return this.isWatchingAd;
//     }

//     handleClick(callbacks, pageInstance) {
//         if (!this.isWatchingAd) {
//             this.isWatchingAd = true;
//             this.adCountdown = 5;
//             pageInstance.draw(); 

//             this.adTimer = setInterval(() => {
//                 this.adCountdown--;
//                 if (this.adCountdown <= 0) {
//                     clearInterval(this.adTimer);
//                     this.adTimer = null;
//                     this.isWatchingAd = false;
//                     if (callbacks?.gameRevive) callbacks.gameRevive();
//                 }
//                 if (pageInstance.isVisible) pageInstance.draw();
//             }, 1000);
//         }
//     }

//     reset() {
//         this.isWatchingAd = false;
//         if (this.adTimer) {
//             clearInterval(this.adTimer);
//             this.adTimer = null;
//         }
//     }
    
//     onGameStart() {}
// }
// export default new ReviveAd();