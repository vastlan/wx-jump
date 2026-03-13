// src/game/view.js
import GamePage from '../pages/game-page.js'
import GameOverPage from '../pages/game-over-page.js'
import StartPage from '../pages/start-page.js' // 引入主菜单

class GameView {
  constructor() {}

  initStartPage(callbacks) {
    this.startPage = new StartPage(callbacks)
    this.startPage.init({
      scene: this.gamePage.scene 
    })
  }

  initGamePage(callbacks) {
    this.gamePage = new GamePage(callbacks)
    this.gamePage.init()
  }

  initGameOverPage(callbacks) {
    this.gameOverPage = new GameOverPage(callbacks)
    this.gameOverPage.init({
      scene: this.gamePage.scene
    })
  }

  showStartPage() {
    this.gameOverPage.hide()
    this.startPage.show()
  }

  showGamePage() {
    this.gameOverPage.hide()
    this.startPage.hide()
    this.gamePage.restart()
    this.gamePage.show()
  }

  showGameOverPage() {
    this.gameOverPage.show()
  }

  restartGame () {
    this.gamePage.restart()
  }
}

export default new GameView()