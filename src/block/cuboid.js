import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

export default class Cuboid extends BaseBlock {
  constructor(x, y, z, skin = 'default') {
    super('cuboid')
    const { width, height } = blockConf
    const geometry = new THREE.BoxGeometry(width, height, width)
    
    // 美拉德色系定义
    const colors = [0x8B4513, 0xD2B48C, 0xDEB887, 0xA0522D] // 焦糖、卡其、杏色、赭石
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    // 使用 Lambert 材质配合平滑光照，不再使用杂乱的拼贴图
    const material = new THREE.MeshLambertMaterial({ 
      color: randomColor,
      // 如果需要特定皮肤，可以加一层淡淡的纹理混合
      transparent: true,
      opacity: 0.95 
    })

    this.instance = new THREE.Mesh(geometry, material)
    this.instance.position.set(x, y, z)
    this.instance.castShadow = true
    this.instance.receiveShadow = true
    this.skin = skin
  }
}