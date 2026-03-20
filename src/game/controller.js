// src/game/controller.js
import gameModel from './model.js'
import gameView from './view.js'

class GameController {
  constructor() {
    this.gameView = gameView
    this.gameModel = gameModel
    this.previousStage = 'start-page' 
  }

  initPages() {
    const gamePageCallbacks = {
      showGameOverPage: () => this.gameModel.setStage('game-over-page')
    }
    
    const gameOverPageCallbacks = {
      gameRestart: () => this.gameModel.setStage('game-page'),
      goHome: () => this.gameModel.setStage('start-page'),
      showStore: () => this.gameModel.setStage('store-page'),
      showRank: () => this.gameModel.setStage('rank-page') // ✨ 新增路由
    }

    const startPageCallbacks = {
      gameStart: () => this.gameModel.setStage('game-page'),
      showStore: () => this.gameModel.setStage('store-page'),
      showRank: () => this.gameModel.setStage('rank-page') // ✨ 新增路由
    }

    const modalCallbacks = {
      onBack: () => this.gameModel.setStage(this.previousStage)
    }

    this.gameView.initGamePage(gamePageCallbacks)
    this.gameView.initGameOverPage(gameOverPageCallbacks)
    this.gameView.initStartPage(startPageCallbacks) 
    this.gameView.initStorePage(modalCallbacks) 
    this.gameView.initRankPage(modalCallbacks) // ✨ 注入相同回调

    this.gameModel.stageChanged.attach((sender, args) => {
      const stageName = args.stage

      // 记录进入模态框之前的状态
      if (stageName !== 'store-page' && stageName !== 'rank-page') {
          this.previousStage = stageName;
      }

      switch (stageName) {
        case 'start-page': this.gameView.showStartPage(); break;
        case 'game-page': this.gameView.showGamePage(); break;
        case 'game-over-page': this.gameView.showGameOverPage(); break;
        case 'store-page': this.gameView.showStorePage(); break;
        case 'rank-page': this.gameView.showRankPage(); break; // ✨ 触发渲染
        default: break;
      }
    })

    this.gameModel.setStage('start-page')
  }
}

export default new GameController()