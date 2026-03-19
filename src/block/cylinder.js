// src/block/cylinder.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'
import colorConf from '../../confs/color-conf'

// 🌿 保持与立方体同源的插画生态体系配色
const ART_PALETTES = colorConf.ART_PALETTES

export default class Cylinder extends BaseBlock {
  constructor(x, y, z, skin = 'default', customWidth) {
    super('cylinder')
    // 【Bug 修复】：加回丢失的 skin 属性，防止加分状态机崩溃
    this.skin = skin 
    
    const width = customWidth || blockConf.width
    const height = blockConf.height
    this.width = width
    const radius = width / 2

    this.instance = new THREE.Group()

    const isOutfit = Math.random() > 0.3
    const palette = ART_PALETTES[Math.floor(Math.random() * ART_PALETTES.length)]

    if (isOutfit) {
      const topGeom = new THREE.CylinderGeometry(radius, radius, height * 0.2, 32)
      const topMat = new THREE.MeshLambertMaterial({ color: palette.colors[0] })
      const topMesh = new THREE.Mesh(topGeom, topMat)
      topMesh.position.y = height * 0.4
      topMesh.castShadow = true
      topMesh.receiveShadow = true

      const midGeom = new THREE.CylinderGeometry(radius, radius, height * 0.5, 32)
      const midMat = new THREE.MeshLambertMaterial({ color: palette.colors[1] })
      const midMesh = new THREE.Mesh(midGeom, midMat)
      midMesh.position.y = height * 0.05
      midMesh.castShadow = true
      midMesh.receiveShadow = true

      const botGeom = new THREE.CylinderGeometry(radius, radius, height * 0.3, 32)
      const botMat = new THREE.MeshLambertMaterial({ color: palette.colors[2] })
      const botMesh = new THREE.Mesh(botGeom, botMat)
      botMesh.position.y = -height * 0.35
      botMesh.castShadow = true
      botMesh.receiveShadow = true

      this.instance.add(topMesh, midMesh, botMesh)
    } else {
      const solidColor = palette.colors[Math.floor(Math.random() * 3)]
      const geom = new THREE.CylinderGeometry(radius, radius, height, 32)
      const mat = new THREE.MeshLambertMaterial({ color: solidColor })
      const mesh = new THREE.Mesh(geom, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.instance.add(mesh)
    }

    this.instance.position.set(x, y, z)
  }
}