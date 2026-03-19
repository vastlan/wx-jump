// src/block/cuboid.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'
import colorConf from '../../confs/color-conf'

// 🌿 纯正独立插画风：低饱和度、自然质感的拼色（顶部稍亮，侧面稍暗）
const ART_PALETTES = colorConf.ART_PALETTES

export default class Cuboid extends BaseBlock {
  constructor(x, y, z, skin = 'default', customWidth) {
    super('cuboid')
    // 【Bug 修复】：加回丢失的 skin 属性，防止加分状态机崩溃
    this.skin = skin 
    
    const width = customWidth || blockConf.width
    const height = blockConf.height
    this.width = width 

    this.instance = new THREE.Group()

    const isOutfit = Math.random() > 0.3
    const palette = ART_PALETTES[Math.floor(Math.random() * ART_PALETTES.length)]

    if (isOutfit) {
      const topGeom = new THREE.BoxGeometry(width, height * 0.2, width)
      const topMat = new THREE.MeshLambertMaterial({ color: palette.colors[0] })
      const topMesh = new THREE.Mesh(topGeom, topMat)
      topMesh.position.y = height * 0.4
      topMesh.castShadow = true
      topMesh.receiveShadow = true

      const midGeom = new THREE.BoxGeometry(width, height * 0.5, width)
      const midMat = new THREE.MeshLambertMaterial({ color: palette.colors[1] })
      const midMesh = new THREE.Mesh(midGeom, midMat)
      midMesh.position.y = height * 0.05
      midMesh.castShadow = true
      midMesh.receiveShadow = true

      const botGeom = new THREE.BoxGeometry(width, height * 0.3, width)
      const botMat = new THREE.MeshLambertMaterial({ color: palette.colors[2] })
      const botMesh = new THREE.Mesh(botGeom, botMat)
      botMesh.position.y = -height * 0.35
      botMesh.castShadow = true
      botMesh.receiveShadow = true

      this.instance.add(topMesh, midMesh, botMesh)
    } else {
      const solidColor = palette.colors[Math.floor(Math.random() * 3)]
      const geom = new THREE.BoxGeometry(width, height, width)
      const mat = new THREE.MeshLambertMaterial({ color: solidColor })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.instance.add(mesh)
    }

    this.instance.position.set(x, y, z)
  }
}