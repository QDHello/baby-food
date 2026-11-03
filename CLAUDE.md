# CLAUDE.md

宝宝辅食小程序（BabyFood）：面向 0-3 岁宝宝的辅食推荐与喂养记录微信小程序。原生小程序（WXML/WXSS/JS）+ 微信云开发（可选）。

## 开发工作流（spec 驱动）

需求唯一事实来源是 `docs/spec.md`。任何功能开发/改动，按以下顺序执行：

1. **先补 spec**：在 `docs/spec.md` 对应小节写清「需求 → 数据字段 → 验收标准」。
2. **出实现计划**：列出要改的文件、要加/改的字段，和用户确认后再写代码。
3. **实现**：按计划改动。
4. **对照验收**：完成后逐条核对 spec 的验收标准，勾选 `[ ]`。

数据模型变更必须同步更新 `docs/spec.md` 第 4 节。本文件只约定「怎么工作」，不重复需求内容。

## 技术约束

- **数据现状**：`miniprogram/data/mock.js` 为内置示例数据；`services/baby.js`、`services/feeding.js` 走本地缓存；`cloudfunctions/` 已建骨架但**未接数据流**。
- **WXML 模板不支持数组方法调用**：`indexOf` / `join` / `includes` 等需在 JS 里预计算后再绑定。
- **类名用英文 key**：CSS / WXML 类名用英文，中文 label 仅用于展示文案。
- **Tabbar 图标**：线稿（描边）风格，243×243 透明底 PNG，位于 `miniprogram/images/tabbar/`；未选中灰色 `#999999`、选中橙色 `#FF7043`。
