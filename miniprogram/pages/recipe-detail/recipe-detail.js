const { RECIPES } = require('../../data/mock');
const { DIFFICULTY, expandAllergens } = require('../../utils/constants');
const { canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const favorites = require('../../services/favorites');

Page({
  data: {
    recipe: null,
    difficulty: null,
    baby: null,
    conflictText: '',
    isFav: false
  },

  onLoad(options) {
    const recipe = RECIPES.find((r) => r.id === options.id);
    if (!recipe) {
      wx.showToast({ title: '食谱不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    const app = getApp();
    const baby = app.globalData.currentBaby;
    // 检测宝宝过敏原与食谱食材的冲突（大类经 expandAllergens 扩展，如「海鲜」拦住鱼/虾/蟹）
    const babyAllergens = expandAllergens((baby && baby.allergens) || []);
    const conflictAllergens = (recipe.allergens || []).filter((a) =>
      babyAllergens.includes(a)
    );

    this.setData({
      recipe: {
        ...recipe,
        cover: recipe.cover || '',
        showCover: !!recipe.cover
      },
      baby,
      conflictText: conflictAllergens.join('、'),
      difficulty: DIFFICULTY[recipe.difficulty] || DIFFICULTY.easy,
      // 收藏状态（需宝宝维度，未设宝宝时为 false）
      isFav: baby ? favorites.isFavorite(baby.id, recipe.id) : false
    });
    wx.setNavigationBarTitle({ title: recipe.title });
  },

  // 从收藏列表取消收藏后返回本页时，同步收藏状态
  onShow() {
    wx.showShareMenu({
      menus: ['shareAppMessage', 'shareTimeline']
    });
    const baby = getApp().globalData.currentBaby;
    if (this.data.recipe && baby) {
      this.setData({ isFav: favorites.isFavorite(baby.id, this.data.recipe.id) });
    }
  },

  // 转发给好友：卡片带封面图，落地到本页
  onShareAppMessage() {
    const r = this.data.recipe;
    if (!r) return { title: '蹦Food·宝宝辅食', path: '/pages/index/index' };
    return {
      title: `${r.title}｜${r.minMonths}-${r.maxMonths}月龄辅食`,
      path: `/pages/recipe-detail/recipe-detail?id=${r.id}`,
      imageUrl: r.cover || undefined
    };
  },

  // 分享到朋友圈：单页模式打开，通过 query 带食谱 id
  onShareTimeline() {
    const r = this.data.recipe;
    if (!r) return { title: '蹦Food·宝宝辅食' };
    return {
      title: `${r.title}｜${r.minMonths}-${r.maxMonths}月龄辅食`,
      query: `id=${r.id}`,
      imageUrl: r.cover || undefined
    };
  },

  // 封面图加载失败 → 回退 emoji
  onCoverError() {
    this.setData({ 'recipe.showCover': false });
  },

  goAdd() {
    // 小月龄也可记一笔（仅奶类）——辅食详情页入口仍保留引导，但允许进记录页（小月龄宝宝看辅食详情属低频浏览场景，进去后选奶类即可）
    const baby = getApp().globalData.currentBaby;
    if (baby && !canAddSolidFood(baby.birthday)) {
      const isMilk = (this.data.recipe.tags || []).includes('奶类');
      if (!isMilk) {
        wx.showToast({ title: '未满6月龄仅支持记录母乳/配方奶', icon: 'none' });
        return;
      }
    }
    wx.navigateTo({
      url: `/pages/record-add/record-add?recipeId=${this.data.recipe.id}`
    });
  },
  // 收藏 / 取消收藏（按当前宝宝维度存储）
  addFavorite() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      wx.showToast({ title: '请先在「我的」创建宝宝档案', icon: 'none' });
      return;
    }
    const recipeId = this.data.recipe.id;
    const isFav = favorites.toggleFavorite(baby.id, recipeId);
    this.setData({ isFav });
    wx.showToast({ title: isFav ? '已收藏' : '已取消收藏', icon: 'none' });
  }
});
