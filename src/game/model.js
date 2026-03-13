// src/game/model.js
import Event from '../utils/event'

class GameModel {
  constructor() {
    this.stage = ''
    this.stageChanged = new Event(this)
    
    // 新增：分数与连击状态
    this.score = 0
    this.combo = 0 // 记录连续跳中中心的次数
    this.scoreChanged = new Event(this) // 分数变化事件（给 UI 用的）
  }

  getStage() {
    return this.stage
  }

  setStage(stage) {
    this.stage = stage
    this.stageChanged.notify({ stage })
  }

  // 新增：加分逻辑
  addScore(points) {
    this.score += points
    console.log(`当前得分: ${this.score}`)
    this.scoreChanged.notify({ score: this.score })
  }

  // 新增：重置分数
  resetScore() {
    this.score = 0
    this.combo = 0
    this.scoreChanged.notify({ score: this.score })
  }
}

export default new GameModel()