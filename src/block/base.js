import blockConf from '../../confs/block-conf'

export default class BaseBlock {
  constructor(type) {
    this.type = type
    this.width = blockConf.width
    this.height = blockConf.height
  }
}