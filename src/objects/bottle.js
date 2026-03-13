import { CustomAnimation } from '../../libs/animation'
import bottleConf from '../../confs/bottle-conf'
import blockConf from '../../confs/block-conf'

const { initPosition } = bottleConf

class Bottle {
  constructor() {
    this.status = 'stop'
    this.velocity = { vx: 0, vy: 0 }
    this.flyingTime = 0
    this.direction = 'x'
    this.scale = 1
  }

  init() {
    // 棋子配色：采用美拉德深色系（如深咖啡）
    const material = new THREE.MeshLambertMaterial({ color: 0x3D2B1F }) 

    const obj = this.obj = new THREE.Object3D()
    obj.position.set(initPosition.x, initPosition.y + 10, initPosition.z)

    const bottle = this.bottle = new THREE.Object3D()
    
    // 棋子模型构造（简化并优化比例）
    const head = this.head = new THREE.Mesh(new THREE.SphereGeometry(bottleConf.headRadius, 20, 20), material)
    head.position.y = 4.5
    
    const body = this.body = new THREE.Mesh(
      new THREE.CylinderGeometry(bottleConf.headRadius * 0.7, bottleConf.headRadius * 1.5, 3.5, 20),
      material
    )
    body.position.y = 1.75

    bottle.add(head)
    bottle.add(body)
    obj.add(bottle)
  }

  showUp() {
    CustomAnimation.to(this.obj.position, {
      x: initPosition.x,
      y: blockConf.height / 2,
      z: initPosition.z
    }, 0.5)
  }

  prepare() {
    this.status = 'prepare'
  }

  jump(pressTime, onLanding) {
    this.status = 'jump'
    this.flyingTime = 0
    this.onLanding = onLanding
    
    // 核心精调： pressTime 映射逻辑
    // 基础速度更小，让轻点变为可能
    this.velocity.vx = Math.min(pressTime * 0.007, 2.5) 
    this.velocity.vy = 1.6 
    
    CustomAnimation.to(this.body.scale, { x: 1, y: 1, z: 1 }, 0.2)
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
      const g = 0.12 // 增加一点重力感
      
      this.obj.position.y = blockConf.height / 2 + (this.velocity.vy * t - 0.5 * g * t * t)
      
      if (this.direction === 'x') {
        this.obj.position.x += this.velocity.vx
        this.bottle.rotation.z -= 0.12
      } else {
        this.obj.position.z -= this.velocity.vx
        this.bottle.rotation.x -= 0.12
      }

      if (this.obj.position.y <= blockConf.height / 2) {
        this.status = 'stop'
        this.obj.position.y = blockConf.height / 2
        this.bottle.rotation.set(0, 0, 0)
        this.body.scale.set(1, 1, 1)
        if (this.onLanding) this.onLanding()
      }
    }
  }
}
export default new Bottle()