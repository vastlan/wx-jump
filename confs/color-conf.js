// 👗 终极穿搭大辞典 (Fashion Palettes Dictionary)
// 结构: [上衣色(Top), 裤/裙色(Bottom), 鞋色(Shoes)]
export default {
  ART_PALETTES: [
    // ==========================================
    // 🌿 1. 自然治愈系 (Flora & Earth) - 原有风格扩展
    // 搭配技巧：大地色系互相叠加，极其安全、治愈、无攻击性。
    // ==========================================
    { name: '苔藓森林 (Moss)', colors: [0x8A9A5B, 0x768748, 0x5D6B35] }, 
    { name: '秋日陶土 (Terracotta)', colors: [0xCB997E, 0xD4A373, 0xA56336] },  
    { name: '鼠尾草地 (Sage)', colors: [0xCCD5AE, 0xBAC49A, 0x94A187] },
    { name: '落日黄昏 (Dusty Coral)', colors: [0xE9C46A, 0xD6B25B, 0xB89A4B] }, 
    { name: '迷雾山峰 (Foggy Grey)', colors: [0xA8A5A6, 0x8D878A, 0x666063] }, 
    { name: '干枯玫瑰 (Dusty Rose)', colors: [0xBC8A8E, 0xA8777B, 0x8A5C60] },
    { name: '燕麦拿铁 (Oatmeal Latte)', colors: [0xEFE6DD, 0xD3C4B7, 0xA8998C] }, // 燕麦毛衣+卡其直筒裤+麂皮软鞋
  
    // ==========================================
    // 💰 2. 静奢老钱风 (Quiet Luxury / Old Money)
    // 搭配技巧：降低色彩饱和度，大量使用藏青、羊绒驼色、米白，质感至上。
    // ==========================================
    { name: '羊绒大衣 (Cashmere Camel)', colors: [0xC19A6B, 0x36454F, 0x1A1A1A] }, // 驼色毛衣+炭灰西裤+黑皮鞋
    { name: '游艇假日 (Yacht Club)', colors: [0xFFFDD0, 0xF5F5F5, 0x8B4513] }, // 奶油白针织衫+纯白亚麻裤+棕色乐福鞋
    { name: '常春藤 (Ivy League)', colors: [0x1D2B53, 0xD2B48C, 0x4A0E4E] }, // 藏青色西装+卡其休闲裤+勃艮第红皮鞋
    { name: '伯爵红茶 (Earl Grey)', colors: [0x4A4A4A, 0x2C2C2C, 0x111111] }, // 深灰高领打底+纯黑西裤+切尔西靴
  
    // ==========================================
    // 🛹 3. 日系 City Boy / 街头休闲 (Urban Casual)
    // 搭配技巧：宽松叠穿，善用军绿、藏青、白色的撞色，鞋子通常是白球鞋。
    // ==========================================
    { name: '原宿街头 (Harajuku)', colors: [0x556B2F, 0x1A2A40, 0xEEEEEE] }, // 军绿Oversize外套+深蓝原牛+白板鞋
    { name: '镰仓海风 (Kamakura Blue)', colors: [0xADD8E6, 0xF0E68C, 0x8B4513] }, // 浅蓝条纹衬衫+卡其短裤+棕色帆船鞋
    { name: '富士山下 (Fuji Snow)', colors: [0xFFFFFF, 0x708090, 0x2F4F4F] }, // 纯白T恤+石板灰工装裤+深灰运动鞋
    { name: '涩谷叠穿 (Shibuya Layers)', colors: [0xFF9900, 0x4B5320, 0x111111] }, // 亮橙色卫衣+军绿伞兵裤+黑武士球鞋
  
    // ==========================================
    // ☕ 4. 法式慵懒风 (French Chic)
    // 搭配技巧：毫不费力的优雅，经典红白蓝，或者黑白配加上一点亮色点缀。
    // ==========================================
    { name: '巴黎画报 (Parisian Stripe)', colors: [0xF0F8FF, 0x5D8AA8, 0x8B0000] }, // 白底蓝条纹海魂衫+复古蓝牛仔裤+法式红舞鞋
    { name: '香榭落叶 (Trench Coat)', colors: [0xD1BEA8, 0x1C1C1C, 0x2E2E2E] }, // 经典卡其风衣+纯黑紧身裤+黑色短靴
    { name: '塞纳河畔 (Seine Evening)', colors: [0x000080, 0xFFFFFF, 0x8B0000] }, // 藏蓝法式衬衫+纯白直筒裤+暗红玛丽珍鞋
  
    // ==========================================
    // 🎞️ 5. 美式复古风 (70s Vintage)
    // 搭配技巧：高饱和度的暖色调，芥末黄、铁锈红搭配水洗做旧单宁。
    // ==========================================
    { name: '加州旅馆 (Hotel California)', colors: [0xFFDB58, 0x654321, 0x556B2F] }, // 芥末黄针织短袖+深棕灯芯绒裤+橄榄绿帆布鞋
    { name: '德州公路 (Texas Highway)', colors: [0xB7410E, 0x318CE7, 0xD2B48C] }, // 铁锈红夹克+水洗蓝牛仔裤+黄牛皮皮靴
    { name: '西部牛仔 (Double Denim)', colors: [0x87CEEB, 0x00008B, 0x8B4513] }, // 浅蓝牛仔衬衫+深蓝牛仔裤+棕色马丁靴
  
    // ==========================================
    // 🧊 6. 极简冷淡风 (Minimalist / Normcore)
    // 搭配技巧：去繁就简，黑白灰的极致运用，考验材质的纯粹。
    // ==========================================
    { name: '史蒂夫 (The Steve)', colors: [0x111111, 0x222222, 0xDDDDDD] }, // 黑色半高领毛衣+黑色修身裤+灰色运动鞋
    { name: '北欧冰川 (Nordic Ice)', colors: [0xFDFDFD, 0xADD8E6, 0xFFFFFF] }, // 纯白立领衬衫+极浅灰蓝阔腿裤+纯白极简平底鞋
    { name: '水泥城市 (Concrete)', colors: [0x808080, 0x505050, 0x202020] }, // 中灰套头衫+深灰束脚裤+纯黑跑鞋
  
    // ==========================================
    // 🌃 7. 机能先锋 / 赛博朋克 (Techwear / Cyberpunk)
    // 搭配技巧：通体暗黑，加上极小面积的高饱和度荧光色（如鞋子）作为视觉焦点。
    // ==========================================
    { name: '夜之城 (Night City)', colors: [0x1A1A1A, 0x2A2A2A, 0x39FF14] }, // 黑胶防风冲锋衣+黑战术裤+荧光绿气垫鞋
    { name: '霓虹暗影 (Neon Shadow)', colors: [0x222222, 0x111111, 0xFF00FF] }, // 哑光黑外套+机能黑裤+赛博粉紫光边鞋
    { name: '废土行者 (Wasteland)', colors: [0x4A4A4A, 0x303030, 0xFF4500] }, // 深灰做旧斗篷+炭黑绑带裤+亮橙色战术靴
  
    // ==========================================
    // 🍬 8. 千禧多巴胺 (Y2K / Dopamine)
    // 搭配技巧：大胆的糖果色撞色，充满青春活力，让人心情愉悦。
    // ==========================================
    { name: '泡泡糖 (Bubblegum)', colors: [0xFF69B4, 0x89CFF0, 0xFAFAFA] }, // 芭比粉辣妹T恤+婴儿蓝工装裤+老爹白鞋
    { name: '青苹果 (Green Apple)', colors: [0x98FF98, 0xFFD1DC, 0xFFFFFF] }, // 薄荷绿短袖+柔和樱花粉短裙+纯白长袜板鞋
    { name: '千禧银 (Millennium Silver)', colors: [0xE0E0E0, 0x1A1A1A, 0x00FFFF] } // 银色亮面羽绒服+黑色喇叭裤+荧光青蓝底鞋
  ]
}