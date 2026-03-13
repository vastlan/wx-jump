// src/pages/game-page.js
import { scene, camera } from '../scene/index'
import Cylinder from '../block/cylinder'
import Cuboid from '../block/cuboid'
import ground from '../objects/ground'
import bottle from '../objects/bottle'
import gameModel from '../game/model'
import audioManager from '../utils/audio-manager'
import scoreText from '../objects/score-text'
import wave from '../objects/wave'
import blockConf from '../../confs/block-conf'
import scoreText3d from '../objects/score-text-3d'
import { CustomAnimation } from '../../libs/animation' 

export default class GamePage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.touchStartTime = 0
    this.blocks = [] 
    this.isGameOver = false 
    this.bonusTimer = null 
  }

  init() {
    this.scene = scene
    this.ground = ground
    this.bottle = bottle
    this.scene.init()
    this.ground.init()
    this.bottle.init()
    
    scoreText.init() 
    
    gameModel.scoreChanged.attach((sender, args) => {
      scoreText.updateScore(args.score)
    })

    this.resetGame()
    this.bindTouchEvent()
    this.render()
  }

  resetGame() {
    this.isGameOver = false
    this.clearBonusTimer() 
    gameModel.resetScore()
    
    this.blocks.forEach(block => {
      this.scene.instance.remove(block.instance)
    })
    this.blocks = []

    // 初始前两个方块永远是简单平地，方便玩家找回手感
    const initWidth = 12
    const initDistance = initWidth + 2 + Math.random() * 4
    const cylinderBlock = new Cuboid(-15, 0, 0, 'default', initWidth)
    const cuboidBlock = new Cylinder(-15 + initDistance, 0, 0, 'default', initWidth)
    this.scene.instance.add(cylinderBlock.instance)
    this.scene.instance.add(cuboidBlock.instance)
    this.blocks.push(cylinderBlock)
    this.blocks.push(cuboidBlock)
    
    this.bottle.reset() 
    this.bottle.obj.position.set(-15, 0, 0)
    this.bottle.showUp()

    this.scene.instance.add(ground.instance)
    this.scene.instance.add(this.bottle.obj)
    this.updateCamera()
  }

  bindTouchEvent() {
    wx.onTouchStart(() => {
      if (this.isGameOver) return 
      this.clearBonusTimer() 
      this.touchStartTime = Date.now()
      this.bottle.prepare()
      audioManager.play('scale_intro') 
    })

    wx.onTouchEnd(() => {
      if (this.isGameOver) return
      audioManager.stop('scale_intro') 
      const touchEndTime = Date.now()
      const pressTime = touchEndTime - this.touchStartTime
      
      const currentBlock = this.blocks[this.blocks.length - 2]
      const nextBlock = this.blocks[this.blocks.length - 1]
      const currentY = currentBlock.instance.position.y + blockConf.height / 2
      const nextY = nextBlock.instance.position.y + blockConf.height / 2

      this.bottle.jump(pressTime, currentY, nextY, () => {
         this.checkCollision() 
      })
    })
  }

  checkCollision() {
    const currentBlock = this.blocks[this.blocks.length - 2]
    const nextBlock = this.blocks[this.blocks.length - 1]
    const bottlePos = this.bottle.obj.position

    const dx = bottlePos.x - nextBlock.instance.position.x
    const dz = bottlePos.z - nextBlock.instance.position.z
    const distanceToNext = Math.sqrt(dx * dx + dz * dz)

    const dxCurr = bottlePos.x - currentBlock.instance.position.x
    const dzCurr = bottlePos.z - currentBlock.instance.position.z
    const distanceToCurr = Math.sqrt(dxCurr * dxCurr + dzCurr * dzCurr)

    const NEXT_RADIUS = nextBlock.width / 2 + 0.5 
    const CURR_RADIUS = currentBlock.width / 2 + 0.5  
    const CENTER_RADIUS = 1.8  

    if (distanceToNext < CENTER_RADIUS) {
      gameModel.combo += 1
      const addScore = 2 * gameModel.combo
      gameModel.addScore(addScore)
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName)
      wave.createWave(this.scene.instance, nextBlock.instance.position)
      scoreText3d.showScore(this.scene.instance, addScore, nextBlock.instance.position)
      this.successJump(nextBlock)
    } else if (distanceToNext < NEXT_RADIUS) {
      gameModel.combo = 0
      gameModel.addScore(1)
      audioManager.play('success') 
      this.successJump(nextBlock)
    } else if (distanceToCurr < CURR_RADIUS) {
      gameModel.combo = 0
      audioManager.play('success') 
      this.startBonusTimer(currentBlock) 
    } else {
      this.isGameOver = true
      audioManager.play('fall') 
      
      let fallType = 'straight'
      if (distanceToNext >= NEXT_RADIUS && distanceToNext < NEXT_RADIUS + 1.5) {
        if (this.bottle.direction === 'x') {
          fallType = dx < 0 ? 'tiltBackward' : 'tiltForward'
        } else {
          fallType = dz > 0 ? 'tiltBackward' : 'tiltForward'
        }
      } else if (distanceToCurr >= CURR_RADIUS && distanceToCurr < CURR_RADIUS + 1.5) {
        fallType = 'tiltForward'
      }

      this.bottle.fall(fallType) 
      setTimeout(() => {
        if (this.callbacks && this.callbacks.showGameOverPage) {
          this.callbacks.showGameOverPage()
        }
      }, 1500)
    }
  }

  successJump(landedBlock) {
    this.generateNextBlock()
    this.updateCamera()
    this.startBonusTimer(landedBlock) 
  }

  startBonusTimer(block) {
    this.clearBonusTimer()
    let bonusScore = 0
    let audioName = ''

    if (block.skin === 'store') {
      bonusScore = 15
      audioName = 'store' 
    } else if (block.skin.includes('disk')) {
      bonusScore = 30
      audioName = 'sing' 
    }

    if (bonusScore > 0) {
      this.bonusTimer = setTimeout(() => {
        gameModel.addScore(bonusScore)
        audioManager.play(audioName)
        wave.createWave(this.scene.instance, block.instance.position)
        scoreText3d.showScore(this.scene.instance, bonusScore, block.instance.position) 
      }, 2000) 
    }
  }

  clearBonusTimer() {
    if (this.bonusTimer) {
      clearTimeout(this.bonusTimer)
      this.bonusTimer = null
    }
  }

  generateNextBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1]
    const score = gameModel.score
    
    // ========================================================
    // 核心改造：加权随机难度系统 (Weighted Random Difficulty)
    // ========================================================
    
    // progress 反映了游戏进度阶段 (0 到 50 分之间平滑增长，50分满进度)
    const progress = Math.min(score / 50, 1.0) 
    
    // 动态概率：开局就有 15% 的概率遇到高难，满分时达到 80% 概率遇到高难
    const hardProbability = 0.15 + progress * 0.65 
    
    let jumpDifficulty = 0 // 难度系数： 0.0(最简单) ~ 1.0(最极变态)
    
    // 抽卡环节：根据当前的概率，决定接下来的这个方块难度落入哪个区间
    if (Math.random() < hardProbability) {
      // 抽中高难度：随机 0.5 ~ 1.0 之间的极限属性
      jumpDifficulty = 0.5 + Math.random() * 0.5
    } else {
      // 抽中低难度（喘息时刻）：随机 0.0 ~ 0.5 之间的简单属性
      jumpDifficulty = Math.random() * 0.5
    }

    // 难度映射 1：方块宽度
    // jumpDifficulty 为 0 时宽 13(巨大)，为 1.0 时宽 5(极限小)
    const nextWidth = 13 - (jumpDifficulty * 8)

    // 难度映射 2：方块距离
    const minDistance = (lastBlock.width + nextWidth) / 2 + 2
    // 困难度越高，额外增加的距离越远，最大增加 11 个单位，确保绝对不会超出屏幕视野
    const distance = minDistance + (jumpDifficulty * 11)

    // 难度映射 3：高度落差
    let heightDiff = 0
    // 只有当难度系数抽中中等偏上(> 0.3)时，才会有高度变化
    if (jumpDifficulty > 0.3) {
      const heightSign = Math.random() > 0.5 ? 1 : -1
      // 最大落差随着难度提高而增大，最高可达正负 8 个单位
      heightDiff = heightSign * (Math.random() * jumpDifficulty * 8)
    }
    const targetY = lastBlock.instance.position.y + heightDiff 

    // ========================================================

    const isXDirection = Math.random() > 0.5 
    let newX = lastBlock.instance.position.x
    let newZ = lastBlock.instance.position.z

    if (isXDirection) {
      newX += distance
      this.bottle.direction = 'x'
    } else {
      newZ -= distance
      this.bottle.direction = 'z'
    }

    const isCuboid = Math.random() > 0.5 
    let newBlock

    if (isCuboid) {
      const skins = ['default', 'default', 'store', 'express', 'dict', 'door', 'medicine', 'money', 'clock', 'gift', 'indoor', 'well']
      const randomSkin = skins[Math.floor(Math.random() * skins.length)]
      newBlock = new Cuboid(newX, targetY, newZ, randomSkin, nextWidth)
    } else {
      const skins = ['default', 'default', 'disk', 'disk_light', 'disk_dark', 'golf', 'paper']
      const randomSkin = skins[Math.floor(Math.random() * skins.length)]
      newBlock = new Cylinder(newX, targetY, newZ, randomSkin, nextWidth)
    }

    newBlock.instance.position.y = targetY + 15
    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)

    CustomAnimation.to(newBlock.instance.position, { y: targetY }, 0.25)

    if (this.blocks.length > 5) {
      const oldBlock = this.blocks.shift()
      this.scene.instance.remove(oldBlock.instance)
    }
  }

  updateCamera() {
    const lastBlock = this.blocks[this.blocks.length - 1] 
    const currentBlock = this.blocks[this.blocks.length - 2] 

    const targetPosition = new THREE.Vector3(
      (lastBlock.instance.position.x + currentBlock.instance.position.x) / 2,
      ((lastBlock.instance.position.y - 15) + currentBlock.instance.position.y) / 2,
      (lastBlock.instance.position.z + currentBlock.instance.position.z) / 2
    )
    camera.updatePosition(targetPosition)
  }

  render() {
    if (camera && camera.update) camera.update()
    this.scene.render()
    if (this.bottle) this.bottle.update()
    requestAnimationFrame(this.render.bind(this))
  }

  show() { console.log('game page show') }
  hide() { console.log('game page hide') }
  
  restart() { 
    this.resetGame() 
  }
}