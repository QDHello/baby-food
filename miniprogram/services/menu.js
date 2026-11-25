// 一周菜单本地数据服务（按宝宝维度隔离；云开发接入后映射 baby_menus 表）
// storage 键：babyfood_menu_{babyId}，结构 { weekStart: 'YYYY-MM-DD', days: { mon~sun: { meal: recipeId } } }
// 口径：月龄适用 = 起始月归属（同食谱列表页 tab）；过敏冲突 = recipe.allergens ∩ baby.allergens（同详情页横幅）
const { RECIPES } = require('../data/mock');
const { STAGES, expandAllergens } = require('../utils/constants');
const { calcMonthAge, formatDate } = require('../utils/util');
const favorites = require('./favorites');

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: '周一', tue: '周二', wed: '周三', thu: '周四', fri: '周五', sat: '周六', sun: '周日' };
const MEAL_LABELS = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

function key(babyId) {
  return `babyfood_menu_${babyId}`;
}

// 写操作后提升数据版本号（与 favorites/feeding 一致）
function bump() {
  const app = getApp();
  if (app && typeof app.bumpDataVersion === 'function') app.bumpDataVersion();
}

// 某日期所在周的周一（YYYY-MM-DD）
function weekStartOf(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // 周一=0 ... 周日=6
  d.setDate(d.getDate() - offset);
  return formatDate(d);
}

function currentWeekStart() {
  return weekStartOf(new Date());
}

// 餐次数按月龄：<6 月无辅食；<9 月 2 餐（午/晚）；≥9 月 3 餐（早/午/晚）
function mealsForBaby(baby) {
  if (!baby) return [];
  const { months } = calcMonthAge(baby.birthday);
  if (months < 6) return [];
  return months < 9 ? ['lunch', 'dinner'] : ['breakfast', 'lunch', 'dinner'];
}

// 宝宝月龄所在阶段（取 min <= months 的最后一个，与食谱列表 matchStage 同口径）
function stageOfBaby(baby) {
  const { months } = calcMonthAge(baby.birthday);
  let hit = STAGES[0];
  STAGES.forEach((s) => {
    if (months >= s.min) hit = s;
  });
  return hit;
}

// 过敏冲突：食谱过敏原与宝宝过敏原有交集（宝宝大类先经 expandAllergens 扩展，
// 如「海鲜」→ 鱼/虾/蟹/贝类，否则大类勾选拦不住具体过敏原食谱）
function hasConflict(recipe, baby) {
  const ba = expandAllergens((baby && baby.allergens) || []);
  return (recipe.allergens || []).some((a) => ba.includes(a));
}

// 空周骨架
function emptyDays(meals) {
  const days = {};
  DAY_KEYS.forEach((d) => {
    days[d] = {};
    meals.forEach((m) => { days[d][m] = ''; });
  });
  return days;
}

// 获取菜单；跨周返回 expired 标记（不删除旧数据，页面展示归档提示）
function getMenu(babyId) {
  if (!babyId) return null;
  const m = wx.getStorageSync(key(babyId));
  if (!m || !m.weekStart) return null;
  if (m.weekStart !== currentWeekStart()) return { ...m, expired: true };
  return m;
}

function saveMenu(babyId, menu) {
  if (!babyId) return;
  wx.setStorageSync(key(babyId), menu);
  bump();
}

function clearMenu(babyId) {
  if (!babyId) return;
  wx.removeStorageSync(key(babyId));
  bump();
}

// 月龄适用食谱池（起始月归属，排除过敏冲突；excludeIds 用于剔除收藏池已有项）
function applicableRecipes(baby, excludeIds) {
  if (!baby || !baby.birthday) return [];
  const { months } = calcMonthAge(baby.birthday);
  if (months < 6) return [];
  const stage = stageOfBaby(baby);
  return RECIPES.filter((r) =>
    r.minMonths >= stage.min && r.minMonths < stage.max &&
    !hasConflict(r, baby) && !(excludeIds || []).includes(r.id)
  );
}

// 手动指定弹窗数据：收藏池 + 适用池（含本周已用标记在页面侧计算）
function listPool(baby) {
  if (!baby) return { favPool: [], appPool: [] };
  const favs = favorites.getFavorites(baby.id)
    .map((f) => RECIPES.find((r) => r.id === f.id))
    .filter((r) => r && !hasConflict(r, baby));
  const appPool = applicableRecipes(baby, favs.map((r) => r.id));
  return { favPool: favs, appPool };
}

// 随机取数组元素
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 洗牌（每次生成结果不同）
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 一键生成整周：收藏优先填充，不足从适用池补足；一周不重样优先，池不足时相邻两天同餐次不重样
// 返回 { menu, repeated }，repeated = 是否因池不足出现了重复
function generateMenu(baby) {
  const meals = mealsForBaby(baby);
  const { favPool, appPool } = listPool(baby);
  const favIds = favPool.map((r) => r.id);
  // 菜池序列：收藏在前（优先消耗），适用池在后
  const combined = shuffle(favPool).concat(shuffle(appPool));
  const usedIds = new Set();
  const days = {};
  let repeated = false;

  // 生成槽位顺序（按天、按餐次早→午→晚）
  const slots = [];
  DAY_KEYS.forEach((d) => meals.forEach((m) => slots.push({ day: d, meal: m })));

  slots.forEach((slot, idx) => {
    // 第一轮：取未用过的第一个（收藏在前保证优先）
    let picked = combined.find((r) => !usedIds.has(r.id));
    if (!picked) {
      // 池耗尽：允许重复，但不与当天已有、前一天同餐次重复
      const prevMealId = idx >= meals.length ? (days[slots[idx - meals.length].day] || {})[slot.meal] : '';
      const dayIds = Object.values(days[slot.day] || {}).filter(Boolean);
      const candidates = combined.filter((r) => r.id !== prevMealId && !dayIds.includes(r.id));
      picked = pick(candidates.length ? candidates : combined);
      repeated = true;
    }
    if (!picked) return; // 池为空（理论上 <6 月龄才会出现，页面已拦截）
    usedIds.add(picked.id);
    if (!days[slot.day]) days[slot.day] = {};
    days[slot.day][slot.meal] = picked.id;
  });

  const menu = { weekStart: currentWeekStart(), days, mealOrder: meals };
  saveMenu(baby.id, menu);
  return { menu, repeated, favIds };
}

// 单格换一换：从菜池随机换一道，优先未在本周出现的；返回 { ok, recipe } 或 { ok: false, reason }
function swapOne(baby, menu, day, meal) {
  const cur = (menu.days[day] || {})[meal];
  const usedIds = new Set();
  DAY_KEYS.forEach((d) => Object.values(menu.days[d] || {}).forEach((id) => { if (id) usedIds.add(id); }));
  const { favPool, appPool } = listPool(baby);
  const combined = favPool.concat(appPool);
  if (!combined.length) return { ok: false, reason: '菜池为空，先去收藏一些食谱吧' };
  // 优先：本周未用过的
  const fresh = combined.filter((r) => !usedIds.has(r.id) && r.id !== cur);
  if (fresh.length) return { ok: true, recipe: pick(fresh) };
  // 兜底：任意不等于当前的
  const others = combined.filter((r) => r.id !== cur);
  if (!others.length) return { ok: false, reason: '没有更多可换的食谱了' };
  return { ok: true, recipe: pick(others) };
}

module.exports = {
  DAY_KEYS, DAY_LABELS, MEAL_LABELS,
  weekStartOf, currentWeekStart, mealsForBaby, stageOfBaby, hasConflict,
  getMenu, saveMenu, clearMenu, emptyDays, applicableRecipes, listPool,
  generateMenu, swapOne
};
