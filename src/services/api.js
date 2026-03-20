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
      const list = [
        { rank: 1, name: '肝帝本人', score: 9999 },
        { rank: 2, name: '手残党党魁', score: 8888 },
        { rank: 3, name: '摸鱼达人', score: 50 },
        { name: '你', score: gameModel.highestScore }
    ];

    return list.sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));
  }

  static async getFriendRank() {
      await mockDelay();
      const list = [
        { name: '星河旅人', score: 1342 },
        { name: '风起长安', score: 987 },
        { name: '夜色微凉', score: 1560 },
        { name: '云间过客', score: 1123 },
        { name: '山海行者', score: 1789 },
        { name: '落日听风', score: 845 },
        { name: '青灯古卷', score: 1299 },
        { name: '白鹿逐风', score: 1675 },
        { name: '荒野旅途', score: 910 },
        { name: '浮生若梦', score: 1420 },
        { name: '长夜未央', score: 1533 },
        { name: '星火燎原', score: 1208 },
        { name: '雾隐青山', score: 995 },
        { name: '逐光之人', score: 1712 },
        { name: '千里行舟', score: 880 },
        { name: '月下孤影', score: 1366 },
        { name: '寒江独钓', score: 1498 },
        { name: '风雪归人', score: 1024 },
        { name: '苍穹之翼', score: 1603 },
        { name: '流云逐月', score: 10 },
        { name: '你', score: gameModel.highestScore },
      ];

      return list.sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));
  }

    // ==========================================
    // ✨ 修复：根据真实分数计算的动态合规说明
    // ==========================================
    static async getShareDescs(currentScore) {
        await mockDelay(50);
        
        // 修复逻辑漏洞：0分就是0%，有分数才开始计算击败率
        let exceedPct = 0;
        if (currentScore > 0) {
            exceedPct = Math.min(99, Math.floor(12 + currentScore * 2.8)); 
        }

        return [
            `本次积分超越${exceedPct}%玩家，这得好好炫炫`,
            `本次已积累${currentScore}积分，和好友分享薅羊毛好事`,
            `独乐乐不如众乐乐，一起开心跳跃`,
            `战绩不错，快去展示一下你的实力`
        ];
    }

    // ==========================================
    // ✨ 修复违规：彻底清理敏感词，采用微信官方绝对合规库
    // ==========================================
    static async getShareTemplates() {
        await mockDelay(50);
        return {
            universal: [
                "我正在玩薅薅跳，快来一起开心闯关！",
                "休闲解压的宝藏小游戏，点开即玩~",
                "快乐跳跃，轻松解压，你也来试试吧",
                "这个小游戏太好玩了，随时随地跳一跳"
            ],
            showoff: [
                "我在薅薅跳获得了{score}分，你能打破我的记录吗？",
                "{score}分达成！今天的操作依然行云流水",
                "发挥神勇，这局拿到了{score}分的好成绩！"
            ]
        };
    }
}