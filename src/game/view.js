// src/game/view.js
import GamePage from '../pages/game-page.js'
import GameOverPage from '../pages/game-over-page.js'
import StartPage from '../pages/start-page.js'
import StorePage from '../pages/store-page.js' 
import RankPage from '../pages/rank-page.js' 
import scoreText from '../objects/score-text.js' // ✨ 引入计分板组件

class GameView {
  constructor() {
    this.gamePage = null
    this.gameOverPage = null
    this.startPage = null
    this.storePage = null 
    this.rankPage = null
  }

  initStartPage(callbacks) {
    this.startPage = new StartPage(callbacks)
    this.startPage.init({ scene: this.gamePage ? this.gamePage.scene : null })
  }

  initGamePage(callbacks) {
    this.gamePage = new GamePage(callbacks)
    this.gamePage.init()
  }

  initGameOverPage(callbacks) {
    this.gameOverPage = new GameOverPage(callbacks)
    this.gameOverPage.init({ scene: this.gamePage ? this.gamePage.scene : null })
  }

  initStorePage(callbacks) {
    this.storePage = new StorePage(callbacks)
    this.storePage.init()
  }

  initRankPage(callbacks) {
    this.rankPage = new RankPage(callbacks)
    this.rankPage.init()
  }

  // ✨ 核心修复：一键隐藏所有视图层，包括悬浮的分数
  hideAll() {
    if (this.gameOverPage) this.gameOverPage.hide()
    if (this.gamePage) this.gamePage.hide()
    if (this.storePage) this.storePage.hide() 
    if (this.startPage) this.startPage.hide()
    if (this.rankPage) this.rankPage.hide()
    if (scoreText) scoreText.hide() // 隐藏局内分数
  }

  showStartPage() {
    this.hideAll();
    this.startPage.show()
  }

  showGamePage() {
    this.hideAll();
    this.gamePage.restart()
    this.gamePage.show()
    // ✨ 只有在进入游戏主环节时，才让分数现身
    if (scoreText) scoreText.show() 
  }

  showGameOverPage() {
    this.hideAll();
    this.gameOverPage.show()
  }

  showStorePage() {
    this.hideAll();
    this.storePage.show() 
  }

  showRankPage() {
    this.hideAll();
    this.rankPage.show() 
  }

  restartGame () {
    if (this.gamePage) this.gamePage.restart()
  }
}

export default new GameView()