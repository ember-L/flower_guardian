export interface PlantClass {
  id: number
  name: string
  careTips: string[]
  difficulty: number // 1-5, 1=easiest
  category: string
  waterFrequency: string
  lightNeeds: string
  temperature: string
}

export const plantClasses: PlantClass[] = [
  {
    id: 1,
    name: '绿萝',
    careTips: ['保持土壤微湿，春秋3-5天浇一次', '散射光养护，避免强光直射', '经常向叶面喷水增加湿度', '每月施一次稀薄液肥', '冬季减少浇水，保持盆土偏干'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '散射光',
    temperature: '15-30°C'
  },
  {
    id: 2,
    name: '吊兰',
    careTips: ['保持土壤湿润但不积水', '喜半阴环境，耐阴性好', '生长期每月施一次液肥', '及时修剪枯叶', '分株繁殖简单易活'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '半阴',
    temperature: '15-25°C'
  },
  {
    id: 3,
    name: '多肉植物',
    careTips: ['干透浇透，宁干勿湿', '需要充足光照，每天4-6小时', '使用颗粒土，保证排水', '夏季休眠期控制浇水', '冬季保持5°C以上'],
    difficulty: 1,
    category: '多肉植物',
    waterFrequency: '7-15天',
    lightNeeds: '强光',
    temperature: '10-30°C'
  },
  {
    id: 4,
    name: '仙人掌',
    careTips: ['极少浇水，每月1-2次即可', '需要充足阳光', '冬季休眠期停止浇水', '使用排水良好的沙质土', '避免频繁移动位置'],
    difficulty: 1,
    category: '多肉植物',
    waterFrequency: '15-30天',
    lightNeeds: '强光',
    temperature: '10-35°C'
  },
  {
    id: 5,
    name: '虎皮兰',
    careTips: ['非常耐旱，浇水不宜过多', '耐阴性强，散射光即可', '冬季每月浇一次水', '避免叶心积水', '每年换盆一次'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '7-10天',
    lightNeeds: '散射光/半阴',
    temperature: '15-30°C'
  },
  {
    id: 6,
    name: '芦荟',
    careTips: ['浇水见干见湿', '喜光耐旱', '每年春季换盆', '避免低温冻伤', '分株繁殖'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '7-10天',
    lightNeeds: '充足光照',
    temperature: '15-35°C'
  },
  {
    id: 7,
    name: '富贵竹',
    careTips: ['水培保持水质清洁', '每周换一次水', '散光养护', '水位没过根部10cm', '生根后可转土培'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '换水每周',
    lightNeeds: '散射光',
    temperature: '18-30°C'
  },
  {
    id: 8,
    name: '铜钱草',
    careTips: ['喜水，保持盆土湿润', '需要充足光照', '半水半土养护最佳', '生长迅速，定期修剪', '可水培或土培'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '1-2天',
    lightNeeds: '充足光照',
    temperature: '15-30°C'
  },
  {
    id: 9,
    name: '薄荷',
    careTips: ['保持土壤湿润', '需要充足阳光', '经常采摘促进分枝', '生长迅速，注意修剪', '容易扦插繁殖'],
    difficulty: 1,
    category: '香草植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '15-30°C'
  },
  {
    id: 10,
    name: '龟背竹',
    careTips: ['保持土壤湿润', '喜温暖湿润半阴环境', '经常向叶面喷水', '生长期每月施一次肥', '需要攀爬支架'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '散射光',
    temperature: '20-30°C'
  },
  {
    id: 11,
    name: '月季',
    careTips: ['每天至少6小时光照', '生长期保持土壤湿润', '每月施一次复合肥', '及时修剪残花', '注意防治白粉病和蚜虫'],
    difficulty: 2,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '15-28°C'
  },
  {
    id: 12,
    name: '茉莉花',
    careTips: ['喜阳，需要充足光照', '花期增加浇水频率', '花后追施磷钾肥', '每年春季重剪', '喜欢酸性土壤'],
    difficulty: 2,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '20-35°C'
  },
  {
    id: 13,
    name: '栀子花',
    careTips: ['喜酸性土壤', '保持土壤湿润', '需要充足散射光', '经常向叶面喷水', '花期前施磷钾肥'],
    difficulty: 3,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足散射光',
    temperature: '18-28°C'
  },
  {
    id: 14,
    name: '杜鹃花',
    careTips: ['喜酸性疏松土壤', '保持土壤湿润', '散射光养护', '生长期薄肥勤施', '花后及时修剪'],
    difficulty: 3,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '散射光',
    temperature: '15-25°C'
  },
  {
    id: 15,
    name: '蝴蝶兰',
    careTips: ['使用水苔栽培', '保持基质微润', '散射光养护', '花期后剪去花梗', '温差刺激促进开花'],
    difficulty: 3,
    category: '兰花',
    waterFrequency: '5-7天',
    lightNeeds: '散射光',
    temperature: '18-28°C'
  },
  {
    id: 16,
    name: '君子兰',
    careTips: ['保持土壤微湿', '避免强光直射', '生长期每月施一次肥', '注意温差不要太大', '换盆时注意保护肉质根'],
    difficulty: 3,
    category: '观叶植物',
    waterFrequency: '5-7天',
    lightNeeds: '散射光',
    temperature: '15-25°C'
  },
  {
    id: 17,
    name: '文竹',
    careTips: ['保持土壤湿润', '忌强光，喜阴凉', '经常向周围喷水', '每年春季换盆', '枝叶发黄及时修剪'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '半阴',
    temperature: '15-25°C'
  },
  {
    id: 18,
    name: '发财树',
    careTips: ['浇水不宜过多，宁干勿湿', '散射光养护', '冬季注意保暖', '每月施一次薄肥', '叶面经常喷水'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '7-10天',
    lightNeeds: '散射光',
    temperature: '18-30°C'
  },
  {
    id: 19,
    name: '金钱树',
    careTips: ['非常耐旱，少浇水', '散射光或半阴', '冬季每月浇一次', '避免积水烂根', '分块茎繁殖'],
    difficulty: 1,
    category: '观叶植物',
    waterFrequency: '10-15天',
    lightNeeds: '散射光/半阴',
    temperature: '15-30°C'
  },
  {
    id: 20,
    name: '白掌',
    careTips: ['保持土壤湿润', '喜半阴环境', '经常向叶面喷水', '生长期每月施液肥', '低温时注意保暖'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '半阴',
    temperature: '18-30°C'
  },
  {
    id: 21,
    name: '红掌',
    careTips: ['保持基质湿润', '需要充足散射光', '喜高温高湿', '花期增施磷钾肥', '避免低温和强光'],
    difficulty: 3,
    category: '开花植物',
    waterFrequency: '3-5天',
    lightNeeds: '散射光',
    temperature: '20-30°C'
  },
  {
    id: 22,
    name: '三角梅',
    careTips: ['需要充足光照', '生长期保持湿润', '控水促花', '花后重剪', '冬季注意防寒'],
    difficulty: 2,
    category: '开花植物',
    waterFrequency: '3-5天',
    lightNeeds: '充足光照',
    temperature: '15-35°C'
  },
  {
    id: 23,
    name: '长寿花',
    careTips: ['见干见湿浇水', '充足光照', '花期前施磷钾肥', '花后修剪残花', '扦插繁殖容易'],
    difficulty: 1,
    category: '开花植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '15-28°C'
  },
  {
    id: 24,
    name: '天竺葵',
    careTips: ['充足光照', '控制浇水，避免过湿', '花期增施磷钾肥', '夏季注意遮阴通风', '秋季扦插繁殖'],
    difficulty: 2,
    category: '开花植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '15-25°C'
  },
  {
    id: 25,
    name: '矮牵牛',
    careTips: ['充足光照', '保持土壤湿润', '经常摘心促进分枝', '花期施液肥', '及时清理残花'],
    difficulty: 2,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '15-28°C'
  },
  {
    id: 26,
    name: '绣球花',
    careTips: ['保持土壤湿润', '半阴环境', '酸性土开蓝花', '花后修剪', '冬季注意防寒'],
    difficulty: 3,
    category: '开花植物',
    waterFrequency: '2-3天',
    lightNeeds: '半阴',
    temperature: '15-25°C'
  },
  {
    id: 27,
    name: '铁线蕨',
    careTips: ['保持土壤和空气湿润', '忌强光，喜阴凉', '不可让土壤干透', '经常喷水', '喜酸性土壤'],
    difficulty: 3,
    category: '观叶植物',
    waterFrequency: '1-2天',
    lightNeeds: '半阴/阴',
    temperature: '15-25°C'
  },
  {
    id: 28,
    name: '常春藤',
    careTips: ['保持土壤湿润', '散射光或半阴', '经常向叶面喷水', '生长期每月施肥', '可以造型牵引'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '3-5天',
    lightNeeds: '散射光/半阴',
    temperature: '15-25°C'
  },
  {
    id: 29,
    name: '橡皮树',
    careTips: ['见干见湿浇水', '需要充足光照', '经常擦拭叶面', '每月施一次肥', '注意控制株型'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '18-30°C'
  },
  {
    id: 30,
    name: '幸福树',
    careTips: ['保持土壤湿润', '散射光养护', '经常向叶面喷水', '生长期施复合肥', '注意通风防虫'],
    difficulty: 2,
    category: '观叶植物',
    waterFrequency: '5-7天',
    lightNeeds: '散射光',
    temperature: '18-30°C'
  },
  {
    id: 31,
    name: '罗汉松',
    careTips: ['保持土壤微湿', '需要充足光照', '生长期施薄肥', '定期修剪造型', '盆栽注意控水'],
    difficulty: 3,
    category: '盆景植物',
    waterFrequency: '3-5天',
    lightNeeds: '充足光照',
    temperature: '15-28°C'
  },
  {
    id: 32,
    name: '茶花',
    careTips: ['喜酸性土壤', '保持土壤湿润', '散射光养护', '花期前施磷钾肥', '注意防治病虫害'],
    difficulty: 4,
    category: '开花植物',
    waterFrequency: '3-5天',
    lightNeeds: '散射光',
    temperature: '15-25°C'
  },
  {
    id: 33,
    name: '兰花(春兰)',
    careTips: ['使用兰花专用植料', '保持基质微润', '散射光通风环境', '薄肥勤施', '分株繁殖'],
    difficulty: 4,
    category: '兰花',
    waterFrequency: '5-7天',
    lightNeeds: '散射光',
    temperature: '15-25°C'
  },
  {
    id: 34,
    name: '石斛兰',
    careTips: ['需要较高湿度', '适当遮阴', '使用树皮水苔栽培', '生长期薄肥勤施', '冬季控水促花'],
    difficulty: 3,
    category: '兰花',
    waterFrequency: '3-5天',
    lightNeeds: '散射光',
    temperature: '18-28°C'
  },
  {
    id: 35,
    name: '碗莲',
    careTips: ['需要充足光照', '使用无孔花盆', '保持水位', '生长期施缓释肥', '注意防治蚜虫'],
    difficulty: 3,
    category: '水生植物',
    waterFrequency: '保持水位',
    lightNeeds: '充足光照',
    temperature: '20-35°C'
  },
  {
    id: 36,
    name: '睡莲',
    careTips: ['需要充足光照', '水深15-30cm', '生长期施肥', '及时清理枯叶', '冬季休眠减少养护'],
    difficulty: 3,
    category: '水生植物',
    waterFrequency: '保持水位',
    lightNeeds: '充足光照',
    temperature: '15-30°C'
  },
  {
    id: 37,
    name: '风信子',
    careTips: ['水培保持水位接触根部', '初期遮阴促使生根', '生根后给予光照', '花期保持凉爽', '花后保存种球'],
    difficulty: 2,
    category: '球根植物',
    waterFrequency: '保持水位',
    lightNeeds: '充足光照',
    temperature: '10-20°C'
  },
  {
    id: 38,
    name: '郁金香',
    careTips: ['秋季种球春季开花', '需要低温春化', '充足光照', '花期保持土壤湿润', '花后保留种球'],
    difficulty: 3,
    category: '球根植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '10-18°C'
  },
  {
    id: 39,
    name: '朱顶红',
    careTips: ['种球露出1/3', '保持土壤微湿', '充足光照', '花后继续养护种球', '秋季减少浇水促休眠'],
    difficulty: 2,
    category: '球根植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '18-28°C'
  },
  {
    id: 40,
    name: '迷迭香',
    careTips: ['需要充足光照', '控制浇水，耐旱', '通风良好', '定期修剪造型', '扦插繁殖'],
    difficulty: 2,
    category: '香草植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '15-30°C'
  },
  {
    id: 41,
    name: '罗勒',
    careTips: ['充足光照和温度', '保持土壤湿润', '经常采摘促进分枝', '花期前摘除花蕾', '每年重新播种'],
    difficulty: 2,
    category: '香草植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '20-30°C'
  },
  {
    id: 42,
    name: '碰碰香',
    careTips: ['充足光照', '控制浇水', '触摸叶片散发香味', '扦插繁殖', '注意防寒'],
    difficulty: 1,
    category: '香草植物',
    waterFrequency: '5-7天',
    lightNeeds: '充足光照',
    temperature: '15-28°C'
  },
  {
    id: 43,
    name: '草莓',
    careTips: ['充足光照', '保持土壤湿润', '结果期施磷钾肥', '及时摘除匍匐茎', '注意防治灰霉病'],
    difficulty: 3,
    category: '果蔬植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '15-25°C'
  },
  {
    id: 44,
    name: '小番茄',
    careTips: ['充足光照', '保持土壤湿润', '搭设支架', '开花时摇动植株授粉', '结果期增施磷钾肥'],
    difficulty: 3,
    category: '果蔬植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '20-30°C'
  },
  {
    id: 45,
    name: '辣椒',
    careTips: ['充足光照', '保持土壤湿润', '开花结果期施肥', '及时采收促进结果', '注意防治蚜虫'],
    difficulty: 2,
    category: '果蔬植物',
    waterFrequency: '2-3天',
    lightNeeds: '充足光照',
    temperature: '20-30°C'
  },
  {
    id: 46,
    name: '含羞草',
    careTips: ['充足光照', '保持土壤湿润', '避免频繁触碰', '生长期施薄肥', '一年生植物需留种'],
    difficulty: 1,
    category: '趣味植物',
    waterFrequency: '3-5天',
    lightNeeds: '充足光照',
    temperature: '20-30°C'
  },
  {
    id: 47,
    name: '捕蝇草',
    careTips: ['使用纯净水浇灌', '保持基质湿润', '充足光照', '不可施肥', '冬季休眠期保持低温'],
    difficulty: 4,
    category: '趣味植物',
    waterFrequency: '保持湿润',
    lightNeeds: '充足光照',
    temperature: '15-30°C'
  }
]

export const plantCategories = [
  '观叶植物',
  '开花植物',
  '多肉植物',
  '兰花',
  '香草植物',
  '水生植物',
  '球根植物',
  '果蔬植物',
  '盆景植物',
  '趣味植物'
]
