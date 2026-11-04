const { RECIPES } = require('../../data/mock');
const feeding = require('../../services/feeding');
const { calcMonthAge, getStage, formatAge, canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const { REACTIONS, MEAL_LABEL, MEAL_ORDER } = require('../../utils/constants');

const REACTION_LABEL = {};
REACTIONS.forEach((r) => { REACTION_LABEL[r.key] = r.label; });

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const RECOMMEND_COUNT = 6;
// onShow 节流窗口：30 秒内且数据无变更时不重复刷新
const RELOAD_INTERVAL = 30 * 1000;

function mealOrder(meal) {
  return MEAL_ORDER[meal] === undefined ? 9 : MEAL_ORDER[meal];
}

// "2026-11-03" → "11月3日 · 周二"
function dateLabel(dateStr) {
  const d = new Date(String(dateStr).replace(/-/g, '/'));
  if (isNaN(d.getTime())) return dateStr;
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + WEEK_DAYS[d.getDay()];
}

Page({
  data: {
    baby: null,
    stage: null,
    ageText: '',
    // 今日概览：最近一天的记录
    overview: {
      dateLabel: '',
      items: [],
      state: 'empty' // empty(从未记录) / noBaby / ready
    },
    // 推荐辅食
    recommendTitle: '本月精选辅食',
    recommendHint: '设置宝宝月龄，推荐更精准',
    recommendRecipes: [],
    canShuffle: false
  },

  // 转发给好友：分享首页入口
  onShareAppMessage() {
    return {
      title: '蹦Food·记录宝宝每一口辅食',
      path: '/pages/index/index'
    };
  },

  onShow() {
    const app = getApp();
    const version = app.globalData.dataVersion || 0;
    const babyId = (app.globalData.currentBaby && app.globalData.currentBaby.id) || null;
    const now = Date.now();
    const unchanged = this._lastVersion === version && this._babyId === babyId;

    // 数据有变更（新增/编辑/删除记录、宝宝档案变动）或切换宝宝 → 立即刷新；
    // 否则 30 秒内不重复刷新，避免 tab 来回切换时反复读缓存 + 重洗推荐
    if (unchanged && this._lastLoadAt && now - this._lastLoadAt < RELOAD_INTERVAL) {
      return;
    }

    this.load();
    this._lastVersion = version;
    this._babyId = babyId;
    this._lastLoadAt = now;
  },

  load() {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    this.loadOverview(baby);

    let poolKey;
    if (baby) {
      const { months } = calcMonthAge(baby.birthday);
      const stage = getStage(months);
      if (months < MIN_SOLID_MONTHS) {
        // 未满 6 月龄：不推荐辅食，给出喂养引导
        this.setData({
          baby,
          stage,
          ageText: formatAge(baby.birthday),
          recommendTitle: `${baby.name}满${MIN_SOLID_MONTHS}月龄后开启辅食之旅`,
          recommendHint: '当前以母乳/配方奶喂养为主',
          recommendRecipes: [],
          canShuffle: false
        });
        this.recommendPool = [];
        this._poolKey = 'under6:' + baby.id;
        return;
      }
      this.setData({
        baby,
        stage,
        ageText: formatAge(baby.birthday),
        recommendTitle: '适合 ' + baby.name + '（' + months + '月龄）',
        recommendHint: ''
      });
      this.recommendPool = RECIPES.filter((r) => months >= r.minMonths && months <= r.maxMonths);
      poolKey = baby.id + ':' + months + ':' + this.recommendPool.map((r) => r.id).join(',');
    } else {
      this.setData({
        baby: null,
        stage: null,
        ageText: '',
        recommendTitle: '本月精选辅食',
        recommendHint: '设置宝宝月龄，推荐更精准'
      });
      this.recommendPool = RECIPES.slice();
      poolKey = 'no-baby';
    }

    // 会话内推荐缓存：宝宝/月龄/食谱池未变时沿用上一批，
    // 切 tab 回来不会再随机换一批；「换一换」仍由用户主动触发
    if (this._poolKey === poolKey && this.data.recommendRecipes.length) {
      this.setData({ canShuffle: this.recommendPool.length > RECOMMEND_COUNT });
      return;
    }
    this._poolKey = poolKey;
    this.shuffleRecommend(true);
  },

  // 今日概览：只取最近一天
  loadOverview(baby) {
    const logs = baby ? feeding.getLogs(baby.id) : [];
    if (!baby) {
      this.setData({ overview: { dateLabel: '', items: [], state: 'noBaby' } });
      return;
    }
    if (!logs.length) {
      this.setData({ overview: { dateLabel: '', items: [], state: 'empty' } });
      return;
    }
    const latestDate = logs
      .map((l) => l.date)
      .sort()
      .reverse()[0];
    const items = logs
      .filter((l) => l.date === latestDate)
      .sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal))
      .map((l) => ({
        id: l.id,
        recipeTitle: l.recipeTitle,
        mealLabel: MEAL_LABEL[l.meal] || '',
        reactionLabel: REACTION_LABEL[l.reaction] || '',
        reaction: l.reaction || 'none',
        note: l.note || '',
        images: Array.isArray(l.images) ? l.images : []
      }));
    this.setData({ overview: { dateLabel: dateLabel(latestDate), items, state: 'ready' } });
  },

  // 推荐辅食：随机取一批，换一换时避开上一批
  // 注意：WXML 直接 bindtap 本方法，此时入参是事件对象；只有 load() 显式传 true 才是首屏
  shuffleRecommend(e) {
    const first = e === true;
    const pool = this.recommendPool || [];
    const prev = this._lastRecommendIds || [];
    let candidates = first ? pool : pool.filter((r) => prev.indexOf(r.id) === -1);
    if (candidates.length < RECOMMEND_COUNT) candidates = pool.slice();
    const shuffled = candidates.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    const picked = shuffled.slice(0, RECOMMEND_COUNT).map((r) => ({
      id: r.id,
      title: r.title,
      emoji: r.emoji,
      cover: r.cover || '',
      showCover: !!r.cover,
      desc: r.desc,
      minMonths: r.minMonths,
      maxMonths: r.maxMonths
    }));
    this._lastRecommendIds = picked.map((r) => r.id);
    this.setData({
      recommendRecipes: picked,
      canShuffle: pool.length > RECOMMEND_COUNT
    });
  },

  // 封面图加载失败 → 回退 emoji
  onCoverError(e) {
    const id = e.currentTarget.dataset.id;
    const list = this.data.recommendRecipes;
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id && list[i].showCover) {
        this.setData({ ['recommendRecipes[' + i + '].showCover']: false });
        break;
      }
    }
  },

  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },
  goRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },
  goRecipeList() {
    wx.navigateTo({ url: '/pages/recipe-list/recipe-list' });
  },
  goRecipe(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` });
  },
  goAddRecord() {
    const baby = this.data.baby;
    if (baby && !canAddSolidFood(baby.birthday)) {
      wx.showToast({ title: `宝宝满${MIN_SOLID_MONTHS}月龄后才能添加辅食`, icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/record-add/record-add' });
  },
  goWiki() {
    wx.switchTab({ url: '/pages/wiki/wiki' });
  }
});
