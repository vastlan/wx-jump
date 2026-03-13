// src/block/base.js
export default class BaseBlock {
  constructor(type) {
    this.type = type
  }

  // 核心升级一：工业级垃圾回收机制，防止长局游戏手机发烫和闪退
  dispose() {
    if (!this.instance) return
    
    // 销毁几何体占用的 GPU 内存
    if (this.instance.geometry) {
      this.instance.geometry.dispose()
    }
    
    // 销毁材质和贴图占用的 GPU 内存
    if (this.instance.material) {
      const materials = Array.isArray(this.instance.material) ? this.instance.material : [this.instance.material]
      materials.forEach(mat => {
        if (mat.map) mat.map.dispose() // 销毁图片纹理
        mat.dispose()                  // 销毁材质本身
      })
    }
  }
}