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
    this.distanceToTarget = 0.001 
    
    this.currentBlock = null 
    this.currentBlockOrigY = 0
    this.currentPlaneY = 0

    this.baseScale = 1.35 
  }

  init() {
    // ==========================================
    // 【核心视觉】：美拉德高级盲盒玩偶 (Maillard Soft Doll)
    // ==========================================

    // 方案二：京都木棉
    // 特点：非常有故事感，踩在“自然系”格子上像在散步，踩在“金属系”格子上像艺术潮玩。
    const cHead  = 0xFFFDF0; // 奶油白（未染色原棉的颜色）
    const cBody  = 0x2F3E55; // 深藏青（原色单宁夹克）
    const cArm   = 0x1A2A40; // 同上
    const cLeg   = 0xE9E4D4; // 燕麦卡其（重磅斜纹裤）
    const cFoot  = 0x7A5C4D; // 巧克力棕（复古手工皮鞋）
    const cBlush = 0xECB390; // 杏橘色（透出一种健康、阳光的穿搭氛围）

    const matParams = { roughness: 0.5, metalness: 0.0 }
    const matHead = new THREE.MeshStandardMaterial({ color: cHead, ...matParams })
    const matBody = new THREE.MeshStandardMaterial({ color: cBody, oughness: 0.5, metalness: 0.1 })
    const matArm  = new THREE.MeshStandardMaterial({ color: cArm,  ...matParams })
    const matLeg  = new THREE.MeshStandardMaterial({ color: cLeg,  ...matParams })
    const matFoot = new THREE.MeshStandardMaterial({ color: cFoot, roughness: 0.2, metalness: 0.4 })
    const matEye  = new THREE.MeshStandardMaterial({ color: cFoot, roughness: 0.3, metalness: 0.2 })
    const matBlush = new THREE.MeshStandardMaterial({ color: cBlush, roughness: 0.8, metalness: 0 })

    const createSmoothBone = (rTop, rBot, h, mat) => {
      const group = new THREE.Group()
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 32), mat)
      cyl.castShadow = true
      
      const topSph = new THREE.Mesh(new THREE.SphereGeometry(rTop, 32, 16), mat)
      topSph.position.y = h / 2
      topSph.castShadow = true
      
      const botSph = new THREE.Mesh(new THREE.SphereGeometry(rBot, 32, 16), mat)
      botSph.position.y = -h / 2
      botSph.castShadow = true
      
      group.add(cyl, topSph, botSph)
      return group
    }

    const obj = this.obj = new THREE.Object3D()
    obj.position.set(bottleConf.initPosition.x, bottleConf.initPosition.y + 10, bottleConf.initPosition.z)

    // ==========================================
    // ✨【光影修复】：锁死辅光角度，消除全屏高亮 Bug
    // ==========================================
    const dollFillLight = new THREE.DirectionalLight(0xfff0e6, 0.4)
    dollFillLight.position.set(3, 5, 4)
    obj.add(dollFillLight)
    // 关键修复：把 Target 也挂载到本体上，确保照射相对角度永远不变！
    obj.add(dollFillLight.target) 

    this.directionWrapper = new THREE.Object3D()
    const bottle = this.bottle = new THREE.Object3D()

    bottle.position.y = 0 
    bottle.scale.set(this.baseScale, this.baseScale, this.baseScale)

    this.torsoGroup = new THREE.Object3D()
    this.torsoGroup.position.y = 1.6 

    // ------------------------------------------
    // 头部 
    // ------------------------------------------
    this.headGroup = new THREE.Group()
    
    const headGeom = new THREE.SphereGeometry(1.45, 32, 32)
    headGeom.scale(1.1, 0.9, 1.1) 
    this.head = new THREE.Mesh(headGeom, matHead)
    this.head.castShadow = true
    this.headGroup.add(this.head)

    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16)
    const eyeL = new THREE.Mesh(eyeGeom, matEye)
    eyeL.position.set(-0.45, 0, -1.38)
    const eyeR = new THREE.Mesh(eyeGeom, matEye)
    eyeR.position.set(0.45, 0, -1.38)
    this.headGroup.add(eyeL, eyeR)

    const blushGeom = new THREE.SphereGeometry(0.2, 16, 16)
    blushGeom.scale(1.0, 0.5, 0.2) 
    const blushL = new THREE.Mesh(blushGeom, matBlush)
    blushL.position.set(-0.8, -0.2, -1.25)
    blushL.rotation.z = 0.2
    const blushR = new THREE.Mesh(blushGeom, matBlush)
    blushR.position.set(0.8, -0.2, -1.25)
    blushR.rotation.z = -0.2
    this.headGroup.add(blushL, blushR)

    this.headGroup.position.y = 3.6
    this.torsoGroup.add(this.headGroup)

    // ------------------------------------------
    // 身体 
    // ------------------------------------------
    this.body = createSmoothBone(1.05, 0.75, 2.0, matBody)
    this.body.position.y = 1.2
    this.torsoGroup.add(this.body)

    // ------------------------------------------
    // 双臂
    // ------------------------------------------
    this.armL = new THREE.Object3D()
    this.armL.position.set(-1.4, 2.0, 0) 
    const armLInside = createSmoothBone(0.28, 0.22, 1.2, matArm)
    armLInside.position.y = -0.7
    armLInside.rotation.z = -0.15 
    this.armL.add(armLInside)
    
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), matArm)
    handL.position.set(-0.15, -1.4, 0) 
    handL.castShadow = true
    this.armL.add(handL)
    this.torsoGroup.add(this.armL)

    this.armR = new THREE.Object3D()
    this.armR.position.set(1.4, 2.0, 0)
    const armRInside = createSmoothBone(0.28, 0.22, 1.2, matArm)
    armRInside.position.y = -0.7
    armRInside.rotation.z = 0.15 
    this.armR.add(armRInside)
    
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), matArm)
    handR.position.set(0.15, -1.4, 0)
    handR.castShadow = true
    this.armR.add(handR)
    this.torsoGroup.add(this.armR)

    // ------------------------------------------
    // 腿部与脚丫
    // ------------------------------------------
    const createLeg = (xOffset) => {
      const hip = new THREE.Object3D()
      hip.position.set(xOffset, 1.6, 0) 
      
      const legInside = createSmoothBone(0.35, 0.25, 1.2, matLeg)
      legInside.position.y = -0.7
      legInside.rotation.x = 0.05 
      hip.add(legInside)

      const footGeom = new THREE.SphereGeometry(0.45, 16, 16)
      footGeom.scale(1.0, 0.45, 1.4) 
      const foot = new THREE.Mesh(footGeom, matFoot)
      foot.position.set(0, -1.4, -0.2) 
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
    
    this.torsoGroup.position.y = 1.6 
    this.torsoGroup.rotation.set(0, 0, 0)
    
    this.body.scale.set(1, 1, 1)
    this.headGroup.position.y = 3.6
    
    this.legL.position.y = 1.6 
    this.legR.position.y = 1.6 
    this.legL.scale.set(1, 1, 1)
    this.legR.scale.set(1, 1, 1)
    this.legL.rotation.set(0, 0, 0)
    this.legR.rotation.set(0, 0, 0)
    
    this.armL.rotation.set(0, 0, 0)
    this.armR.rotation.set(0, 0, 0)
    
    this.bottle.scale.set(this.baseScale, this.baseScale, this.baseScale)
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
      CustomAnimation.to(this.armL.rotation, { x: 0.4 }, 0.1)
      CustomAnimation.to(this.armR.rotation, { x: -0.4 }, 0.1)
      
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0.4 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: -0.4 }, 0.1)
        CustomAnimation.to(this.armL.rotation, { x: -0.4 }, 0.1)
        CustomAnimation.to(this.armR.rotation, { x: 0.4 }, 0.1)
      }, 100)
      
      setTimeout(() => {
        CustomAnimation.to(this.legL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.legR.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armL.rotation, { x: 0 }, 0.1)
        CustomAnimation.to(this.armR.rotation, { x: 0 }, 0.1)
        if (this.onLanding) {
          this.onLanding(true) 
          this.onLanding = null
        }
      }, 250)
      
      this._resetBodyParts(0.1);
      CustomAnimation.to(this.bottle.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale }, 0.1)
      return 
    }

    this.status = 'jump'
    
    let effectivePressTime = Math.max(0, pressTime - PRESS_TIME_THRESHOLD)
    const JUMP_FACTOR = 0.00102
    const totalScalarVelocity = effectivePressTime * JUMP_FACTOR 

    this.velocity.vx = (dx / this.distanceToTarget) * totalScalarVelocity
    this.velocity.vz = (dz / this.distanceToTarget) * totalScalarVelocity
    this.velocity.vy = 1.6
    
    this._resetBodyParts(0.1);
    CustomAnimation.to(this.bottle.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale }, 0.1)

    CustomAnimation.to(this.torsoGroup.rotation, { x: -0.2 }, 0.1) 
    CustomAnimation.to(this.armL.rotation, { x: -1.8 }, 0.1) 
    CustomAnimation.to(this.armR.rotation, { x: 0.8 }, 0.1)  
    CustomAnimation.to(this.legL.rotation, { x: -1.2 }, 0.1) 
    CustomAnimation.to(this.legR.rotation, { x: 1.2 }, 0.1) 
  }

  _resetBodyParts(duration) {
    CustomAnimation.to(this.legL.scale, { x: 1, y: 1, z: 1 }, duration)
    CustomAnimation.to(this.legR.scale, { x: 1, y: 1, z: 1 }, duration)
    CustomAnimation.to(this.body.scale, { x: 1, y: 1, z: 1 }, duration)
    CustomAnimation.to(this.headGroup.position, { y: 3.6 }, duration)
    CustomAnimation.to(this.legL.position, { y: 1.6 }, duration) 
    CustomAnimation.to(this.legR.position, { y: 1.6 }, duration)
    CustomAnimation.to(this.torsoGroup.position, { y: 1.6 }, duration)
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
      this.charge = Math.min(this.charge + 0.012, 20.0) 
      
      const charCharge = Math.min(this.charge, 0.9) 
      
      // ==========================================
      // 【终极物理优化】：取消全局压扁！
      // 只压缩腿部，同时让上半身保持圆润，随着腿部下沉！
      // ==========================================
      const squashY = Math.max(1 - 0.45 * charCharge, 0.4) 
      const stretchXZ = Math.sqrt(1 / squashY)

      // 锁定全局放大系数，严禁全身变形！
      this.bottle.scale.set(this.baseScale, this.baseScale, this.baseScale)

      // 仅仅压缩双腿（模拟屈膝受力）
      this.legL.scale.set(stretchXZ, squashY, stretchXZ)
      this.legR.scale.set(stretchXZ, squashY, stretchXZ)

      // 精确的脚底锚定数学：
      // 脚底在骨盆(Y=1.6)下方的距离正好是 -1.4。腿部被压缩时，为了保证脚底板不悬空，必须整体下沉。
      const dropY = 1.4 * (1 - squashY)
      const newY = 1.6 - dropY

      // 将腿部和完整的上半身(头胸手)一起平移下沉
      this.legL.position.y = newY
      this.legR.position.y = newY
      this.torsoGroup.position.y = newY

      // 身体前倾和手臂蓄力后摆
      this.torsoGroup.rotation.x = -0.05 - (0.4 * charCharge)
      this.armL.rotation.x = -0.8 * charCharge 
      this.armR.rotation.x = -0.8 * charCharge 

      if (this.currentBlock) {
        const blockScaleY = Math.max(1 - 0.15 * this.charge, 0.2)
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

      // if (this.flyingTime % 2 === 0) {
      //   tail.createTail(scene.instance, this.obj.position, this.directionWrapper.rotation)
      // }

      const currentDx = this.obj.position.x - this.startPos.x
      const currentDz = this.obj.position.z - this.startPos.z
      const distanceMoved = Math.sqrt(currentDx * currentDx + currentDz * currentDz)
      
      const targetY = (distanceMoved < this.distanceToTarget / 2) ? this.currentPlaneY : this.nextPlaneY
      const currentVelocityY = this.velocity.vy - g * t 

      if (currentVelocityY < 0 && this.obj.position.y <= targetY) {
        this.status = 'stop'
        this.obj.position.y = targetY 
        
        // 落地时短暂的全局果冻 Q 弹缓冲，因为极其短暂（50ms），只会增加可爱感
        CustomAnimation.to(this.bottle.scale, { x: 1.2 * this.baseScale, y: 0.6 * this.baseScale, z: 1.2 * this.baseScale }, 0.05)
        setTimeout(() => {
          CustomAnimation.to(this.bottle.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale }, 0.1)
        }, 50)

        CustomAnimation.to(this.torsoGroup.rotation, { x: -0.05 }, 0.1)
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