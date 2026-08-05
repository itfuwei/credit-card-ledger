<!-- 负责使用 Element Plus 卡片网格展示每张信用卡的账单拆分、额度占用和还款提醒。 -->
<script setup>
import { Goods, Medal, Plus, Present } from '@element-plus/icons-vue'
import { formatMoneyFromFen } from '../../domain/billing'

defineProps({ cards: { type: Array, required: true } })
const emit = defineEmits(['create-transaction'])

// 提醒状态同时使用文字和颜色，避免只依赖颜色传递风险级别。
function reminderType(days) { if (days <= 3) return 'danger'; if (days <= 7) return 'warning'; return 'info' }
function pointsRatingLabel(rating) { return { good: '优', average: '良', poor: '差' }[rating] || '良' }
</script>

<template>
  <el-row :gutter="13">
    <el-col v-for="card in cards" :key="card.id" :xs="24" :md="12" class="card-column">
      <el-card class="credit-card" shadow="never">
        <template #header><div class="card-header"><el-avatar shape="square" :size="34" :style="{ background: card.color }">{{ card.bank.slice(0,1) }}</el-avatar><div class="card-identity"><div class="bank-line"><strong>{{ card.bank }}</strong><el-tooltip content="添加交易" placement="top"><el-button class="quick-transaction" text circle size="small" aria-label="添加交易" @click="emit('create-transaction', card.id)"><el-icon><Plus /></el-icon></el-button></el-tooltip></div><small>{{ card.name }} · {{ card.last4 }}</small></div><div class="header-status"><el-tag v-if="card.hasCheckIn" size="small" type="success" effect="plain">签到</el-tag><el-tooltip :content="`积分等级：${pointsRatingLabel(card.pointsRating)}`" placement="top"><span class="icon-stat"><el-icon><Medal /></el-icon><b>{{ pointsRatingLabel(card.pointsRating) }}</b></span></el-tooltip><el-popover v-if="card.activitySummary.total" placement="top" :width="190" trigger="hover"><template #reference><span class="icon-stat activity-stat"><el-icon><Present /></el-icon><b>{{ card.activitySummary.total }}</b></span></template><div class="activity-popover"><div v-if="card.activitySummary.unmet"><span>未达标</span><b>{{ card.activitySummary.unmet }}</b></div><div v-if="card.activitySummary.ongoing"><span>进行中</span><b>{{ card.activitySummary.ongoing }}</b></div><div v-if="card.activitySummary.waiting"><span>待领取</span><b>{{ card.activitySummary.waiting }}</b></div><div v-if="card.activitySummary.claimable"><span>可领取</span><b>{{ card.activitySummary.claimable }}</b></div><div v-if="card.activitySummary.expired"><span>已过期</span><b>{{ card.activitySummary.expired }}</b></div><div v-if="card.activitySummary.claimed"><span>已领取</span><b>{{ card.activitySummary.claimed }}</b></div></div></el-popover><el-popover v-if="card.pointsProducts.length" placement="top" :width="250" trigger="hover"><template #reference><span class="icon-stat"><el-icon><Goods /></el-icon><b>{{ card.pointsProducts.length }}</b></span></template><div class="product-popover"><div v-for="product in card.pointsProducts" :key="product.id" class="product-line"><strong>{{ product.name }}</strong><span>{{ product.pointsCost }} 积分</span></div></div></el-popover><el-tag :type="reminderType(card.daysToPayment)" size="small" effect="light">{{ card.daysToPayment }}天后还款</el-tag></div></div></template>
        <el-row class="balance" justify="space-between"><el-col :span="12"><span>当前占用</span><strong class="money">{{ formatMoneyFromFen(card.balanceFen) }}</strong></el-col><el-col :span="12" class="align-right"><span>剩余额度</span><strong class="money">{{ formatMoneyFromFen(card.availableFen) }}</strong></el-col></el-row>
        <el-progress :percentage="Math.min(Math.round(card.usage * 100),100)" :stroke-width="5" :show-text="false" :color="card.color" />
        <el-descriptions class="card-details" :column="4" size="small"><el-descriptions-item label="已出账">{{ formatMoneyFromFen(card.issuedFen) }}</el-descriptions-item><el-descriptions-item label="未出账">{{ formatMoneyFromFen(card.unissuedFen) }}</el-descriptions-item><el-descriptions-item label="账单日">每月{{ card.statementDay }}日</el-descriptions-item><el-descriptions-item label="还款日">每月{{ card.paymentDay }}日</el-descriptions-item></el-descriptions>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.card-column { margin-bottom: 13px; }.credit-card { height: 100%; border-color: var(--border); }.credit-card :deep(.el-card__header) { padding: 14px 16px; border-bottom: 0; }.credit-card :deep(.el-card__body) { padding: 0 16px 14px; }.card-header { display: flex; align-items: center; min-width: 0; }.card-identity { min-width: 0; margin-left: 10px; }.bank-line { display: flex; align-items: center; min-width: 0; gap: 2px; }.card-identity strong,.card-identity small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.card-identity strong { min-width: 0; font-size: 14px; }.card-identity small { margin-top: 3px; color: var(--text-muted); font-size: 10px; }.quick-transaction { width: 22px; height: 22px; flex: none; padding: 0; }.header-status { display: flex; align-items: center; gap: 6px; flex: none; margin-left: auto; }.icon-stat { height: 24px; display: inline-flex; align-items: center; gap: 3px; color: var(--text-secondary); cursor: default; }.icon-stat .el-icon { font-size: 15px; }.icon-stat b { font-size: 11px; }.activity-stat { color: var(--brand); }.balance { margin: 2px 0 9px; }.balance span { display: block; color: var(--text-muted); font-size: 10px; }.balance strong { display: block; margin-top: 3px; font-size: 18px; }.align-right { text-align: right; }.card-details { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-soft); }.card-details :deep(.el-descriptions__body) { background: transparent; }.card-details :deep(.el-descriptions__cell) { padding-bottom: 0; }.card-details :deep(.el-descriptions__label) { display: block; margin: 0 0 4px; color: var(--text-muted); font-size: 10px; }.card-details :deep(.el-descriptions__content) { color: #343a42; font-size: 11px; font-weight: 600; }
@media (max-width: 520px) { .header-status { gap: 4px; }.card-header > .el-avatar { display: none; }.card-identity { margin-left: 0; } }
</style>

<style>
.activity-popover div,.product-line { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding: 7px 0; border-bottom: 1px solid var(--border-soft); }.activity-popover div:last-child,.product-line:last-child { border-bottom: 0; }.activity-popover span,.product-line strong { font-size: 12px; }.activity-popover b,.product-line span { flex: none; color: var(--brand); font-size: 11px; }.product-popover { max-height: 260px; overflow-y: auto; }
</style>
