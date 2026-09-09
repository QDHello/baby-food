# 宝宝辅食小程序（BabyFood）

面向 0-3 岁宝宝的辅食推荐与喂养记录微信小程序。原生小程序 + 微信云开发（可选）。

## 功能总览

- **按月龄推荐**：录入宝宝生日，自动计算月龄，推荐适龄食谱
- **食谱浏览**：按阶段（0-4月 / 4-6月 / 6-8月 / 8-10月 / 10-12月 / 1-2岁 / 2-3岁）筛选、搜索
- **过敏原管理**：宝宝档案标记过敏原，食谱详情自动做冲突提醒
- **食物百科**：食材营养、建议添加月龄、过敏风险
- **喂养打卡**：记录每天吃了什么、有无过敏/不适反应，按日期回顾

## 技术栈

- 微信小程序原生框架（WXML / WXSS / JS）
- 微信云开发（云函数 + 云数据库，可选启用）
- 数据当前为本地缓存 + 内置示例数据，未接云开发也能完整跑通

## 目录结构

```
BabyFood/
├── project.config.json        # 项目配置（appid 需替换）
├── miniprogram/               # 小程序主体
│   ├── app.js / app.json / app.wxss
│   ├── sitemap.json
│   ├── data/mock.js           # 示例食谱 + 食材百科数据
│   ├── utils/constants.js     # 年龄阶段、过敏原、难度常量
│   ├── utils/util.js          # 月龄计算、日期、id 工具
│   ├── services/baby.js       # 宝宝档案数据服务
│   ├── services/feeding.js    # 喂养记录数据服务
│   └── pages/
│       ├── index/             # 首页（月龄卡片 + 推荐）
│       ├── wiki/              # 食物百科
│       ├── record/            # 喂养记录
│       ├── mine/              # 我的
│       ├── recipe-list/       # 食谱列表（筛选/搜索）
│       ├── recipe-detail/     # 食谱详情（含过敏冲突提示）
│       ├── baby-list/         # 宝宝列表
│       ├── baby-edit/         # 宝宝档案编辑（生日/过敏原）
│       └── record-add/        # 喂养打卡
└── cloudfunctions/            # 云函数骨架
    ├── login/
    ├── baby/
    ├── recipe/
    └── feedingLog/
```

## 如何运行

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 「导入项目」选择本目录（`BabyFood`）
3. 在 `project.config.json` 的 `appid` 填入你自己的小程序 AppID（或用测试号）
4. 编译即可预览；当前所有数据走本地，无需配置后端

## 云开发配置（可选）

1. 开发者工具里点击「云开发」开通，创建环境，记下**环境 ID**
2. 将环境 ID 填入 `miniprogram/app.js` 的 `globalData.env`
3. 在云开发控制台创建集合：`babies`、`recipes`、`feedingLogs`
4. 右键 `cloudfunctions/` 下各函数目录 →「上传并部署：云端安装依赖」
5. 把 `miniprogram/data/mock.js` 的食谱数据导入 `recipes` 集合，即可替换本地示例数据

之后将 `services/baby.js`、`services/feeding.js` 中的本地缓存读写替换为 `wx.cloud.callFunction` 调用即可。

## 数据模型

| 集合/存储 | 字段 |
|---|---|
| `babies` | id, name, birthday, gender, allergens[], emoji |
| `recipes` | id, title, emoji, minMonths, maxMonths, desc, difficulty, allergens[], ingredients[], steps[], nutrition, tags[] |
| `feedingLogs` | id, babyId, date, recipeId, recipeTitle, emoji, reaction, note |

## 下一步（阶段 2 / 3）

- [ ] 收藏功能
- [ ] 按月龄指引页（阶段科普内容）
- [ ] 内容管理后台（运营录入食谱/百科）
- [ ] 订阅消息喂养提醒
- [ ] 分享海报
- [ ] 喂养数据统计（已尝试食材数、过敏记录）
