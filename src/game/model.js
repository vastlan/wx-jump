// src/game/model.js
import Event from '../utils/event'

class GameModel {
  constructor() {
    this.stage = ''
    this.stageChanged = new Event(this)
    
    this.score = 0
    this.combo = 0 
    this.scoreChanged = new Event(this) 

    // 历史最高分数据（仅用于排行榜展示，永不扣减）
    this.highestScore = 0
    this.initHighestScore()

    // ✨ 新增：消费积分数据（用于商城购买皮肤/道具，可扣减）
    this.coins = 0
    this.initCoins()
  }

  // 初始化：从微信本地缓存或浏览器缓存中读取最高分
  initHighestScore() {
    if (typeof wx !== 'undefined') {
      const score = wx.getStorageSync('highestScore')
      if (score) this.highestScore = score
    } else {
      const score = localStorage.getItem('highestScore')
      if (score) this.highestScore = parseInt(score)
    }
  }

  // ✨ 初始化：读取本地存储的消费积分（钱包余额）
  initCoins() {
    if (typeof wx !== 'undefined') {
      const coins = wx.getStorageSync('user_coins')
      if (coins) this.coins = coins
    } else {
      const coins = localStorage.getItem('user_coins')
      if (coins) this.coins = parseInt(coins)
    }
  }

  // 保存结算数据：同时处理“最高分刷新”和“积分入账”
  saveHighestScore() {
    // 1. 排行榜逻辑：只记录历史最高分
    if (this.score > this.highestScore) {
      this.highestScore = this.score
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('highestScore', this.highestScore)
      } else {
        localStorage.setItem('highestScore', this.highestScore)
      }
    }

    // 2. ✨ 商城逻辑：本局的得分按 1:1 转化为消费积分，存入钱包
    if (this.score > 0) {
      this.coins += this.score
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('user_coins', this.coins)
      } else {
        localStorage.setItem('user_coins', this.coins)
      }
      console.log(`结算完成，本次获得 ${this.score} 积分，商城钱包余额：${this.coins}`)
    }
  }

  // ✨ 新增：商城扣款方法（供后续商城页面调用）
  deductCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('user_coins', this.coins)
      } else {
        localStorage.setItem('user_coins', this.coins)
      }
      return true // 扣款成功
    }
    return false // 余额不足
  }

  getStage() {
    return this.stage
  }

  setStage(stage) {
    this.stage = stage
    this.stageChanged.notify({ stage })
  }

  addScore(points) {
    this.score += points
    this.scoreChanged.notify({ score: this.score })
  }

  resetScore() {
    this.score = 0
    this.combo = 0
    this.scoreChanged.notify({ score: this.score })
  }
}

export default new GameModel()