// src/game/controller.js
import gameModel from './model.js'
import gameView from './view.js'

class GameController {
  constructor() {
    this.gameView = gameView
    this.gameModel = gameModel
  }

  initPages() {
    const gamePageCallbacks = {
      showGameOverPage: () => {
        this.gameModel.setStage('game-over-page')
      }
    }
    
    const gameOverPageCallbacks = {
      gameRestart: () => {
        this.gameModel.setStage('game-page')
      }
    }

    // 新增主菜单点击后的回调
    const startPageCallbacks = {
      gameStart: () => {
        this.gameModel.setStage('game-page')
      }
    }

    // 注意初始化顺序，GamePage必须最先，因为其他UI需要挂载到它的相机上
    this.gameView.initGamePage(gamePageCallbacks)
    this.gameView.initGameOverPage(gameOverPageCallbacks)
    this.gameView.initStartPage(startPageCallbacks) 

    this.gameModel.stageChanged.attach((sender, args) => {
      const stageName = args.stage
      switch (stageName) {
        case 'start-page':
          this.gameView.showStartPage()
          break
        case 'game-page':
          this.gameView.showGamePage()
          break
        case 'game-over-page':
          this.gameView.showGameOverPage()
          break
        default:
          break
      }
    })

    // 核心修改：游戏一打开不再是直接跳，而是进入带有遮罩的菜单页
    this.gameModel.setStage('start-page')
  }
}

export default new GameController()