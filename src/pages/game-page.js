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
    this.isSliding = false 
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
    this.isSliding = false

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
      if (gameModel.getStage() !== 'game-page' || this.isGameOver || this.isSliding) return 
      this.clearBonusTimer() 
      this.touchStartTime = Date.now()
      
      const nextBlock = this.blocks[this.blocks.length - 1]
      const currentBlock = this.blocks[this.blocks.length - 2]
      const currentY = currentBlock.instance.position.y + blockConf.height / 2
      
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
      if (gameModel.getStage() !== 'game-page' || this.isGameOver || this.isSliding) return
      
      if (this.chargeAudioTimer) { clearInterval(this.chargeAudioTimer); this.chargeAudioTimer = null }
      audioManager.stop('scale_intro') 
      audioManager.stop('scale_loop') 

      const touchEndTime = Date.now()
      const pressTime = touchEndTime - this.touchStartTime
      const currentBlock = this.blocks[this.blocks.length - 2]
      const nextBlock = this.blocks[this.blocks.length - 1]
      const currentY = currentBlock.instance.position.y + blockConf.height / 2
      const nextY = nextBlock.instance.position.y + blockConf.height / 2

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

  _checkStrictHit(block, dx, dz) {
    const margin = 0.5 
    if (block.type === 'cuboid') return Math.abs(dx) <= (block.width / 2 + margin) && Math.abs(dz) <= (block.width / 2 + margin)
    else return Math.sqrt(dx * dx + dz * dz) <= (block.width / 2 + margin)
  }

  checkCollision(isMicroStep = false) {
    const currentBlock = this.blocks[this.blocks.length - 2]
    const nextBlock = this.blocks[this.blocks.length - 1]
    const bottlePos = this.bottle.obj.position

    const nextX = nextBlock.instance.position.x;
    const nextZ = nextBlock.instance.position.z;
    const currX = currentBlock.instance.position.x;
    const currZ = currentBlock.instance.position.z;

    const dxNext = bottlePos.x - nextX
    const dzNext = bottlePos.z - nextZ
    const dxCurr = bottlePos.x - currX
    const dzCurr = bottlePos.z - currZ

    const hitNext = this._checkStrictHit(nextBlock, dxNext, dzNext)
    const hitCurr = this._checkStrictHit(currentBlock, dxCurr, dzCurr)
    const distanceToNextCenter = Math.sqrt(dxNext * dxNext + dzNext * dzNext)
    const CENTER_RADIUS = Math.min(2.5, nextBlock.width / 3.5)

    if (hitNext) {
      if (isMicroStep) return;

      if (nextBlock.isIce && distanceToNextCenter >= CENTER_RADIUS) {
        this.isSliding = true;
        
        const dxTotal = (nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x) - (currentBlock.baseX !== undefined ? currentBlock.baseX : currentBlock.instance.position.x);
        const dzTotal = (nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z) - (currentBlock.baseZ !== undefined ? currentBlock.baseZ : currentBlock.instance.position.z);
        const distTotal = Math.sqrt(dxTotal * dxTotal + dzTotal * dzTotal);
        const dirX = dxTotal / distTotal;
        const dirZ = dzTotal / distTotal;

        const maxSlideDist = 3.5; 
        let actualSlideDist = maxSlideDist;
        let willFall = false;

        let distToEdge = 999;
        const margin = 0.5;

        if (Math.abs(dirX) > Math.abs(dirZ)) {
            const edgeX = nextBlock.instance.position.x + Math.sign(dirX) * (nextBlock.width / 2 + margin);
            distToEdge = Math.abs(edgeX - bottlePos.x);
        } else {
            const edgeZ = nextBlock.instance.position.z + Math.sign(dirZ) * (nextBlock.width / 2 + margin);
            distToEdge = Math.abs(edgeZ - bottlePos.z);
        }

        if (distToEdge < maxSlideDist) {
            willFall = true;
            actualSlideDist = distToEdge + 0.2; 
        }

        // ==========================================
        // ✨【滑动追踪优化】：动画采用相对增量计算
        // 允许火柴人在打滑期间依然完美吸附在移动的方块上！
        // ==========================================
        const slideDuration = (actualSlideDist / maxSlideDist) * 0.3; 
        const sX = dirX * actualSlideDist;
        const sZ = dirZ * actualSlideDist;
        
        let slideProgress = { p: 0 };
        const startX = this.bottle.obj.position.x;
        const startZ = this.bottle.obj.position.z;

        audioManager.play('water'); 

        // 不直接修改坐标，而是缓动进度，由 update() 自己结合增量计算
        CustomAnimation.to(slideProgress, { p: 1 }, slideDuration);

        // 利用 requestAnimationFrame 在每一帧叠加相对滑动偏移
        const slideLoop = () => {
            if (!this.isSliding) return;
            const currentP = slideProgress.p;
            // 获取方块底盘实时的绝对坐标，加上相对的滑行距离
            this.bottle.obj.position.x = nextBlock.instance.position.x + dxNext + (sX * currentP);
            this.bottle.obj.position.z = nextBlock.instance.position.z + dzNext + (sZ * currentP);
            requestAnimationFrame(slideLoop);
        };
        slideLoop();

        setTimeout(() => {
            this.isSliding = false;
            if (willFall) {
                const finalDx = this.bottle.obj.position.x - nextBlock.instance.position.x;
                const finalDz = this.bottle.obj.position.z - nextBlock.instance.position.z;
                this.handleFall(currentBlock, nextBlock, finalDx, finalDz, false, false, distanceToNextCenter);
            } else {
                this.handleHitNext(currentBlock, nextBlock, distanceToNextCenter, CENTER_RADIUS, true);
            }
        }, slideDuration * 1000);

        return; 
      }

      this.handleHitNext(currentBlock, nextBlock, distanceToNextCenter, CENTER_RADIUS, false);

    } else if (hitCurr) {
      if (isMicroStep) return; 
      
      gameModel.combo = 0
      audioManager.play('success') 
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.startBonusTimer(currentBlock) 
    } else {
      this.handleFall(currentBlock, nextBlock, dxNext, dzNext, hitNext, hitCurr, distanceToNextCenter);
    }
  }

  handleHitNext(currentBlock, nextBlock, distanceToNextCenter, CENTER_RADIUS, wasSliding) {
    const blockDistance = Math.sqrt(
      Math.pow((nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x) - 
               (currentBlock.baseX !== undefined ? currentBlock.baseX : currentBlock.instance.position.x), 2) + 
      Math.pow((nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z) - 
               (currentBlock.baseZ !== undefined ? currentBlock.baseZ : currentBlock.instance.position.z), 2)
    )
    let baseScore = Math.max(1, Math.floor(blockDistance / 5)) 
    let finalScore = baseScore

    if (!wasSliding && distanceToNextCenter < CENTER_RADIUS) {
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
  }

  handleFall(currentBlock, nextBlock, dxNext, dzNext, hitNext, hitCurr, distanceToNextCenter) {
    this.isGameOver = true
    audioManager.play('fall') 
    gameModel.saveHighestScore()

    const dxCurr = this.bottle.obj.position.x - currentBlock.instance.position.x;
    const dzCurr = this.bottle.obj.position.z - currentBlock.instance.position.z;

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
    else if (block.skin && block.skin.includes('disk')) bonusScore = 30;

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
    
    // ==========================================
    // ✨【A路线终极阶梯】：控制组合出现的概率
    // 阶梯 1: 纯移动 (>8)
    // 阶梯 2: 纯冰块 (>15)
    // 阶梯 3: 终极冰块 + 移动 (>20)
    // ==========================================
    let isMoving = false;
    let isIce = false;

    const rand = Math.random();

    if (this.stepCount > 20) {
        // 第 3 阶段：动感冰块登场！
        if (rand < 0.20) {
            isMoving = true;
            isIce = true;
        } else if (rand < 0.40) {
            isIce = true;
        } else if (rand < 0.65) {
            isMoving = true;
        }
    } else if (this.stepCount > 15) {
        // 第 2 阶段：纯冰块
        if (rand < 0.20) {
            isIce = true;
        } else if (rand < 0.45) {
            isMoving = true;
        }
    } else if (this.stepCount > 8) {
        // 第 1 阶段：仅移动方块
        if (rand < 0.25) {
            isMoving = true;
        }
    }

    if (isMoving) {
        newBlock.isMoving = true;
        newBlock.moveAxis = isXDirection ? 'z' : 'x'; 
        const speedMultiplier = Math.min(1 + (this.stepCount - 8) / 40, 3.0); // 终极速度上限
        newBlock.moveSpeed = (0.0015 + Math.random() * 0.001) * speedMultiplier;
        newBlock.moveRange = 5 + Math.random() * 4;
        newBlock.moveOffset = Math.random() * Math.PI * 2; 
    }

    if (isIce) {
        newBlock.isIce = true;
        // 视觉区分：普通的冰块是冰蓝色，极度危险的【移动冰块】是高能紫光色！
        const iceColor = isMoving ? 0xcc88ff : 0x88ddff; 
        const emissiveColor = isMoving ? 0x441155 : 0x113355;

        const iceMat = new THREE.MeshPhysicalMaterial({
            color: iceColor,       
            transmission: 0.6,     
            transparent: true,
            opacity: 1,
            metalness: 0.2,
            roughness: 0.1,       
            ior: 1.5,
            emissive: emissiveColor,    
            castShadow: true
        });
        
        newBlock.instance.traverse((child) => {
            if (child.isMesh) {
                child.material = iceMat;
            }
        });
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

    const now = Date.now();
    
    let currentStandingBlock = this.blocks[this.blocks.length - 2];
    if (this.isSliding) {
        currentStandingBlock = this.blocks[this.blocks.length - 1];
    }

    this.blocks.forEach(block => {
      if (block.isMoving && block.instance) {
        const basePos = block.moveAxis === 'x' ? block.baseX : block.baseZ;
        const prevPos = block.instance.position[block.moveAxis]; 
        const newPos = basePos + Math.sin(now * block.moveSpeed + block.moveOffset) * block.moveRange; 
        
        const delta = newPos - prevPos;
        block.instance.position[block.moveAxis] = newPos;

        // 无论是静止、蓄力、还是打滑期间，火柴人都会完美吸收平台的移动增量
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