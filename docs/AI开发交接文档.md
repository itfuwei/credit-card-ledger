# 信用卡账本前端 AI 开发交接文档

> 更新时间：2026-07-31  
> 项目路径：`/Users/haofuwei/Desktop/老弟/credit-card-ledger`  
> 当前阶段：仅前端、本地存储原型；禁止自行创建后端

## 1. 给后续 AI 的执行指令

开始开发前必须依次阅读：

1. 工作区规则：`/Users/haofuwei/Desktop/老弟/AGENTS.md`
2. 项目规则：`/Users/haofuwei/Desktop/老弟/credit-card-ledger/AGENTS.md`
3. 本交接文档
4. 与任务相关的源码和 `docs/需求文档.md`

实施要求：

- 当前只开发 `credit-card-ledger` 前端。
- 用户明确宣布前端完成并要求开发后端之前，不得创建 `credit-card-ledger-api`、数据库、服务端脚手架或部署配置。
- 技术栈保持 Vue 3、Vite、JavaScript、Composition API、Element Plus。
- 不改成 React、Nuxt、TypeScript，也不要替换现有组件库。
- 页面不得直接读写 `localStorage`，所有持久化操作通过 repository。
- 账单、金额、活动等纯业务规则应放在 `src/domain/`，不得散落到 Vue 模板。
- 每个源码文件第一行必须有中文职责注释。
- 不保存或展示完整卡号、CVV、密码、验证码等敏感信息。
- 每次功能改动后至少运行 `npm run build`；账单或金额规则变更还应执行对应的可重复 Node 验证或补测试。
- 工作区可能包含用户未提交的改动和真实本地数据，不得擅自清理、覆盖或重置。

## 2. 项目目标与边界

这是一个个人信用卡账本前端，用于管理：

- 信用卡档案、额度、账单日、还款日
- 交易流水及手续费
- 已出账、未出账、当前占用、剩余额度
- 按账期生成的还款计划和实际还款记录
- 信用卡活动、达标进度、奖励领取状态
- 积分评价、兑换路径和值得兑换的商品
- 信用卡和交易流水 JSON 导入、导出

当前数据仅保存在浏览器 `localStorage`。没有登录、用户体系、云同步、REST API、数据库或真实服务端。未来后端候选技术栈是 Node.js + Fastify + PostgreSQL + Drizzle ORM，但当前不得实施。

## 3. 运行环境

- 推荐 Node.js：22（此前使用 `v22.16.0` 验证）
- 包管理器：npm
- 主要依赖：Vue 3、Vite 8、Element Plus、`@element-plus/icons-vue`
- 项目没有 Vue Router，导航由根组件内的响应式状态切换
- 项目尚未配置 Vitest 或正式测试命令

常用命令：

```bash
cd /Users/haofuwei/Desktop/老弟/credit-card-ledger
source ~/.nvm/nvm.sh
nvm use 22
npm install
npm run dev
npm run build
```

构建当前可通过，但 Vite 会提示主 JavaScript chunk 超过 500 kB。这是已知警告，不是构建失败。

## 4. 架构与数据流

```text
页面/业务组件
    ↓ 调用
useLedger.js（共享状态、业务编排、成功提示）
    ↓ 调用
ledgerRepository.js（localStorage 读写边界）

页面/组件
    ↓ 使用派生结果
domain/*.js（账期、汇总、活动、导入校验、手续费等纯函数）
```

关键点：

- `src/app/App.vue` 是应用装配中心，管理当前导航和全局交易抽屉。
- `src/composables/useLedger.js` 使用模块级 `ref` 作为单例状态，多个页面共享同一份数据。
- `src/repositories/ledgerRepository.js` 是当前唯一持久化实现。
- `localStorage` key 为 `credit-card-ledger:v1`。
- 首次没有本地数据时使用 `src/data/seed.js`；当前四组 seed 都是空数组。
- 损坏的本地 JSON 会静默回退到空 seed，目前不会向用户显示恢复警告。
- repository 方法使用接近未来 REST API 的语义，后续替换服务端时应尽量保持 composable 调用边界。

## 5. 目录与关键文件

```text
src/
├── app/
│   ├── App.vue                     # 页面装配、全局交易抽屉、快捷添加交易
│   └── navigation.js              # 总览/信用卡/交易/还款/活动导航
├── components/
│   ├── activities/ActivityDrawer.vue
│   ├── cards/
│   │   ├── CardDirectory.vue       # 信用卡表格和操作入口
│   │   ├── CardDrawer.vue          # 新增/编辑信用卡
│   │   ├── CardStatusGrid.vue      # 总览信用卡状态卡
│   │   └── PointsProductsDrawer.vue
│   ├── dashboard/MetricGrid.vue
│   ├── layout/AppShell.vue
│   ├── repayments/
│   │   ├── RepaymentDrawer.vue
│   │   └── RepaymentPlanTable.vue
│   └── transactions/
│       ├── TransactionDrawer.vue   # 新增/编辑交易、手续费快捷计算
│       └── TransactionTable.vue
├── composables/useLedger.js        # 全局共享账本状态与 CRUD 编排
├── data/seed.js                    # 当前为空的虚构初始数据
├── domain/
│   ├── activity.js                 # 活动互斥状态
│   ├── billing.js                  # 账期和日期规则
│   ├── cardAppearance.js           # 银行主题色
│   ├── importData.js               # JSON 导入清洗与校验
│   ├── ledger.js                   # 卡片汇总、流水增强、还款计划
│   └── transactionFee.js           # 手续费快捷计算
├── repositories/ledgerRepository.js
├── utils/jsonTransfer.js           # JSON 上传解析和下载
└── views/
    ├── DashboardView.vue
    ├── CardsView.vue
    ├── TransactionsView.vue
    ├── RepaymentsView.vue
    └── ActivitiesView.vue
```

## 6. 当前已实现页面

### 6.1 总览

- 汇总卡片数、总额度、当前占用、已出账、未出账。
- 每张卡显示银行、卡名、后四位、占用、剩余额度、账单拆分、账单日、还款日和还款倒计时。
- 卡片可按还款日、距还款日、账单日、已用额度、可用额度、总额度、积分等级排序。
- 默认按每月还款日正序，不是按“距离下次还款日期”排序。
- 银行名称后有一个加号；悬停显示“添加交易”。点击后打开交易抽屉，预选并锁定当前卡片。
- 活动和积分商品以紧凑图标及悬浮信息展示。

### 6.2 信用卡

- 新增、编辑、启用/停用、删除信用卡。
- 有关联交易的卡片禁止删除。
- 每张卡有“记录交易”快捷操作，打开后锁定当前卡片。
- 管理积分评价、兑换路径和优质兑换商品。
- 未设置颜色时按银行名称自动匹配主题色，手动颜色优先。
- 支持信用卡 JSON 导入、导出。

### 6.3 交易流水

- 新增、编辑、删除、搜索、按卡片/日期范围/账单状态筛选、分页。
- 交易表单选择卡片后只读展示该卡账单日和还款日。
- 快捷卡片入口打开时，信用卡不可切换；普通入口仍可选择卡片。
- 手续费可手动填写，也可按交易金额的万分之 22、25、29 快捷计算。
- 快捷手续费按“分”向上取整，例如不足一分钱按一分钱计算。
- 支持交易流水 JSON 导入、导出。

### 6.4 还款计划

- 仅对已经到达账单日的交易生成还款计划。
- 按信用卡和账单期汇总。
- 支持计划中、临近、紧急、逾期等状态。
- 可记录和删除实际还款。
- 实际还款优先冲减该卡最早到期的已出账账期。

### 6.5 活动

- 新增、编辑、删除信用卡活动。
- 记录活动期、消费门槛、奖励、领取入口、领取期和领取结果。
- 活动消费进度按活动日期范围内的交易金额计算。
- 活动状态互斥：进行中、未达标、待领取、可领取、已过期、已领取。

## 7. 核心数据模型

### 7.1 Card

```js
{
  id: string,
  bank: string,
  name: string,
  last4: string,              // 恰好四位数字，只保存后四位
  limitFen: integer,          // 内部存储单位：分
  statementDay: integer,      // 1..31
  paymentDay: integer,        // 1..31
  color: string,
  status: 'active' | 'inactive',
  hasCheckIn: boolean,
  pointsRating: 'good' | 'average' | 'poor',
  pointsRedemptionPath: string,
  pointsProducts: PointProduct[]
}
```

### 7.2 PointProduct

```js
{
  id: string,
  name: string,
  pointsCost: integer,
  cashValueFen: integer,
  note: string
}
```

### 7.3 Transaction

```js
{
  id: string,
  cardId: string,
  date: 'YYYY-MM-DD',
  amountFen: integer,         // 分
  feeFen: integer,            // 分；当前不计入额度占用和待还本金
  note: string,
  createdAt: ISO8601String
}
```

交易记录不保存账单日、还款日或计算后的账期快照。所有历史交易始终使用当前信用卡档案规则重新计算。

### 7.4 Repayment

```js
{
  id: string,
  cardId: string,
  date: 'YYYY-MM-DD',
  amountFen: integer,
  note: string,
  createdAt: ISO8601String
}
```

### 7.5 Activity

```js
{
  id: string,
  cardId: string,
  title: string,
  startDate: 'YYYY-MM-DD',
  endDate: 'YYYY-MM-DD',
  thresholdFen: integer,
  rewardType: 'points' | 'cash' | 'coupon' | 'gift' | 'other',
  rewardDescription: string,
  claimPath: string,
  claimStartDate: 'YYYY-MM-DD',
  claimEndDate: 'YYYY-MM-DD',
  claimed: boolean,
  claimedAt: string,
  createdAt: ISO8601String
}
```

## 8. 账单和金额规则

### 8.1 账期归属

当前明确采用以下规则：

```text
上一个账单日次日 <= 交易日期 <= 本期账单日
```

- 账单日当天的交易归入当期。
- 账单日次日开始归入下一期。
- 例如账单日为 15 日：6 月 16 日至 7 月 15 日归入 7 月 15 日账单。
- 真实银行可能按入账时间处理，但当前模型只有自然日，不记录交易时间或入账日期。

### 8.2 还款日

- `paymentDay > statementDay`：还款日在同一个自然月。
- `paymentDay <= statementDay`：还款日在下一个自然月。
- 账单日或还款日为 29、30、31 时，短月份收敛到该月最后一天。

### 8.3 已出账与未出账

- 预计账单日不晚于“今天”的交易进入已出账。
- 未出账 = 当前占用 - 已出账。
- 还款先从总占用中扣减，并优先冲减已出账部分。
- 金额不会显示为负数，计算使用 `Math.max(0, ...)`。

### 8.4 金额单位

- 应用内部、repository、交易 JSON：整数“分”。
- Vue 表单：用户输入“元”，提交前转换为整数“分”。
- 展示：最终格式化为人民币元。
- 禁止使用浮点金额做累计业务计算。

### 8.5 手续费快捷计算

`src/domain/transactionFee.js`：

```js
feeFen = Math.ceil(amountFen * rate / 10000)
```

支持费率 `22`、`25`、`29`，分别表示万分之 22、25、29。结果向上取整到整分。

## 9. JSON 导入、导出契约

统一文件外壳：

```json
{
  "schemaVersion": 1,
  "type": "cards 或 transactions",
  "exportedAt": "ISO 8601 时间",
  "data": []
}
```

导入也接受直接以数组作为根节点。

### 9.1 合并语义

- 有 `id`：按相同 ID 更新/覆盖现有记录。
- 无 `id`：导入校验阶段使用 `crypto.randomUUID()` 自动生成，作为新记录导入。
- 交易的 `cardId` 必填，且必须引用当前已经存在的信用卡。
- 若先导入无 ID 信用卡，再导入交易，需要先导出信用卡以取得系统生成的卡片 ID。

### 9.2 极易误解的额度单位

信用卡 JSON 的字段仍叫 `limitFen`，但对外导入、导出单位已经按用户要求改为“元”。

```json
{
  "limitFen": 48000
}
```

表示额度 48,000 元，不是 480 元。也接受可转换数字字符串，例如 `"48000"`。导入后内部转换为 `4800000` 分。

这是当前既定兼容协议，后续不要在未迁移 schemaVersion 的情况下擅自改回“分”。若未来清理命名，建议新增 `limitYuan` 或升级导入格式版本，而不是静默改变含义。

### 9.3 信用卡导入字段兼容

- `limitFen`：元；数字或数字字符串，最多两位小数。
- `statementDay`、`paymentDay`：整数或可转换的整数字符串。
- `last4`：必须是字符串形式的四位数字，例如 `"0012"`。
- `color`：空值时自动匹配银行主题色。
- `status`：只有 `inactive` 会导入为停用，其他值默认启用。
- `pointsRating`：只接受 `good`、`average`、`poor`，否则默认 `average`。

### 9.4 交易导入金额

交易 JSON 的 `amountFen`、`feeFen` 仍然是整数“分”，没有改为元，也不接受当前信用卡额度的特殊元制语义。

### 9.5 导出文件名

- `信用卡档案-YYYY-MM-DD.json`
- `交易流水-YYYY-MM-DD.json`

## 10. 银行主题色

主题色映射在 `src/domain/cardAppearance.js`。

- 空颜色或早期通用默认色 `#3f6fb6` 会按银行名称自动替换。
- 用户手动设置的其他颜色会保留。
- 未识别银行回退到 `#3f6fb6`。
- 已覆盖工商、农业、中国、建设、交通、邮储、招商、浦发、中信、光大、华夏、广发、平安、民生、兴业、北京、上海银行等常见名称和简称。

## 11. 当前重要设计决定

1. 交易只引用 `cardId`，不复制卡片账单规则。
2. 修改信用卡账单日或还款日会追溯重算全部历史交易的账期。
3. 手续费当前只是记录和汇总字段，不计入卡片额度占用，也不计入还款计划的待还本金。
4. 总览快捷添加交易使用银行名称后的紧凑加号，悬停文案为“添加交易”。
5. 通过卡片快捷入口添加交易时必须锁定卡片；普通新增交易允许切换卡片。
6. 停用卡仍可通过卡片专属入口补录交易；普通选择器默认只优先选择启用卡。
7. 当前导航不是 URL 路由，刷新后回到总览。
8. 当前所有数据属于单一浏览器账本，没有用户隔离概念；未来后端必须按认证用户隔离。

## 12. 已知问题与技术债

按优先级建议后续关注：

1. **缺少正式自动化测试**：没有 Vitest；账单边界和手续费目前主要靠临时 Node 命令验证。
2. **历史账期会随卡片规则变化**：若用户调整账单日，历史交易会被重新归期。未来可能需要卡片规则版本或交易时规则快照。
3. **删除卡片关联检查不完整**：目前只检查关联交易，没有阻止删除仍有关联还款或活动的卡片，可能产生孤立引用。
4. **手续费归属未定**：手续费不进入额度占用和应还金额；需求文档仍将其列为待确认事项。
5. **信用卡导入字段命名与单位不一致**：`limitFen` 对外实际是元，需谨慎维护兼容性。
6. **localStorage 损坏静默回退**：用户可能误以为数据丢失，缺少恢复提示和备份入口。
7. **导入仅支持整批失败**：单条错误会拒绝整个文件，没有逐条错误报告或预览确认。
8. **导入合并是完整覆盖**：相同 ID 的导入项会替换旧对象，不是字段级 patch。
9. **缺少路由**：无法通过 URL 直达页面，也没有浏览器前进/后退语义。
10. **构建体积较大**：Element Plus 当前完整引入，主 chunk 超过 500 kB。
11. **格式风格不完全统一**：部分 Vue 文件模板和 CSS 压缩在单行，部分文件使用双引号/分号，尚未统一执行格式化。
12. **需求文档存在少量旧描述**：例如“当前占用第一阶段尚未实现还款冲减”已经不符合代码；本交接文档的当前行为描述优先级高于该旧句。

## 13. 安全与隐私注意事项

- 仓库中的 `信用卡.json`、导入模板或浏览器 localStorage 可能包含用户真实的银行名称、卡名和后四位。
- 不要把这些文件内容复制到日志、截图、公开 issue、外部服务或模型提示之外的公开位置。
- 不要把真实用户数据迁入 seed。
- 不要新增完整卡号、CVV、密码、短信验证码字段。
- 不要实现伪造交易、规避风控等能力。
- 后续接入云端前必须设计认证、授权、HTTPS、用户隔离、备份和删除机制。

## 14. 推荐验证清单

每次改动至少执行：

```bash
npm run build
```

涉及账单规则时验证：

- 账单日当天归当期。
- 账单日次日归下期。
- 还款日小于或等于账单日时跨月。
- 1 月/12 月跨年。
- 闰年 2 月和 29/30/31 日收敛。
- 当天到达账单日时从未出账变为已出账。

涉及交易表单时验证：

- 普通入口可切换卡片。
- 总览加号和信用卡页快捷入口锁定当前卡片。
- 选择卡片后账单日、还款日同步变化。
- 万 22/25/29 手续费正确并向上取整到分。
- 编辑交易保留 `createdAt`。

涉及导入导出时验证：

- 无 ID 自动新增，有 ID 合并覆盖。
- 卡片额度导入、导出按元。
- 交易金额导入、导出按分。
- 数字字符串兼容。
- 卡片类型和交易类型文件不能互相导入。
- 文件名为中文业务名称加日期。

涉及 UI 时检查桌面和移动视口，尤其关注：

- 总览卡片头部较拥挤，银行名称、加号、签到、积分、活动、商品和还款标签不能重叠。
- 信用卡表格右侧固定操作列宽度。
- 移动端抽屉、双列金额输入和手续费快捷按钮是否溢出。

## 15. 建议的后续开发顺序

若用户没有给出更具体任务，建议先做：

1. 引入 Vitest，为 `billing.js`、`ledger.js`、`transactionFee.js`、`importData.js` 建立边界测试。
2. 修复删除卡片时对交易、还款、活动的完整引用检查。
3. 明确手续费是否进入应还金额、额度占用和还款计划。
4. 为 JSON 导入增加预览、逐条错误说明和导入结果统计。
5. 统一代码格式并配置稳定的 lint/test 脚本。
6. 完成前端验收后，再由用户明确启动后端设计。

## 16. 可直接交给新 AI 的启动提示

```text
请继续开发项目：/Users/haofuwei/Desktop/老弟/credit-card-ledger

先完整阅读：
1. /Users/haofuwei/Desktop/老弟/AGENTS.md
2. /Users/haofuwei/Desktop/老弟/credit-card-ledger/AGENTS.md
3. /Users/haofuwei/Desktop/老弟/credit-card-ledger/docs/AI开发交接文档.md
4. 与本次任务相关的源码和 docs/需求文档.md

当前只开发 Vue 前端，不创建后端。以现有代码和交接文档描述的“当前真实行为”为准，保留 localStorage/repository/domain 分层。不要覆盖用户已有数据。修改后运行与范围相符的验证，至少执行 npm run build。
```
