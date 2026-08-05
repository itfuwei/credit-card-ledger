<!-- 负责组合总览指标、信用卡状态、流水表格和交易录入抽屉，不直接处理持久化。 -->
<script setup>
import { computed, ref } from 'vue'
import { Plus, SortDown, SortUp } from '@element-plus/icons-vue'
import CardStatusGrid from '../components/cards/CardStatusGrid.vue'
import MetricGrid from '../components/dashboard/MetricGrid.vue'
import TransactionTable from '../components/transactions/TransactionTable.vue'
import { useLedger } from '../composables/useLedger'
import { getActivityStatus } from '../domain/activity'

const { cards, cardRows, totals, transactionRows, activities, loading, deleteTransaction } = useLedger()
const emit = defineEmits(['create'])
const today = new Intl.DateTimeFormat('en-CA').format(new Date())
const sortField = ref('paymentDay')
const sortDirection = ref(1)
const sortOptions = [
  { value: 'paymentDay', label: '还款日' },
  { value: 'daysToPayment', label: '距还款日' },
  { value: 'statementDay', label: '账单日' },
  { value: 'balanceFen', label: '已用额度' },
  { value: 'availableFen', label: '可用额度' },
  { value: 'limitFen', label: '总额度' },
  { value: 'pointsRating', label: '积分等级' },
]

const dashboardCards = computed(() => cardRows.value.map((card) => {
  const relatedActivities = activities.value.filter((item) => item.cardId === card.id)
  const activitySummary = relatedActivities.reduce((summary, activity) => {
    const spentFen = transactionRows.value.filter((transaction) => transaction.cardId === card.id && transaction.date >= activity.startDate && transaction.date <= activity.endDate).reduce((sum, transaction) => sum + transaction.amountFen, 0)
    const status = getActivityStatus(activity, spentFen, today)
    summary[status.key] += 1
    return summary
  }, { total: relatedActivities.length, unmet: 0, ongoing: 0, waiting: 0, claimable: 0, expired: 0, claimed: 0 })
  return { ...card, activitySummary, pointsProducts: card.pointsProducts || [] }
}))

const sortedDashboardCards = computed(() => dashboardCards.value.slice().sort((left, right) => {
  const ratingValue = { poor: 1, average: 2, good: 3 }
  const leftValue = sortField.value === 'pointsRating' ? ratingValue[left.pointsRating] : left[sortField.value]
  const rightValue = sortField.value === 'pointsRating' ? ratingValue[right.pointsRating] : right[sortField.value]
  // 默认以每月还款日排序，因此 1 日始终在 30 日之前，而不是按下一个自然日期排序。
  if (leftValue === rightValue) return left.bank.localeCompare(right.bank, 'zh-CN')
  return (leftValue - rightValue) * sortDirection.value
}))

function toggleSortDirection() { sortDirection.value *= -1 }
</script>

<template>
  <MetricGrid :totals="totals" :card-count="cards.length" />
  <section class="page-section">
    <div class="section-heading">
      <div>
        <h2>卡片状态</h2>
        <p>额度占用、账单拆分与下一还款日</p>
      </div>
      <div class="card-sort"><span>排序</span><el-select v-model="sortField" size="small" aria-label="卡片排序字段"><el-option v-for="option in sortOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select><el-tooltip :content="sortDirection === 1 ? '正序' : '倒序'"><el-button circle size="small" aria-label="切换排序方向" @click="toggleSortDirection"><el-icon><SortUp v-if="sortDirection === 1" /><SortDown v-else /></el-icon></el-button></el-tooltip></div>
    </div>
    <CardStatusGrid :cards="sortedDashboardCards" @create-transaction="emit('create', $event)" />
  </section>
  <section class="page-section">
    <TransactionTable
      :rows="transactionRows"
      :loading="loading"
      @delete="deleteTransaction"
    />
  </section>
  <el-button
    class="mobile-create"
    type="primary"
    circle
    size="large"
    aria-label="记录交易"
    @click="emit('create')"
    ><el-icon><Plus /></el-icon
  ></el-button>
</template>

<style scoped>
.mobile-create {
  display: none;
  position: fixed;
  right: 18px;
  bottom: 78px;
  z-index: 15;
  box-shadow: 0 8px 24px rgba(200, 67, 73, 0.35);
}
.card-sort { display: flex; align-items: center; gap: 6px; }.card-sort > span { color: var(--text-muted); font-size: 11px; }.card-sort .el-select { width: 112px; }
@media (max-width: 640px) {
  .mobile-create {
    display: inline-flex;
  }
  .section-heading { align-items: stretch; flex-direction: column; }
  .card-sort { justify-content: flex-end; }
}
</style>
