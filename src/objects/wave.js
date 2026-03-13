// src/objects/wave.js
import { CustomAnimation } from '../../libs/animation'
import blockConf from '../../confs/block-conf'

class Wave {
  constructor() {}

  // 触发命中靶心的白色水波纹扩散特效
  createWave(scene, position) {
    const geometry = new THREE.RingGeometry(1.5, 2.5, 32)
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 1, 
      side: THREE.DoubleSide 
    })
    const mesh = new THREE.Mesh(geometry, material)
    
    // 将圆环平放
    mesh.rotation.x = -Math.PI / 2
    
    // 方块的中心点在 Y=0，它的顶面高度是 height/2。
    // 我们将波纹稍微抬高 0.1 个单位，防止与方块顶面发生 Z-Fighting（画面闪烁）
    const surfaceY = (blockConf.height / 2) + 0.1
    mesh.position.set(position.x, surfaceY, position.z) 

    scene.add(mesh)

    // 动画 1：波纹向外放大 3 倍
    CustomAnimation.to(mesh.scale, { x: 3, y: 3, z: 3 }, 0.5)
    
    // 动画 2：透明度逐渐变为 0 (渐隐)，完成后从场景中销毁释放内存
    CustomAnimation.to(material, { opacity: 0 }, 0.5, 'Linear', () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    })
  }
}

export default new Wave()