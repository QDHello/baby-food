// 自定义食谱：打卡时搜索不到的辅食，可手动添加，本地持久化
const KEY = 'babyfood_custom_recipes';

function list() {
  return wx.getStorageSync(KEY) || [];
}

// 按名称添加（同名去重），返回食谱对象
function add(name) {
  const title = (name || '').trim();
  if (!title) return null;
  const all = list();
  const exists = all.find((r) => r.title === title);
  if (exists) return exists;
  const recipe = {
    id: 'custom_' + Date.now(),
    title,
    emoji: '🍽️',
    cover: '',
    minMonths: 0,
    maxMonths: 36,
    desc: '自定义食谱',
    difficulty: 'easy',
    allergens: [],
    ingredients: [],
    steps: [],
    tips: [],
    nutrition: '',
    tags: ['自定义'],
    custom: true
  };
  all.unshift(recipe);
  wx.setStorageSync(KEY, all);
  return recipe;
}

module.exports = { list, add };
