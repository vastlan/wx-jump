// src/components/revive-ad.js
const safeFont = `"-apple-system", BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif`;
const INK_COLOR = '#1A1A1A'; 
const PAPER_COLOR = '#FFFFFF'; 

class ReviveAd {
    constructor() {
        // ✨ 预留的真实广告位 ID（去微信公众平台->流量主 申请）
        this.adUnitId = 'adunit-xxxxxxxxxxxx'; 
        this.rewardedVideoAd = null;
        this.isInitialized = false;
        this.activeCallbacks = null;
    }

    // ✨ 微信官方要求：广告组件必须尽早初始化并进行预加载
    init() {
        if (this.isInitialized) return;
        
        // 检查当前环境是否支持原生激励视频广告
        if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
            this.rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: this.adUnitId });
            
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频广告预加载成功');
            });
            
            this.rewardedVideoAd.onError((err) => {
                console.error('激励视频广告加载失败', err);
            });
            
            // ✨ 核心原生回调：监听广告关闭事件
            this.rewardedVideoAd.onClose((res) => {
                // 玩家点击了原生【关闭广告】按钮
                // 小于 2.1.0 的基础库版本，res 是 undefined
                if (res && res.isEnded || res === undefined) {
                    // 正常播放结束，下发复活奖励
                    if (this.activeCallbacks?.gameRevive) {
                        this.activeCallbacks.gameRevive();
                    }
                } else {
                    // 播放中途退出，不予复活
                    wx.showToast({ title: '看完视频才能复活哦', icon: 'none' });
                }
            });
            
            this.isInitialized = true;
        }
    }

    draw(ctx, x, y, w, h, drawSketchyBox) {
        ctx.fillStyle = PAPER_COLOR; ctx.fillRect(x, y, w, h);
        drawSketchyBox(ctx, x, y, w, h);
        ctx.fillStyle = INK_COLOR; 
        
        // ✨ 规避敏感词：使用各大厂通用的合规字眼
        ctx.font = `bold ${Math.floor(w * 0.075)}px ${safeFont}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('▶ 视频复活', x + w / 2, y + h / 2);
        
        return { x, y, w, h };
    }

    drawOverlay() {
        // ✨ 原生广告播放时，微信客户端会直接接管屏幕并阻断触控，严禁在 Canvas 画假遮罩
    }

    isBlocking() {
        // 业务层不再需要手动阻断
        return false;
    }

    handleClick(callbacks, pageInstance) {
        this.activeCallbacks = callbacks;

        if (this.rewardedVideoAd) {
            // 尝试展示原生广告
            this.rewardedVideoAd.show().catch(() => {
                // 如果由于网络原因未加载成功，手动重新拉取并播放
                this.rewardedVideoAd.load()
                    .then(() => this.rewardedVideoAd.show())
                    .catch(err => {
                        console.error('广告拉取彻底失败', err);
                        wx.showToast({ title: '暂无视频资源', icon: 'none' });
                    });
            });
        } else {
            // PC 端微信开发者工具 / 未配置广告 ID 的模拟环境
            console.log('【模拟调用：微信原生激励视频广告】');
            if (typeof wx !== 'undefined' && wx.showToast) {
                wx.showToast({ title: '广告ID尚未配置', icon: 'none' });
            } else {
                // 纯网页端直接触发复活测试
                if (callbacks?.gameRevive) callbacks.gameRevive();
            }
        }
    }

    reset() {}
    onGameStart() {}
}

export default new ReviveAd();