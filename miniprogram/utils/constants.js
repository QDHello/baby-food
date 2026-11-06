// 常量定义：年龄阶段、过敏原、难度等

// 年龄阶段（单位：月龄，覆盖 0-3 岁）
const STAGES = [
  { key: '0-6', min: 0, max: 6, name: '0-6月', label: '0-6月', desc: '纯母乳/配方奶', tip: '此阶段以奶为主，满6月龄前不添加辅食' },
  { key: '6-8', min: 6, max: 8, name: '6-8月', label: '6-8月', desc: '辅食初期·泥糊', tip: '从强化铁米粉、蔬果泥开始，逐样尝试' },
  { key: '8-10', min: 8, max: 10, name: '8-10月', label: '8-10月', desc: '末状食物', tip: '可添加蛋黄、肉泥、肝泥' },
  { key: '10-12', min: 10, max: 12, name: '10-12月', label: '10-12月', desc: '碎末状·手指食物', tip: '引入手指食物、软烂小块' },
  { key: '12-24', min: 12, max: 24, name: '12-24月', label: '12-24月', desc: '软饭/固体', tip: '逐步过渡到一日三餐' },
  { key: '24-36', min: 24, max: 36, name: '24-36月', label: '24-36月', desc: '接近成人', tip: '均衡营养，养成良好进食习惯' }
];

// 常见过敏原（含 8 大类 + 婴幼儿高发食材）
const ALLERGENS = [
  '牛奶', '鸡蛋', '花生', '大豆', '小麦', '坚果', '海鲜', '芝麻',
  '芒果', '菠萝', '猕猴桃', '虾', '蟹', '鱼', '蜂蜜'
];

// 8 大常见过敏原（重点标注）
const MAJOR_ALLERGENS = ['牛奶', '鸡蛋', '花生', '大豆', '小麦', '坚果', '海鲜', '芝麻'];

// 食谱难度
const DIFFICULTY = {
  easy: { key: 'easy', label: '简单', color: 'tag-green' },
  normal: { key: 'normal', label: '中等', color: 'tag' },
  hard: { key: 'hard', label: '较难', color: 'tag-red' }
};

// 喂养反应（key 用于样式类名，label 用于展示）
const REACTIONS = [
  { key: 'none', label: '无' },
  { key: 'allergy', label: '过敏' },
  { key: 'discomfort', label: '不适' }
];

// 餐次
const MEALS = [
  { key: 'breakfast', label: '早餐' },
  { key: 'lunch', label: '午餐' },
  { key: 'dinner', label: '晚餐' },
  { key: 'snack', label: '加餐' }
];
const MEAL_LABEL = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
// 餐次排序权重（早→午→晚→加餐）
const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

// 过敏风险等级 → 样式 key
const RISK_LEVELS = { '低': 'low', '中': 'mid', '高': 'high' };

module.exports = { STAGES, ALLERGENS, MAJOR_ALLERGENS, DIFFICULTY, REACTIONS, MEALS, MEAL_LABEL, MEAL_ORDER, RISK_LEVELS };
