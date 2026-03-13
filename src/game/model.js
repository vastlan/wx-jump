// src/game/model.js
import Event from '../utils/event'

class GameModel {
  constructor() {
    this.stage = ''
    this.stageChanged = new Event(this)
    
    this.score = 0
    this.combo = 0 
    this.scoreChanged = new Event(this) 

    // 新增：历史最高分数据
    this.highestScore = 0
    this.initHighestScore()
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

  // 保存最高分：如果当前分数超越了历史最高，则覆写缓存
  saveHighestScore() {
    if (this.score > this.highestScore) {
      this.highestScore = this.score
      if (typeof wx !== 'undefined') {
        wx.setStorageSync('highestScore', this.highestScore)
      } else {
        localStorage.setItem('highestScore', this.highestScore)
      }
    }
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