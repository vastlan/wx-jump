// src/scene/camera.js
import sceneConf from '../../confs/scene-conf'
import { CustomAnimation } from '../../libs/animation'

const frustumSize = sceneConf.frustumSize

class Camera {
  constructor() {
    this.instance = null
    this.target = null
  }

  init () {
    const aspect = window.innerHeight / window.innerWidth
    const instance = this.instance = new THREE.OrthographicCamera(
      -frustumSize,
      frustumSize,
      frustumSize * aspect,
      -frustumSize,
      -100,
      85
    )
    // 初始相机位置
    instance.position.set(-10, 10, 10)
    // 初始观察目标 (原点)
    const target = this.target = new THREE.Vector3(0, 0, 0)
    instance.lookAt(target)
  }

  // 新增：相机平滑移动跟随逻辑
  updatePosition(newTargetPosition) {
    // 1. 移动相机本体的位置 (保持相同的相对观察角度)
    CustomAnimation.to(this.instance.position, {
      x: newTargetPosition.x - 10,
      y: newTargetPosition.y + 10,
      z: newTargetPosition.z + 10
    }, 0.5)

    // 2. 移动相机的焦点 (Target)
    CustomAnimation.to(this.target, {
      x: newTargetPosition.x,
      y: newTargetPosition.y,
      z: newTargetPosition.z
    }, 0.5)
  }

  // 新增：在每一帧渲染时，强迫相机盯住 target
  update() {
    if (this.instance && this.target) {
      this.instance.lookAt(this.target)
    }
  }
}

export default new Camera()