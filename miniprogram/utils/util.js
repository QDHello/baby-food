// 公共工具函数
const { STAGES } = require('./constants');

// 根据生日计算月龄（返回 { months, days, years }）
function calcMonthAge(birthday) {
  if (!birthday) return { months: 0, days: 0, years: 0 };
  const birth = new Date(birthday.replace(/-/g, '/'));
  const now = new Date();
  if (isNaN(birth.getTime())) return { months: 0, days: 0, years: 0 };

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const restMonths = months % 12;
  const days = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (24 * 3600 * 1000)));

  return { months, days, years, restMonths };
}

// 根据月龄获取所处阶段
function getStage(months) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (months >= STAGES[i].min) return STAGES[i];
  }
  return STAGES[0];
}

// 月龄显示文案：如 "8个月10天" / "1岁2个月"
function formatAge(birthday) {
  const { months, days, years, restMonths } = calcMonthAge(birthday);
  if (months < 12) {
    return days === 0 ? `${months}个月` : `${months}个月${days % 30}天`;
  }
  return restMonths === 0 ? `${years}岁` : `${years}岁${restMonths}个月`;
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 生成唯一 id
function genId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { calcMonthAge, getStage, formatAge, formatDate, genId };
