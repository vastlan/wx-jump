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
import particle from '../objects/particle' 

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
      if (block.dispose) block.dispose()
    })
    this.blocks = []

    this.scene.background.setTargetColor('#E8E8E8')

    const initWidth = 18
    const initDistance = initWidth + 2 + Math.random() * 2
    const cylinderBlock = new Cuboid(-15, 0, 0, 'default', initWidth)
    cylinderBlock.isHard = false 
    
    const cuboidBlock = new Cylinder(-15 + initDistance, 0, 0, 'default', initWidth)
    cuboidBlock.isHard = false 
    
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
      if (gameModel.getStage() !== 'game-page' || this.isGameOver) return 
      this.clearBonusTimer() 
      this.touchStartTime = Date.now()
      this.bottle.prepare()
      audioManager.play('scale_intro') 
    })

    wx.onTouchEnd(() => {
      if (gameModel.getStage() !== 'game-page' || this.isGameOver) return
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

    // ========================================================
    // 核心物理修复：精确的带补偿碰撞检测
    // ========================================================
    
    // 小人本身的物理底座半径（来源于 bottleConf.bodyWidth / 2 = 1.4）
    const BOTTLE_R = 1.4 

    const getHitRadius = (block) => {
      const baseRadius = block.width / 2
      // 如果是正方形方块(cuboid)，其对角线（四个角）距离中心更远
      // 增加 1.25 的形状系数补偿，确保跳在角落依然判定成功
      const shapeFactor = block.type === 'cuboid' ? 1.25 : 1.0
      // 最终的安全落点半径 = 方块几何判定半径 + 小人身体半径
      return baseRadius * shapeFactor + BOTTLE_R
    }

    const NEXT_RADIUS = getHitRadius(nextBlock)
    const CURR_RADIUS = getHitRadius(currentBlock)
    const CENTER_RADIUS = Math.min(2.5, nextBlock.width / 3.5)

    const baseScore = nextBlock.isHard ? 3 : 1

    if (distanceToNext < CENTER_RADIUS) {
      gameModel.combo += 1
      const addScore = baseScore * 2 * gameModel.combo
      gameModel.addScore(addScore)
      
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName)
      wave.createWave(this.scene.instance, nextBlock.instance.position)
      scoreText3d.showScore(this.scene.instance, addScore, nextBlock.instance.position)
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.successJump(nextBlock)
      
    } else if (distanceToNext < NEXT_RADIUS) {
      gameModel.combo = 0
      gameModel.addScore(baseScore)
      audioManager.play('success') 
      
      if (nextBlock.isHard) {
        scoreText3d.showScore(this.scene.instance, baseScore, nextBlock.instance.position)
      }

      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.successJump(nextBlock)
      
    } else if (distanceToCurr < CURR_RADIUS) {
      gameModel.combo = 0
      audioManager.play('success') 
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.startBonusTimer(currentBlock) 
      
    } else {
      this.isGameOver = true
      audioManager.play('fall') 
      gameModel.saveHighestScore()

      let fallType = 'straight'
      // 失误动画的边缘触发范围也同步向外扩展，体验更真实
      if (distanceToNext >= NEXT_RADIUS && distanceToNext < NEXT_RADIUS + 2.0) {
        if (this.bottle.direction === 'x') {
          fallType = dx < 0 ? 'tiltBackward' : 'tiltForward'
        } else {
          fallType = dz > 0 ? 'tiltBackward' : 'tiltForward'
        }
      } else if (distanceToCurr >= CURR_RADIUS && distanceToCurr < CURR_RADIUS + 2.0) {
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
    
    let hardProb = 0.20 
    if (score >= 80) {
      hardProb = 0.80   
    } else if (score >= 60) {
      hardProb = 0.60   
    } else if (score >= 40) {
      hardProb = 0.50   
    } else if (score >= 20) {
      hardProb = 0.40   
    }

    const isHard = Math.random() < hardProb
    let nextWidth, distance, heightDiff

    if (isHard) {
      nextWidth = 6 + Math.random() * 4 
      const minDistance = (lastBlock.width + nextWidth) / 2 + 2
      distance = minDistance + 12 + Math.random() * 10 
      const heightSign = Math.random() > 0.5 ? 1 : -1
      heightDiff = heightSign * (5 + Math.random() * 8) 
    } else {
      nextWidth = 16 + Math.random() * 6 
      const minDistance = (lastBlock.width + nextWidth) / 2 + 2
      distance = minDistance + 2 + Math.random() * 6 
      const heightSign = Math.random() > 0.5 ? 1 : -1
      heightDiff = heightSign * (Math.random() * 2) 
    }

    const targetY = lastBlock.instance.position.y + heightDiff 
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

    newBlock.isHard = isHard
    newBlock.instance.position.y = targetY + 15
    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)

    CustomAnimation.to(newBlock.instance.position, { y: targetY }, 0.25)

    if (this.blocks.length > 5) {
      const oldBlock = this.blocks.shift()
      this.scene.instance.remove(oldBlock.instance)
      if (oldBlock.dispose) oldBlock.dispose() 
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