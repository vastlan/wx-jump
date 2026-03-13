// src/objects/wave.js
import { CustomAnimation } from '../../libs/animation'
import blockConf from '../../confs/block-conf'

class Wave {
  constructor() {}

  createWave(scene, position) {
    const geometry = new THREE.RingGeometry(1.5, 2.5, 32)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 1, 
      side: THREE.DoubleSide,
      depthWrite: false 
    })
    const mesh = new THREE.Mesh(geometry, material)
    
    mesh.rotation.x = -Math.PI / 2
    
    // 核心修正：波纹的高度必须加上方块本身的动态 y 坐标
    const surfaceY = position.y + (blockConf.height / 2) + 0.05
    mesh.position.set(position.x, surfaceY, position.z) 

    scene.add(mesh)

    CustomAnimation.to(mesh.scale, { x: 3, y: 3, z: 3 }, 0.5)
    CustomAnimation.to(material, { opacity: 0 }, 0.5, 'Linear', () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    })
  }
}

export default new Wave()