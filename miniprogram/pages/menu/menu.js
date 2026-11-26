// 一周菜单页（三期 FR-30~35，规格见 docs/spec-v1.2-三期.md）
const { RECIPES } = require('../../data/mock');
const { calcMonthAge, formatDate } = require('../../utils/util');
const { SHARE_IMAGE } = require('../../utils/constants');
const menuService = require('../../services/menu');

Page({
  data: {
    state: 'loading', // noBaby | tooYoung | ready
    babyMonths: null,
    meals: [], // 本宝宝餐次 key 数组
    mealSummary: '',
    weekLabel: '',
    hasMenu: false,
    expired: false,
    daysList: [],
    // 手动指定弹窗
    pickerShow: false,
    pickerTab: 'fav',
    pickerTitle: '',
    pickerFav: [],
    pickerApp: [],
    usedIds: [],
    conflictCount: 0, // 存量菜单中与宝宝过敏原冲突的格子数
    activeCell: null // { day, meal }
  },

  onShow() {
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    this.render();
  },

  // 转发给好友：分享菜单页入口（不携带本地菜单数据——对方打开看到自己的菜单）
  onShareAppMessage() {
    return {
      title: '蹦Food·本周宝宝辅食菜单',
      path: '/pages/menu/menu',
      imageUrl: SHARE_IMAGE
    };
  },

  // 分享到朋友圈：单页模式打开菜单页
  onShareTimeline() {
    return {
      title: '蹦Food·本周宝宝辅食菜单',
      imageUrl: SHARE_IMAGE
    };
  },

  render() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) {
      this.setData({ state: 'noBaby' });
      return;
    }
    const { months } = calcMonthAge(baby.birthday);
    if (months < 6) {
      this.setData({ state: 'tooYoung', babyMonths: months });
      return;
    }

    const meals = menuService.mealsForBaby(baby);
    const stage = menuService.stageOfBaby(baby);
    const menu = menuService.getMenu(baby.id);
    const expired = !!(menu && menu.expired);
    const weekStart = expired || !menu ? menuService.currentWeekStart() : menu.weekStart;
    const days = expired || !menu ? menuService.emptyDays(meals) : menu.days;
    const hasMenu = !expired && !!menu;

    // 周标题：11月16日-11月22日
    const ws = new Date(weekStart.replace(/-/g, '/'));
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    const todayStr = formatDate(new Date());

    // 存量菜单兜底：宝宝过敏原后来变更、或新添了过敏史记录时，已排格子可能含不适宜食谱
    const allergyIds = menuService.allergyRecipeIds(baby.id);
    const daysList = menuService.DAY_KEYS.map((d, i) => {
      const date = new Date(ws); date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);
      const cells = meals.map((meal) => {
        const rid = (days[d] || {})[meal];
        const recipe = rid ? RECIPES.find((r) => r.id === rid) : null;
        return {
          meal,
          mealLabel: menuService.MEAL_LABELS[meal],
          recipeId: recipe ? recipe.id : '',
          title: recipe ? recipe.title : '',
          emoji: recipe ? recipe.emoji : '',
          // 不适宜 = 过敏原冲突（含大类扩展）∪ 过敏史（吃过标记过敏）
          conflict: recipe ? (menuService.hasConflict(recipe, baby) || allergyIds.includes(recipe.id)) : false
        };
      });
      return {
        day: d,
        dayLabel: menuService.DAY_LABELS[d],
        dateLabel: `${date.getMonth() + 1}月${date.getDate()}日`,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        cells
      };
    });

    const conflictCount = daysList.reduce((n, d) => n + d.cells.filter((c) => c.conflict).length, 0);

    this.setData({
      state: 'ready',
      babyMonths: months,
      meals,
      mealSummary: `${stage.label} · 每日 ${meals.length} 餐`,
      weekLabel: `${ws.getMonth() + 1}月${ws.getDate()}日-${we.getMonth() + 1}月${we.getDate()}日`,
      hasMenu,
      expired,
      conflictCount,
      daysList
    });
  },

  // 一键生成 / 重新生成整周
  onGenerate() {
    const baby = getApp().globalData.currentBaby;
    if (!baby) return;
    const { repeated } = menuService.generateMenu(baby);
    this.render();
    wx.showToast({ title: repeated ? '菜池较小，部分天数会重复' : '本周菜单已生成', icon: 'none' });
  },

  // 清空本周菜单
  onClearAll() {
    wx.showModal({
      title: '清空菜单',
      content: '确定清空本周菜单吗？清空后可重新生成。',
      confirmColor: '#e53935',
      success: (res) => {
        if (!res.confirm) return;
        const baby = getApp().globalData.currentBaby;
        menuService.clearMenu(baby.id);
        this.render();
        wx.showToast({ title: '已清空', icon: 'none' });
      }
    });
  },

  // 点击格子：空格 → 直接弹选择；已安排 → 操作单
  onCellTap(e) {
    const { day, meal } = e.currentTarget.dataset;
    const cell = this.findCell(day, meal);
    if (cell.isPast) return;
    if (!cell.recipeId) {
      this.openPicker(day, meal);
      return;
    }
    wx.showActionSheet({
      itemList: ['查看详情', '换一换', '手动指定', '清除'],
      success: (res) => {
        if (res.tapIndex === 0) this.goDetail(cell.recipeId);
        else if (res.tapIndex === 1) this.doSwap(day, meal);
        else if (res.tapIndex === 2) this.openPicker(day, meal);
        else this.doClear(day, meal);
      }
    });
  },

  findCell(day, meal) {
    const d = this.data.daysList.find((x) => x.day === day);
    return d.cells.find((c) => c.meal === meal);
  },

  getRawMenu() {
    const baby = getApp().globalData.currentBaby;
    return menuService.getMenu(baby.id);
  },

  doSwap(day, meal) {
    const baby = getApp().globalData.currentBaby;
    const menu = this.getRawMenu();
    if (!menu) return;
    const res = menuService.swapOne(baby, menu, day, meal);
    if (!res.ok) {
      wx.showToast({ title: res.reason, icon: 'none' });
      return;
    }
    menu.days[day][meal] = res.recipe.id;
    menuService.saveMenu(baby.id, menu);
    this.render();
    wx.showToast({ title: `已换成${res.recipe.title}`, icon: 'none' });
  },

  doClear(day, meal) {
    const baby = getApp().globalData.currentBaby;
    const menu = this.getRawMenu();
    if (!menu) return;
    menu.days[day][meal] = '';
    menuService.saveMenu(baby.id, menu);
    this.render();
  },

  goDetail(e) {
    // 兼容两种入参：WXML 事件对象 / 操作单回调直接传 recipeId 字符串
    const id = typeof e === 'string' ? e : e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` });
  },

  // ===== 手动指定弹窗 =====
  openPicker(day, meal) {
    const baby = getApp().globalData.currentBaby;
    const { favPool, appPool } = menuService.listPool(baby);
    const used = new Set();
    menuService.DAY_KEYS.forEach((d) => Object.values((this.getRawMenu() || { days: {} }).days[d] || {}).forEach((id) => { if (id) used.add(id); }));
    const decorate = (list) => list.map((r) => ({
      id: r.id, title: r.title, emoji: r.emoji,
      monthLabel: `${r.minMonths === r.maxMonths ? r.minMonths : r.minMonths + '-' + r.maxMonths}月`,
      used: used.has(r.id)
    }));
    this.setData({
      pickerShow: true,
      pickerTab: 'fav',
      activeCell: { day, meal },
      pickerTitle: `${menuService.DAY_LABELS[day]} · ${menuService.MEAL_LABELS[meal]}`,
      pickerFav: decorate(favPool),
      pickerApp: decorate(appPool)
    });
  },

  onPickerTab(e) {
    this.setData({ pickerTab: e.currentTarget.dataset.tab });
  },

  onPick(e) {
    const { id } = e.currentTarget.dataset;
    const { day, meal } = this.data.activeCell;
    const baby = getApp().globalData.currentBaby;
    const menu = this.getRawMenu() || { weekStart: menuService.currentWeekStart(), days: menuService.emptyDays(this.data.meals) };
    if (!menu.days[day]) menu.days[day] = {};
    menu.days[day][meal] = id;
    menu.weekStart = menuService.currentWeekStart();
    menuService.saveMenu(baby.id, menu);
    this.closePicker();
    this.render();
    wx.showToast({ title: '已安排', icon: 'none' });
  },

  closePicker() {
    this.setData({ pickerShow: false, activeCell: null });
  },

  noop() {},

  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },

  goRecipeList() {
    wx.navigateTo({ url: '/pages/recipe-list/recipe-list' });
  }
});
