// src/game/controller.js
import gameModel from './model.js'
import gameView from './view.js'

class GameController {
  constructor() {
    this.gameView = gameView
    this.gameModel = gameModel
    // ✨ 新增：路由历史栈，记录进入商城前的页面
    this.previousStage = 'start-page' 
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
      },
      goHome: () => {
        this.gameModel.setStage('start-page')
      },
      showStore: () => {
        this.gameModel.setStage('store-page')
      }
    }

    const startPageCallbacks = {
      gameStart: () => {
        this.gameModel.setStage('game-page')
      },
      showStore: () => {
        this.gameModel.setStage('store-page')
      }
    }

    const storePageCallbacks = {
      onBack: () => {
        // ✨ 核心修复：精准返回上一级页面，绝不乱跳！
        this.gameModel.setStage(this.previousStage)
      }
    }

    this.gameView.initGamePage(gamePageCallbacks)
    this.gameView.initGameOverPage(gameOverPageCallbacks)
    this.gameView.initStartPage(startPageCallbacks) 
    this.gameView.initStorePage(storePageCallbacks) 

    this.gameModel.stageChanged.attach((sender, args) => {
      const stageName = args.stage

      // ✨ 自动拦截并记录真实的业务页面，把商城当作透明的“模态弹窗”
      if (stageName !== 'store-page') {
          this.previousStage = stageName;
      }

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
        case 'store-page':
          this.gameView.showStorePage() 
          break
        default:
          break
      }
    })

    this.gameModel.setStage('start-page')
  }
}

export default new GameController()