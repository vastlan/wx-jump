// src/services/api.js
import gameModel from '../game/model'

// 模拟网络请求延迟，让单机版也有真实的 Loading 交互体验
const mockDelay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export default class API {
    // ==========================================
    // 🛍️ 积分商城系统 (Store System)
    // ==========================================

    // 获取商城商品列表
    static async getStoreItems() {
        await mockDelay();
        // 预设三个极具治愈系风格的商品
        return [
            { 
                id: 'skin_mint', 
                name: '薄荷青披风', 
                type: 'skin', 
                price: 500, 
                icon: 'res/images/store_top.png', 
                desc: '治愈系穿搭，轻盈如风' 
            },
            { 
                id: 'skin_maillard', 
                name: '美拉德针织帽', 
                type: 'skin', 
                price: 1200, 
                icon: 'res/images/store_bottom.png', 
                desc: '焦糖色系，秋冬高级感' 
            },
            { 
                id: 'trail_star', 
                name: '星光拖尾', 
                type: 'trail', 
                price: 2500, 
                icon: 'res/images/gold.png', 
                desc: '跳跃时散发治愈微光' 
            }
        ];
    }

    // 获取用户已拥有的物品清单
    static async getUserInventory() {
        await mockDelay(100);
        if (typeof wx !== 'undefined') {
            return wx.getStorageSync('user_inventory') || [];
        } else {
            return JSON.parse(localStorage.getItem('user_inventory') || '[]');
        }
    }

    // 购买商品逻辑
    static async buyItem(itemId, price) {
        await mockDelay();
        
        // 调用 model 层尝试扣款
        const success = gameModel.deductCoins(price);
        
        if (!success) {
            return { success: false, msg: '积分不足' };
        }

        // 扣款成功，加入背包
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
}