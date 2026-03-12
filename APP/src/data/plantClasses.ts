// 47种植物类别数据
export interface PlantInfo {
  name: string;
  careTips: string;
}

export const PLANT_CLASSES: Record<number, PlantInfo> = {
  0: { name: '非洲紫罗兰', careTips: '喜温暖湿润，半阴环境，保持土壤微湿' },
  1: { name: '芦荟', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  2: { name: '红掌', careTips: '喜高温高湿，避免直射光，保持土壤湿润' },
  3: { name: '散尾葵', careTips: '喜温暖湿润，散射光，保持土壤湿润' },
  4: { name: '文竹', careTips: '喜半阴，避免直射，保持土壤微湿' },
  5: { name: '秋海棠', careTips: '喜温暖湿润，散射光，保持土壤湿润' },
  6: { name: '天堂鸟', careTips: '喜阳光充足，通风良好，浇水适度' },
  7: { name: '鸟巢蕨', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  8: { name: '波士顿蕨', careTips: '喜半阴湿润，保持土壤湿润，避免直射' },
  9: { name: '竹芋', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  10: { name: '一叶兰', careTips: '喜温暖湿润，半阴环境，浇水适度' },
  11: { name: '金钱草', careTips: '喜湿润环境，水培或土培均可，保持土壤湿润' },
  12: { name: '万年青', careTips: '喜温暖湿润，半阴环境，保持土壤微湿' },
  13: { name: '蟹爪兰', careTips: '喜散射光，浇水见干见湿，冬季开花' },
  14: { name: '菊花', careTips: '喜阳光充足，通风良好，浇水适度' },
  15: { name: '浪星竹芋', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  16: { name: '水仙', careTips: '喜阳光充足，凉爽环境，水培或土培' },
  17: { name: '龙血树', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  18: { name: '黛粉叶', careTips: '喜温暖湿润，半阴环境，保持土壤微湿' },
  19: { name: '海芋', careTips: '喜温暖湿润，半阴环境，保持土壤湿润，有毒' },
  20: { name: '常春藤', careTips: '喜凉爽湿润，半阴环境，保持土壤湿润' },
  21: { name: '风信子', careTips: '喜阳光充足，凉爽环境，水培或土培' },
  22: { name: '铁十字秋海棠', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  23: { name: '玉树', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  24: { name: '长寿花', careTips: '喜阳光充足，浇水见干见湿，冬季开花' },
  25: { name: '萱草', careTips: '喜阳光充足，耐寒，浇水适度' },
  26: { name: '铃兰', careTips: '喜凉爽湿润，半阴环境，保持土壤湿润，有毒' },
  27: { name: '发财树', careTips: '喜温暖湿润，散射光，浇水见干见湿' },
  28: { name: '龟背竹', careTips: '喜温暖湿润，半阴环境，保持土壤微湿' },
  29: { name: '兰花', careTips: '喜通风良好，散射光，保持土壤微湿' },
  30: { name: '棕竹', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  31: { name: '白掌', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  32: { name: '一品红', careTips: '喜阳光充足，浇水见干见湿，冬季开花' },
  33: { name: '红斑竹叶', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  34: { name: '酒瓶兰', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  35: { name: '绿萝', careTips: '喜阴凉湿润，避免直射，保持土壤微湿' },
  36: { name: '竹节秋海棠', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  37: { name: '响尾蛇竹芋', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  38: { name: '橡皮树', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  39: { name: '苏铁', careTips: '喜阳光充足，温暖环境，浇水见干见湿' },
  40: { name: '鹅掌柴', careTips: '喜温暖湿润，散射光，保持土壤微湿' },
  41: { name: '虎皮兰', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  42: { name: '紫露草', careTips: '喜温暖湿润，半阴环境，保持土壤湿润' },
  43: { name: '郁金香', careTips: '喜阳光充足，凉爽环境，冬季种植' },
  44: { name: '捕蝇草', careTips: '喜湿润环境，喜阳光，使用纯净水，避免施肥' },
  45: { name: '丝兰', careTips: '喜阳光充足，耐旱，浇水见干见湿' },
  46: { name: '金钱树', careTips: '喜温暖湿润，半阴环境，浇水见干见湿' },
};

export const getPlantInfo = (id: number): PlantInfo => {
  return PLANT_CLASSES[id] || { name: '未知植物', careTips: '暂无养护信息' };
};

export const getPlantName = (id: number): string => {
  return PLANT_CLASSES[id]?.name || '未知植物';
};

export const getPlantCareTips = (id: number): string => {
  return PLANT_CLASSES[id]?.careTips || '暂无养护信息';
};
