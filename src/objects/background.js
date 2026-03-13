import sceneConf from '../../confs/scene-conf'

class Background {
  constructor() {}

  init() {
    const groundGeometry = new THREE.PlaneGeometry(
      sceneConf.frustumSize * 2,
      window.innerHeight / window.innerWidth * sceneConf.frustumSize * 2
    )
    const material = new THREE.MeshBasicMaterial({
      color: 0xd7dbe6,
      transparent: true,
      opacity: 1
    })

    const instance = this.instance = new THREE.Mesh(groundGeometry, material)
  }
}

export default new Background()
