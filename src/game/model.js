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

    // 消费积分数据（用于商城购买皮肤/道具，可扣减）
    this.coins = 0
    this.initCoins()

    // ✨ 新增：持久化难度选择状态
    this.currentDifficulty = 'defaultDiff' // 默认选中第一个
    this.initDifficulty()
  }

  initHighestScore() {
    if (typeof wx !== 'undefined') {
      const score = wx.getStorageSync('highestScore')
      if (score) this.highestScore = score
    } else {
      const score = localStorage.getItem('highestScore')
      if (score) this.highestScore = parseInt(score)
    }
  }

  initCoins() {
    if (typeof wx !== 'undefined') {
      const coins = wx.getStorageSync('user_coins')
      if (coins) this.coins = coins
    } else {
      const coins = localStorage.getItem('user_coins')
      if (coins) this.coins = parseInt(coins)
    }
  }

  // ✨ 初始化：读取本地存储的难度选项
  initDifficulty() {
    if (typeof wx !== 'undefined') {
      const diff = wx.getStorageSync('user_difficulty')
      if (diff) this.currentDifficulty = diff
    } else {
      const diff = localStorage.getItem('user_difficulty')
      if (diff) this.currentDifficulty = diff
    }
  }

  // ✨ 保存难度设置
  setDifficulty(diffKey) {
    this.currentDifficulty = diffKey
    if (typeof wx !== 'undefined') {
      wx.setStorageSync('user_difficulty', this.currentDifficulty)
    } else {
      localStorage.setItem('user_difficulty', this.currentDifficulty)
    }
  }

  saveHighestScore() {
    if (this.score > this.highestScore) {
      this.highestScore = this.score
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('highestScore', this.highestScore)
      } else {
        localStorage.setItem('highestScore', this.highestScore)
      }
    }

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

  deductCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('user_coins', this.coins)
      } else {
        localStorage.setItem('user_coins', this.coins)
      }
      return true 
    }
    return false 
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