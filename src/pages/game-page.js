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

// ✨【触觉引擎升级】：引入微信原生 heavy(重震)、medium(中震)、light(轻震)
const safeVibrate = (type) => {
  try {
    if (type === 'long') wx.vibrateLong()
    else wx.vibrateShort({ type: type }) 
  } catch (e) {}
}

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
    
    this.lastFrameTime = Date.now()
    this.activeCollapsingBlock = null 
    this.lastVibrateTime = 0 
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
    this.activeCollapsingBlock = null
    this.lastVibrateTime = 0

    this.blocks.forEach(block => {
      this.scene.instance.remove(block.instance)
      if (block.dispose) block.dispose()
    })
    this.blocks = []
    
    this.scene.background.setTargetColor('#81C9B5')

    const initWidth = 18
    const initDistance = initWidth + 2 + Math.random() * 2
    const cylinderBlock = new Cuboid(-15, 0, 0, 'default', initWidth)
    const cuboidBlock = new Cylinder(-15 + initDistance, 0, 0, 'default', initWidth)
    
    cylinderBlock.baseX = -15; cylinderBlock.baseZ = 0;
    cuboidBlock.baseX = -15 + initDistance; cuboidBlock.baseZ = 0;

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
      
      safeVibrate('light') 

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

    const nextX = nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x;
    const nextZ = nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z;
    const currX = currentBlock.baseX !== undefined ? currentBlock.baseX : currentBlock.instance.position.x;
    const currZ = currentBlock.baseZ !== undefined ? currentBlock.baseZ : currentBlock.instance.position.z;

    const nextOffset = nextBlock.virtualPos ? (nextBlock.virtualPos - (nextBlock.moveAxis === 'x' ? nextX : nextZ)) : 0;
    const currOffset = currentBlock.virtualPos ? (currentBlock.virtualPos - (currentBlock.moveAxis === 'x' ? currX : currZ)) : 0;

    const realNextX = nextX + (nextBlock.moveAxis === 'x' ? nextOffset : 0);
    const realNextZ = nextZ + (nextBlock.moveAxis === 'z' ? nextOffset : 0);
    const realCurrX = currX + (currentBlock.moveAxis === 'x' ? currOffset : 0);
    const realCurrZ = currZ + (currentBlock.moveAxis === 'z' ? currOffset : 0);

    const dxNext = bottlePos.x - realNextX;
    const dzNext = bottlePos.z - realNextZ;
    const dxCurr = bottlePos.x - realCurrX;
    const dzCurr = bottlePos.z - realCurrZ;

    const hitNext = this._checkStrictHit(nextBlock, dxNext, dzNext) && !nextBlock.hasCollapsed;
    const hitCurr = this._checkStrictHit(currentBlock, dxCurr, dzCurr) && !currentBlock.hasCollapsed;
    const distanceToNextCenter = Math.sqrt(dxNext * dxNext + dzNext * dzNext)
    const CENTER_RADIUS = Math.min(2.5, nextBlock.width / 3.5)

    if (hitNext) {
      if (isMicroStep) return;

      if (nextBlock.isIce && distanceToNextCenter >= CENTER_RADIUS) {
        this.isSliding = true;
        const dxTotal = nextX - currX;
        const dzTotal = nextZ - currZ;
        const distTotal = Math.sqrt(dxTotal * dxTotal + dzTotal * dzTotal);
        const dirX = dxTotal / distTotal;
        const dirZ = dzTotal / distTotal;

        const maxSlideDist = 3.5; 
        let actualSlideDist = maxSlideDist;
        let willFall = false;
        let distToEdge = 999;
        const margin = 0.5;

        if (Math.abs(dirX) > Math.abs(dirZ)) {
            const edgeX = realNextX + Math.sign(dirX) * (nextBlock.width / 2 + margin);
            distToEdge = Math.abs(edgeX - bottlePos.x);
        } else {
            const edgeZ = realNextZ + Math.sign(dirZ) * (nextBlock.width / 2 + margin);
            distToEdge = Math.abs(edgeZ - bottlePos.z);
        }

        if (distToEdge < maxSlideDist) {
            willFall = true;
            actualSlideDist = distToEdge + 0.2; 
        }

        const slideDuration = (actualSlideDist / maxSlideDist) * 0.3; 
        const sX = dirX * actualSlideDist;
        const sZ = dirZ * actualSlideDist;
        
        let slideProgress = { p: 0 };
        audioManager.play('water'); 
        CustomAnimation.to(slideProgress, { p: 1 }, slideDuration);

        const slideLoop = () => {
            if (!this.isSliding) return;
            const currentP = slideProgress.p;
            const currentRealNextX = nextX + (nextBlock.moveAxis === 'x' && nextBlock.virtualPos ? (nextBlock.virtualPos - nextX) : 0);
            const currentRealNextZ = nextZ + (nextBlock.moveAxis === 'z' && nextBlock.virtualPos ? (nextBlock.virtualPos - nextZ) : 0);
            
            this.bottle.obj.position.x = currentRealNextX + dxNext + (sX * currentP);
            this.bottle.obj.position.z = currentRealNextZ + dzNext + (sZ * currentP);
            requestAnimationFrame(slideLoop);
        };
        slideLoop();

        setTimeout(() => {
            this.isSliding = false;
            if (willFall || nextBlock.hasCollapsed) {
                const finalDxNext = this.bottle.obj.position.x - realNextX;
                const finalDzNext = this.bottle.obj.position.z - realNextZ;
                const finalDxCurr = this.bottle.obj.position.x - realCurrX;
                const finalDzCurr = this.bottle.obj.position.z - realCurrZ;
                this.handleFall(currentBlock, nextBlock, finalDxNext, finalDzNext, finalDxCurr, finalDzCurr, false, false, distanceToNextCenter);
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
      safeVibrate('light') 
      audioManager.play('success') 
      particle.createDust(this.scene.instance, this.bottle.obj.position)
      this.startBonusTimer(currentBlock) 
    } else {
      this.handleFall(currentBlock, nextBlock, dxNext, dzNext, dxCurr, dzCurr, hitNext, hitCurr, distanceToNextCenter);
    }
  }

  handleHitNext(currentBlock, nextBlock, distanceToNextCenter, CENTER_RADIUS, wasSliding) {
    const blockDistance = Math.sqrt(
      Math.pow((nextBlock.baseX) - (currentBlock.baseX), 2) + 
      Math.pow((nextBlock.baseZ) - (currentBlock.baseZ), 2)
    )
    let baseScore = Math.max(1, Math.floor(blockDistance / 5)) 
    let finalScore = baseScore

    let isPerfect = (!wasSliding && distanceToNextCenter < CENTER_RADIUS);

    if (isPerfect) {
      finalScore = baseScore * 2
      gameModel.combo += 1
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName)
      wave.createWave(this.scene.instance, nextBlock.instance.position)
    } else {
      gameModel.combo = 0
      audioManager.play('success') 
    }

    // ==========================================
    // ✨【触觉增强】：完美区分不同降落材质的手感！
    // ==========================================
    if (nextBlock.isCollapsing) {
      // 跳上脆弱的塌陷方块时，给予最强烈的“重震 (heavy)”，提示危险降临！
      safeVibrate('heavy'); 
    } else if (isPerfect) {
      safeVibrate('medium'); 
    } else {
      safeVibrate('light'); 
    }

    gameModel.addScore(finalScore)
    scoreText3d.showScore(this.scene.instance, finalScore, nextBlock.instance.position)
    particle.createDust(this.scene.instance, this.bottle.obj.position)
    
    // 传递 currentBlock 以便执行过河拆桥
    this.successJump(currentBlock, nextBlock)
  }

  handleFall(currentBlock, nextBlock, dxNext, dzNext, dxCurr, dzCurr, hitNext, hitCurr, distanceToNextCenter) {
    this.isGameOver = true
    this.activeCollapsingBlock = null; 
    this.isSliding = false;
    
    audioManager.play('fall') 
    safeVibrate('long') 

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

  // ✨【过河拆桥】：接收上一块石头，用于离足销毁
  successJump(currentBlock, landedBlock) {
    this.stepCount++   
    
    // ==========================================
    // ✨【原点消失】：只要跳离了塌陷格子，它立刻化为齑粉！
    // ==========================================
    if (currentBlock && currentBlock.isCollapsing && !currentBlock.hasCollapsed) {
        currentBlock.hasCollapsed = true;
        // 0.2秒内极速萎缩消失，深藏功与名
        CustomAnimation.to(currentBlock.instance.scale, {x: 0.01, y: 0.01, z: 0.01}, 0.2);
    }

    if (this.activeCollapsingBlock && this.activeCollapsingBlock.hasCollapsed === false) {
        this.activeCollapsingBlock.shakeOffsetX = 0;
        this.activeCollapsingBlock.shakeOffsetZ = 0;
    }
    this.activeCollapsingBlock = null;

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
    
    let isMoving = false;
    let isIce = false;
    let isCollapsing = false;

    if (gameModel.combo >= 3) {
        isMoving = true;
        newBlock.isMoving = true;
        newBlock.moveAxis = isXDirection ? 'z' : 'x';
        newBlock.moveSpeed = 0.001; 
        newBlock.moveRange = 4;
        newBlock.moveOffset = 0;
        
        const buffMat = new THREE.MeshStandardMaterial({ color: 0xF3E5AB, roughness: 0.85, metalness: 0 }); 
        newBlock.instance.traverse(c => { if (c.isMesh) c.material = buffMat; });

    } else {
        if (this.stepCount > 25) {
            const rand = Math.random();
            if (rand < 0.15) { isMoving = true; isIce = true; isCollapsing = true; } 
            else if (rand < 0.30) { isIce = true; isCollapsing = true; } 
            else if (rand < 0.50) { isMoving = true; isCollapsing = true; } 
            else if (rand < 0.65) { isCollapsing = true; }
            else if (rand < 0.80) { isIce = true; }
            else { isMoving = true; }
        } else if (this.stepCount > 2) {
            const rand = Math.random();
            if (rand < 0.85) { isCollapsing = true; } 
            else if (rand < 0.35) { isIce = true; }
            else if (rand < 0.60) { isMoving = true; }
        } else if (this.stepCount > 8) {
            if (Math.random() < 0.25) { isMoving = true; }
        }

        if (isMoving) {
            newBlock.isMoving = true;
            newBlock.moveAxis = isXDirection ? 'z' : 'x'; 
            const speedMultiplier = Math.min(1 + (this.stepCount - 8) / 40, 3.0); 
            newBlock.moveSpeed = (0.0015 + Math.random() * 0.001) * speedMultiplier;
            newBlock.moveRange = 5 + Math.random() * 4;
            newBlock.moveOffset = Math.random() * Math.PI * 2; 
        }

        if (isCollapsing) {
            newBlock.isCollapsing = true;
            newBlock.collapseTimeLeft = 10; 
            newBlock.triggeredCollapse = false;
            newBlock.hasCollapsed = false;
            newBlock.shakeOffsetX = 0;
            newBlock.shakeOffsetZ = 0;
        }

        if (isIce) {
            newBlock.isIce = true;
            const iceColor = 0x88ddff; 
            const iceMat = new THREE.MeshPhysicalMaterial({
                color: iceColor,       
                transmission: 0.6,     
                transparent: true,
                opacity: 1,
                metalness: 0.2,
                roughness: 0.1,       
                ior: 1.5,
                emissive: 0x113355,    
                castShadow: true
            });
            
            newBlock.instance.traverse((child) => {
                if (child.isMesh) child.material = iceMat;
            });
        }
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
    
    const lastX = (lastBlock && lastBlock.baseX !== undefined) ? lastBlock.baseX : (lastBlock ? lastBlock.instance.position.x : 0);
    const lastZ = (lastBlock && lastBlock.baseZ !== undefined) ? lastBlock.baseZ : (lastBlock ? lastBlock.instance.position.z : 0);
    const currX = (currentBlock && currentBlock.baseX !== undefined) ? currentBlock.baseX : (currentBlock ? currentBlock.instance.position.x : 0);
    const currZ = (currentBlock && currentBlock.baseZ !== undefined) ? currentBlock.baseZ : (currentBlock ? currentBlock.instance.position.z : 0);
    const lastY = lastBlock ? (lastBlock.instance.position.y - 15) : 0;
    const currY = currentBlock ? currentBlock.instance.position.y : 0;

    const targetPosition = new THREE.Vector3(
      (lastX + currX) / 2 || 0,
      (lastY + currY) / 2 || 0,
      (lastZ + currZ) / 2 || 0
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
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    let currentStandingBlock = this.blocks[this.blocks.length - 2];
    if (this.isSliding) {
        currentStandingBlock = this.blocks[this.blocks.length - 1];
    }

    if (!this.isGameOver && currentStandingBlock && currentStandingBlock.isCollapsing && !currentStandingBlock.triggeredCollapse && this.bottle.status === 'stop') {
        currentStandingBlock.triggeredCollapse = true;
        this.activeCollapsingBlock = currentStandingBlock;
    }

    if (this.activeCollapsingBlock && !this.activeCollapsingBlock.hasCollapsed && !this.isGameOver) {
        const block = this.activeCollapsingBlock;
        block.collapseTimeLeft -= dt;

        if (block.collapseTimeLeft > 0) {
            const progress = 1 - Math.max(0, block.collapseTimeLeft / 10);
            
            const intensity = Math.pow(progress, 3) * 1.5 + 0.05; 
            block.shakeOffsetX = (Math.random() - 0.5) * intensity;
            block.shakeOffsetZ = (Math.random() - 0.5) * intensity;

            // ==========================================
            // ✨【死亡心跳增强】：引入 heavy 剧烈震动
            // 越到后面，震动越强、频率越快，压迫感拉满！
            // ==========================================
            if (this.bottle.status === 'stop' || this.bottle.status === 'prepare') {
                const vibrateInterval = 800 - (progress * 700); 
                if (now - this.lastVibrateTime > vibrateInterval) {
                    safeVibrate(progress > 0.6 ? 'heavy' : 'medium'); // 后期剧烈抖动时，使用 heavy 重震
                    this.lastVibrateTime = now;
                }
            }
        } else {
            block.hasCollapsed = true;
            CustomAnimation.to(block.instance.scale, {x: 0.01, y: 0.01, z: 0.01}, 0.2);
            
            if (!this.isGameOver && (this.bottle.status === 'stop' || this.bottle.status === 'prepare')) {
                this.isGameOver = true;
                audioManager.play('fall');
                safeVibrate('long'); 
                this.bottle.fall('straight'); 
                setTimeout(() => { if (this.callbacks && this.callbacks.showGameOverPage) this.callbacks.showGameOverPage() }, 1500);
            }
        }
    }

    this.blocks.forEach(block => {
      let deltaX = 0;
      let deltaZ = 0;
      const prevX = block.instance.position.x;
      const prevZ = block.instance.position.z;

      let shakeX = 0;
      let shakeZ = 0;
      if (block.isCollapsing && block.triggeredCollapse && !block.hasCollapsed) {
          shakeX = block.shakeOffsetX || 0;
          shakeZ = block.shakeOffsetZ || 0;
      }

      let newVirtualX = block.baseX;
      let newVirtualZ = block.baseZ;

      if (block.isMoving && !block.hasCollapsed) {
          const moveAxis = block.moveAxis;
          const basePos = moveAxis === 'x' ? block.baseX : block.baseZ;
          block.virtualPos = basePos + Math.sin(now * block.moveSpeed + block.moveOffset) * block.moveRange;
          if (moveAxis === 'x') newVirtualX = block.virtualPos;
          if (moveAxis === 'z') newVirtualZ = block.virtualPos;
      }

      if (!block.hasCollapsed) {
          block.instance.position.x = newVirtualX + shakeX;
          block.instance.position.z = newVirtualZ + shakeZ;
          
          deltaX = block.instance.position.x - prevX;
          deltaZ = block.instance.position.z - prevZ;

          if (block === currentStandingBlock && this.bottle && (this.bottle.status === 'stop' || this.bottle.status === 'prepare') && !this.isSliding) {
              this.bottle.obj.position.x += deltaX;
              this.bottle.obj.position.z += deltaZ;
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