// src/game/view.js
import GamePage from '../pages/game-page.js'
import GameOverPage from '../pages/game-over-page.js'
import StartPage from '../pages/start-page.js'
import StorePage from '../pages/store-page.js' 

class GameView {
  constructor() {
    this.gamePage = null
    this.gameOverPage = null
    this.startPage = null
    this.storePage = null 
  }

  initStartPage(callbacks) {
    this.startPage = new StartPage(callbacks)
    this.startPage.init({
      scene: this.gamePage ? this.gamePage.scene : null 
    })
  }

  initGamePage(callbacks) {
    this.gamePage = new GamePage(callbacks)
    this.gamePage.init()
  }

  initGameOverPage(callbacks) {
    this.gameOverPage = new GameOverPage(callbacks)
    this.gameOverPage.init({
      scene: this.gamePage ? this.gamePage.scene : null
    })
  }

  initStorePage(callbacks) {
    this.storePage = new StorePage(callbacks)
    this.storePage.init()
  }

  showStartPage() {
    if (this.gameOverPage) this.gameOverPage.hide()
    if (this.gamePage) this.gamePage.hide()
    if (this.storePage) this.storePage.hide() 
    this.startPage.show()
  }

  showGamePage() {
    if (this.gameOverPage) this.gameOverPage.hide()
    if (this.startPage) this.startPage.hide()
    if (this.storePage) this.storePage.hide() 
    this.gamePage.restart()
    this.gamePage.show()
  }

  showGameOverPage() {
    if (this.gamePage) this.gamePage.hide()
    if (this.startPage) this.startPage.hide()
    if (this.storePage) this.storePage.hide() // ✨ 核心修复：结算页出现时强制卸载商城
    this.gameOverPage.show()
  }

  showStorePage() {
    if (this.startPage) this.startPage.hide()
    if (this.gameOverPage) this.gameOverPage.hide()
    if (this.gamePage) this.gamePage.hide()
    this.storePage.show() 
  }

  restartGame () {
    if (this.gamePage) this.gamePage.restart()
  }
}

export default new GameView()