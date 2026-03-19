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

// 安全调用微信震动 API
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

    this.standingBlock = null
    this.isFeverMode = false
    this.feverJumpsLeft = 0
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
    this.isFeverMode = false
    this.feverJumpsLeft = 0

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
    
    this.standingBlock = cylinderBlock

    this.bottle.reset() 
    this.bottle.obj.position.set(-15, 0, 0)
    this.bottle.showUp()

    this.scene.instance.add(ground.instance)
    this.scene.instance.add(this.bottle.obj)
    
    this.updateCamera()
  }

  bindTouchEvent() {
    wx.onTouchStart(() => {
      if (gameModel.getStage() !== 'game-page' || this.isGameOver || this.isSliding || this.isFeverMode) return 
      this.clearBonusTimer() 
      
      safeVibrate('light') 

      this.touchStartTime = Date.now()

      const currentIdx = this.blocks.indexOf(this.standingBlock)
      const currentBlock = this.blocks[currentIdx]
      const nextBlock = this.blocks[currentIdx + 1]
      if (!currentBlock || !nextBlock) return

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
      if (gameModel.getStage() !== 'game-page' || this.isGameOver || this.isSliding || this.isFeverMode) return
      
      if (this.chargeAudioTimer) { clearInterval(this.chargeAudioTimer); this.chargeAudioTimer = null }
      audioManager.stop('scale_intro') 
      audioManager.stop('scale_loop') 

      const touchEndTime = Date.now()
      const pressTime = touchEndTime - this.touchStartTime

      const currentIdx = this.blocks.indexOf(this.standingBlock)
      const currentBlock = this.blocks[currentIdx]
      const nextBlock = this.blocks[currentIdx + 1]
      if (!currentBlock || !nextBlock) return

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

  executeAutoJump() {
      if (this.feverJumpsLeft <= 0 || this.isGameOver) {
          this.isFeverMode = false;
          return;
      }
      
      const currentIdx = this.blocks.indexOf(this.standingBlock)
      const currentBlock = this.blocks[currentIdx]
      const nextBlock = this.blocks[currentIdx + 1]
      if (!currentBlock || !nextBlock) {
          this.isFeverMode = false;
          return;
      }
      
      const nextX = nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x;
      const nextZ = nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z;
      const targetPos = new THREE.Vector3(nextX, nextBlock.instance.position.y, nextZ); 
      
      const currentY = currentBlock.instance.position.y + blockConf.height / 2;
      const nextY = nextBlock.instance.position.y + blockConf.height / 2;
      
      this.bottle.prepare(targetPos, currentBlock, currentY);
      
      const dx = targetPos.x - this.bottle.obj.position.x;
      const dz = targetPos.z - this.bottle.obj.position.z;
      const distance = Math.max(Math.sqrt(dx*dx + dz*dz), 0.001);
      
      const pressTime = (distance / 0.01674) + 150; 
      
      this.bottle.jump(pressTime, currentY, nextY, targetPos, (isMicroStep) => {
          this.checkCollision(isMicroStep);
      });
      
      this.feverJumpsLeft--;
  }

  _checkStrictHit(block, dx, dz) {
    const margin = 0.5 
    if (block.type === 'cuboid') return Math.abs(dx) <= (block.width / 2 + margin) && Math.abs(dz) <= (block.width / 2 + margin)
    else return Math.sqrt(dx * dx + dz * dz) <= (block.width / 2 + margin)
  }

  checkCollision(isMicroStep = false) {
    const currentIdx = this.blocks.indexOf(this.standingBlock)
    const currentBlock = this.blocks[currentIdx]
    const nextBlock = this.blocks[currentIdx + 1]
    if (!currentBlock || !nextBlock) return

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

    const hitNext = (this._checkStrictHit(nextBlock, dxNext, dzNext) || this.isFeverMode) && !nextBlock.hasCollapsed;
    const hitCurr = (this._checkStrictHit(currentBlock, dxCurr, dzCurr) || this.isFeverMode) && !currentBlock.hasCollapsed;
    
    const distanceToNextCenter = Math.sqrt(dxNext * dxNext + dzNext * dzNext)
    const CENTER_RADIUS = Math.min(2.5, nextBlock.width / 3.5)

    if (hitNext) {
      if (isMicroStep) return;

      if (nextBlock.isIce && distanceToNextCenter >= CENTER_RADIUS && !this.isFeverMode) {
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

    let isPerfect = (!wasSliding && distanceToNextCenter < CENTER_RADIUS) || this.isFeverMode;
    let isBlindSnipe = false;

    if (this.isFeverMode) {
        this.bottle.obj.position.x = nextBlock.baseX;
        this.bottle.obj.position.z = nextBlock.baseZ;
    }

    if (nextBlock.isMirage && isPerfect && !this.isFeverMode) {
        const currentOpacity = Math.pow(Math.sin((Date.now() / 1000) * (Math.PI / 10) + nextBlock.mirageOffset), 2);
        if (currentOpacity < 0.20) { 
            isBlindSnipe = true;
        }
    }

    // 取消幻影实体化
    if (nextBlock.isMirage) {
        nextBlock.isMirage = false; 
        if (nextBlock.mirageMaterials) {
            for (let i = 0; i < nextBlock.mirageMaterials.length; i++) {
                nextBlock.mirageMaterials[i].opacity = 1;
                nextBlock.mirageMaterials[i].transparent = false;
            }
            nextBlock.mirageMaterials = null; // 解除引用，释放内存
        }
    }

    // ✨【安全清理】：吃星星或错失星星的内存防漏释放
    if (nextBlock.hasFeverItem) {
        nextBlock.hasFeverItem = false; 
        
        if (isPerfect && !this.isFeverMode) {
            if (nextBlock.feverOrb) {
                nextBlock.instance.remove(nextBlock.feverOrb); 
                nextBlock.feverOrb.geometry.dispose(); // 销毁废弃数据
                nextBlock.feverOrb.material.dispose(); // 销毁废弃数据
                nextBlock.feverOrb = null;
            }
            
            this.isFeverMode = true;
            this.feverJumpsLeft = 5; 
            safeVibrate('heavy');
            audioManager.play('combo8'); 

            for(let i = 0; i < 5; i++) {
                this.generateNextBlock(true);
            }
        } else if (!this.isFeverMode) {
            if (nextBlock.feverOrb) {
                CustomAnimation.to(nextBlock.feverOrb.scale, {x: 0.01, y: 0.01, z: 0.01}, 0.2);
                setTimeout(() => {
                    if (nextBlock && nextBlock.instance && nextBlock.feverOrb) {
                        nextBlock.instance.remove(nextBlock.feverOrb);
                        nextBlock.feverOrb.geometry.dispose(); // 延时彻底销毁
                        nextBlock.feverOrb.material.dispose(); // 延时彻底销毁
                        nextBlock.feverOrb = null;
                    }
                }, 200);
            }
        }
    }

    if (isBlindSnipe) {
      finalScore = baseScore * 5 
      gameModel.combo += 1
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName) 
      wave.createWave(this.scene.instance, nextBlock.instance.position)
      setTimeout(() => wave.createWave(this.scene.instance, nextBlock.instance.position), 150)
      safeVibrate('heavy') 
    } else if (isPerfect) {
      finalScore = baseScore * 2
      gameModel.combo += 1
      const comboName = `combo${Math.min(gameModel.combo, 8)}`
      audioManager.play(comboName)
      wave.createWave(this.scene.instance, nextBlock.instance.position)
      safeVibrate('medium') 
    } else {
      gameModel.combo = 0
      audioManager.play('success') 
    }

    if (nextBlock.isCollapsing && !isBlindSnipe && !this.isFeverMode) {
      safeVibrate('heavy'); 
    } else if (!isPerfect && !isBlindSnipe) {
      safeVibrate('light'); 
    }

    gameModel.addScore(finalScore)
    scoreText3d.showScore(this.scene.instance, finalScore, nextBlock.instance.position)
    particle.createDust(this.scene.instance, this.bottle.obj.position)
    
    this.successJump(currentBlock, nextBlock)
  }

  handleFall(currentBlock, nextBlock, dxNext, dzNext, dxCurr, dzCurr, hitNext, hitCurr, distanceToNextCenter) {
    this.isGameOver = true
    this.activeCollapsingBlock = null; 
    this.isSliding = false;
    this.isFeverMode = false;
    
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

  successJump(currentBlock, landedBlock) {
    this.stepCount++   
    this.standingBlock = landedBlock;

    const prevIdx = this.blocks.indexOf(landedBlock) - 1;
    const prevBlock = prevIdx >= 0 ? this.blocks[prevIdx] : null;
    if (prevBlock && prevBlock.isCollapsing && !prevBlock.hasCollapsed) {
        prevBlock.hasCollapsed = true;
        CustomAnimation.to(prevBlock.instance.scale, {x: 0.01, y: 0.01, z: 0.01}, 0.2);
    }

    if (this.activeCollapsingBlock && this.activeCollapsingBlock.hasCollapsed === false) {
        this.activeCollapsingBlock.shakeOffsetX = 0;
        this.activeCollapsingBlock.shakeOffsetZ = 0;
    }
    this.activeCollapsingBlock = null;

    if (this.isFeverMode) {
        if (this.feverJumpsLeft === 5) {
            setTimeout(() => { this.executeAutoJump(); }, 500); 
        } else if (this.feverJumpsLeft > 0) {
            setTimeout(() => { this.executeAutoJump(); }, 300); 
        } else {
            this.isFeverMode = false;
            this.generateNextBlock();
        }
    } else {
        this.generateNextBlock();
    }

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

  generateNextBlock(isFeverSpawn = false) {
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
    let isMirage = false;
    let spawnFever = false;

    // ✨ 暴走生成的方块保持原样，没有任何危险变异
    if (isFeverSpawn) {
        // 不应用任何危险属性
    } else if (gameModel.combo >= 3 && !this.isFeverMode) {
        // ✨【严格内存回收】：替换材质前务必 dispose()
        isMoving = true;
        newBlock.isMoving = true;
        newBlock.moveAxis = isXDirection ? 'z' : 'x';
        newBlock.moveSpeed = 0.001; 
        newBlock.moveRange = 4;
        newBlock.moveOffset = 0;
        
        const buffMat = new THREE.MeshStandardMaterial({ color: 0xF3E5AB, roughness: 0.85, metalness: 0 }); 
        newBlock.instance.traverse(c => { 
            if (c.isMesh) {
                if (c.material) c.material.dispose(); // 防止美拉德原材质泄露
                c.material = buffMat; 
            }
        });
    } else {
        const difficultyScale = Math.min((this.stepCount - 10) / 100, 0.4); 
        
        if (!this.isFeverMode && Math.random() < 0.05) {
            spawnFever = true;
        }

        if (this.stepCount > 8)  isIce = Math.random() < (0.25 + difficultyScale * 0.5); 
        if (this.stepCount > 15) isMoving = Math.random() < (0.20 + difficultyScale * 0.5);    
        if (this.stepCount > 20) isCollapsing = Math.random() < (0.15 + difficultyScale * 0.4); 
        if (this.stepCount > 25) isMirage = Math.random() < (0.15 + difficultyScale * 0.4); 

        if (spawnFever) {
            newBlock.hasFeverItem = true;
            const orbGeom = new THREE.OctahedronGeometry(1.8, 0); 
            const orbMat = new THREE.MeshBasicMaterial({ color: 0xFFEAA7, wireframe: false }); 
            const orb = new THREE.Mesh(orbGeom, orbMat);
            orb.position.y = blockConf.height / 2 + 3;
            newBlock.feverOrb = orb;
            newBlock.instance.add(orb);
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
                if (child.isMesh) {
                    if (child.material) child.material.dispose(); // 防止原材质泄漏
                    child.material = iceMat;
                }
            });
        }
        
        // ✨【消除 CPU 狂暴发热】：预存数组，告别每帧 traverse
        if (isMirage) {
            newBlock.isMirage = true;
            newBlock.mirageOffset = Math.random() * Math.PI * 2; 
            newBlock.mirageMaterials = []; 
            newBlock.instance.traverse(c => {
                if (c.isMesh && c.material) {
                    const newMat = c.material.clone();
                    newMat.transparent = true;
                    c.material.dispose(); // 废弃旧材质
                    c.material = newMat;
                    newBlock.mirageMaterials.push(newMat);
                }
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
  
    const visibleWidth = frustumSize / cam.zoom; 
    const visibleHeight = (frustumSize * aspect) / cam.zoom;
  
    const camX = cam.position.x
    const camZ = cam.position.z
  
    this.blocks = this.blocks.filter((block, index) => {
      // 绝对免疫回收锁，保障神罗天征生成的 5 个方块绝对存活
      if (index >= this.blocks.length - 10) return true;

      const pos = block.instance.position
      const inView =
        Math.abs(pos.x - camX) < visibleWidth * 2.5 &&
        Math.abs(pos.z - camZ) < visibleHeight * 2.5
  
      if (!inView) {
        this.scene.instance.remove(block.instance)
        
        // ✨【双重内存保险】：如果方块移除了但还有残留数组，彻底清空
        if (block.mirageMaterials) {
            block.mirageMaterials.forEach(m => m.dispose());
            block.mirageMaterials = null;
        }

        if (block.dispose) block.dispose()
        return false
      }
      return true
    })
  }

  updateCamera() {
    const currentIdx = this.blocks.indexOf(this.standingBlock)
    if (currentIdx < 0) return
    const currentBlock = this.blocks[currentIdx]
    const nextBlock = this.blocks[currentIdx + 1] 
    
    if (!currentBlock || !nextBlock) return
    
    const lastX = currentBlock.baseX !== undefined ? currentBlock.baseX : currentBlock.instance.position.x;
    const lastZ = currentBlock.baseZ !== undefined ? currentBlock.baseZ : currentBlock.instance.position.z;
    const currX = nextBlock.baseX !== undefined ? nextBlock.baseX : nextBlock.instance.position.x;
    const currZ = nextBlock.baseZ !== undefined ? nextBlock.baseZ : nextBlock.instance.position.z;
    const lastY = currentBlock.instance.position.y;
    const currY = nextBlock.instance.position.y;

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
        targetZoom = this.isFeverMode ? 0.50 : 0.80; 
    }

    if (camera && camera.instance && Math.abs(camera.instance.zoom - targetZoom) > 0.001) {
        camera.instance.zoom += (targetZoom - camera.instance.zoom) * (this.isFeverMode ? 0.20 : 0.08);
        camera.instance.updateProjectionMatrix();
    }

    const now = Date.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    const currentIdx = this.blocks.indexOf(this.standingBlock);
    let currentStandingBlock = this.blocks[currentIdx];
    if (this.isSliding && this.blocks[currentIdx + 1]) {
        currentStandingBlock = this.blocks[currentIdx + 1];
    }

    if (!this.isGameOver && currentStandingBlock && currentStandingBlock.isCollapsing && !currentStandingBlock.triggeredCollapse && this.bottle.status === 'stop' && !this.isFeverMode) {
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

            if (this.bottle.status === 'stop' || this.bottle.status === 'prepare') {
                const vibrateInterval = 800 - (progress * 700); 
                if (now - this.lastVibrateTime > vibrateInterval) {
                    safeVibrate(progress > 0.6 ? 'heavy' : 'medium'); 
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

      // ✨【丝滑渲染】：彻底告别每帧 Traverse，直调材质缓存数组
      if (block.isMirage && !block.hasCollapsed && block.mirageMaterials) {
          const opacity = Math.pow(Math.sin((now / 1000) * (Math.PI / 10) + block.mirageOffset), 2);
          for (let i = 0; i < block.mirageMaterials.length; i++) {
              block.mirageMaterials[i].opacity = opacity;
          }
      }

      if (block.hasFeverItem && block.feverOrb && !block.hasCollapsed) {
          block.feverOrb.rotation.y += 0.05;
          block.feverOrb.rotation.z += 0.02;
          block.feverOrb.position.y = (blockConf.height / 2) + 3 + Math.sin(now * 0.005) * 0.5;
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