<!-- 负责使用 Element Plus 统计卡片展示额度、占用、已出账和未出账四项核心指标。 -->
<script setup>
import { computed } from 'vue'
import { formatMoneyFromFen } from '../../domain/billing'

const props = defineProps({ totals: { type: Object, required: true }, cardCount: { type: Number, required: true } })
const usage = computed(() => props.totals.limitFen ? Math.round(props.totals.balanceFen / props.totals.limitFen * 100) : 0)
const metrics = computed(() => [
  { label: '总信用额度', value: props.totals.limitFen, note: `${props.cardCount} 张有效卡片` },
  { label: '当前总占用', value: props.totals.balanceFen, note: `整体使用率 ${usage.value}%` },
  { label: '已出账待还', value: props.totals.issuedFen, note: '优先关注临近还款项目', emphasis: true },
  { label: '未出账金额', value: props.totals.unissuedFen, note: '将进入后续账单' },
])
</script>

<template>
  <el-row class="metric-grid" :gutter="0" aria-label="账户指标">
    <el-col v-for="metric in metrics" :key="metric.label" :xs="12" :sm="12" :lg="6">
      <el-card class="metric-card" :class="{ emphasis: metric.emphasis }" shadow="never">
        <el-statistic :value="metric.value" :formatter="formatMoneyFromFen"><template #title>{{ metric.label }}</template></el-statistic>
        <p>{{ metric.note }}</p>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
.metric-grid { margin-top: 26px; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.metric-grid :deep(.el-col) { min-width: 0; }.metric-card { width: 100%; height: 100%; border: 0; border-right: 1px solid var(--border-soft); border-radius: 0; }.metric-grid .el-col:last-child .metric-card { border-right: 0; }.metric-card :deep(.el-statistic__head) { color: var(--text-secondary); font-size: 12px; }.metric-card :deep(.el-statistic__number) { margin: 8px 0 5px; color: var(--text-primary); font-size: 23px; font-weight: 700; }.metric-card.emphasis :deep(.el-statistic__number) { color: var(--brand); }.metric-card p { margin: 0; color: var(--text-muted); font-size: 11px; }
@media (max-width: 1199px) { .metric-grid .el-col:nth-child(-n+2) .metric-card { border-bottom: 1px solid var(--border-soft); }.metric-grid .el-col:nth-child(even) .metric-card { border-right: 0; } }
@media (max-width: 540px) { .metric-card :deep(.el-card__body) { padding: 16px; }.metric-card :deep(.el-statistic__number) { font-size: 18px; } }
</style>
