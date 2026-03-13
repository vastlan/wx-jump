// src/utils/audio-manager.js
class AudioManager {
  constructor() {
    this.audios = {}
    this.init()
  }

  init() {
    // 增加了 store(便利店) 和 sing(唱片机) 的音效
    const sounds = [
      'scale_intro', 'success', 'fall', 
      'combo1', 'combo2', 'combo3', 'combo4', 'combo5', 'combo6', 'combo7', 'combo8',
      'store', 'sing' 
    ]
    
    sounds.forEach(name => {
      const audio = wx.createInnerAudioContext()
      audio.src = `res/audios/${name}.mp3`
      this.audios[name] = audio
    })
  }

  play(name) {
    if (this.audios[name]) {
      this.audios[name].seek(0)
      this.audios[name].play()
    }
  }

  stop(name) {
    if (this.audios[name]) {
      this.audios[name].stop()
    }
  }
}

export default new AudioManager()