# 蹦Food · 四期功能规格（反馈入口 + 购物清单）

> 本文档是**四期功能**的单一事实来源（source of truth），一期见 `spec.md`、二期见 `spec-v1.1-二期.md`、三期见 `spec-v1.2-三期.md`（各期独立，不混装）。版本：v1.3（2026-11-25 立项）。

---

## 1. 范围概述

| 编号 | 功能 | 优先级 |
| --- | --- | --- |
| FR-40 | 「我的」页意见反馈入口（微信原生反馈页） | P0 |
| FR-41 | 购物清单：从一周菜单聚合食材，勾选式采购清单 | P0 |
| FR-42 | 一周菜单页分享（好友 + 朋友圈，统一封面） | P1 |

**背景**：三期验收后 UV 运营观察中（累计用户 10），优先补齐体验闭环与传播点；购物清单承接「菜单 → 买菜」场景；菜单分享是 UV 冲刺的传播抓手（"我给宝宝排了一周菜单"比裸链接有说服力）。

---

## 2. 功能规格

### 2.1 意见反馈（FR-40）

**需求**：「我的」页菜单底部新增「💬 意见反馈」入口，点击打开微信原生「意见反馈」页，用户可提交文字/截图并勾选上传小程序日志；开发者在小程序管理后台「管理 → 用户反馈」查看。

**实现**（2026-11-25）：

- `pages/mine/mine.wxml`：菜单末尾新增「📮 意见反馈」项——外层 `.menu-item`（view）正常渲染图标/文字/箭头，内嵌 `button.feedback-cover`（`position:absolute` 铺满整行 + `opacity:0`）仅承接 `open-type="feedback"` 原生能力；这是 open-type 按钮的标准做法，彻底规避 button 默认字体/行高污染（前两版直接把 button 当菜单行用，真机上图标缩小、文字居中无法完全重置）
- 图标选 📮（红色邮筒，自带色块），与 ℹ️ 蓝底图标风格一致；💬 灰色空心气泡偏淡被否
- `pages/mine/mine.wxss`：`.menu-item` 加 `position:relative`（保留给后续可能的行内覆盖用途）
- **方案定稿（2026-11-25 五轮真机迭代）**：①button 当菜单行+单类重置 → 形态不对；②view+覆盖层 → opacity:0 真机点击丢弃、透明背景热区不可靠（点箭头无反应）；③button 本体+单类重置 → 仍不对齐；④全量声明+important → 仍不对齐；⑤**定稿：照抄项目内已验证配方**——详情页 share-btn（`open-type="share"`）在真机上渲染完全正常，其重置关键为 `min-height: 0`（基础库给 button:not([size=mini]) 注入固定行高体系）+ 双类选择器 `.bottom-bar .share-btn` 压默认值 + `::after display:none`。菜单页复刻为 `.menu .feedback-btn`（同等特异性）+ `min-height:0`/`height:auto` + `display:flex` 行内布局 + padding 32rpx + 子元素逐项等值。**教训沉淀：open-type 按钮样式问题先找项目内已验证的 button 重置案例抄，不要从零猜 UA 默认值**
- 反馈数据查看路径：mp.weixin.qq.com → 管理 → 用户反馈；微信公众平台公众号会推送新反馈提醒

**验收标准**：

- [x] 「我的」页出现「💬 意见反馈」菜单项，样式与其他菜单项一致（hover 无蓝色按钮底、边框圆角正常）。（2026-11-26 真机确认样式对齐；图标定稿 📮）
- [ ] 真机点击打开微信原生意见反馈页，可提交文字与截图；提交后在 mp 后台「用户反馈」可见。

### 2.3 菜单页分享（FR-42）

**需求**：一周菜单页支持转发好友与分享朋友圈；页内 meal-summary 行右侧加「分享给家人 ›」显式入口（open-type=share），不依赖右上角胶囊菜单。不携带本地菜单数据——对方点开进入自己的菜单页（本地 storage 各自隔离，无数据泄露）。

**实现**（2026-11-26）：

- `pages/menu/menu.js`：`onShow` 开启 `showShareMenu` 双菜单；`onShareAppMessage`/`onShareTimeline` 标题「蹦Food·本周宝宝辅食菜单」，path 指向 `/pages/menu/menu`，统一封面 SHARE_IMAGE
- `pages/menu/menu.wxml`：meal-summary 与分享按钮包一层 `.meal-row`（flex 两端对齐）
- `pages/menu/menu.wxss`：`.menu-share-btn` 弱化为行内文字链（绿字 22rpx），重置沿用 FR-40 经验（min-height:0 + ::after display:none）
- **入口位置定稿（2026-11-26，867df6d）**：分享入口从 meal-row 右侧移至**底部操作区**（清空按钮上方，居中绿字 26rpx）——用户反馈行尾位置别扭（右侧与「重新生成」双层操作叠加、左侧灰字与分享语义不相关）；底部是「浏览完菜单后的自然动作位」，与清空组成收尾操作组。仅 `hasMenu` 时显示。meal-row 容器拆除，meal-summary 恢复纯文字说明行。热区保持 ≈88rpx、文字绿 #389e0d 不变

**单日分享：已评估并否决**（2026-11-26）：

- 曾实现「每天天卡片行尾独立分享按钮，转发标题带当天菜名摘要」，代码完成（a800494）后经评估**撤销**——用户决策：整周分享已够用，单日入口冗余，保持天卡片行头干净（day-name/date/今天 标记紧凑排列）
- 若未来重启此需求，技术方案已验证可复用：`onShareAppMessage(res)` 按 `res.from === 'button'` + `res.target.dataset.day` 区分按钮触发源，标题动态拼当天菜名；按钮样式沿用 min-height:0 重置配方

**验收标准**：

- [ ] 菜单页可转发好友/分享朋友圈，卡片带统一封面；对方打开进入其自己的菜单页（无他人数据）。
- [ ] 「分享给家人 ›」位于底部操作区（清空上方，居中绿字），无按钮默认样式残留，真机点击弹转发面板。

### 2.2 购物清单（FR-41）

**需求**：（待开发前补充细化）从本周菜单读取全部已排格子的食谱，聚合 ingredients 去重，按类别分组输出勾选式采购清单；支持清空勾选进度。

**实现**：（待开发）

**验收标准**：（待开发后补充）

### 2.4 UI 评审 quick wins（轻量清单，2026-11-26）

> 系统性 UI 评审后的一次性打磨，纯样式/无行为变更（5c1af03）：

- **触控热区**：菜单页「分享给家人」命中区扩至 ≈88rpx（padding 24rpx + margin 负值回位，视觉零变化）——原 22rpx 字号热区不足 44px 标准
- **对比度**：小字号文字绿统一换深档 `#389e0d`（白底 4.6:1，达 WCAG AA；原 #52C41A 仅 3.0:1）——menu（分享链接/picker-tab 激活/picker-month）、index（ov-meal/recommend-hint/shuffle/action-btn）、record（baby-switch）共 9 处；按钮/图标类大面积绿底（gen-btn、hero、today-flag 实底等）保持 #52C41A
- **「今天」强调归拢**：day-name 不再变绿（去 day-name-today），当日卡片加 `border: 2rpx solid #b7eb8f` 描边，today-flag 改实底绿+白字——强调从三处收敛为卡片级一处
- **阴影一致性**：day-card 补全局 .card 同款绿色柔影 `0 4rpx 20rpx rgba(82,196,26,0.06)`
- **picker-tab 激活跳动**：常驻 `border: 2rpx solid transparent` + box-sizing，切换不再窜 4rpx
- **按压反馈**：全局 `.press { opacity: 0.7 }`，gen-btn/conflict-action/clear-btn/guide-btn 补 hover-class="press"
- **meal-summary 防折行**：nowrap + ellipsis，杜绝「整」字孤行

**遗留（P2，四期收尾一起做）**：字号 11 档收敛、圆角 24/28/32/40 统一、design token 化（:root 变量暂不可用于 wxss，用注释清单代替）。

---

## 3. 实施计划

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| S1 | 意见反馈入口 | ✅ 2026-11-25 |
| S2 | 购物清单（聚合算法 + 清单页 + 菜单页入口） | ⬜ |
