// src/objects/particle.js
import { CustomAnimation } from '../../libs/animation'

class Particle {
  constructor() {
    this.geometry = null
    this.material = null
  }

  createDust(scene, position) {
    // 延迟初始化
    if (!this.geometry) {
      this.geometry = new THREE.SphereGeometry(0.2, 8, 8) 
      this.material = new THREE.MeshBasicMaterial({
        color: 0xe0e0e0, 
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      })
    }

    const particleCount = 8 + Math.floor(Math.random() * 5) 
    
    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(this.geometry, this.material.clone())
      mesh.position.copy(position)
      scene.add(mesh)

      const angle = Math.random() * Math.PI * 2
      const distance = 1.0 + Math.random() * 2.0 
      const dx = Math.cos(angle) * distance
      const dz = Math.sin(angle) * distance

      CustomAnimation.to(mesh.position, {
        x: position.x + dx,
        y: position.y + 0.5 + Math.random() * 1.5,
        z: position.z + dz
      }, 0.3)

      CustomAnimation.to(mesh.scale, { x: 0.1, y: 0.1, z: 0.1 }, 0.3)
      CustomAnimation.to(mesh.material, { opacity: 0 }, 0.3, 'Linear', () => {
        scene.remove(mesh)
        mesh.material.dispose()
      })
    }
  }
}

export default new Particle()