// src/block/base.js
export default class BaseBlock {
  constructor(type) {
    this.type = type
  }

  // 核心升级：适配 Group 容器的深度 GPU 垃圾回收机制
  // 彻底解决长时间游玩导致的手机发烫和闪退问题
  dispose() {
    if (!this.instance) return
    
    // 递归遍历 Group 中的所有子网格（头、身、腿）
    this.instance.traverse((child) => {
      if (child.isMesh) {
        // 1. 销毁几何体占用的 GPU 内存
        if (child.geometry) {
          child.geometry.dispose()
        }
        
        // 2. 销毁材质和贴图占用的 GPU 内存
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          materials.forEach(mat => {
            if (mat.map) mat.map.dispose() // 销毁图片纹理
            mat.dispose()                  // 销毁材质本身
          })
        }
      }
    })
  }
}