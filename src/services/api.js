// src/services/api.js
import gameModel from '../game/model'

const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export default class API {
    static async getMysteryLinks() {
        await mockDelay();
        return [
            { id: 'link_mt', name: '美团', logo: '', url: 'https://meituan.com' },
            { id: 'link_elm', name: '饿了么', logo: '', url: 'https://ele.me' },
            { id: 'link_jd', name: '京东', logo: '', url: 'https://jd.com' }
        ];
    }

    static async getDailyPrizes() {
        await mockDelay();
        return [
            { id: 'prize_1', name: '劳斯莱斯5元券', image: '', price: 10, desc: '真实有效，购车立减5元巨款，速抢！' },
            { id: 'prize_2', name: '过期冰红茶盖', image: '', price: 5, desc: '再来一瓶，但是昨天已经过期了...' }
        ];
    }

    static async getStoreItems() {
        await mockDelay();
        return [
            { id: 'item_marker', name: '粗头马克笔', image: '', price: 500, desc: '让火柴人的线条变得极粗，存在感爆棚' },
            { id: 'item_whiteout', name: '修正液拖尾', image: '', price: 1200, desc: '跳跃时在空中留下一道潦草的涂改痕迹' },
            { id: 'item_gridpaper', name: '数学网格纸', image: '', price: 2500, desc: '将纯白背景换成充满噩梦的数学作业本' }
        ];
    }

    static async getUserInventory() {
        await mockDelay(100);
        if (typeof wx !== 'undefined') return wx.getStorageSync('user_inventory') || [];
        else return JSON.parse(localStorage.getItem('user_inventory') || '[]');
    }

    static async buyItem(itemId, price) {
        await mockDelay();
        const success = gameModel.deductCoins(price);
        if (!success) return { success: false, msg: '积分不够哦' };
        
        let inventory = await this.getUserInventory();
        if (!inventory.includes(itemId)) {
            inventory.push(itemId);
            if (typeof wx !== 'undefined') wx.setStorageSync('user_inventory', inventory);
            else localStorage.setItem('user_inventory', JSON.stringify(inventory));
        }
        return { success: true, remainingCoins: gameModel.coins, inventory };
    }

    static async getGlobalRank() {
        await mockDelay();
        return [
            { rank: 1, name: '肝帝本人', score: 9999 },
            { rank: 2, name: '手残党党魁', score: 8888 },
            { rank: 3, name: '摸鱼达人', score: 7777 }
        ];
    }

    static async getFriendRank() {
        await mockDelay();
        const list = [
            { name: '隔壁老王', score: 1200 },
            { name: '我的小号', score: 800 },
            { name: '你', score: gameModel.highestScore },
        ];
        return list.sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));
    }

    // ==========================================
    // ✨ 修复：根据真实分数计算的动态合规文案
    // ==========================================
    static async getShareDescs(currentScore) {
        await mockDelay(50);
        
        // 真实合理的百分比算法：0分就是0%，有分数才开始计算击败率
        let exceedPct = 0;
        if (currentScore > 0) {
            exceedPct = Math.min(99, Math.floor(12 + currentScore * 2.8)); 
        }

        return [
            `本次积分超越${exceedPct}%玩家，这得好好炫炫`,
            `本次已积累${currentScore}积分，叫上好友一起来挑战吧`,
            `独乐乐不如众乐乐，叫上朋友一起薅`,
            `战绩不错，快去微信群里装个杯`
        ];
    }

    static async getShareTemplates() {
        await mockDelay(50);
        return {
            universal: ["快来帮我看看，这关怎么过？", "发现一个宝藏小游戏，快上车", "休闲解压，点开即玩", "快来和我一起快乐闯关吧"],
            showoff: ["轻轻松松{score}分，还有谁？", "{score}分达成！我的手速超乎想象", "不好意思，{score}分就是这么简单"]
        };
    }
}