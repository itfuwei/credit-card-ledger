<!-- 负责活动页的进度计算、状态筛选以及活动新增、编辑、删除和领取操作。 -->
<script setup>
import { computed, ref } from 'vue'
import { Delete, EditPen, Plus } from '@element-plus/icons-vue'
import ActivityDrawer from '../components/activities/ActivityDrawer.vue'
import { useLedger } from '../composables/useLedger'
import { getActivityStatus } from '../domain/activity'
import { formatMoneyFromFen } from '../domain/billing'

const { cards, transactionRows, activities, loading, createActivity, updateActivity, deleteActivity } = useLedger()
const drawerOpen = ref(false)
const editingActivity = ref(null)
const cardFilter = ref('')
const statusFilter = ref('')
const today = new Intl.DateTimeFormat('en-CA').format(new Date())
const rewardLabels = { points: '积分', cash: '立减金', coupon: '优惠券', gift: '实物', other: '其他' }

const activityRows = computed(() => activities.value.map((item) => {
  const card = cards.value.find((entry) => entry.id === item.cardId)
  const spentFen = transactionRows.value.filter((transaction) => transaction.cardId === item.cardId && transaction.date >= item.startDate && transaction.date <= item.endDate).reduce((sum, transaction) => sum + transaction.amountFen, 0)
  const completed = spentFen >= item.thresholdFen
  return { ...item, card, spentFen, completed, progress: Math.min(100, Math.round(spentFen / item.thresholdFen * 100)), activityStatus: getActivityStatus(item, spentFen, today) }
}))
const visibleRows = computed(() => activityRows.value.filter((item) => (!cardFilter.value || item.cardId === cardFilter.value) && (!statusFilter.value || item.activityStatus.key === statusFilter.value)))
const claimableCount = computed(() => activityRows.value.filter((item) => item.activityStatus.key === 'claimable').length)
const pendingCount = computed(() => activityRows.value.filter((item) => ['ongoing', 'waiting'].includes(item.activityStatus.key)).length)

function openCreate() { editingActivity.value = null; drawerOpen.value = true }
function openEdit(item) { editingActivity.value = item; drawerOpen.value = true }
async function saveActivity(payload) { if (editingActivity.value) await updateActivity(editingActivity.value.id, payload); else await createActivity(payload) }
async function markClaimed(item) { await updateActivity(item.id, { claimed: true, claimedAt: today }) }
</script>

<template>
  <section class="page-heading"><div><p class="eyebrow">信用卡权益</p><h2>活动进度与奖励领取</h2><p>消费进度根据交易流水自动计算，领取状态由你手动确认。</p></div><el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>添加活动</el-button></section>
  <el-row class="summary-row" :gutter="12"><el-col :xs="24" :sm="8"><div class="summary-item"><span>全部活动</span><strong>{{ activities.length }} 个</strong></div></el-col><el-col :xs="24" :sm="8"><div class="summary-item danger"><span>可以领取</span><strong>{{ claimableCount }} 个</strong></div></el-col><el-col :xs="24" :sm="8"><div class="summary-item"><span>进行中/待领取</span><strong>{{ pendingCount }} 个</strong></div></el-col></el-row>
  <section class="activity-panel"><div class="panel-heading"><div><h2>活动列表</h2><p>同一张信用卡可以维护多个活动</p></div><el-space wrap><el-select v-model="cardFilter" clearable placeholder="全部信用卡"><el-option v-for="card in cards" :key="card.id" :label="`${card.bank} · ${card.last4}`" :value="card.id" /></el-select><el-select v-model="statusFilter" clearable placeholder="全部状态"><el-option label="未达标" value="unmet" /><el-option label="进行中" value="ongoing" /><el-option label="待领取" value="waiting" /><el-option label="可领取" value="claimable" /><el-option label="已领取" value="claimed" /><el-option label="已过期" value="expired" /></el-select></el-space></div>
    <el-table v-loading="loading" :data="visibleRows" empty-text="暂无信用卡活动">
      <el-table-column label="状态" width="94"><template #default="{ row }"><el-tag :type="row.activityStatus.type" effect="light">{{ row.activityStatus.label }}</el-tag></template></el-table-column>
      <el-table-column label="活动" min-width="220"><template #default="{ row }"><strong>{{ row.title }}</strong><div class="subline">{{ row.card?.bank }} · {{ row.card?.last4 }}</div></template></el-table-column>
      <el-table-column label="活动时间" min-width="190"><template #default="{ row }">{{ row.startDate }} 至 {{ row.endDate }}</template></el-table-column>
      <el-table-column label="消费进度" min-width="190"><template #default="{ row }"><div class="progress-copy"><span>{{ formatMoneyFromFen(row.spentFen) }} / {{ formatMoneyFromFen(row.thresholdFen) }}</span><b>{{ row.progress }}%</b></div><el-progress :percentage="row.progress" :stroke-width="5" :show-text="false" /></template></el-table-column>
      <el-table-column label="奖励" min-width="180"><template #default="{ row }"><el-tag size="small" type="warning" effect="plain">{{ rewardLabels[row.rewardType] }}</el-tag><span class="reward-copy">{{ row.rewardDescription }}</span></template></el-table-column>
      <el-table-column label="领取时间" min-width="190"><template #default="{ row }">{{ row.claimStartDate }} 至 {{ row.claimEndDate }}</template></el-table-column>
      <el-table-column prop="claimPath" label="领取入口" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="190" fixed="right"><template #default="{ row }"><el-button v-if="row.activityStatus.key === 'claimable'" text type="success" @click="markClaimed(row)">标记已领</el-button><el-button text type="primary" aria-label="编辑活动" @click="openEdit(row)"><el-icon><EditPen /></el-icon></el-button><el-popconfirm title="确定删除这个活动吗？" confirm-button-text="删除" cancel-button-text="取消" @confirm="deleteActivity(row.id)"><template #reference><el-button text type="danger" aria-label="删除活动"><el-icon><Delete /></el-icon></el-button></template></el-popconfirm></template></el-table-column>
    </el-table>
  </section>
  <ActivityDrawer v-model="drawerOpen" :cards="cards" :activity="editingActivity" :submit-handler="saveActivity" />
</template>

<style scoped>
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 28px 0 20px; }.eyebrow { margin: 0 0 6px; color: var(--brand); font-size: 12px; font-weight: 600; }.page-heading h2 { margin: 0; font-size: 22px; }.page-heading > div > p:last-child { margin: 7px 0 0; color: var(--text-secondary); font-size: 13px; }.summary-row { margin-bottom: 14px; }.summary-item { padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.summary-item span,.summary-item strong { display: block; }.summary-item span { color: var(--text-muted); font-size: 11px; }.summary-item strong { margin-top: 5px; font-size: 20px; }.summary-item.danger strong { color: var(--el-color-danger); }.activity-panel { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 17px 18px 13px; }.panel-heading h2 { margin: 0; font-size: 17px; }.panel-heading p,.subline { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }.panel-heading .el-select { width: 170px; }.progress-copy { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; color: var(--text-secondary); font-size: 11px; }.progress-copy b { color: var(--text-primary); }.reward-copy { margin-left: 7px; font-size: 12px; }.activity-panel :deep(.el-table__inner-wrapper::before) { display: none; }.activity-panel :deep(.el-table .cell) { white-space: nowrap; }
@media (max-width: 700px) { .page-heading { align-items: stretch; flex-direction: column; padding-top: 22px; }.page-heading .el-button { width: 100%; }.summary-row :deep(.el-col + .el-col) { margin-top: 10px; }.panel-heading { align-items: stretch; flex-direction: column; }.panel-heading :deep(.el-space),.panel-heading .el-select { width: 100%; } }
</style>
