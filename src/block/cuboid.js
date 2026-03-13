// src/block/cuboid.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

export default class Cuboid extends BaseBlock {
  // 新增 customWidth 参数以支持大小不一的难度
  constructor(x, y, z, skin = 'default', customWidth) {
    super('cuboid')
    this.skin = skin 
    
    // 如果没有传入自定义宽度，则使用默认宽度
    const width = customWidth || blockConf.width
    const height = blockConf.height
    this.width = width // 将宽度保存到实例，供外部计算距离防穿模

    const geometry = new THREE.BoxGeometry(width, height, width)
    const loader = new THREE.TextureLoader()

    let topTexture, sideTexture, bottomTexture;
    let material;

    // 核心升级四：全面启用 res/images 下的丰富皮肤库
    if (skin === 'store') {
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
      // 默认美拉德高级纯色体系
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