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
    
    // ✨ 核心修复一：精确计算并抵消脚底黑边的物理膨胀厚度
    // 脚的原始半径 0.45 * 缩放倍率 1.35 * 黑边膨胀系数 ≈ 0.28
    this.baseYOffset = 0.28 
  }

  init() {
    // ==========================================
    // ✨ 【终极视觉统一】：纯净 2D 手绘火柴人材质重构
    // ==========================================

    // 1. 废弃所有受光照影响的 Standard 材质，改用纯粹的 Basic 材质
    const matWhite = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const matBlack = new THREE.MeshBasicMaterial({ color: 0x1A1A1A });
    
    // 2. 核心灵魂：背面渲染的粗黑边框材质
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1A1A1A, side: THREE.BackSide });

    // 映射回原代码的变量名，确保不报任何 undefined 错误
    const matHead = matWhite;
    const matBody = matWhite;
    const matArm  = matWhite;
    const matLeg  = matWhite;
    const matFoot = matWhite;
    const matEye  = matBlack; 
    const matBlush = matWhite; 

    // ✨ 智能描边生成器：动态计算各个几何体的膨胀比例，保持黑边粗细均匀
    const addOutline = (mesh, type, radius, height) => {
        const thickness = 0.20; // 描边粗细
        const outline = new THREE.Mesh(mesh.geometry, outlineMat);
        
        if (type === 'sphere') {
            const scale = (radius + thickness) / radius;
            outline.scale.setScalar(scale);
        } else if (type === 'cylinder') {
            // 圆柱体只膨胀侧面，上下底面不膨胀，以免在关节处刺穿
            const scaleXZ = (radius + thickness) / radius;
            outline.scale.set(scaleXZ, 1.0, scaleXZ);
        }
        mesh.add(outline);
    }

    const createSmoothBone = (rTop, rBot, h, mat) => {
      const group = new THREE.Group()
      
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 32), mat)
      cyl.castShadow = true
      addOutline(cyl, 'cylinder', Math.max(rTop, rBot), h) // 为圆柱加黑边
      
      const topSph = new THREE.Mesh(new THREE.SphereGeometry(rTop, 32, 16), mat)
      topSph.position.y = h / 2
      topSph.castShadow = true
      addOutline(topSph, 'sphere', rTop) // 为顶部关节加黑边
      
      const botSph = new THREE.Mesh(new THREE.SphereGeometry(rBot, 32, 16), mat)
      botSph.position.y = -h / 2
      botSph.castShadow = true
      addOutline(botSph, 'sphere', rBot) // 为底部关节加黑边
      
      group.add(cyl, topSph, botSph)
      return group
    }

    const obj = this.obj = new THREE.Object3D()
    obj.position.set(bottleConf.initPosition.x, bottleConf.initPosition.y + 10, bottleConf.initPosition.z)

    // 灯光保留：虽然材质不受光照影响，但需要灯光来给地面投射黑色的火柴人影子
    const dollFillLight = new THREE.DirectionalLight(0xfff0e6, 0.4)
    dollFillLight.position.set(3, 5, 4)
    obj.add(dollFillLight)
    obj.add(dollFillLight.target) 

    this.directionWrapper = new THREE.Object3D()
    const bottle = this.bottle = new THREE.Object3D()

    // ✨ 核心修复二：初始加载时，将火柴人整体拔高一个“脚底黑边”的厚度
    bottle.position.y = this.baseYOffset 
    bottle.scale.set(this.baseScale, this.baseScale, this.baseScale)

    this.torsoGroup = new THREE.Object3D()
    this.torsoGroup.position.y = 1.6 

    // ------------------------------------------
    // 头部 (保持原比例)
    // ------------------------------------------
    this.headGroup = new THREE.Group()
    
    const headGeom = new THREE.SphereGeometry(1.45, 32, 32)
    headGeom.scale(1.1, 0.9, 1.1) 
    this.head = new THREE.Mesh(headGeom, matHead)
    this.head.castShadow = true
    
    // 头部的椭球体手动计算描边比例
    const headOutline = new THREE.Mesh(headGeom, outlineMat);
    const ht = 0.20;
    headOutline.scale.set((1.45*1.1+ht)/(1.45*1.1), (1.45*0.9+ht)/(1.45*0.9), (1.45*1.1+ht)/(1.45*1.1));
    this.head.add(headOutline);
    
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
    // 身体 (保持原比例)
    // ------------------------------------------
    this.body = createSmoothBone(1.05, 0.75, 2.0, matBody)
    this.body.position.y = 1.2
    this.torsoGroup.add(this.body)

    // ------------------------------------------
    // 双臂 (保持原比例)
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
    addOutline(handL, 'sphere', 0.32) // 手掌黑边
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
    addOutline(handR, 'sphere', 0.32) // 手掌黑边
    this.armR.add(handR)
    this.torsoGroup.add(this.armR)

    // ------------------------------------------
    // 腿部与脚丫 (保持原比例)
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
      
      // 脚底板的椭球体手动计算描边比例
      const footOutline = new THREE.Mesh(footGeom, outlineMat);
      const ft = 0.20;
      footOutline.scale.set((0.45*1.0+ft)/(0.45*1.0), (0.45*0.45+ft)/(0.45*0.45), (0.45*1.4+ft)/(0.45*1.4));
      foot.add(footOutline);

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

  // ==========================================
  // 下方所有的核心动画和位移逻辑【100% 保持不动】
  // ==========================================

  reset() {
    this.status = 'stop'
    this.flyingTime = 0
    this.charge = 0
    
    this.directionWrapper.rotation.set(0, -Math.PI / 2, 0) 
    this.bottle.rotation.set(0, 0, 0)
    
    // ✨ 核心修复三：填补原版生命周期漏洞！
    // 必须强制归位，否则跌落动画设置的 y: 1.5 缓存会残留到新的一局！
    this.bottle.position.set(0, this.baseYOffset, 0) 
    
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
    const JUMP_FACTOR = 0.00152
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
      
      const squashY = Math.max(1 - 0.45 * charCharge, 0.4) 
      const stretchXZ = Math.sqrt(1 / squashY)

      this.bottle.scale.set(this.baseScale, this.baseScale, this.baseScale)

      this.legL.scale.set(stretchXZ, squashY, stretchXZ)
      this.legR.scale.set(stretchXZ, squashY, stretchXZ)

      const dropY = 1.4 * (1 - squashY)
      const newY = 1.6 - dropY

      this.legL.position.y = newY
      this.legR.position.y = newY
      this.torsoGroup.position.y = newY

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

      const currentDx = this.obj.position.x - this.startPos.x
      const currentDz = this.obj.position.z - this.startPos.z
      const distanceMoved = Math.sqrt(currentDx * currentDx + currentDz * currentDz)
      
      const targetY = (distanceMoved < this.distanceToTarget / 2) ? this.currentPlaneY : this.nextPlaneY
      const currentVelocityY = this.velocity.vy - g * t 

      if (currentVelocityY < 0 && this.obj.position.y <= targetY) {
        this.status = 'stop'
        this.obj.position.y = targetY 
        
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