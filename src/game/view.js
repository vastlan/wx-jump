// src/game/view.js
import GamePage from '../pages/game-page.js'
import GameOverPage from '../pages/game-over-page.js'
import StartPage from '../pages/start-page.js'
import StorePage from '../pages/store-page.js' 
import RankPage from '../pages/rank-page.js' 
import scoreText from '../objects/score-text.js' 

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

  hideAll() {
    if (this.gameOverPage) this.gameOverPage.hide()
    if (this.gamePage) this.gamePage.hide()
    if (this.storePage) this.storePage.hide() 
    if (this.startPage) this.startPage.hide()
    if (this.rankPage) this.rankPage.hide()
    if (scoreText) scoreText.hide() 
  }

  showStartPage() {
    this.hideAll();
    this.startPage.show()
  }

  showGamePage() {
    this.hideAll();
    this.gamePage.restart()
    this.gamePage.show()
    if (scoreText) scoreText.show() 
  }

  // ✨ 新增：不重置分数，直接在局内复活
  reviveGamePage() {
    this.hideAll();
    this.gamePage.revive() // 核心：调用复活而不是 restart
    this.gamePage.show()
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