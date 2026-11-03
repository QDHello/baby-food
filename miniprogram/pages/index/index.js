const { RECIPES } = require('../../data/mock');
const feeding = require('../../services/feeding');
const { calcMonthAge, getStage, formatAge, canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const { REACTIONS, MEAL_LABEL, MEAL_ORDER } = require('../../utils/constants');

const REACTION_LABEL = {};
REACTIONS.forEach((r) => { REACTION_LABEL[r.key] = r.label; });

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const RECOMMEND_COUNT = 6;

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

  onShow() {
    this.load();
  },

  load() {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    this.loadOverview(baby);

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
      } else {
        this.setData({
          baby,
          stage,
          ageText: formatAge(baby.birthday),
          recommendTitle: '适合 ' + baby.name + '（' + months + '月龄）',
          recommendHint: ''
        });
        this.recommendPool = RECIPES.filter((r) => months >= r.minMonths && months <= r.maxMonths);
      }
    } else {
      this.setData({
        baby: null,
        stage: null,
        ageText: '',
        recommendTitle: '本月精选辅食',
        recommendHint: '设置宝宝月龄，推荐更精准'
      });
      this.recommendPool = RECIPES.slice();
    }
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
  shuffleRecommend(first) {
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
