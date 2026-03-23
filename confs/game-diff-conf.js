export default {
  defaultDiff: {
    lebel: '正常',
    // 1. 进度系统
    safeSteps: 3,            // 新手保护期：前 X 步绝对是简单格子
    peakSteps: 100,          // 进度峰值：走到第 X 步时，游戏大盘进度拉满
    
    // 2. 概率分布系统 (你可以控制困难局出现的频繁程度)
    minHardProb: 0.55,       // 前期：脱离保护期后，困难格子的起步概率
    maxHardProb: 0.95,       // 后期：进度拉满时，困难格子的极限概率
    
    // 3. 尺寸与间距系统
    widthMax: 18.0,          // 最大宽度 (简单格子常用)
    widthMin: 4.5,           // 最小宽度 (困难格子后期极限)
    gapBase: 6.0,            // 最短净空间距 (简单格子常用)
    gapExtraMax: 200.0,       // 极限额外拉伸间距 (困难格子专属)

    // 4. 陷阱权重控制 (抽卡概率权重)
    weightMoving: 1.0,       
    weightIce: 0.8,          
    weightCollapse: 0.6,     
    weightMirage: 0.5,       
    
    // 5. 陷阱叠加控制
    maxTrapsEarly: 1,        
    maxTrapsLate: 4,         

    // ✨ 6. 压力槽与“打巴掌给甜枣”系统 (核心新增)
    tensionThreshold: 6.5,   // 压力阈值：累积难度达到此值，强制给甜枣 (值越小，给甜枣越频繁)
    pityGapMax: 3.0,         // 甜枣格子的最大间距 (强行拉近)
    pityWidthMin: 16.0       // 甜枣格子的最小宽度 (强行变大)
  },
  classicDiff: {
    label: '经典',
    // 微信跳一跳经典耐玩型
    safeSteps: 5,
    peakSteps: 120,
    minHardProb: 0.35,
    maxHardProb: 0.75,
    widthMax: 18.0,
    widthMin: 6.5,
    gapBase: 5.5,
    gapExtraMax: 120.0,
    weightMoving: 1.0,       
    weightIce: 0.8,          
    weightCollapse: 0.6,     
    weightMirage: 0.5,   
    maxTrapsEarly: 1,        
    maxTrapsLate: 4,    
    tensionThreshold: 5.5,
    pityGapMax: 4.0,
    pityWidthMin: 14.0
  },
  addictedDiff: {
    label: '推荐',
    // 节奏流（最上瘾版本）🔥推荐
    safeSteps: 3,
    peakSteps: 100,
    minHardProb: 0.50,
    maxHardProb: 0.90,
    widthMax: 18.0,
    widthMin: 4.2,
    gapBase: 5.8,
    gapExtraMax: 150.0,
    weightMoving: 1.0,       
    weightIce: 0.8,          
    weightCollapse: 0.6,     
    weightMirage: 0.5,   
    maxTrapsEarly: 1,        
    maxTrapsLate: 4,    
    tensionThreshold: 6.2,
    pityGapMax: 3.5,
    pityWidthMin: 15.5
  },
  challengeDiff: {
    label: '挑战',
    // 高手挑战型（抖音爆分流）
    safeSteps: 2,
    peakSteps: 80,
    minHardProb: 0.65,
    maxHardProb: 0.98,
    widthMax: 18.0,
    widthMin: 4.2,
    gapBase: 6.0,
    gapExtraMax: 200.0,
    weightMoving: 1.0,       
    weightIce: 0.8,          
    weightCollapse: 0.6,     
    weightMirage: 0.5,   
    maxTrapsEarly: 1,        
    maxTrapsLate: 4,    
    tensionThreshold: 8.5,
    pityGapMax: 3.0,
    pityWidthMin: 16.0
  },
  tormentDiff: {
    label: '折磨',
    // 恶意折磨流（主播效果拉满）
    safeSteps: 1,
    peakSteps: 60,
    minHardProb: 0.80,
    maxHardProb: 1.00,
    widthMax: 16.0,
    widthMin: 4.0,
    gapBase: 6.5,
    gapExtraMax: 220.0,
    weightMoving: 1.0,       
    weightIce: 0.8,          
    weightCollapse: 0.6,     
    weightMirage: 0.5,   
    maxTrapsEarly: 1,        
    maxTrapsLate: 4,    
    tensionThreshold: 10.0,
    pityGapMax: 2.5,
    pityWidthMin: 17.0
  }
}