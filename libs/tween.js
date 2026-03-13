function Linear(currentFrame, from, range, totalFrameCount) {
  return currentFrame * range / totalFrameCount + from
}

export default {
  Linear
}