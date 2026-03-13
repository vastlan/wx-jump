// src/scene/camera.js
import sceneConf from '../../confs/scene-conf'

const frustumSize = sceneConf.frustumSize

class Camera {
  constructor() {
    this.instance = null
    this.target = null
    this.nextPosition = null // 新增：相机的物理目标位置
    this.nextTarget = null   // 新增：相机的视觉焦点位置
  }

  init () {
    const aspect = window.innerHeight / window.innerWidth
    const instance = this.instance = new THREE.OrthographicCamera(
      -frustumSize, frustumSize, frustumSize * aspect, -frustumSize, -100, 85
    )
    instance.position.set(-10, 10, 10)
    const target = this.target = new THREE.Vector3(0, 0, 0)
    instance.lookAt(target)

    this.nextPosition = instance.position.clone()
    this.nextTarget = target.clone()
  }

  updatePosition(newTargetPosition) {
    // 仅仅更新目标点，不直接执行强制动画
    this.nextPosition.set(newTargetPosition.x - 10, newTargetPosition.y + 10, newTargetPosition.z + 10)
    this.nextTarget.copy(newTargetPosition)
  }

  update() {
    if (this.instance && this.target && this.nextPosition && this.nextTarget) {
      // 核心修复一：使用 0.08 的弹性系数进行实时线性插值（Lerp）
      // 这将彻底解决所有的镜头抖动、卡顿和撕裂感！
      this.instance.position.lerp(this.nextPosition, 0.08)
      this.target.lerp(this.nextTarget, 0.08)
      this.instance.lookAt(this.target)
    }
  }
}
export default new Camera()