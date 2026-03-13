// src/block/cylinder.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

export default class Cylinder extends BaseBlock {
  constructor(x, y, z, skin = 'default') {
    super('cylinder')
    this.skin = skin
    
    const width = blockConf.width
    const height = blockConf.height
    const radius = width / 2
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
    const loader = new THREE.TextureLoader()

    let topTexture, sideTexture, bottomTexture;

    if (skin === 'disk') {
      topTexture = loader.load('res/images/disk.png')
      sideTexture = loader.load('res/images/gray.png') // 侧边用灰色暂代
      bottomTexture = loader.load('res/images/white.png')
    } else {
      topTexture = loader.load('res/images/golf_top.png')
      sideTexture = loader.load('res/images/golf_bottom.png')
      bottomTexture = loader.load('res/images/white.png')
    }

    const topMaterial = new THREE.MeshLambertMaterial({ map: topTexture })
    const sideMaterial = new THREE.MeshLambertMaterial({ map: sideTexture })
    const bottomMaterial = new THREE.MeshLambertMaterial({ map: bottomTexture })

    const materials = [ sideMaterial, topMaterial, bottomMaterial ]

    this.instance = new THREE.Mesh(geometry, materials)
    this.instance.position.set(x, y, z)
    this.instance.castShadow = true
    this.instance.receiveShadow = true
  }
}