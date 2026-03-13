// src/block/cylinder.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

export default class Cylinder extends BaseBlock {
  constructor(x, y, z, skin = 'default', customWidth) {
    super('cylinder')
    this.skin = skin
    
    const width = customWidth || blockConf.width
    this.width = width
    const height = blockConf.height
    const radius = width / 2

    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
    const loader = new THREE.TextureLoader()

    let topTexture, sideTexture, bottomTexture;
    let material;

    if (skin === 'disk') {
      topTexture = loader.load('res/images/disk.png')
      sideTexture = loader.load('res/images/gray.png') 
    } else if (skin === 'disk_light') {
      topTexture = loader.load('res/images/disk_light.png')
      sideTexture = loader.load('res/images/gray.png') 
    } else if (skin === 'disk_dark') {
      topTexture = loader.load('res/images/disk_dark.png')
      sideTexture = loader.load('res/images/gray.png') 
    } else if (skin === 'golf') {
      topTexture = loader.load('res/images/golf_top.png')
      sideTexture = loader.load('res/images/golf_bottom.png')
    } else if (skin === 'paper') {
      topTexture = loader.load('res/images/paper_top.png')
      sideTexture = loader.load('res/images/paper_bottom.png')
    }

    if (topTexture && sideTexture) {
      const topMat = new THREE.MeshLambertMaterial({ map: topTexture })
      const sideMat = new THREE.MeshLambertMaterial({ map: sideTexture })
      const bottomMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
      const materials = [ sideMat, topMat, bottomMat ]
      this.instance = new THREE.Mesh(geometry, materials)
    } else {
      const colors = [0x8B4513, 0xD2B48C, 0xDEB887, 0xA0522D, 0xCD853F, 0xF4A460] 
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      material = new THREE.MeshLambertMaterial({ color: randomColor })
      this.instance = new THREE.Mesh(geometry, material)
    }

    this.instance.position.set(x, y, z)
    this.instance.castShadow = true
    this.instance.receiveShadow = true
  }
}