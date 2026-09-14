<!-- 负责组合还款计划的筛选、风险汇总和按账期排列的待还清单。 -->
<script setup>
import { computed, ref } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useLedger } from '../composables/useLedger'
import { formatMoneyFromFen } from '../domain/billing'
import RepaymentDrawer from '../components/repayments/RepaymentDrawer.vue'
import RepaymentPlanTable from '../components/repayments/RepaymentPlanTable.vue'

const { cards, repaymentPlans, repayments, loading, createRepayment, deleteRepayment } = useLedger()
const cardId = ref('')
const status = ref('')
const repaymentEntryOpen = ref(false)

const visiblePlans = computed(() => repaymentPlans.value.filter((plan) => (!cardId.value || plan.card.id === cardId.value) && (!status.value || plan.status === status.value)))
const totalDueFen = computed(() => visiblePlans.value.reduce((sum, plan) => sum + plan.outstandingFen, 0))
const urgentDueFen = computed(() => visiblePlans.value.filter((plan) => ['overdue', 'urgent'].includes(plan.status)).reduce((sum, plan) => sum + plan.outstandingFen, 0))
const upcomingCount = computed(() => visiblePlans.value.filter((plan) => plan.status === 'upcoming').length)
const sortedRepayments = computed(() => repayments.value.slice().sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)))

async function saveRepayment(payload) { await createRepayment(payload) }

async function quickRepay(plan) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  try {
    await createRepayment({ cardId: plan.card.id, date: today, amountFen: plan.outstandingFen, note: '一键还款' })
    ElMessage.success(`已还清 ${plan.card.bank} · ${plan.card.last4} 的 ${formatMoneyFromFen(plan.outstandingFen)}`)
  } catch (e) {
    ElMessage.error('一键还款失败，请重试')
  }
}
</script>

<template>
  <section class="page-heading"><div><p class="eyebrow">还款安排</p><h2>按卡片查看待还计划</h2><p>每张卡固定一条记录；待还金额为未还清账期合计，已还清后自动预告下一期账单。</p></div><el-button type="primary" @click="repaymentEntryOpen = true"><el-icon><Plus /></el-icon>记录还款</el-button></section>
  <section class="filter-panel"><el-form :inline="true" label-position="top"><el-form-item label="信用卡"><el-select v-model="cardId" clearable placeholder="全部卡片"><el-option v-for="card in cards" :key="card.id" :label="`${card.bank} · ${card.last4}`" :value="card.id" /></el-select></el-form-item><el-form-item label="还款状态"><el-select v-model="status" clearable placeholder="全部状态"><el-option label="已还清" value="paid" /><el-option label="已逾期" value="overdue" /><el-option label="3 天内" value="urgent" /><el-option label="4-7 天内" value="upcoming" /><el-option label="计划中" value="planned" /></el-select></el-form-item></el-form></section>
  <el-row class="summary-row" :gutter="12"><el-col :xs="24" :sm="8"><div class="summary-item"><span>全部待还</span><strong>{{ formatMoneyFromFen(totalDueFen) }}</strong></div></el-col><el-col :xs="24" :sm="8"><div class="summary-item danger"><span>逾期及 3 天内</span><strong>{{ formatMoneyFromFen(urgentDueFen) }}</strong></div></el-col><el-col :xs="24" :sm="8"><div class="summary-item"><span>4-7 天内卡片</span><strong>{{ upcomingCount }} 张</strong></div></el-col></el-row>
  <el-alert class="plan-note" title="还款自动按最早到期账期冲减" description="超出当前已出账金额的部分不会分配给未出账账期，但会从卡片当前占用中扣减。" type="info" :closable="false" show-icon />
  <RepaymentPlanTable :plans="visiblePlans" :loading="loading" @repay="quickRepay" />
  <section class="history-panel"><div class="history-heading"><div><h2>还款记录</h2><p>删除记录后，待还金额和额度占用会自动恢复。</p></div></div><el-table :data="sortedRepayments" empty-text="暂无还款记录"><el-table-column prop="date" label="还款日期" min-width="120" /><el-table-column label="信用卡" min-width="180"><template #default="{ row }"><span>{{ cards.find((card) => card.id === row.cardId)?.bank || '已删除卡片' }} · {{ cards.find((card) => card.id === row.cardId)?.last4 || '----' }}</span></template></el-table-column><el-table-column label="还款金额" min-width="135"><template #default="{ row }"><strong class="money">{{ formatMoneyFromFen(row.amountFen) }}</strong></template></el-table-column><el-table-column prop="note" label="备注" min-width="180" show-overflow-tooltip /><el-table-column label="操作" width="76" fixed="right"><template #default="{ row }"><el-popconfirm title="确定删除这笔还款记录吗？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteRepayment(row.id)"><template #reference><el-button text type="danger" aria-label="删除还款记录"><el-icon><Delete /></el-icon></el-button></template></el-popconfirm></template></el-table-column></el-table></section>
  <RepaymentDrawer v-model="repaymentEntryOpen" :cards="cards" :submit-handler="saveRepayment" />
</template>

<style scoped>
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 28px 0 20px; }.eyebrow { margin: 0 0 6px; color: var(--brand); font-size: 12px; font-weight: 600; }.page-heading h2 { margin: 0; font-size: 22px; }.page-heading > div > p:last-child { margin: 7px 0 0; color: var(--text-secondary); font-size: 13px; }.filter-panel { margin-bottom: 14px; padding: 14px 18px 2px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.filter-panel :deep(.el-form-item) { margin-right: 12px; }.filter-panel :deep(.el-form-item__label) { padding-bottom: 4px; color: var(--text-muted); font-size: 11px; }.filter-panel :deep(.el-select) { width: 190px; }.summary-row { margin-bottom: 14px; }.summary-item { padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.summary-item span,.summary-item strong { display: block; }.summary-item span { color: var(--text-muted); font-size: 11px; }.summary-item strong { margin-top: 5px; font-size: 20px; }.summary-item.danger strong { color: var(--el-color-danger); }.plan-note,.history-panel { margin-top: 14px; }.history-panel { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.history-heading { padding: 17px 18px 13px; }.history-heading h2 { margin: 0; font-size: 17px; }.history-heading p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }.history-panel :deep(.el-table__inner-wrapper::before) { display: none; }
@media (max-width: 640px) { .page-heading { align-items: stretch; flex-direction: column; padding-top: 22px; }.page-heading .el-button { width: 100%; }.filter-panel :deep(.el-form),.filter-panel :deep(.el-form-item) { display: block; margin-right: 0; }.filter-panel :deep(.el-select) { width: 100%; }.summary-row :deep(.el-col + .el-col) { margin-top: 10px; } }
</style>
