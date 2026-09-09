const { ALLERGENS, MAJOR_ALLERGENS } = require('../../utils/constants');
const { formatAge, formatDate } = require('../../utils/util');
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
      }
    }
  },

  onName(e) {
    this.setData({ name: e.detail.value });
  },
  onBirthday(e) {
    this.setData({ birthday: e.detail.value });
    this.updateAge();
  },
  onGender(e) {
    this.setData({ gender: e.currentTarget.dataset.gender });
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
