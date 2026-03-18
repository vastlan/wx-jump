// src/block/cylinder.js
import BaseBlock from './base'
import blockConf from '../../confs/block-conf'

const ART_PALETTES = [
  { name: '美拉德 (Maillard)', colors: [0xF5DEB3, 0x8B5A2B, 0x3E2723] }, 
  { name: '莫奈水星 (Monet)', colors: [0xB0E0E6, 0x778899, 0x4682B4] },  
  { name: '梵高星空 (Van Gogh)', colors: [0xFFD700, 0x1E90FF, 0x000080] },
  { name: '莫兰迪 (Morandi)', colors: [0xE0D6D6, 0xC4B7B7, 0x9E9090] }, 
  { name: '美式复古 (Vintage)', colors: [0x2E8B57, 0xF5DEB3, 0x800000] }, 
  { name: '高定极简 (Couture)', colors: [0xFFFFFF, 0x808080, 0x111111] }  
]

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