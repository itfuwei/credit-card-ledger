<!-- 负责以表格形式展示信用卡档案，并提供编辑、停用和删除入口。 -->
<script setup>
import { computed, ref } from 'vue'
import { Delete, EditPen, Plus, Search } from '@element-plus/icons-vue'
import { formatMoneyFromFen } from '../../domain/billing'

const props = defineProps({ cards: { type: Array, required: true }, loading: Boolean })
const emit = defineEmits(['edit', 'delete', 'toggle-status', 'manage-products', 'create-transaction'])
const query = ref('')
const visibleCards = computed(() => props.cards.filter((card) => `${card.bank}${card.name}${card.last4}`.includes(query.value.trim())))
function ratingMeta(rating) { return { good: { type: 'success', label: '优' }, average: { type: 'warning', label: '良' }, poor: { type: 'info', label: '差' } }[rating] || { type: 'info', label: '未评' } }
</script>

<template>
  <section class="card-directory">
    <div class="panel-heading"><div><h2>全部信用卡</h2><p>管理卡片档案、额度和账单规则</p></div><el-input v-model="query" clearable placeholder="搜索银行、卡名或后四位"><template #prefix><el-icon><Search /></el-icon></template></el-input></div>
    <el-table v-loading="loading" :data="visibleCards" empty-text="暂无信用卡，请添加第一张卡">
      <el-table-column label="信用卡" min-width="210"><template #default="{ row }"><div class="identity"><el-avatar shape="square" :size="32" :style="{ background: row.color }">{{ row.bank.slice(0, 1) }}</el-avatar><span><strong>{{ row.bank }}</strong><small>{{ row.name }} · {{ row.last4 }}</small></span></div></template></el-table-column>
      <el-table-column label="固定额度" min-width="125"><template #default="{ row }">{{ formatMoneyFromFen(row.limitFen) }}</template></el-table-column>
      <el-table-column label="账单日" min-width="90"><template #default="{ row }">每月 {{ row.statementDay }} 日</template></el-table-column>
      <el-table-column label="还款日" min-width="90"><template #default="{ row }">每月 {{ row.paymentDay }} 日</template></el-table-column>
      <el-table-column label="签到" width="82"><template #default="{ row }"><el-tag :type="row.hasCheckIn ? 'success' : 'info'" effect="light">{{ row.hasCheckIn ? '需要' : '无需' }}</el-tag></template></el-table-column>
      <el-table-column label="积分等级" width="92"><template #default="{ row }"><el-tag :type="ratingMeta(row.pointsRating).type" effect="light">{{ ratingMeta(row.pointsRating).label }}</el-tag></template></el-table-column>
      <el-table-column label="积分兑换路径" min-width="220" show-overflow-tooltip><template #default="{ row }">{{ row.pointsRedemptionPath || '暂未填写' }}</template></el-table-column>
      <el-table-column label="优质商品" min-width="130"><template #default="{ row }"><el-button text type="primary" @click="emit('manage-products', row)">{{ row.pointsProducts?.length ? `管理 ${row.pointsProducts.length} 个` : '添加商品' }}</el-button></template></el-table-column>
      <el-table-column label="状态" width="88"><template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'" effect="light">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="262" fixed="right"><template #default="{ row }"><el-button text type="primary" @click="emit('create-transaction', row.id)"><el-icon><Plus /></el-icon>记录交易</el-button><el-button text type="primary" @click="emit('edit', row)"><el-icon><EditPen /></el-icon>编辑</el-button><el-dropdown trigger="click"><el-button text>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item @click="emit('toggle-status', row)">{{ row.status === 'active' ? '停用卡片' : '启用卡片' }}</el-dropdown-item><el-dropdown-item divided><el-popconfirm title="确定删除此信用卡吗？已有流水的卡片无法删除。" confirm-button-text="删除" cancel-button-text="取消" @confirm="emit('delete', row.id)"><template #reference><span class="danger-action"><el-icon><Delete /></el-icon>删除卡片</span></template></el-popconfirm></el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.card-directory { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 17px 18px 13px; }.panel-heading h2 { margin: 0; font-size: 17px; }.panel-heading p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; }.panel-heading .el-input { width: 240px; }.identity { display: flex; align-items: center; gap: 9px; }.identity span,.identity strong,.identity small { display: block; }.identity strong { font-size: 13px; }.identity small { margin-top: 3px; color: var(--text-muted); font-size: 11px; }.danger-action { display: flex; align-items: center; gap: 5px; color: var(--el-color-danger); }.danger-action :deep(.el-icon) { margin: 0; }
@media (max-width: 640px) { .panel-heading { align-items: stretch; flex-direction: column; }.panel-heading .el-input { width: 100%; } }
</style>
