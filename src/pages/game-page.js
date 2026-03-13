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

export default class GamePage {
  constructor(callbacks) {
    this.callbacks = callbacks
    this.touchStartTime = 0
    this.blocks = [] 
    this.isGameOver = false 
    this.bonusTimer = null // 新增：彩蛋停留计时器
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
    this.clearBonusTimer() // 重置时清除计时器
    gameModel.resetScore()
    
    this.blocks.forEach(block => {
      this.scene.instance.remove(block.instance)
    })
    this.blocks = []

    const cylinderBlock = new Cuboid(-15, 0, 0, 'default')
    const cuboidBlock = new Cylinder(8, 0, 0, 'default')
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
      
      // 核心：只要玩家一摸屏幕准备跳，立刻取消彩蛋计时！
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
      
      this.bottle.jump(pressTime, () => {
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

    const BLOCK_RADIUS = 6.5 
    const CENTER_RADIUS = 2  

    if (distanceToNext < CENTER_RADIUS) {
      gameModel.combo += 1
      const addScore = 2 * gameModel.combo
      gameModel.addScore(addScore)
      
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName)
      wave.createWave(this.scene.instance, nextBlock.instance.position)
      
      this.successJump(nextBlock)
    } else if (distanceToNext < BLOCK_RADIUS) {
      gameModel.combo = 0
      gameModel.addScore(1)
      audioManager.play('success') 
      this.successJump(nextBlock)
    } else if (distanceToCurr < BLOCK_RADIUS) {
      gameModel.combo = 0
      audioManager.play('success') 
      // 原地跳没掉下去，也可以触发当前方块的彩蛋
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
    
    // 每次成功落地后，开启该方块专属的彩蛋倒计时
    this.startBonusTimer(landedBlock) 
  }

  // 新增：彩蛋停留奖励逻辑
  startBonusTimer(block) {
    this.clearBonusTimer()
    
    let bonusScore = 0
    let audioName = ''

    // 判断踩中的是什么皮肤的方块
    if (block.skin === 'store') {
      bonusScore = 15
      audioName = 'store' // 开门营业声
    } else if (block.skin === 'disk') {
      bonusScore = 30
      audioName = 'sing' // 播放音乐声
    }

    if (bonusScore > 0) {
      // 开启 2 秒倒计时
      this.bonusTimer = setTimeout(() => {
        gameModel.addScore(bonusScore)
        audioManager.play(audioName)
        // 触发一次波纹特效表示加分成功
        wave.createWave(this.scene.instance, block.instance.position)
        console.log(`触发彩蛋！额外加分: +${bonusScore}`)
      }, 2000) 
    }
  }

  clearBonusTimer() {
    if (this.bonusTimer) {
      clearTimeout(this.bonusTimer)
      this.bonusTimer = null
    }
  }

  // ... 保持 import 不变 ...

  generateNextBlock() {
    // 难度升级：距离在 6 到 22 之间随机波动 (原为固定10-20)
    // 这样既有几乎贴着的方块，也有需要长按的远距离方块
    const distance = 6 + Math.random() * 16 
    const isXDirection = Math.random() > 0.5 

    const lastBlock = this.blocks[this.blocks.length - 1]
    let newX = lastBlock.instance.position.x
    let newZ = lastBlock.instance.position.z

    if (isXDirection) {
      newX += distance
      this.bottle.direction = 'x'
    } else {
      newZ -= distance
      this.bottle.direction = 'z'
    }

    const BlockClass = Math.random() > 0.5 ? Cuboid : Cylinder
    const newBlock = new BlockClass(newX, 0, newZ)

    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)

    // 自动清理旧方块
    if (this.blocks.length > 5) {
      const oldBlock = this.blocks.shift()
      this.scene.instance.remove(oldBlock.instance)
    }
  }

// ... 保持其他方法如 render/updateCamera 不变 ...

  updateCamera() {
    const lastBlock = this.blocks[this.blocks.length - 1] 
    const currentBlock = this.blocks[this.blocks.length - 2] 

    const targetPosition = new THREE.Vector3(
      (lastBlock.instance.position.x + currentBlock.instance.position.x) / 2,
      0,
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