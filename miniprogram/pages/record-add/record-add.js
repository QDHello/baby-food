const { RECIPES } = require('../../data/mock');
const feeding = require('../../services/feeding');
const customRecipe = require('../../services/custom-recipe');
const { genId, formatDate, canAddSolidFood } = require('../../utils/util');
const { REACTIONS, MEALS, MEAL_LABEL } = require('../../utils/constants');
const imageStore = require('../../utils/image-store');

const MAX_IMAGES = 3;

// 按当前时间推断默认餐次
function guessMeal() {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 17 && h < 21) return 'dinner';
  return 'snack';
}

Page({
  data: {
    recipes: RECIPES,
    recipeIndex: -1,
    recipe: null,
    date: '',
    today: '',
    reactions: REACTIONS,
    reaction: 'none',
    meals: MEALS,
    mealIndex: 1,
    note: '',
    baby: null,
    recipeKeyword: '',   // 弹窗内搜索关键词
    recipeOptions: [],   // 搜索结果（最多展示 50 条）
    recipeMatchCount: 0, // 命中总数（超出展示数时提示）
    showRecipePicker: false,
    images: [],      // 已选图片（本地持久化路径）
    saving: false,
    solidBlocked: false, // 未满 6 月龄，禁止记录辅食
    isEdit: false,   // 编辑模式
    logId: '',
    pendingRemove: [] // 编辑模式下待删除的旧图片
  },

  onLoad(options) {
    const today = formatDate(new Date());

    // 编辑模式：按 logId 回填
    if (options.logId) {
      const log = feeding.getLog(options.logId);
      if (log) {
        const recipeIndex = RECIPES.findIndex((r) => r.id === log.recipeId);
        const mealIndex = MEALS.findIndex((m) => m.key === (log.meal || 'lunch'));
        const editRecipe = recipeIndex >= 0 ? RECIPES[recipeIndex] : null;
        this.setData({
          isEdit: true,
          logId: log.id,
          recipeIndex,
          recipe: editRecipe,
          recipeKeyword: editRecipe ? editRecipe.title : '',
          date: log.date,
          today,
          mealIndex: mealIndex >= 0 ? mealIndex : 1,
          reaction: log.reaction || 'none',
          note: log.note || '',
          images: Array.isArray(log.images) ? log.images : []
        });
        wx.setNavigationBarTitle({ title: '编辑记录' });
        return;
      }
    }

    let recipeIndex = -1;
    if (options.recipeId) {
      recipeIndex = RECIPES.findIndex((r) => r.id === options.recipeId);
    }
    this.setData({
      recipeIndex,
      recipe: recipeIndex >= 0 ? RECIPES[recipeIndex] : null,
      recipeKeyword: recipeIndex >= 0 ? RECIPES[recipeIndex].title : '',
      date: today,
      today,
      mealIndex: MEALS.findIndex((m) => m.key === guessMeal())
    });
  },

  onShow() {
    const baby = getApp().globalData.currentBaby;
    this.setData({
      baby,
      // 全局规则：未满 6 月龄不允许添加辅食
      solidBlocked: !!baby && !canAddSolidFood(baby.birthday)
    });
  },

  // 食谱搜索：内置 + 自定义，按名称/食材/标签过滤
  allRecipes() {
    return RECIPES.concat(customRecipe.list());
  },
  filterRecipes(keyword) {
    const kw = (keyword || '').trim();
    const all = this.allRecipes();
    if (!kw) return all;
    return all.filter(
      (r) =>
        r.title.includes(kw) ||
        r.ingredients.some((i) => i.includes(kw)) ||
        (r.tags || []).some((t) => t.includes(kw))
    );
  },
  applyRecipeOptions(keyword) {
    const matched = this.filterRecipes(keyword);
    this.setData({
      recipeOptions: matched.slice(0, 50),
      recipeMatchCount: matched.length
    });
  },
  // 拉起半屏弹窗（重置关键词，展示全部食谱）
  onOpenRecipePicker() {
    this.setData({ showRecipePicker: true, recipeKeyword: '' });
    this.applyRecipeOptions('');
  },
  onCloseRecipePicker() {
    this.setData({ showRecipePicker: false });
  },
  noop() {},

  // 弹窗内搜索输入
  onRecipeInput(e) {
    const kw = e.detail.value;
    this.setData({ recipeKeyword: kw });
    this.applyRecipeOptions(kw);
  },
  // 选中即确认并关闭弹窗
  onPickRecipe(e) {
    const id = e.currentTarget.dataset.id;
    const recipe = this.allRecipes().find((r) => r.id === id);
    if (!recipe) return;
    this.setData({
      recipe,
      recipeIndex: RECIPES.indexOf(recipe),
      recipeKeyword: recipe.title,
      showRecipePicker: false
    });
  },
  // 搜索无结果时，把关键词添加为自定义食谱并选中
  onAddCustomRecipe() {
    const name = (this.data.recipeKeyword || '').trim();
    if (!name) return;
    const recipe = customRecipe.add(name);
    if (!recipe) return;
    this.setData({
      recipe,
      recipeIndex: -1,
      recipeKeyword: recipe.title,
      showRecipePicker: false
    });
    wx.showToast({ title: '已添加自定义食谱', icon: 'success' });
  },
  onClearRecipe() {
    this.setData({
      recipe: null,
      recipeIndex: -1,
      recipeKeyword: ''
    });
  },

  onDate(e) {
    this.setData({ date: e.detail.value });
  },
  onReaction(e) {
    this.setData({ reaction: e.currentTarget.dataset.reaction });
  },
  onMeal(e) {
    this.setData({ mealIndex: Number(e.detail.value) });
  },
  onNote(e) {
    this.setData({ note: e.detail.value });
  },

  // 选择图片（相册/拍照，最多 3 张，压缩后持久化到本地）
  onAddImage() {
    const remain = MAX_IMAGES - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多 3 张', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPaths = (res.tempFiles || []).map((f) => f.tempFilePath);
        const saved = imageStore.saveImages(tempPaths);
        if (saved.length < tempPaths.length) {
          wx.showToast({ title: '部分图片保存失败', icon: 'none' });
        }
        this.setData({ images: this.data.images.concat(saved).slice(0, MAX_IMAGES) });
      }
    });
  },

  // 删除图片：编辑模式下先记录待删除，保存时才真正删文件（避免取消编辑导致记录丢图）
  onRemoveImage(e) {
    const idx = Number(e.currentTarget.dataset.index);
    const images = this.data.images.slice();
    const [removed] = images.splice(idx, 1);
    if (removed && !this.data.isEdit) imageStore.removeImage(removed);
    const pendingRemove = this.data.pendingRemove.slice();
    if (removed && this.data.isEdit) pendingRemove.push(removed);
    this.setData({ images, pendingRemove });
  },

  // 点击预览
  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src;
    wx.previewImage({ current, urls: this.data.images });
  },

  save() {
    if (this.data.saving) return;
    if (this.data.solidBlocked) {
      wx.showToast({ title: '宝宝满6月龄后才能添加辅食', icon: 'none' });
      return;
    }
    const baby = this.data.baby;
    if (!this.data.isEdit && !baby) {
      wx.showToast({ title: '请先添加宝宝档案', icon: 'none' });
      return;
    }
    if (!this.data.recipe) {
      wx.showToast({ title: '请选择食谱', icon: 'none' });
      return;
    }
    const { recipe, date, reaction, note, images } = this.data;
    this.setData({ saving: true });
    try {
      if (this.data.isEdit) {
        // 清理被移除的旧图片文件
        const keep = {};
        images.forEach((p) => { keep[p] = true; });
        this.data.pendingRemove.forEach((p) => {
          if (!keep[p]) imageStore.removeImage(p);
        });
        feeding.updateLog(this.data.logId, {
          date,
          meal: MEALS[this.data.mealIndex].key,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          emoji: recipe.emoji,
          reaction,
          note: note.trim(),
          images: images.slice(0, MAX_IMAGES)
        });
        wx.showToast({ title: '已保存', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 600);
      } else {
        feeding.addLog({
          id: genId('log'),
          babyId: baby.id,
          date,
          meal: MEALS[this.data.mealIndex].key,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          emoji: recipe.emoji,
          reaction,
          note: note.trim(),
          images: images.slice(0, MAX_IMAGES)
        });
        wx.showToast({ title: '打卡成功', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/record/record' }), 600);
      }
    } catch (e) {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      this.setData({ saving: false });
    }
  }
});
