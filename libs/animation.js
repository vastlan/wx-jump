import Tween from './tween'

export const CustomAnimation = {
  to(from, to, duration, type = 'Linear') {
    for (let prop in to) {
      TweenAnimation(from[prop], to[prop], duration, type, value => {
        from[prop] = value
      })
    }
  }
}

/**
 * @param duration 秒
 */
export function TweenAnimation(from, to, duration = 3, type = 'Linear', callback = () => {}) {
  const frameCount = Math.ceil(duration * 1000 / 17);

  let start = -1

  const startTime = Date.now()
  let lastTime = Date.now()

  const tweenFn = Tween[type]

  var step = function() {
    const currentTime = Date.now()
    const interval = currentTime - lastTime

    let fps = 0

    if (interval) {
      fps = Math.ceil(1000 / interval)
    } else {
      requestAnimationFrame(step)
      return
    }

    const MIN_FPS = 30
    if (fps >= MIN_FPS) {
      start++
    } else {
      const _start = Math.floor(interval / 17)
      start = start + _start
    }

    console.log(start, frameCount, interval)
    const value = tweenFn(start, from, to - from, frameCount)

    if (start <= frameCount) {
      callback(value)
      requestAnimationFrame(step)
    } else {
      callback(to)
    }

    lastTime = Date.now()
  }

  step()
}