// confs/bottle-conf.js
export default {
  initPosition: { x: -15, y: 0, z: 0 },
  headRadius: 0.9,
  bodyWidth: 1.8,
  bodyHeight: 3.5,
  // 核心修复：极大幅度降低跳跃系数。
  // 原本隐藏在代码里的系数太高。现在设为 0.0018，
  // 意味着你轻点屏幕（十几毫秒），小人只会往前挪动一点点。
  jumpC: 0.0018 
}