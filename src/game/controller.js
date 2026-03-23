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
      showRank: () => this.gameModel.setStage('rank-page'),
      
      // ✨ 新增：触发，切换路由到专用的复活状态
      gameRevive: () => this.gameModel.setStage('game-revive') 
    }

    const startPageCallbacks = {
      gameStart: () => this.gameModel.setStage('game-page'),
      showStore: () => this.gameModel.setStage('store-page'),
      showRank: () => this.gameModel.setStage('rank-page')
    }

    const modalCallbacks = {
      onBack: () => this.gameModel.setStage(this.previousStage)
    }

    this.gameView.initGamePage(gamePageCallbacks)
    this.gameView.initGameOverPage(gameOverPageCallbacks)
    this.gameView.initStartPage(startPageCallbacks) 
    this.gameView.initStorePage(modalCallbacks) 
    this.gameView.initRankPage(modalCallbacks) 

    this.gameModel.stageChanged.attach((sender, args) => {
      const stageName = args.stage

      if (stageName !== 'store-page' && stageName !== 'rank-page') {
          this.previousStage = stageName;
      }

      switch (stageName) {
        case 'start-page': this.gameView.showStartPage(); break;
        case 'game-page': this.gameView.showGamePage(); break;
        case 'game-over-page': this.gameView.showGameOverPage(); break;
        case 'store-page': this.gameView.showStorePage(); break;
        case 'rank-page': this.gameView.showRankPage(); break; 
        case 'game-revive': this.gameView.reviveGamePage(); break; // ✨ 处理显示
        default: break;
      }
    })

    this.gameModel.setStage('start-page')
  }
}

export default new GameController()