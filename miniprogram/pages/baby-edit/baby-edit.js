const { ALLERGENS, MAJOR_ALLERGENS } = require('../../utils/constants');
const { formatAge, formatDate, canAddSolidFood } = require('../../utils/util');
const babyService = require('../../services/baby');

const EMOJIS = ['👶', '👧', '👦', '🐣', '🍼', '😊'];

// 过敏原选项：major 标记预计算；checked 状态在数据中维护（WXML 不支持 indexOf 等方法调用）
const ALLERGEN_ITEMS = ALLERGENS.map((name) => ({
  name,
  major: MAJOR_ALLERGENS.indexOf(name) >= 0
}));

Page({
  data: {
    id: null,
    name: '',
    birthday: '',
    today: formatDate(new Date()),
    gender: '男',
    allergens: [],
    emoji: '👶',
    emojis: EMOJIS,
    allergenItems: ALLERGEN_ITEMS,
    agePreview: ''
  },

  onLoad(options) {
    if (options.id) {
      const baby = babyService.getBabies().find((b) => b.id === options.id);
      if (baby) {
        const allergens = baby.allergens || [];
        this.setData({
          id: baby.id,
          name: baby.name || '',
          birthday: baby.birthday || '',
          gender: baby.gender || '男',
          allergens,
          emoji: baby.emoji || '👶',
          allergenItems: ALLERGEN_ITEMS.map((i) => ({ ...i, checked: allergens.indexOf(i.name) >= 0 }))
        });
        this.updateAge();
        // 编辑模式：进入页面时头像与月龄/性别规则对齐（<6 月龄→奶瓶，否则按性别）
        this.syncAvatarEmoji(false);
      }
    }
  },

  onName(e) {
    this.setData({ name: e.detail.value });
  },
  onBirthday(e) {
    const birthday = e.detail.value;
    this.setData({ birthday });
    this.updateAge();
    // 联动头像：未满 6 月龄→奶瓶；满 6 月龄→按性别匹配（静默，不 toast）
    this.syncAvatarEmoji(false);
  },
  onGender(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({ gender });
    // 用户主动点性别：按性别匹配并提示
    this.syncAvatarEmoji(true);
  },
  // 头像自动匹配统一入口：月龄规则优先（<6 月龄→🍼 奶瓶），否则按性别→👧/👦
  syncAvatarEmoji(showToast) {
    const { birthday, gender, emoji } = this.data;
    const underSix = birthday && typeof canAddSolidFood === 'function' && !canAddSolidFood(birthday);
    const next = underSix ? '🍼' : (gender === '女' ? '👧' : '👦');
    if (next !== emoji) {
      this.setData({ emoji: next });
      if (showToast && !underSix) {
        wx.showToast({ title: `已匹配${gender === '女' ? '女' : '男'}宝宝头像`, icon: 'none' });
      }
    }
  },
  onEmoji(e) {
    this.setData({ emoji: e.currentTarget.dataset.emoji });
  },
  updateAge() {
    this.setData({
      agePreview: this.data.birthday ? formatAge(this.data.birthday) : ''
    });
  },
  toggleAllergen(e) {
    const name = e.currentTarget.dataset.name;
    const allergenItems = this.data.allergenItems.map((i) =>
      i.name === name ? { ...i, checked: !i.checked } : i
    );
    this.setData({
      allergenItems,
      allergens: allergenItems.filter((i) => i.checked).map((i) => i.name)
    });
  },

  save() {
    const { id, name, birthday, gender, allergens, emoji } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请输入宝宝昵称', icon: 'none' });
      return;
    }
    if (!birthday) {
      wx.showToast({ title: '请选择生日', icon: 'none' });
      return;
    }
    const data = { name: name.trim(), birthday, gender, allergens, emoji };
    if (id) {
      babyService.updateBaby(id, data);
    } else {
      babyService.createBaby(data);
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  }
});
