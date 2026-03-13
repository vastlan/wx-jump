import GamePage from '../pages/game-page'
import GameOverPage from '../pages/game-over-page'

class GameView {
  constructor() {}

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

  showGamePage() {
    this.gameOverPage.hide()
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