import * as THREE from '../libs/three.js'
window.THREE = THREE

import game from './game/game.js'

export default class Main {
  constructor() {}
  static init () {
    game.init()

    // 在游戏初始化时，主动声明允许分享
    if (typeof wx !== 'undefined' && wx.showShareMenu) {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline'] // 允许分享给朋友和朋友圈
        });
        
        // 配置右上角三个点的被动分享默认内容
        if (wx.onShareAppMessage) {
            wx.onShareAppMessage(() => {
                return {
                    title: '我正在玩这个魔性小游戏，快来一起开心闯关！',
                    imageUrl: '' // 自动截屏
                }
            });
        }
    }
  }
}