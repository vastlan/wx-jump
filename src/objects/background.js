// src/objects/background.js
import sceneConf from '../../confs/scene-conf'

class Background {
  constructor() {
    this.instance = null
    this.material = null
    this.targetColor = null
  }

  init() {
    const geometry = new THREE.PlaneGeometry(200, 200)
    // 使用默认的美拉德米色初始化
    this.material = new THREE.MeshBasicMaterial({ color: sceneConf.backgroundColor })
    this.instance = new THREE.Mesh(geometry, this.material)
    
    this.targetColor = new THREE.Color(sceneConf.backgroundColor)
  }

  // 接收外部传来的新颜色指令
  setTargetColor(hexColor) {
    this.targetColor = new THREE.Color(hexColor)
  }

  // 核心升级二：在每一帧中平滑地向目标颜色过渡 (Lerp)
  update() {
    if (this.material && this.targetColor) {
      // 0.01 的插值速度意味着颜色会在几秒钟内像呼吸一样缓慢而平滑地渐变
      this.material.color.lerp(this.targetColor, 0.01)
    }
  }
}

export default new Background()