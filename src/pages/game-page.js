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
// 核心修复：更正配置文件的相对路径，往上跳两层跳出 src 目录
import blockConf from '../../confs/block-conf'

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

    const initWidth = 12
    const initDistance = initWidth + 2 + Math.random() * 6
    const cylinderBlock = new Cuboid(-15, 0, 0, 'default', initWidth)
    const cuboidBlock = new Cylinder(-15 + initDistance, 0, 0, 'default', initWidth)
    this.scene.instance.add(cylinderBlock.instance)
    this.scene.instance.add(cuboidBlock.instance)
    this.blocks.push(cylinderBlock)
    this.blocks.push(cuboidBlock)
    
    this.bottle.obj.position.set(-15, 0, 0)
    this.bottle.direction = 'x'
    this.bottle.status = 'stop'
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
      // 这里用到了正确引入的 blockConf
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
      this.bottle.fall() 
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
    const difficulty = Math.min(score / 40, 1.0) 

    const minWidth = 10 - (difficulty * 5) 
    const maxWidth = 13 - (difficulty * 3) 
    const nextWidth = minWidth + Math.random() * (maxWidth - minWidth)

    const minDistance = (lastBlock.width + nextWidth) / 2 + 2
    const maxDistance = minDistance + 6 + (difficulty * 10) 
    const distance = minDistance + Math.random() * (maxDistance - minDistance)

    const heightDiff = (Math.random() - 0.5) * (difficulty * 10)
    const newY = lastBlock.instance.position.y + heightDiff

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
      newBlock = new Cuboid(newX, newY, newZ, randomSkin, nextWidth)
    } else {
      const skins = ['default', 'default', 'disk', 'disk_light', 'disk_dark', 'golf', 'paper']
      const randomSkin = skins[Math.floor(Math.random() * skins.length)]
      newBlock = new Cylinder(newX, newY, newZ, randomSkin, nextWidth)
    }

    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)

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
      (lastBlock.instance.position.y + currentBlock.instance.position.y) / 2,
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