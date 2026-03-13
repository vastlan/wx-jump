// src/objects/bottle.js
import { CustomAnimation } from '../../libs/animation'
import bottleConf from '../../confs/bottle-conf'
import blockConf from '../../confs/block-conf'
import { scene } from '../scene/index' // 引入场景以便挂载残影
import tail from './tail' // 引入残影特效模块

class Bottle {
  constructor() {
    this.status = 'stop'
    this.velocity = { vx: 0, vy: 0 }
    this.flyingTime = 0
    this.direction = 'x'
    this.scale = 1
  }

  init() {
    const material = new THREE.MeshLambertMaterial({ color: 0x3D2B1F }) 
    const obj = this.obj = new THREE.Object3D()
    obj.position.set(bottleConf.initPosition.x, bottleConf.initPosition.y + 10, bottleConf.initPosition.z)

    const bottle = this.bottle = new THREE.Object3D()
    const head = this.head = new THREE.Mesh(new THREE.SphereGeometry(bottleConf.headRadius, 20, 20), material)
    head.position.y = 4.5
    head.castShadow = true
    
    const body = this.body = new THREE.Mesh(
      new THREE.CylinderGeometry(bottleConf.headRadius * 0.7, bottleConf.headRadius * 1.5, 3.5, 20), material
    )
    body.position.y = 1.75
    body.castShadow = true

    bottle.add(head)
    bottle.add(body)
    obj.add(bottle)
  }

  reset() {
    this.status = 'stop'
    this.direction = 'x'
    this.flyingTime = 0
    this.scale = 1
    this.bottle.rotation.set(0, 0, 0)
    this.body.scale.set(1, 1, 1)
    this.head.position.y = 4.5
  }

  showUp() {
    CustomAnimation.to(this.obj.position, {
      x: bottleConf.initPosition.x,
      y: blockConf.height / 2,
      z: bottleConf.initPosition.z
    }, 0.5)
  }

  prepare() {
    if (this.status !== 'stop') return
    this.status = 'prepare'
  }

  jump(pressTime, currentPlaneY, nextPlaneY, onLanding) {
    if (this.status !== 'prepare') return
    this.status = 'jump'
    this.flyingTime = 0
    this.onLanding = onLanding
    
    this.currentPlaneY = currentPlaneY
    this.nextPlaneY = nextPlaneY
    this.startPos = this.obj.position.clone()
    
    this.velocity.vx = pressTime * bottleConf.jumpC 
    this.velocity.vy = 1.6 
    
    CustomAnimation.to(this.body.scale, { x: 1, y: 1, z: 1 }, 0.2)
    CustomAnimation.to(this.head.position, { y: 4.5 }, 0.2)
  }

  fall(fallType) {
    this.status = 'fall'
    
    if (fallType === 'tiltForward') {
      const axis = this.direction === 'x' ? 'z' : 'x'
      const angle = -Math.PI / 2 
      CustomAnimation.to(this.bottle.rotation, { [axis]: angle }, 0.2)
      setTimeout(() => {
        CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4)
      }, 150)
    } else if (fallType === 'tiltBackward') {
      const axis = this.direction === 'x' ? 'z' : 'x'
      const angle = Math.PI / 2 
      CustomAnimation.to(this.bottle.rotation, { [axis]: angle }, 0.2)
      setTimeout(() => {
        CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4)
      }, 150)
    } else {
      CustomAnimation.to(this.obj.position, { y: this.obj.position.y - 20 }, 0.4)
    }
  }

  update() {
    if (this.status === 'prepare') {
      this.scale -= 0.003
      this.scale = Math.max(0.5, this.scale)
      this.body.scale.y = this.scale
      this.body.scale.x += 0.0015
      this.body.scale.z += 0.0015
      this.head.position.y -= 0.015
    } else if (this.status === 'jump') {
      this.flyingTime += 1
      const t = this.flyingTime
      const g = 0.12 
      
      this.obj.position.y = this.startPos.y + (this.velocity.vy * t - 0.5 * g * t * t)
      
      if (this.direction === 'x') {
        this.obj.position.x += this.velocity.vx
        this.bottle.rotation.z -= 0.12
      } else {
        this.obj.position.z -= this.velocity.vx
        this.bottle.rotation.x -= 0.12
      }

      // 核心特效注入：飞行状态下，每隔 2 帧在当前位置生成一个尾迹残影
      if (this.flyingTime % 2 === 0) {
        tail.createTail(scene.instance, this.obj.position, this.bottle.rotation)
      }

      const distanceMoved = (this.direction === 'x') ? 
        Math.abs(this.obj.position.x - this.startPos.x) : 
        Math.abs(this.obj.position.z - this.startPos.z)
      
      const targetY = (distanceMoved < 4) ? this.currentPlaneY : this.nextPlaneY
      const currentVelocityY = this.velocity.vy - g * t 

      if (currentVelocityY < 0 && this.obj.position.y <= targetY) {
        this.status = 'stop'
        this.obj.position.y = targetY 
        this.bottle.rotation.set(0, 0, 0)
        this.body.scale.set(1, 1, 1)
        
        if (this.onLanding) {
          this.onLanding()
          this.onLanding = null
        }
      }
    }
  }
}
export default new Bottle()