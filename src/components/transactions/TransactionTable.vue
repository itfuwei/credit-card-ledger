<!-- 负责使用 Element Plus 表格呈现流水，并提供前端筛选和删除确认交互。 -->
<script setup>
import { computed, ref } from "vue";
import { Delete, EditPen, Search } from "@element-plus/icons-vue";
import { formatDate, formatMoneyFromFen } from "../../domain/billing";

const props = defineProps({
  rows: { type: Array, required: true },
  loading: Boolean,
  title: { type: String, default: "最近交易" },
  description: { type: String, default: "每笔记录自动归入对应账单周期" },
  searchable: { type: Boolean, default: true },
  editable: Boolean,
});
const emit = defineEmits(["delete", "edit"]);
const query = ref("");
// 筛选仅影响当前视图，不修改 repository 中保存的交易数据。
const filteredRows = computed(() =>
  props.rows.filter((row) =>
    `${row.card.bank}${row.card.name}${row.card.last4}${row.note}`.includes(
      query.value.trim()
    )
  )
);
</script>

<template>
  <section class="transaction-panel">
    <div class="panel-heading">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <el-input
        v-if="searchable"
        v-model="query"
        clearable
        placeholder="搜索卡片或备注"
        ><template #prefix
          ><el-icon><Search /></el-icon></template
      ></el-input>
    </div>
    <el-table
      v-loading="loading"
      :data="filteredRows"
      stripe
      empty-text="暂无交易记录"
    >
      <el-table-column prop="date" label="交易日期" min-width="112" />
      <el-table-column label="卡片" min-width="160"
        ><template #default="{ row }"
          ><strong>{{ row.card.bank }}</strong
          ><span class="card-number"> {{ row.card.last4 }}</span></template
        ></el-table-column
      >
      <el-table-column label="金额" min-width="120"
        ><template #default="{ row }"
          ><strong class="money">{{
            formatMoneyFromFen(row.amountFen)
          }}</strong></template
        ></el-table-column
      >
      <el-table-column label="手续费" min-width="105"
        ><template #default="{ row }">{{
          formatMoneyFromFen(row.feeFen)
        }}</template></el-table-column
      >
      <el-table-column label="预计出账" min-width="105"
        ><template #default="{ row }">{{
          formatDate(row.billingCycle.statementDate)
        }}</template></el-table-column
      >
      <el-table-column label="预计还款" min-width="105"
        ><template #default="{ row }">{{
          formatDate(row.billingCycle.paymentDate)
        }}</template></el-table-column
      >
      <el-table-column
        prop="note"
        label="备注"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column label="操作" :width="editable ? 122 : 76" fixed="right"
        ><template #default="{ row }"
          ><el-button
            v-if="editable"
            text
            type="primary"
            aria-label="编辑交易"
            @click="emit('edit', row)"
            ><el-icon><EditPen /></el-icon></el-button
          ><el-popconfirm
            title="确定删除这笔交易吗？"
            confirm-button-text="删除"
            cancel-button-text="取消"
            @confirm="emit('delete', row.id)"
            ><template #reference
              ><el-button text type="danger" aria-label="删除交易"
                ><el-icon
                  ><Delete /></el-icon></el-button></template></el-popconfirm></template
      ></el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.transaction-panel {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 18px 13px;
}
.panel-heading h2 {
  margin-bottom: 0;
  font-size: 17px;
}
.panel-heading p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 11px;
}
.panel-heading .el-input {
  width: 220px;
}
.panel-heading svg {
  width: 15px;
}
.card-number {
  color: var(--text-muted);
}
.transaction-panel :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.transaction-panel :deep(.el-table .cell) {
  white-space: nowrap;
}
@media (max-width: 640px) {
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .panel-heading .el-input {
    width: 100%;
  }
}
</style>
