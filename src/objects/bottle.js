// src/objects/bottle.js
import { CustomAnimation } from '../../libs/animation'
import bottleConf from '../../confs/bottle-conf'
import blockConf from '../../confs/block-conf'
import { scene } from '../scene/index' 
import tail from './tail' 

const PRESS_TIME_THRESHOLD = 250 // 轻点屏幕阈值，保留微调行走功能

class Bottle {
  constructor() {
    this.status = 'stop'
    this.velocity = { vx: 0, vy: 0, vz: 0 } 
    this.flyingTime = 0
    this.charge = 0 
    this.direction = 'x'
    this.lastDirection = 'x'
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

    // 添加手掌与手臂
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

    // 添加大脚掌（运动鞋）与腿部
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
    
    // 重置所有缩放形变
    this.body.scale.set(1, 1, 1)
    this.head.position.y = 3.6
    
    this.legL.position.y = 2.0
    this.legR.position.y = 2.0
    this.legL.scale.y = 1
    this.legR.scale.y = 1
    this.legL.rotation.set(0, 0, 0)
    this.legR.rotation.set(0, 0, 0)
    
    this.armL.rotation.set(0, 0, 0)
    this.armR.rotation.set(0, 0, 0)
  }

  showUp() {
    CustomAnimation.to(this.obj.position, {
      x: bottleConf.initPosition.x,
      y: blockConf.height / 2,
      z: bottleConf.initPosition.z
    }, 0.5)
  }

  prepare(targetPos) {
    if (this.status !== 'stop') return
    this.status = 'prepare'
    this.charge = 0

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
    this.startPos = this.obj.position.clone()

    const dx = targetPos.x - this.startPos.x
    const dz = targetPos.z - this.startPos.z
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz)

    // ==========================================
    // 保留：轻点微调行走功能 (不变)
    // ==========================================
    if (pressTime < PRESS_TIME_THRESHOLD) {
      this.status = 'stop' 
      const tinyStep = 0.8
      if (distanceToTarget > 0.001) {
        CustomAnimation.to(this.obj.position, { 
          x: this.obj.position.x + (dx / distanceToTarget) * tinyStep,
          z: this.obj.position.z + (dz / distanceToTarget) * tinyStep
        }, 0.2)
      }

      CustomAnimation.to(this.legL.rotation, { x: -0.4 }, 0.1)
      CustomAnimation.to(this.legR.rotation, { x: 0.4 }, 0.1)
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0.4 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: -0.4 }, 0.1)
      }, 100)
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: 0 }, 0.1)
      }, 200)
      
      // 中断蓄力时，平滑恢复所有形变
      CustomAnimation.to(this.legL.scale, { y: 1 }, 0.1)
      CustomAnimation.to(this.legR.scale, { y: 1 }, 0.1)
      CustomAnimation.to(this.body.scale, { y: 1 }, 0.1)
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
    
    // 超越 2s 爆发系数 (保留上一版的爽感)
    let finalPressTime = pressTime
    if (pressTime > 500) {
      finalPressTime = pressTime * 1.5
    } else if (pressTime > 1000) {
      finalPressTime = pressTime * 3.5
    }

    const JUMP_FACTOR = 0.00025 
    const totalScalarDistance = finalPressTime * JUMP_FACTOR 

    this.velocity.vx = (dx / distanceToTarget) * totalScalarDistance
    this.velocity.vz = (dz / distanceToTarget) * totalScalarDistance
    this.velocity.vy = 1.6 
    
    // 起跳瞬间：所有蓄力形变如弹簧般瞬间释放归位
    CustomAnimation.to(this.legL.scale, { y: 1 }, 0.1)
    CustomAnimation.to(this.legR.scale, { y: 1 }, 0.1)
    CustomAnimation.to(this.body.scale, { y: 1 }, 0.1)
    CustomAnimation.to(this.head.position, { y: 3.6 }, 0.1)
    CustomAnimation.to(this.legL.position, { y: 2.0 }, 0.1)
    CustomAnimation.to(this.legR.position, { y: 2.0 }, 0.1)
    CustomAnimation.to(this.torsoGroup.position, { y: 2.0 }, 0.1)

    // ==========================================
    // 夸张的空中跳远姿态：大摆臂与猛跨栏
    // ==========================================
    CustomAnimation.to(this.torsoGroup.rotation, { x: -0.4 }, 0.2) // 身体剧烈前倾
    CustomAnimation.to(this.legL.rotation, { x: -1.2 }, 0.2) // 左腿高抬跨栏
    CustomAnimation.to(this.legR.rotation, { x: 1.2 }, 0.2)  // 右腿死死向后拉伸
    // 双臂向后方（反方向）甩动到极限
    CustomAnimation.to(this.armL.rotation, { x: -1.8 }, 0.2) 
    CustomAnimation.to(this.armR.rotation, { x: -1.8 }, 0.2)  
  }

  fall(fallType) {
    this.status = 'fall'
    if (fallType === 'tiltForward') {
      CustomAnimation.to(this.bottle.rotation, { x: -Math.PI / 2 }, 0.2)
      setTimeout(() => { CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4) }, 150)
    } else if (fallType === 'tiltBackward') {
      CustomAnimation.to(this.bottle.rotation, { x: Math.PI / 2 }, 0.2)
      setTimeout(() => { CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4) }, 150)
    } else {
      CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4)
    }
  }

  update() {
    if (this.status === 'prepare') {
      this.charge = Math.min(this.charge + 0.008, 2.0)
      const visualCharge = Math.min(this.charge, 1.2) // 限制最大视觉形变，防止穿模
      
      // ==========================================
      // 核心物理动画 1：联动压缩 (Squash) - 还原原版手感
      // 腿部压缩的同时，身体(圆柱体)也发生果冻般地变扁！
      // ==========================================
      const legScaleY = Math.max(1 - 0.45 * visualCharge, 0.3) 
      this.legL.scale.y = legScaleY
      this.legR.scale.y = legScaleY

      // 身体压缩 (变矮变粗的视觉错觉)
      const bodyScaleY = Math.max(1 - 0.2 * visualCharge, 0.6)
      this.body.scale.y = bodyScaleY

      // 计算并下调各个关节的基准高度，确保双脚死死贴在方块上
      const hipY = 2.0 * legScaleY
      this.legL.position.y = hipY
      this.legR.position.y = hipY
      this.torsoGroup.position.y = hipY
      
      // 身体变矮后，头部需要额外向下偏移以保持连接
      const bodyHeightDiff = 2.4 * (1 - bodyScaleY)
      this.head.position.y = 3.6 - bodyHeightDiff

      // 身体前倾与手臂后摆
      this.torsoGroup.rotation.x = -0.3 * visualCharge 
      this.armL.rotation.x = -0.8 * visualCharge 
      this.armR.rotation.x = -0.8 * visualCharge

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
      
      const targetY = (distanceMoved < 4) ? this.currentPlaneY : this.nextPlaneY
      const currentVelocityY = this.velocity.vy - g * t 

      // ==========================================
      // 核心物理动画 2：重力落地缓冲 (Impact Bounce)
      // 极其完美地复刻了原版 game.js 的吸附反馈！
      // ==========================================
      if (currentVelocityY < 0 && this.obj.position.y <= targetY) {
        this.status = 'stop'
        this.obj.position.y = targetY 
        
        // 第一阶段：落地的瞬间由于惯性产生形变（腿弯曲，重心下压）
        CustomAnimation.to(this.legL.scale, { y: 0.6 }, 0.05)
        CustomAnimation.to(this.legR.scale, { y: 0.6 }, 0.05)
        CustomAnimation.to(this.torsoGroup.position, { y: 1.2 }, 0.05)
        
        // 第二阶段：快速弹簧回弹恢复原状
        setTimeout(() => {
          CustomAnimation.to(this.legL.scale, { y: 1 }, 0.1)
          CustomAnimation.to(this.legR.scale, { y: 1 }, 0.1)
          CustomAnimation.to(this.torsoGroup.position, { y: 2.0 }, 0.1)
        }, 50)

        // 空中姿态迅速回正
        CustomAnimation.to(this.torsoGroup.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armR.rotation, { x: 0 }, 0.1)
        
        // 双腿迅速收回并拢
        CustomAnimation.to(this.legL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: 0 }, 0.1)
        
        if (this.onLanding) {
          this.onLanding()
          this.onLanding = null
        }
      }
    }
  }
}
export default new Bottle()