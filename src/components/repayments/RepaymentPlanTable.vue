<!-- 负责用表格展示按账期生成的待还计划，并明确区分逾期和临近状态。 -->
<script setup>
import { formatFullDate, formatMoneyFromFen } from '../../domain/billing'

defineProps({ plans: { type: Array, required: true }, loading: Boolean })

function statusMeta(plan) {
  if (plan.status === 'overdue') return { type: 'danger', label: `逾期 ${Math.abs(plan.daysToPayment)} 天` }
  if (plan.status === 'urgent') return { type: 'danger', label: plan.daysToPayment === 0 ? '今日还款' : `${plan.daysToPayment} 天后还款` }
  if (plan.status === 'upcoming') return { type: 'warning', label: `${plan.daysToPayment} 天后还款` }
  return { type: 'info', label: `${plan.daysToPayment} 天后还款` }
}
</script>

<template>
  <section class="repayment-table">
    <div class="panel-heading"><div><h2>待还账期</h2><p>按预计还款日排序；实际还款记录功能将在下一阶段接入。</p></div></div>
    <el-table v-loading="loading" :data="plans" stripe empty-text="暂无已出账的待还计划">
      <el-table-column label="还款状态" min-width="125"><template #default="{ row }"><el-tag :type="statusMeta(row).type" effect="light">{{ statusMeta(row).label }}</el-tag></template></el-table-column>
      <el-table-column label="信用卡" min-width="185"><template #default="{ row }"><div class="card-identity"><el-avatar shape="square" :size="30" :style="{ background: row.card.color }">{{ row.card.bank.slice(0, 1) }}</el-avatar><span><strong>{{ row.card.bank }}</strong><small>{{ row.card.name }} · {{ row.card.last4 }}</small></span></div></template></el-table-column>
      <el-table-column label="账单日" min-width="118"><template #default="{ row }">{{ formatFullDate(row.statementDate) }}</template></el-table-column>
      <el-table-column label="还款日" min-width="118"><template #default="{ row }">{{ formatFullDate(row.paymentDate) }}</template></el-table-column>
      <el-table-column label="账单金额" min-width="128"><template #default="{ row }">{{ formatMoneyFromFen(row.amountFen) }}</template></el-table-column>
      <el-table-column label="已还金额" min-width="128"><template #default="{ row }">{{ formatMoneyFromFen(row.paidFen) }}</template></el-table-column>
      <el-table-column label="待还金额" min-width="128"><template #default="{ row }"><strong class="money">{{ formatMoneyFromFen(row.outstandingFen) }}</strong></template></el-table-column>
      <el-table-column label="手续费" min-width="105"><template #default="{ row }">{{ formatMoneyFromFen(row.feeFen) }}</template></el-table-column>
      <el-table-column label="交易笔数" min-width="92"><template #default="{ row }">{{ row.transactionCount }} 笔</template></el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.repayment-table { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.panel-heading { padding: 17px 18px 13px; }.panel-heading h2 { margin: 0; font-size: 17px; }.panel-heading p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }.repayment-table :deep(.el-table__inner-wrapper::before) { display: none; }.repayment-table :deep(.el-table .cell) { white-space: nowrap; }.card-identity { display: flex; align-items: center; gap: 9px; }.card-identity span,.card-identity strong,.card-identity small { display: block; }.card-identity strong { font-size: 13px; }.card-identity small { margin-top: 3px; color: var(--text-muted); font-size: 11px; }
</style>
