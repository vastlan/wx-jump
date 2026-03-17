// src/block/cuboid.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

export default class Cuboid extends BaseBlock {
  constructor(x, y, z, skin = 'default', customWidth) {
    super('cuboid')
    this.skin = skin 
    const width = customWidth || blockConf.width
    const height = blockConf.height
    this.width = width 

    const geometry = new THREE.BoxGeometry(width, height, width)
    const loader = new THREE.TextureLoader()

    let topTexture, sideTexture
    let material

    // 核心回归：读取原版源码中的精美灰白贴图
    if (skin === 'default') {
      topTexture = loader.load('res/images/box_top.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'store') {
      topTexture = loader.load('res/images/store_top.png')
      sideTexture = loader.load('res/images/store_bottom.png') 
    } else if (skin === 'express') {
      topTexture = loader.load('res/images/express.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'dict') {
      topTexture = loader.load('res/images/dict.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'door') {
      topTexture = loader.load('res/images/door.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'medicine') {
      topTexture = loader.load('res/images/medicine.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'money') {
      topTexture = loader.load('res/images/money.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'clock') {
      topTexture = loader.load('res/images/clock.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'gift') {
      topTexture = loader.load('res/images/gift.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'indoor') {
      topTexture = loader.load('res/images/indoor.png')
      sideTexture = loader.load('res/images/box_middle.png')
    } else if (skin === 'well') {
      topTexture = loader.load('res/images/well.png')
      sideTexture = loader.load('res/images/box_middle.png')
    }

    if (topTexture && sideTexture) {
      const topMat = new THREE.MeshLambertMaterial({ map: topTexture })
      const sideMat = new THREE.MeshLambertMaterial({ map: sideTexture })
      const bottomMat = new THREE.MeshLambertMaterial({ color: 0xffffff })
      const materials = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat]
      this.instance = new THREE.Mesh(geometry, materials)
    } else {
      material = new THREE.MeshLambertMaterial({ color: 0xEAEAEA })
      this.instance = new THREE.Mesh(geometry, material)
    }

    this.instance.position.set(x, y, z)
    this.instance.castShadow = true
    this.instance.receiveShadow = true
  }
}