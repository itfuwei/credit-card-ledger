# 信用卡管理前端规则

## 项目定位

`credit-card-ledger` 是信用卡管理系统的前端项目，后端使用 Supabase BaaS（PostgreSQL + Auth + Auto REST API），不编写独立后端服务。

当前功能范围：

- 用户注册与登录（Supabase Auth，邮箱密码方式）
- 信用卡档案展示与管理
- 交易流水录入、编辑、删除和查询
- 额度占用与剩余额度展示
- 已出账与未出账计算
- 账单周期、预计出账日和还款日计算
- 还款计划与实际还款记录
- 活动管理与积分商品管理
- 云端数据持久化（Supabase）、JSON 导入和导出

## 技术栈

- Vue 3
- Vite
- JavaScript，不引入 TypeScript
- Composition API 和 `<script setup>`
- Element Plus，作为表单、表格、弹窗、抽屉、分页、状态标签和反馈组件库
- `@element-plus/icons-vue`，作为唯一的项目图标来源
- 项目原生 CSS，负责应用框架、页面布局、业务卡片和品牌视觉
- `@supabase/supabase-js`，作为 Supabase 客户端 SDK

不要擅自改用 React、Nuxt、TypeScript 或其他前端框架。

## 项目结构

项目采用按职责分层、页面按业务组合的结构：

```text
src/
├── app/
│   ├── App.vue              # 只负责应用装配，不编写页面业务
│   └── navigation.js        # 前端导航定义
├── assets/
│   └── styles/
│       ├── tokens.css       # 设计变量及 Element Plus 主题变量
│       ├── base.css         # 重置和全局基础样式
│       └── utilities.css    # 少量跨页面工具样式
├── components/
│   ├── layout/              # 侧栏、顶栏、应用框架
│   ├── cards/               # 信用卡业务组件
│   ├── dashboard/           # 总览业务组件
│   └── transactions/        # 流水表格和录入表单
├── composables/
│   ├── useAuth.js           # 认证状态和登录/注册/退出
│   └── useLedger.js         # 页面共享的应用状态和业务编排
├── data/
│   └── seed.js              # 明确标注的虚构种子数据
├── domain/
│   ├── billing.js           # 账单周期纯函数
│   └── ledger.js            # 汇总和派生数据纯函数
├── lib/
│   └── supabaseClient.js    # Supabase 客户端初始化
├── repositories/
│   └── ledgerRepository.js  # Supabase 数据访问边界
├── utils/
│   ├── caseConvert.js       # camelCase ↔ snake_case 转换
│   └── jsonTransfer.js      # JSON 导入导出工具
├── views/
│   ├── LoginView.vue        # 登录注册页
│   └── DashboardView.vue    # 页面级布局与业务组件组合
└── main.js                  # Vue、Element Plus 和全局样式入口
```

- 不为追求目录形式过度拆分小组件。
- 业务计算不得散落在模板表达式和多个组件中。
- 与 Vue 无关的账单、日期、金额规则放在 `src/domain/`，保持纯函数并可独立测试。
- 数据读写通过 `src/repositories/` 隔离，页面不直接依赖 localStorage 或未来 API 的实现细节。
- `src/app/App.vue` 保持轻量，只装配应用布局和当前视图；禁止把表格、弹窗、领域计算和大段样式重新堆回根组件。
- 页面组件负责组合，不直接执行持久化；业务组件聚焦单一工作流；领域模块不得依赖 Vue 或 Element Plus。

## Element Plus 使用规则

- 表单、输入框、选择器、日期选择器、数字输入、表格、抽屉/弹窗、标签、确认框、消息提示、分页和空状态优先使用 Element Plus。
- 应用侧栏、页面标题、指标区、信用卡状态卡等领域视觉使用项目组件和原生 CSS，不强行套用通用卡片组件。
- Element Plus 主题变量统一定义在 `src/assets/styles/tokens.css`，不要在组件中散落覆盖同一主题值。
- 所有基础交互与布局优先使用 Element Plus 组件，包括 `ElContainer`、`ElMenu`、`ElCard`、`ElRow`、`ElCol`、`ElButton`、`ElForm`、`ElTable`、`ElDrawer` 和反馈组件；原生元素只用于 Element Plus 无法表达的业务展示结构。
- 图标统一使用 `@element-plus/icons-vue`，通过 `ElIcon` 进行渲染；禁止新增或保留 `lucide-vue-next` 引用。
- 第一阶段可以完整引入 Element Plus，稳定后再根据构建体积决定是否改为自动按需导入。
- 不通过复制 Element Plus 内部 DOM 结构或私有类实现功能。

## 依赖版本规则

- `package.json` 中的每个直接依赖必须显式指定版本或版本范围，禁止使用 `latest`、`*` 或未标版本的依赖。
- 新增依赖前先确定目标版本，并同步更新 `package-lock.json`。
- 不擅自升级用户已经指定的版本；升级前说明兼容性影响，升级后运行构建和相关验证。

## 数据与后端边界

- 后端使用 Supabase BaaS，不创建独立的 Node.js / Fastify 后端服务。
- 前端通过 `@supabase/supabase-js` SDK 直接读写 Supabase 数据库。
- 数据库表结构 SQL 存放在 `supabase/migrations/` 中，需手动复制到 Supabase SQL Editor 执行。
- repository 方法使用 REST API 语义（`listCards`、`createTransaction` 等），内部通过 Supabase SDK 实现。
- 前端只持有 Supabase anon key（公开密钥，配合 RLS 使用），不持有 service_role key。
- 用户数据通过 Row Level Security 隔离，每张表的 `user_id` 列限制用户只能操作自己的数据。
- 前端可以为了即时反馈计算账单结果，但数据库中的持久化数据是最终可信数据。
- 环境变量从 `import.meta.env` 读取，不在代码中硬编码 Supabase URL 和密钥。
- 新增环境变量时同步维护 `.env.example`，其中只能放占位值。

## 核心业务约定

### 信用卡

至少包含：

- `id`
- `bank`
- `name`
- `last4`
- `limit`
- `statementDay`
- `paymentDay`
- `status`

不得收集或展示完整卡号、CVV、密码或验证码。

### 交易流水

至少包含：

- `id`
- `cardId`
- `date`
- `amount`
- `fee`
- `note`
- `createdAt`

界面使用“交易”或“资金使用”等中性描述。

### 账单计算

- 账单计算统一调用 `src/domain/billing.js` 或其后续拆分模块。
- 交易日在账单日当天时，默认归入当期账单；账单日次日起归入下期账单。
- 还款日在账单日之前或等于账单日时，默认属于下一个自然月。
- 29、30、31 日遇到短月份时取当月最后一天。
- 已出账和未出账是根据当前日期与账单周期得出的计算状态，避免重复维护相互矛盾的数据。
- 跨月、跨年、闰年、月末和账单日当天必须有测试覆盖。

### 金额

- 展示统一使用人民币格式。
- 不使用二进制浮点数执行最终财务结算。
- 当前原型可以接受表单小数输入，但进入持久化层前应转换为“分”的整数；未来 API 也优先传输最小货币单位整数。

## 交互与视觉

- 产品是高频管理工具，界面保持安静、紧凑、易扫描，不设计成营销落地页。
- 桌面端优先支持总览、卡片比较和流水表格；移动端优先支持快速录入、还款提醒和单卡查看。
- 颜色用于表达状态：正常、临近、紧急、逾期必须有文字标签，不能只依赖颜色。
- 图标使用 `@element-plus/icons-vue`，不手绘组件库已提供的通用图标。
- 表单必须包含标签、校验、错误反馈、加载状态和防重复提交处理。
- 所有关键操作都要考虑空状态、失败状态和数据较多时的表现。
- 中文文本不得被按钮、卡片或表格单元格截断或遮挡。

## JavaScript 与 Vue 规范

- 每个源码文件的第一行必须是文件职责注释，清楚说明该文件解决什么问题：`.js` 使用 `//`，`.vue` 使用 `<!-- -->`，`.css` 使用 `/* */`。例如：`// 负责计算交易所属账单周期与预计还款日。`
- 源码中的关键业务逻辑必须添加中文注释，说明“为什么这样做”、关键输入输出、边界条件或不变量；例如账单日当天归属、跨月还款日、金额由元转换为分、localStorage 迁移和前后端职责边界。
- 不为显而易见的单行语法、模板标签或变量赋值添加重复注释。注释应补充信息，不能只是把代码翻译成中文。
- 修改既有文件时，若该文件尚无文件职责注释，必须补上；若改动涉及复杂业务逻辑，应同时补充或更新对应注释。
- 注释应与代码同步维护。代码行为发生变化而注释不再准确时，必须在同一次修改中更新或删除注释。
- 使用现代 ES Modules。
- 优先使用 `const`，需要重新赋值时使用 `let`，不使用 `var`。
- 组件使用 `<script setup>` 和 Composition API。
- 派生状态使用 `computed`，不要复制一份可由现有状态计算的数据。
- 副作用集中在 composable、repository 或明确的生命周期代码中。
- 不直接修改 props。
- 列表渲染使用稳定业务 ID 作为 `key`。
- 日期解析不要依赖含糊的浏览器本地字符串行为；明确处理本地自然日和时区。
- 复杂函数保持单一职责，并为边界行为添加简短说明或测试。

## 质量要求

- 每次功能改动后运行 `npm run build`。
- 账单领域规则变更后运行对应单元测试；尚未建立测试工具时，至少添加可重复执行的 Node 测试，并尽快补齐 Vitest。
- 完成功能前检查桌面与移动视口，确保无重叠、无横向溢出和关键内容截断。
- 不提交 `node_modules`、构建目录、真实用户数据或包含密钥的 `.env`。
- 新增环境变量时同步维护 `.env.example`，其中只能放占位值。
