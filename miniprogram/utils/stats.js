// 喂养统计聚合服务（纯函数现算，不新增存储；二期 D23/D24）
// 输入：feeding.getLogs(babyId) 的记录数组 + 统计范围
// 输出：统一聚合对象，页面只做渲染

// 日期 → YYYY-MM-DD（本地时区）
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 范围过滤：month=当前自然月 1 号至今；all=全部
function filterByRange(logs, range) {
  if (range === 'all') return logs;
  const now = new Date();
  const firstDay = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
  return logs.filter((l) => l.date >= firstDay && l.date <= fmtDate(now));
}

// 按食谱聚合次数（title 相同视为同一食谱，recipeId 优先）
function groupByRecipe(logs) {
  const map = {};
  logs.forEach((l) => {
    const k = l.recipeId || l.recipeTitle;
    if (!map[k]) {
      map[k] = { id: k, title: l.recipeTitle, emoji: l.emoji || '🍽️', count: 0 };
    }
    map[k].count += 1;
    if (!map[k].emoji && l.emoji) map[k].emoji = l.emoji;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// 主聚合：返回 summary / reactionDist / allergyRank / heat / topRecipes
function buildStats(logs, range) {
  const scoped = filterByRange(logs, range);

  // 概览三格：累计记录 / 打卡天数（去重日期）/ 尝试食谱数（去重食谱）
  const dateSet = new Set(scoped.map((l) => l.date));
  const summary = {
    total: scoped.length,
    days: dateSet.size,
    recipes: new Set(scoped.map((l) => l.recipeId || l.recipeTitle)).size
  };

  // 反应分布（三档计数）
  const reactionDist = { none: 0, allergy: 0, discomfort: 0 };
  scoped.forEach((l) => {
    const r = l.reaction || 'none';
    if (reactionDist[r] !== undefined) reactionDist[r] += 1;
  });

  // 过敏关注：触发过敏的食谱排行
  const allergyRank = groupByRecipe(scoped.filter((l) => l.reaction === 'allergy'));

  // 近 30 天打卡热度（含今天，无记录日为 0）
  const countByDate = {};
  scoped.forEach((l) => {
    countByDate[l.date] = (countByDate[l.date] || 0) + 1;
  });
  const today = new Date();
  const heat = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const ds = fmtDate(d);
    heat.push({ date: ds, count: countByDate[ds] || 0 });
  }

  // 最常做食谱 Top5
  const topRecipes = groupByRecipe(scoped).slice(0, 5);

  return { summary, reactionDist, allergyRank, heat, topRecipes, total: scoped.length };
}

module.exports = { buildStats };
