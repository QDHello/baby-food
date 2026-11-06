const feeding = require('../../services/feeding');
const { formatAge, canAddSolidFood, MIN_SOLID_MONTHS } = require('../../utils/util');
const { REACTIONS, MEAL_LABEL, MEAL_ORDER } = require('../../utils/constants');

const REACTION_LABEL = {};
REACTIONS.forEach((r) => { REACTION_LABEL[r.key] = r.label; });

// 首屏渲染条数，每次触底再追加一页（阶段 1 本地数据；阶段 2 可对接 feedingLog.list 的 skip/limit）
const PAGE_SIZE = 20;

// 左滑删除按钮宽度，与 record.wxss 中 .swipe-del 的 width 保持一致
const DEL_WIDTH_RPX = 140;

function mealOrder(meal) {
  return MEAL_ORDER[meal] === undefined ? 9 : MEAL_ORDER[meal];
}

Page({
  data: {
    baby: null,
    ageText: '',
    groupedLogs: [],
    totalCount: 0,
    hasMore: false,
    draggingId: ''
  },

  onLoad() {
    const { windowWidth } = wx.getSystemInfoSync();
    this._delWidth = (DEL_WIDTH_RPX * windowWidth) / 750;
    this._openIndex = null;
  },

  onShow() {
    // 保持已加载页数：编辑记录返回后不会跳回列表顶部
    this.load(true);
  },

  // 上拉触底加载下一页（页面级滚动，record.wxml 未使用 scroll-view）
  onReachBottom() {
    this.loadMore();
  },

    // keepCount：是否保留当前已加载条数（onShow / 删除后使用）
  load(keepCount) {
    const app = getApp();
    const baby = app.globalData.currentBaby;
    const logs = baby ? feeding.getLogs(baby.id) : [];

    // 全量排序结果放在实例属性上，不进 data，避免一次性把大数组传给视图层
    this._allLogs = logs.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1; // 日期倒序
      return mealOrder(a.meal) - mealOrder(b.meal);            // 组内按餐次正序
    });

    const total = this._allLogs.length;
    // 保留已加载页数，但保底渲染满一页（或全部）：新增记录返回后不会因
    // 旧 _renderCount 偏小而被隐藏，也不会误报“加载更多”
    const prevCount = keepCount && this._renderCount ? this._renderCount : 0;
    this._renderCount = Math.min(Math.max(prevCount, Math.min(PAGE_SIZE, total)), total);

    this._openIndex = null;
    this.setData({
      baby,
      ageText: baby ? formatAge(baby.birthday) : '',
      groupedLogs: this.buildGroups(),
      totalCount: total,
      hasMore: this._renderCount < total,
      // 单页内容（未超过一页）不显示任何分页提示
      showPaging: total > PAGE_SIZE,
      draggingId: ''
    });
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this._renderCount = Math.min(
      this._renderCount + PAGE_SIZE,
      (this._allLogs || []).length
    );
    this.setData({
      groupedLogs: this.buildGroups(),
      hasMore: this._renderCount < this._allLogs.length
    });
    // 阶段 2 接云时：此处改为调用 feedingLog.list({ babyId, skip: this._renderCount, limit: PAGE_SIZE })
    // 并把返回的 list 追加到 this._allLogs 后再 buildGroups()
  },

  // 只把当前页需要渲染的记录做字段加工与分组
  buildGroups() {
    const list = (this._allLogs || []).slice(0, this._renderCount).map((l) => ({
      ...l,
      reactionLabel: REACTION_LABEL[l.reaction] || l.reaction,
      mealLabel: MEAL_LABEL[l.meal] || '',
      images: Array.isArray(l.images) ? l.images : [],
      offset: 0
    }));
    return this.groupByDate(list);
  },

  // 按日期分组，最新在前；组内按餐次（早→午→晚→加餐）排序
  groupByDate(logs) {
    const map = {};
    logs.forEach((l) => {
      if (!map[l.date]) map[l.date] = [];
      map[l.date].push(l);
    });
    return Object.keys(map)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        items: map[date].sort((a, b) => mealOrder(a.meal) - mealOrder(b.meal))
      }));
  },

  goAdd() {
    const baby = this.data.baby;
    if (baby && !canAddSolidFood(baby.birthday)) {
      wx.showToast({ title: `宝宝满${MIN_SOLID_MONTHS}月龄后才能添加辅食`, icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/record-add/record-add' });
  },
  // 点击记录进入编辑
  goEdit(e) {
    // 刚结束滑动手势时忽略点击，避免误进编辑页
    if (this._ignoreTap) return;
    // 有滑开的行时，点击任意行只做收起
    if (this._openIndex) {
      this.closeOpen();
      return;
    }
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/record-add/record-add?logId=${id}` });
  },

  // ---- 左滑删除手势 ----
  onTouchStart(e) {
    const gi = Number(e.currentTarget.dataset.gi);
    const ii = Number(e.currentTarget.dataset.ii);
    const t = e.touches[0];

    if (this._openIndex && (this._openIndex.gi !== gi || this._openIndex.ii !== ii)) {
      this.closeOpen();
    }
    const item = this._itemAt(gi, ii);
    this._touch = {
      gi,
      ii,
      startX: t.clientX,
      startY: t.clientY,
      startOffset: item ? item.offset || 0 : 0,
      horizontal: false,
      moved: false
    };
  },

  onTouchMove(e) {
    const touch = this._touch;
    if (!touch) return;
    const t = e.touches[0];
    const dx = t.clientX - touch.startX;
    const dy = t.clientY - touch.startY;

    if (!touch.horizontal) {
      if (Math.abs(dx) < 6) return;
      // 纵向移动优先交给页面滚动
      if (Math.abs(dy) > Math.abs(dx)) return;
      touch.horizontal = true;
      const item = this._itemAt(touch.gi, touch.ii);
      if (!item) return;
      this.setData({ draggingId: item.id });
    }

    touch.moved = true;
    const width = this._delWidth || 70;
    const offset = Math.max(-width, Math.min(0, touch.startOffset + dx));
    this._setOffset(touch.gi, touch.ii, offset);
  },

  onTouchEnd() {
    const touch = this._touch;
    this._touch = null;
    if (!touch || !touch.horizontal || !touch.moved) return;

    const width = this._delWidth || 70;
    const item = this._itemAt(touch.gi, touch.ii);
    const offset = item ? item.offset || 0 : 0;
    const open = offset < -width / 2;

    this._openIndex = open ? { gi: touch.gi, ii: touch.ii } : null;
    // 先恢复过渡，再落位，松手时才有吸附动画
    this.setData({ draggingId: '' }, () => {
      this._setOffset(touch.gi, touch.ii, open ? -width : 0);
    });

    this._ignoreTap = true;
    setTimeout(() => { this._ignoreTap = false; }, 300);
  },

  closeOpen() {
    if (!this._openIndex) return;
    const { gi, ii } = this._openIndex;
    this._openIndex = null;
    this._setOffset(gi, ii, 0);
  },

  _itemAt(gi, ii) {
    const group = this.data.groupedLogs[gi];
    return group && group.items ? group.items[ii] : null;
  },

  _setOffset(gi, ii, offset) {
    this.setData({ [`groupedLogs[${gi}].items[${ii}].offset`]: offset });
  },
  // 预览记录图片
  onPreviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    wx.previewImage({ current, urls });
  },
  goBaby() {
    wx.navigateTo({ url: '/pages/baby-list/baby-list' });
  },
  removeLog(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条喂养记录吗？',
      success: (res) => {
        if (res.confirm) {
          feeding.removeLog(id);
          this.load(true);
        }
      }
    });
  }
});
