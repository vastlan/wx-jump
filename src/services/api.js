// src/services/api.js
import gameModel from '../game/model'

const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export default class API {
    // ==========================================
    // 🔗 神秘链接 (预留真实 Logo 字段)
    // ==========================================
    static async getMysteryLinks() {
        await mockDelay();
        return [
            { id: 'link_mt', name: '美团', logo: '', url: 'https://meituan.com' },
            { id: 'link_elm', name: '饿了么', logo: '', url: 'https://ele.me' },
            { id: 'link_jd', name: '京东', logo: '', url: 'https://jd.com' }
        ];
    }

    // ==========================================
    // 🎁 今日奖品 (白嫖抽奖区)
    // ==========================================
    static async getDailyPrizes() {
        await mockDelay();
        return [
            { id: 'prize_1', name: '劳斯莱斯5元券', image: '', price: 10, desc: '真实有效，购车立减5元巨款，速抢！' },
            { id: 'prize_2', name: '过期冰红茶盖', image: '', price: 5, desc: '再来一瓶，但是昨天已经过期了...' }
        ];
    }

    // ==========================================
    // 🛍️ 积分商城系统 (符合手绘世界观)
    // ==========================================
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
        if (typeof wx !== 'undefined') {
            return wx.getStorageSync('user_inventory') || [];
        } else {
            return JSON.parse(localStorage.getItem('user_inventory') || '[]');
        }
    }

    static async buyItem(itemId, price) {
        await mockDelay();
        const success = gameModel.deductCoins(price);
        if (!success) {
            return { success: false, msg: '积分不够哦' };
        }
        let inventory = await this.getUserInventory();
        if (!inventory.includes(itemId)) {
            inventory.push(itemId);
            if (typeof wx !== 'undefined') {
                wx.setStorageSync('user_inventory', inventory);
            } else {
                localStorage.setItem('user_inventory', JSON.stringify(inventory));
            }
        }
        return { success: true, remainingCoins: gameModel.coins, inventory };
    }

    // ==========================================
    // 🏆 排行榜系统 (单机 Mock)
    // ==========================================
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
            { name: '薅薅', score: 1200 },
            { name: '羊羊', score: 800 },
            { name: '毛毛', score: 800 },
            { name: '欢欢', score: 800 },
            { name: '茵茵', score: 800 },
            { name: '宁宁', score: 800 },
            { name: '宁宁', score: 800 },
            { name: '宁宁', score: 800 },
            { name: '宁宁', score: 800 },
            { name: '你', score: gameModel.highestScore },
        ];
        return list.sort((a, b) => b.score - a.score).map((item, index) => ({
            ...item, rank: index + 1
        }));
    }
}