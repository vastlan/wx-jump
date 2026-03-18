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
    this.chargeAudioTimer = null 
    this.stepCount = 0
  }

  init() {
    this.scene = scene
    this.ground = ground
    this.bottle = bottle

    this.scene.init()
    this.ground.init()
    this.bottle.init()

    scoreText.init() 
    gameModel.scoreChanged.attach((sender, args) => { scoreText.updateScore(args.score) })
    
    this.resetGame()
    this.bindTouchEvent()
    this.render()
  }

  resetGame() {
    this.isGameOver = false
    this.clearBonusTimer() 
    gameModel.resetScore() 

    // 清理旧方块
    this.blocks.forEach(block => {
      this.scene.instance.remove(block.instance)
      if (block.dispose) block.dispose()
    })
    this.blocks = []
    this.scene.background.setTargetColor('#E8E8E8')

    const initWidth = 18
    const initDistance = initWidth + 2 + Math.random() * 2
    const cylinderBlock = new Cuboid(-15, 0, 0, 'default', initWidth)
    const cuboidBlock = new Cylinder(-15 + initDistance, 0, 0, 'default', initWidth)
    
    // 回归最纯净的原生场景加载，剔除导致卡顿的包裹层
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
      
      const nextBlock = this.blocks[this.blocks.length - 1]
      const currentBlock = this.blocks[this.blocks.length - 2]
      const currentY = currentBlock.instance.position.y + blockConf.height / 2
      
      this.bottle.prepare(nextBlock.instance.position, currentBlock, currentY)
      
      audioManager.play('scale_intro') 
      this.chargeAudioTimer = setInterval(() => { audioManager.play('scale_loop') }, 900)
    })

    wx.onTouchEnd(() => {
      if (gameModel.getStage() !== 'game-page' || this.isGameOver) return
      
      if (this.chargeAudioTimer) { clearInterval(this.chargeAudioTimer); this.chargeAudioTimer = null }
      audioManager.stop('scale_intro') 
      audioManager.stop('scale_loop') 

      const touchEndTime = Date.now()
      const pressTime = touchEndTime - this.touchStartTime
      const currentBlock = this.blocks[this.blocks.length - 2]
      const nextBlock = this.blocks[this.blocks.length - 1]
      const currentY = currentBlock.instance.position.y + blockConf.height / 2
      const nextY = nextBlock.instance.position.y + blockConf.height / 2

      this.bottle.jump(pressTime, currentY, nextY, nextBlock.instance.position, (isMicroStep) => { 
        this.checkCollision(isMicroStep) 
      })
    })
  }

  checkCollision(isMicroStep = false) {
    const currentBlock = this.blocks[this.blocks.length - 2]
    const nextBlock = this.blocks[this.blocks.length - 1]
    const bottlePos = this.bottle.obj.position

    const dxNext = bottlePos.x - nextBlock.instance.position.x
    const dzNext = bottlePos.z - nextBlock.instance.position.z
    const dxCurr = bottlePos.x - currentBlock.instance.position.x
    const dzCurr = bottlePos.z - currentBlock.instance.position.z

    const checkStrictHit = (block, dx, dz) => {
      // 保持极其真实的 2/3 脚掌边缘跌落检测容错率
      const margin = 0.5 
      if (block.type === 'cuboid') return Math.abs(dx) <= (block.width / 2 + margin) && Math.abs(dz) <= (block.width / 2 + margin)
      else return Math.sqrt(dx * dx + dz * dz) <= (block.width / 2 + margin)
    }

    const hitNext = checkStrictHit(nextBlock, dxNext, dzNext)
    const hitCurr = checkStrictHit(currentBlock, dxCurr, dzCurr)
    const distanceToNextCenter = Math.sqrt(dxNext * dxNext + dzNext * dzNext)
    const CENTER_RADIUS = Math.min(2.5, nextBlock.width / 3.5)

    if (hitNext) {
      if (isMicroStep) return;

      const blockDistance = Math.sqrt(
        Math.pow(nextBlock.instance.position.x - currentBlock.instance.position.x, 2) + 
        Math.pow(nextBlock.instance.position.z - currentBlock.instance.position.z, 2)
      )
      let baseScore = Math.max(1, Math.floor(blockDistance / 5)) 
      let finalScore = baseScore

      if (distanceToNextCenter < CENTER_RADIUS) {
        finalScore = baseScore * 2
        gameModel.combo += 1
        const comboName = `combo${Math.min(gameModel.combo, 8)}`
        audioManager.play(comboName)
        wave.createWave(this.scene.instance, nextBlock.instance.position)
      } else {
        gameModel.combo = 0
        audioManager.play('success') 
      }

      gameModel.addScore(finalScore)
      scoreText3d.showScore(this.scene.instance, finalScore, nextBlock.instance.position)
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.successJump(nextBlock)

    } else if (hitCurr) {
      if (isMicroStep) return; 
      
      gameModel.combo = 0
      audioManager.play('success') 
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.startBonusTimer(currentBlock) 
    } else {
      this.isGameOver = true
      audioManager.play('fall') 
      gameModel.saveHighestScore()

      let fallType = 'straight'
      if (!hitNext && distanceToNextCenter < nextBlock.width / 2 + 2.5) {
        if (this.bottle.direction === 'x') fallType = dxNext < 0 ? 'tiltBackward' : 'tiltForward'
        else fallType = dzNext > 0 ? 'tiltBackward' : 'tiltForward'
      } else if (!hitCurr && Math.sqrt(dxCurr * dxCurr + dzCurr * dzCurr) < currentBlock.width / 2 + 2.5) {
        fallType = 'tiltForward'
      }

      this.bottle.fall(fallType) 
      setTimeout(() => { if (this.callbacks && this.callbacks.showGameOverPage) this.callbacks.showGameOverPage() }, 1500)
    }
  }

  successJump(landedBlock) {
    this.stepCount++   // ✅ 关键
    this.generateNextBlock()
    this.updateCamera()
    this.startBonusTimer(landedBlock) 
  }

  startBonusTimer(block) {
    this.clearBonusTimer()
    let bonusScore = 0
    if (block.skin === 'store') bonusScore = 15;
    else if (block.skin.includes('disk')) bonusScore = 30;

    if (bonusScore > 0) {
      this.bonusTimer = setTimeout(() => {
        gameModel.addScore(bonusScore)
        audioManager.play('sing')
        wave.createWave(this.scene.instance, block.instance.position)
        scoreText3d.showScore(this.scene.instance, bonusScore, block.instance.position) 
      }, 2000) 
    }
  }

  clearBonusTimer() {
    if (this.bonusTimer) { clearTimeout(this.bonusTimer); this.bonusTimer = null }
  }

  // generateNextBlock() {
  //   const lastBlock = this.blocks[this.blocks.length - 1]
    
  //   const nextWidth = 5 + Math.random() * 15 
  //   const minDistance = (lastBlock.width + nextWidth) / 2 + 1.2
    
  //   // 【完美广角匹配】：因为开启了固定广角，现在可以容纳最远 28 个单位的极限跳跃距离！
  //   const maxDistance = 100 
  //   const distance = minDistance + Math.random() * (maxDistance - minDistance)

  //   const targetY = 0 
  //   const isXDirection = Math.random() > 0.5 
  //   let newX = lastBlock.instance.position.x
  //   let newZ = lastBlock.instance.position.z

  //   if (isXDirection) { newX += distance; this.bottle.direction = 'x' } 
  //   else { newZ -= distance; this.bottle.direction = 'z' }

  //   const isCuboid = Math.random() > 0.5 
  //   let newBlock

  //   if (isCuboid) {
  //     newBlock = new Cuboid(newX, targetY, newZ, 'default', nextWidth)
  //   } else {
  //     newBlock = new Cylinder(newX, targetY, newZ, 'default', nextWidth)
  //   }

  //   newBlock.instance.position.y = targetY + 15
  //   this.scene.instance.add(newBlock.instance)
  //   this.blocks.push(newBlock)

  //   CustomAnimation.to(newBlock.instance.position, { y: targetY }, 0.25)

  //   if (this.blocks.length > 5) {
  //     const oldBlock = this.blocks.shift()
  //     this.scene.instance.remove(oldBlock.instance)
  //     if (oldBlock.dispose) oldBlock.dispose() 
  //   }
  // }

  generateNextBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1]
  
    // =========================
    // 🎯 1. 难度曲线（核心）
    // =========================
    let t

    if (this.stepCount < 10) {
      // 🎯 前10步：强制线性增长（不允许摆烂）
      t = this.stepCount / 10   // 0 → 1 很快拉满
    } else {
      // 🎯 后面：进入正常成长曲线
      t = Math.min((this.stepCount - 10) / 50 + 1, 2)
    }
    // t: 0 → 1（游戏进度）
  
    // =========================
    // 🎯 2. 方块大小（越后面越小）
    // =========================
    const minWidth = 6 - t * 3      // 6 → 3
    const maxWidth = 20 - t * 10    // 20 → 10
    const nextWidth = minWidth + Math.random() * (maxWidth - minWidth)
  
    // =========================
    // 🎯 3. 基础距离（逐渐变大）
    // =========================
    const baseMinDistance = Math.max(
      (lastBlock.width + nextWidth) / 2 + 1.5,
      8   // 👈 关键：绝对不允许太近
    )
  
    const maxDistance = 12 + t * 60   // 12 → 72（逐渐拉大）
    let distance = baseMinDistance + Math.random() * (maxDistance - baseMinDistance)
  
    // =========================
    // 🎁 4. “甜头机制”（关键！！！）
    // =========================
    const rewardChance = 0.15 + (t * 0.1)  // 后期更容易给甜头
  
    if (this.stepCount > 10 && Math.random() < rewardChance) {
      // 给简单局
      distance *= 0.6
      nextWidth * 1.3
    }
  
    // =========================
    // 💀 5. “挑战点”（偶尔很难）
    // =========================
    const challengeChance = 0.1 + t * 0.2
  
    if (Math.random() < challengeChance) {
      distance *= 1.3
    }
  
    // =========================
    // 🎯 6. 方向逻辑（不变）
    // =========================
    const targetY = 0 
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
  
    // =========================
    // 🎯 7. 创建方块
    // =========================
    const isCuboid = Math.random() > 0.5 
    let newBlock
  
    if (isCuboid) {
      newBlock = new Cuboid(newX, targetY, newZ, 'default', nextWidth)
    } else {
      newBlock = new Cylinder(newX, targetY, newZ, 'default', nextWidth)
    }
  
    newBlock.instance.position.y = targetY + 15
    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)
  
    CustomAnimation.to(newBlock.instance.position, { y: targetY }, 0.25)
  
    // if (this.blocks.length > 5) {
    //   const oldBlock = this.blocks.shift()
    //   this.scene.instance.remove(oldBlock.instance)
    //   if (oldBlock.dispose) oldBlock.dispose() 
    // }

    this.cleanupBlocks()
  }

  cleanupBlocks() {
    if (!this.camera || !this.camera.instance) return
  
    const cam = this.camera.instance
  
    const frustumSize = 10 // 和你 sceneConf 保持一致
    const aspect = window.innerHeight / window.innerWidth
  
    const visibleWidth = frustumSize
    const visibleHeight = frustumSize * aspect
  
    const camX = cam.position.x
    const camZ = cam.position.z
  
    this.blocks = this.blocks.filter(block => {
      const pos = block.instance.position
  
      const inView =
        Math.abs(pos.x - camX) < visibleWidth * 1.5 &&
        Math.abs(pos.z - camZ) < visibleHeight * 1.5
  
      if (!inView) {
        this.scene.instance.remove(block.instance)
        if (block.dispose) block.dispose()
        return false
      }
  
      return true
    })
  }

  updateCamera() {
    const lastBlock = this.blocks[this.blocks.length - 1] 
    const currentBlock = this.blocks[this.blocks.length - 2] 
    
    // 摄像机永远极其平稳地追踪两个方块的中心点
    const targetPosition = new THREE.Vector3(
      (lastBlock.instance.position.x + currentBlock.instance.position.x) / 2,
      ((lastBlock.instance.position.y - 15) + currentBlock.instance.position.y) / 2,
      (lastBlock.instance.position.z + currentBlock.instance.position.z) / 2
    )
    camera.updatePosition(targetPosition)
  }

  render() {
    if (camera && camera.update) camera.update()
    
    // ==========================================
    // 【核心广角运镜】：操控底层 3D 摄像机 Zoom
    // 1. 开始页面或死亡页面：标准视角 1.0
    // 2. 游玩页面：固定广角 0.65，视野开阔不晕眩
    // 3. 绝对不影响外部包裹的 2D 积分计分板！
    // ==========================================
    let targetZoom = 1.0;
    if (gameModel.getStage() === 'game-page' && !this.isGameOver) {
        targetZoom = 0.65; 
    }

    // 极其丝滑且性能拉满的线性插值过渡，杜绝死帧
    if (camera && camera.instance && Math.abs(camera.instance.zoom - targetZoom) > 0.001) {
        camera.instance.zoom += (targetZoom - camera.instance.zoom) * 0.08;
        camera.instance.updateProjectionMatrix();
    }

    this.scene.render()
    if (this.bottle) this.bottle.update()
    requestAnimationFrame(this.render.bind(this))

    // 在 zoom 更新之后
    scoreText.updateCameraCompensation()
  }

  show() {} hide() {} restart() { this.resetGame() }
}