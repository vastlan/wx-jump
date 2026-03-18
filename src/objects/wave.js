// src/objects/wave.js
import { CustomAnimation } from '../../libs/animation'
import blockConf from '../../confs/block-conf'

class Wave {
  constructor() {
    // 延迟初始化单例
    this.geometry = null
    this.material = null
  }

  createWave(scene, position) {
    // 性能优化：全局只初始化一次几何体和基础材质，避免重复 new 导致的 GC 卡顿
    if (!this.geometry) {
      this.geometry = new THREE.RingGeometry(1.5, 2.5, 32)
      this.material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 1, 
        side: THREE.DoubleSide,
        depthWrite: false 
      })
    }

    // 仅克隆材质，以保证每个波纹可以独立执行透明度(opacity)渐变动画
    const material = this.material.clone()
    const mesh = new THREE.Mesh(this.geometry, material)
    
    mesh.rotation.x = -Math.PI / 2
    
    // 核心修正：波纹的高度必须加上方块本身的动态 y 坐标
    const surfaceY = position.y + (blockConf.height / 2) + 0.05
    mesh.position.set(position.x, surfaceY, position.z) 

    scene.add(mesh)

    CustomAnimation.to(mesh.scale, { x: 3, y: 3, z: 3 }, 0.5)
    CustomAnimation.to(material, { opacity: 0 }, 0.5, 'Linear', () => {
      scene.remove(mesh)
      material.dispose() // 动画结束只销毁材质，共享的 geometry 永久驻留复用
    })
  }
}

export default new Wave()