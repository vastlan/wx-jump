// src/objects/tail.js
import { CustomAnimation } from '../../libs/animation'
import bottleConf from '../../confs/bottle-conf'

class Tail {
  constructor() {
    // 构造函数中仅声明变量，不调用 THREE，避开模块加载顺序冲突
    this.geometry = null
    this.material = null
  }

  createTail(scene, position, rotation) {
    // 延迟初始化：确保在首次发生飞行调用时，THREE 绝对已经全局挂载完毕
    if (!this.geometry) {
      this.geometry = new THREE.CylinderGeometry(bottleConf.headRadius * 0.7, bottleConf.headRadius * 1.5, 3.5, 20)
      this.material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        depthWrite: false 
      })
    }

    const mesh = new THREE.Mesh(this.geometry, this.material.clone())
    
    mesh.position.set(position.x, position.y + 1.75, position.z)
    mesh.rotation.copy(rotation)
    scene.add(mesh)

    CustomAnimation.to(mesh.scale, { x: 0.2, y: 0.2, z: 0.2 }, 0.15)
    CustomAnimation.to(mesh.material, { opacity: 0 }, 0.15, 'Linear', () => {
      scene.remove(mesh)
      mesh.material.dispose() 
    })
  }
}

export default new Tail()