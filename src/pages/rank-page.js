// src/pages/rank-page.js
import API from '../services/api'

export default class RankPage {
    constructor() {
        this.currentTab = 'friend'; // 'friend' 或 'global'
        this.rankData = [];
    }

    init() {
        this.switchTab('friend');
    }

    async switchTab(tab) {
        this.currentTab = tab;
        this.rankData = [];
        this.render(); // 渲染骨架屏(Skeleton)或Loading

        if (tab === 'global') {
            this.rankData = await API.getGlobalRank();
        } else {
            this.rankData = await API.getFriendRank();
        }
        
        this.render();
    }

    render() {
        // Canvas 2D 绘制逻辑
        // 绘制顶部 Tab 切换器 (好友排名 | 全球排名)
        // 根据 this.rankData 渲染列表
    }
}