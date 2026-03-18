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
    this.stepCount = 0 

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
      
      // 【基准弹道锁定】：准备阶段永远朝向轨道的物理绝对中心线，不会随着方块左右摇摆
      const targetPos = new THREE.Vector3(
        nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x,
        nextBlock.instance.position.y,
        nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z
      )
      
      this.bottle.prepare(targetPos, currentBlock, currentY)
      
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

      // 【基准弹道锁定】：起跳轨迹强制沿 X 轴或 Z 轴直线飞行，强迫玩家预判方块滑动时机
      const targetPos = new THREE.Vector3(
        nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x,
        nextBlock.instance.position.y,
        nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z
      )

      this.bottle.jump(pressTime, currentY, nextY, targetPos, (isMicroStep) => { 
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
        Math.pow((nextBlock.baseX || nextBlock.instance.position.x) - (currentBlock.baseX || currentBlock.instance.position.x), 2) + 
        Math.pow((nextBlock.baseZ || nextBlock.instance.position.z) - (currentBlock.baseZ || currentBlock.instance.position.z), 2)
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
    this.stepCount++   
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

  generateNextBlock() {
    const lastBlock = this.blocks[this.blocks.length - 1]
  
    let t
    if (this.stepCount < 10) {
      t = this.stepCount / 10   
    } else {
      t = Math.min((this.stepCount - 10) / 50 + 1, 2)
    }
  
    const minWidth = 6 - t * 3      
    const maxWidth = 20 - t * 10    
    const nextWidth = minWidth + Math.random() * (maxWidth - minWidth)
  
    const baseMinDistance = Math.max((lastBlock.width + nextWidth) / 2 + 1.5, 8)
    const maxDistance = 12 + t * 60   
    let distance = baseMinDistance + Math.random() * (maxDistance - baseMinDistance)
  
    const rewardChance = 0.15 + (t * 0.1)  
    if (this.stepCount > 10 && Math.random() < rewardChance) {
      distance *= 0.6
      nextWidth * 1.3
    }
  
    const challengeChance = 0.1 + t * 0.2
    if (Math.random() < challengeChance) {
      distance *= 1.3
    }
  
    const targetY = 0 
    const isXDirection = Math.random() > 0.5 
    
    // 使用基准坐标进行衍生，防止累积滑动误差
    let newX = lastBlock.baseX !== undefined ? lastBlock.baseX : lastBlock.instance.position.x;
    let newZ = lastBlock.baseZ !== undefined ? lastBlock.baseZ : lastBlock.instance.position.z;
  
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
      newBlock = new Cuboid(newX, targetY, newZ, 'default', nextWidth)
    } else {
      newBlock = new Cylinder(newX, targetY, newZ, 'default', nextWidth)
    }

    newBlock.baseX = newX;
    newBlock.baseZ = newZ;
    
    // 概率生成动态移动的方块
    if (this.stepCount > 8 && Math.random() < 0.25) {
        newBlock.isMoving = true;
        newBlock.moveAxis = isXDirection ? 'z' : 'x'; 
        const speedMultiplier = Math.min(1 + (this.stepCount - 8) / 40, 2.5);
        newBlock.moveSpeed = (0.0015 + Math.random() * 0.001) * speedMultiplier;
        newBlock.moveRange = 5 + Math.random() * 4;
        newBlock.moveOffset = Math.random() * Math.PI * 2; 
    }
  
    newBlock.instance.position.y = targetY + 15
    this.scene.instance.add(newBlock.instance)
    this.blocks.push(newBlock)
  
    CustomAnimation.to(newBlock.instance.position, { y: targetY }, 0.25)
  
    this.cleanupBlocks()
  }

  cleanupBlocks() {
    if (!this.camera || !this.camera.instance) return
  
    const cam = this.camera.instance
    const frustumSize = 10 
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
    
    const lastX = lastBlock.baseX !== undefined ? lastBlock.baseX : lastBlock.instance.position.x;
    const lastZ = lastBlock.baseZ !== undefined ? lastBlock.baseZ : lastBlock.instance.position.z;
    const currX = currentBlock.baseX !== undefined ? currentBlock.baseX : currentBlock.instance.position.x;
    const currZ = currentBlock.baseZ !== undefined ? currentBlock.baseZ : currentBlock.instance.position.z;

    const targetPosition = new THREE.Vector3(
      (lastX + currX) / 2,
      ((lastBlock.instance.position.y - 15) + currentBlock.instance.position.y) / 2,
      (lastZ + currZ) / 2
    )
    camera.updatePosition(targetPosition)
  }

  render() {
    if (camera && camera.update) camera.update()
    
    let targetZoom = 1.0;
    if (gameModel.getStage() === 'game-page' && !this.isGameOver) {
        targetZoom = 0.80; 
    }

    if (camera && camera.instance && Math.abs(camera.instance.zoom - targetZoom) > 0.001) {
        camera.instance.zoom += (targetZoom - camera.instance.zoom) * 0.08;
        camera.instance.updateProjectionMatrix();
    }

    // ==========================================
    // ✨【摩擦力同步引擎】：实时驱动方块与附着于其上的火柴人！
    // ==========================================
    const now = Date.now();
    // 永远获取火柴人当前“正在站立”的方块（即倒数第二个方块）
    const currentStandingBlock = this.blocks[this.blocks.length - 2];

    this.blocks.forEach(block => {
      if (block.isMoving && block.instance) {
        const basePos = block.moveAxis === 'x' ? block.baseX : block.baseZ;
        const prevPos = block.instance.position[block.moveAxis]; // 记录上一帧位置
        const newPos = basePos + Math.sin(now * block.moveSpeed + block.moveOffset) * block.moveRange; // 计算新位置
        
        // 计算方块这一帧滑行的物理偏移量（Delta）
        const delta = newPos - prevPos;
        block.instance.position[block.moveAxis] = newPos;

        // 【核心吸附逻辑】：如果火柴人正站在它上面（闲置或蓄力时），把增量赋给火柴人！
        if (block === currentStandingBlock && this.bottle && (this.bottle.status === 'stop' || this.bottle.status === 'prepare')) {
          this.bottle.obj.position[block.moveAxis] += delta;
        }
      }
    });

    this.scene.render()
    if (this.bottle) this.bottle.update()
    requestAnimationFrame(this.render.bind(this))

    scoreText.updateCameraCompensation()
  }

  show() {} hide() {} restart() { this.resetGame() }
}