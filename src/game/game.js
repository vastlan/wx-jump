import controller from './controller'

class Game {
  constructor() {
    this.gameController = controller
  }

  init() {
    this.gameController.initPages()
  }
}

export default new Game()