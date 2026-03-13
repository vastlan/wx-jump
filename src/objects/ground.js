class Ground {
  constructor() {}

  init() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200)
    const material = new THREE.ShadowMaterial({
      transparent: true,
      color:0x000000,
      // transparent设置为true opacity才能生效
      opacity: 0.3
    })

    const instance = this.instance = new THREE.Mesh(groundGeometry, material)
    instance.rotation.x = -Math.PI / 2
    instance.position.y = -16 / 3.2

    instance.receiveShadow = true
  }
}

export default new Ground()