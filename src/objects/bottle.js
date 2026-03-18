// src/objects/bottle.js
import { CustomAnimation } from '../../libs/animation'
import bottleConf from '../../confs/bottle-conf'
import blockConf from '../../confs/block-conf'
import { scene } from '../scene/index' 
import tail from './tail' 

const PRESS_TIME_THRESHOLD = 150 

class Bottle {
  constructor() {
    this.status = 'stop'
    this.velocity = { vx: 0, vy: 0, vz: 0 } 
    this.flyingTime = 0
    this.charge = 0 
    this.direction = 'x'
    this.lastDirection = 'x'
    this.distanceToTarget = 0.001 // 赋予初始安全值防崩溃
    
    this.currentBlock = null 
    this.currentBlockOrigY = 0
    this.currentPlaneY = 0
  }

  init() {
    const loader = new THREE.TextureLoader()
    const headTex = loader.load('res/images/head.png')
    const topTex = loader.load('res/images/top.png')
    const bottomTex = loader.load('res/images/bottom.png')

    const headMat = new THREE.MeshLambertMaterial({ map: headTex, color: 0xffffff })
    const topMat = new THREE.MeshLambertMaterial({ map: topTex, color: 0xffffff })
    const bottomMat = new THREE.MeshLambertMaterial({ map: bottomTex, color: 0xffffff })
    const pureWhiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff })

    const obj = this.obj = new THREE.Object3D()
    obj.position.set(bottleConf.initPosition.x, bottleConf.initPosition.y + 10, bottleConf.initPosition.z)

    this.directionWrapper = new THREE.Object3D()
    const bottle = this.bottle = new THREE.Object3D()

    bottle.position.y = 0.25 

    this.torsoGroup = new THREE.Object3D()
    this.torsoGroup.position.y = 2.0 

    this.head = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), headMat)
    this.head.position.y = 3.6 
    this.head.castShadow = true
    this.torsoGroup.add(this.head)

    this.body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 32), topMat)
    this.body.position.y = 1.2
    this.body.rotation.y = Math.PI 
    this.body.castShadow = true
    this.torsoGroup.add(this.body)

    this.armL = new THREE.Object3D()
    this.armL.position.set(-1.4, 2.0, 0) 
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.0, 16), topMat)
    armLMesh.position.y = -0.8
    armLMesh.castShadow = true
    this.armL.add(armLMesh)
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), pureWhiteMat)
    handL.position.y = -2.0 
    handL.castShadow = true
    this.armL.add(handL)
    this.torsoGroup.add(this.armL)

    this.armR = new THREE.Object3D()
    this.armR.position.set(1.4, 2.0, 0)
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.0, 16), topMat)
    armRMesh.position.y = -0.8
    armRMesh.castShadow = true
    this.armR.add(armRMesh)
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), pureWhiteMat)
    handR.position.y = -2.0
    handR.castShadow = true
    this.armR.add(handR)
    this.torsoGroup.add(this.armR)

    const createLeg = (xOffset) => {
      const hip = new THREE.Object3D()
      hip.position.set(xOffset, 2.0, 0) 
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.0, 16), bottomMat)
      legMesh.position.y = -1.0
      legMesh.castShadow = true
      hip.add(legMesh)

      const foot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.3), pureWhiteMat)
      foot.position.set(0, -2.0, -0.25) 
      foot.castShadow = true
      hip.add(foot)

      return hip
    }

    this.legL = createLeg(-0.6)
    this.legR = createLeg(0.6)

    bottle.add(this.torsoGroup)
    bottle.add(this.legL)
    bottle.add(this.legR)

    this.directionWrapper.add(bottle)
    obj.add(this.directionWrapper)
  }

  reset() {
    this.status = 'stop'
    this.flyingTime = 0
    this.charge = 0
    
    this.directionWrapper.rotation.set(0, -Math.PI / 2, 0) 
    this.bottle.rotation.set(0, 0, 0)
    
    this.torsoGroup.position.y = 2.0
    this.torsoGroup.rotation.set(0, 0, 0)
    
    this.body.scale.set(1, 1, 1)
    this.head.position.y = 3.6
    
    this.legL.position.y = 2.0
    this.legR.position.y = 2.0
    this.legL.scale.set(1, 1, 1)
    this.legR.scale.set(1, 1, 1)
    this.legL.rotation.set(0, 0, 0)
    this.legR.rotation.set(0, 0, 0)
    
    this.armL.rotation.set(0, 0, 0)
    this.armR.rotation.set(0, 0, 0)
    
    this.currentBlock = null
  }

  showUp() {
    CustomAnimation.to(this.obj.position, {
      x: bottleConf.initPosition.x,
      y: blockConf.height / 2,
      z: bottleConf.initPosition.z
    }, 0.5)
  }

  prepare(targetPos, currentBlock, currentPlaneY) {
    if (this.status !== 'stop') return
    this.status = 'prepare'
    this.charge = 0

    this.currentBlock = currentBlock
    this.currentPlaneY = currentPlaneY
    if (currentBlock) this.currentBlockOrigY = currentBlock.instance.position.y

    const dx = targetPos.x - this.obj.position.x
    const dz = targetPos.z - this.obj.position.z
    const targetRotationY = Math.atan2(-dx, -dz) 
    CustomAnimation.to(this.directionWrapper.rotation, { y: targetRotationY }, 0.2)
  }

  jump(pressTime, currentPlaneY, nextPlaneY, targetPos, onLanding) {
    if (this.status !== 'prepare') return
    this.flyingTime = 0
    this.onLanding = onLanding
    this.currentPlaneY = currentPlaneY
    this.nextPlaneY = nextPlaneY
    
    if (this.currentBlock) {
      this.currentBlock.instance.scale.y = 1
      this.currentBlock.instance.position.y = this.currentBlockOrigY
      this.obj.position.y = this.currentPlaneY 
      this.currentBlock = null
    }
    
    this.startPos = this.obj.position.clone()

    const dx = targetPos.x - this.startPos.x
    const dz = targetPos.z - this.startPos.z
    
    // 【防崩溃锁】：防止计算除以 0 导致 WebGL NaN 崩溃卡死
    this.distanceToTarget = Math.max(Math.sqrt(dx * dx + dz * dz), 0.001)

    if (pressTime < PRESS_TIME_THRESHOLD) {
      this.status = 'stop' 
      const tinyStep = 0.8
      CustomAnimation.to(this.obj.position, { 
        x: this.obj.position.x + (dx / this.distanceToTarget) * tinyStep,
        z: this.obj.position.z + (dz / this.distanceToTarget) * tinyStep
      }, 0.2)

      CustomAnimation.to(this.legL.rotation, { x: -0.4 }, 0.1)
      CustomAnimation.to(this.legR.rotation, { x: 0.4 }, 0.1)
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0.4 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: -0.4 }, 0.1)
      }, 100)
      
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: 0 }, 0.1)
        
        if (this.onLanding) {
          this.onLanding(true) 
          this.onLanding = null
        }
      }, 250)
      
      CustomAnimation.to(this.legL.scale, { x: 1, y: 1, z: 1 }, 0.1)
      CustomAnimation.to(this.legR.scale, { x: 1, y: 1, z: 1 }, 0.1)
      CustomAnimation.to(this.body.scale, { x: 1, y: 1, z: 1 }, 0.1)
      CustomAnimation.to(this.head.position, { y: 3.6 }, 0.1)
      CustomAnimation.to(this.legL.position, { y: 2.0 }, 0.1)
      CustomAnimation.to(this.legR.position, { y: 2.0 }, 0.1)
      CustomAnimation.to(this.torsoGroup.position, { y: 2.0 }, 0.1)
      CustomAnimation.to(this.torsoGroup.rotation, { x: 0 }, 0.1)
      CustomAnimation.to(this.armL.rotation, { x: 0 }, 0.1)
      CustomAnimation.to(this.armR.rotation, { x: 0 }, 0.1)
      return 
    }

    this.status = 'jump'
    
    // ==========================================
    // 【终极重构】：纯正线性物理体系！
    // 扣除了微调时间，保证速度绝对从 0 开始丝滑起步，彻底告别“断崖起飞”
    // ==========================================
    let effectivePressTime = Math.max(0, pressTime - PRESS_TIME_THRESHOLD)

    // 精调后的比例系数：让你按压 1 秒正好跳到屏幕中间的位置
    const JUMP_FACTOR = 0.00062 
    const totalScalarVelocity = effectivePressTime * JUMP_FACTOR 

    this.velocity.vx = (dx / this.distanceToTarget) * totalScalarVelocity
    this.velocity.vz = (dz / this.distanceToTarget) * totalScalarVelocity
    this.velocity.vy = 1.6
    
    CustomAnimation.to(this.legL.scale, { x: 1, y: 1, z: 1 }, 0.1)
    CustomAnimation.to(this.legR.scale, { x: 1, y: 1, z: 1 }, 0.1)
    CustomAnimation.to(this.body.scale, { x: 1, y: 1, z: 1 }, 0.1)
    CustomAnimation.to(this.head.position, { y: 3.6 }, 0.1)
    CustomAnimation.to(this.legL.position, { y: 2.0 }, 0.1)
    CustomAnimation.to(this.legR.position, { y: 2.0 }, 0.1)
    CustomAnimation.to(this.torsoGroup.position, { y: 2.0 }, 0.1)

    CustomAnimation.to(this.torsoGroup.rotation, { x: -0.4 }, 0.2) 
    CustomAnimation.to(this.legL.rotation, { x: -1.2 }, 0.2) 
    CustomAnimation.to(this.legR.rotation, { x: 1.2 }, 0.2)  
    CustomAnimation.to(this.armL.rotation, { x: -1.8 }, 0.2) 
    CustomAnimation.to(this.armR.rotation, { x: -1.8 }, 0.2)  
  }

  fall(fallType) {
    this.status = 'fall'
    if (fallType === 'tiltForward') {
      CustomAnimation.to(this.bottle.rotation, { x: -Math.PI / 2 }, 0.2)
      CustomAnimation.to(this.bottle.position, { y: 1.5 }, 0.2) 
      setTimeout(() => { CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4) }, 150)
    } else if (fallType === 'tiltBackward') {
      CustomAnimation.to(this.bottle.rotation, { x: Math.PI / 2 }, 0.2)
      CustomAnimation.to(this.bottle.position, { y: 1.5 }, 0.2) 
      setTimeout(() => { CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4) }, 150)
    } else {
      CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4)
    }
  }

  update() {
    if (this.status === 'prepare') {
      // 1. 修改蓄力数值上限（原为 2.0）
      // 如果你想让它“一直”压缩，可以将这个值改大，或者直接移除 Math.min
      this.charge = Math.min(this.charge + 0.008, 10.0) // 比如改为 10.0
      
      // 2. 修改视觉表现的上限（原为 1.2）
      // 这个值直接决定了模型压扁的极限。值越大，压得越扁。
      const visualCharge = Math.min(this.charge, 3.0) // 比如改为 3.0，甚至更大
      
      // --- 以下是应用缩放的逻辑 ---
      
      // 腿部压缩：原代码有 Math.max(..., 0.3) 限制最低高度
      // 如果想压得更狠，可以把 0.3 改小，例如 0.05
      const legScaleY = Math.max(1 - 0.45 * visualCharge, 0.05) 
      const legScaleXZ = Math.sqrt(1 / legScaleY)
      this.legL.scale.set(legScaleXZ, legScaleY, legScaleXZ)
      this.legR.scale.set(legScaleXZ, legScaleY, legScaleXZ)

      // 身体压缩：原代码有 Math.max(..., 0.6) 限制
      const bodyScaleY = Math.max(1 - 0.2 * visualCharge, 0.1) // 比如改为 0.1
      const bodyScaleXZ = Math.sqrt(1 / bodyScaleY)
      this.body.scale.set(bodyScaleXZ, bodyScaleY, bodyScaleXZ)

      const hipY = 2.0 * legScaleY
      this.legL.position.y = hipY
      this.legR.position.y = hipY
      this.torsoGroup.position.y = hipY
      
      const bodyHeightDiff = 2.4 * (1 - bodyScaleY)
      this.head.position.y = 3.6 - bodyHeightDiff

      this.torsoGroup.rotation.x = -0.3 * visualCharge 
      this.armL.rotation.x = -0.8 * visualCharge 
      this.armR.rotation.x = -0.8 * visualCharge

      if (this.currentBlock) {
        // 3. 修改格子（Block）的压缩上限（原为 0.85）
        // 如果希望格子也能一直压扁，把 0.85 改小
        const blockScaleY = Math.max(1 - 0.15 * visualCharge, 0.1) // 比如改为 0.1
        this.currentBlock.instance.scale.y = blockScaleY
        const h = blockConf.height
        const dy = (h - h * blockScaleY) / 2
        this.currentBlock.instance.position.y = this.currentBlockOrigY - dy
        this.obj.position.y = this.currentPlaneY - 2 * dy
      }

    } else if (this.status === 'jump') {
      this.flyingTime += 1
      const t = this.flyingTime
      const g = 0.12 
      
      this.obj.position.y = this.startPos.y + (this.velocity.vy * t - 0.5 * g * t * t)
      this.obj.position.x = this.startPos.x + this.velocity.vx * t
      this.obj.position.z = this.startPos.z + this.velocity.vz * t

      if (this.flyingTime % 2 === 0) {
        tail.createTail(scene.instance, this.obj.position, this.directionWrapper.rotation)
      }

      const currentDx = this.obj.position.x - this.startPos.x
      const currentDz = this.obj.position.z - this.startPos.z
      const distanceMoved = Math.sqrt(currentDx * currentDx + currentDz * currentDz)
      
      const targetY = (distanceMoved < this.distanceToTarget / 2) ? this.currentPlaneY : this.nextPlaneY
      const currentVelocityY = this.velocity.vy - g * t 

      if (currentVelocityY < 0 && this.obj.position.y <= targetY) {
        this.status = 'stop'
        this.obj.position.y = targetY 
        
        CustomAnimation.to(this.legL.scale, { x: 1.2, y: 0.6, z: 1.2 }, 0.05)
        CustomAnimation.to(this.legR.scale, { x: 1.2, y: 0.6, z: 1.2 }, 0.05)
        CustomAnimation.to(this.legL.position, { y: 1.2 }, 0.05)
        CustomAnimation.to(this.legR.position, { y: 1.2 }, 0.05)
        CustomAnimation.to(this.torsoGroup.position, { y: 1.2 }, 0.05)
        
        setTimeout(() => {
          CustomAnimation.to(this.legL.scale, { x: 1, y: 1, z: 1 }, 0.1)
          CustomAnimation.to(this.legR.scale, { x: 1, y: 1, z: 1 }, 0.1)
          CustomAnimation.to(this.legL.position, { y: 2.0 }, 0.1)
          CustomAnimation.to(this.legR.position, { y: 2.0 }, 0.1)
          CustomAnimation.to(this.torsoGroup.position, { y: 2.0 }, 0.1)
        }, 50)

        CustomAnimation.to(this.torsoGroup.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armR.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: 0 }, 0.1)
        
        if (this.onLanding) {
          this.onLanding(false) 
          this.onLanding = null
        }
      }
    }
  }
}
export default new Bottle()