<!-- 负责交易流水页的组合筛选、汇总、分页和编辑入口，不直接访问持久化实现。 -->
<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Download, Plus, RefreshRight, Search, Upload } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import TransactionTable from "../components/transactions/TransactionTable.vue";
import { useLedger } from "../composables/useLedger";
import { formatMoneyFromFen } from "../domain/billing";
import { validateTransactionImport } from "../domain/importData";
import { downloadJson, readJsonUpload } from "../utils/jsonTransfer";

const emit = defineEmits(["create", "edit"]);
const { cards, transactions, transactionRows, loading, deleteTransaction, importTransactions } = useLedger();
const filters = reactive({
  query: "",
  cardId: "",
  dateRange: [],
  billStatus: "",
});
const currentPage = ref(1);
const pageSize = ref(10);
const uploadKey = ref(0);
const today = new Date();
today.setHours(23, 59, 59, 999);

const filteredRows = computed(() =>
  transactionRows.value.filter((row) => {
    const keyword = filters.query.trim();
    if (
      keyword &&
      !`${row.card.bank}${row.card.name}${row.card.last4}${row.note}`.includes(
        keyword
      )
    )
      return false;
    if (filters.cardId && row.cardId !== filters.cardId) return false;
    if (
      filters.dateRange?.length === 2 &&
      (row.date < filters.dateRange[0] || row.date > filters.dateRange[1])
    )
      return false;
    if (
      filters.billStatus === "issued" &&
      row.billingCycle.statementDate > today
    )
      return false;
    if (
      filters.billStatus === "unissued" &&
      row.billingCycle.statementDate <= today
    )
      return false;
    return true;
  })
);

const totalAmountFen = computed(() =>
  filteredRows.value.reduce((sum, row) => sum + row.amountFen, 0)
);
const totalFeeFen = computed(() =>
  filteredRows.value.reduce((sum, row) => sum + row.feeFen, 0)
);
const pageRows = computed(() =>
  filteredRows.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
);

watch(filters, () => {
  currentPage.value = 1;
});

function resetFilters() {
  Object.assign(filters, {
    query: "",
    cardId: "",
    dateRange: [],
    billStatus: "",
  });
}

function exportTransactions() { downloadJson("transactions", transactions.value); }
async function handleTransactionImport(uploadFile) {
  try {
    const cardIds = new Set(cards.value.map((card) => card.id));
    const imported = validateTransactionImport(await readJsonUpload(uploadFile, "transactions"), cardIds);
    await importTransactions(imported);
  } catch (error) { ElMessage.error(error.message || "交易流水导入失败"); }
  finally { uploadKey.value += 1; }
}
</script>

<template>
  <section class="page-heading">
    <div>
      <p class="eyebrow">交易账本</p>
      <h2>查询每一笔资金使用</h2>
      <p>按卡片、日期和账单状态筛选，修改记录后账期会自动重新计算。</p>
    </div>
    <el-space wrap><el-button @click="exportTransactions"><el-icon><Download /></el-icon>导出 JSON</el-button><el-upload :key="uploadKey" accept="application/json,.json" :auto-upload="false" :show-file-list="false" :on-change="handleTransactionImport"><el-button><el-icon><Upload /></el-icon>导入 JSON</el-button></el-upload><el-button type="primary" @click="emit('create')"><el-icon><Plus /></el-icon>记录交易</el-button></el-space>
  </section>

  <section class="filter-panel">
    <el-form :inline="true" label-position="top"
      ><el-form-item label="关键词"
        ><el-input
          v-model="filters.query"
          clearable
          placeholder="银行、卡片或备注"
          ><template #prefix
            ><el-icon><Search /></el-icon></template></el-input></el-form-item
      ><el-form-item label="信用卡"
        ><el-select v-model="filters.cardId" clearable placeholder="全部卡片"
          ><el-option
            v-for="card in cards"
            :key="card.id"
            :label="`${card.bank} · ${card.last4}`"
            :value="card.id" /></el-select></el-form-item
      ><el-form-item label="交易日期"
        ><el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至" /></el-form-item
      ><el-form-item label="账单状态"
        ><el-select
          v-model="filters.billStatus"
          clearable
          placeholder="全部状态"
          ><el-option label="已出账" value="issued" /><el-option
            label="未出账"
            value="unissued" /></el-select></el-form-item
      ><el-form-item class="filter-actions"
        ><el-button @click="resetFilters"
          ><el-icon><RefreshRight /></el-icon>重置</el-button
        ></el-form-item
      ></el-form
    >
  </section>

  <el-row class="summary-row" :gutter="12"
    ><el-col :xs="24" :sm="8"
      ><div class="summary-item">
        <span>筛选结果</span><strong>{{ filteredRows.length }} 笔</strong>
      </div></el-col
    ><el-col :xs="24" :sm="8"
      ><div class="summary-item">
        <span>交易金额</span
        ><strong>{{ formatMoneyFromFen(totalAmountFen) }}</strong>
      </div></el-col
    ><el-col :xs="24" :sm="8"
      ><div class="summary-item">
        <span>手续费</span
        ><strong>{{ formatMoneyFromFen(totalFeeFen) }}</strong>
      </div></el-col
    ></el-row
  >

  <TransactionTable
    :rows="pageRows"
    :loading="loading"
    title="交易明细"
    :description="`共 ${filteredRows.length} 笔符合条件的记录`"
    :searchable="false"
    editable
    @edit="emit('edit', $event)"
    @delete="deleteTransaction"
  />
  <div class="pagination">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="filteredRows.length"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      background
    />
  </div>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 0 20px;
}
.eyebrow {
  margin: 0 0 6px;
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
}
.page-heading h2 {
  margin: 0;
  font-size: 22px;
}
.page-heading > div > p:last-child {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.filter-panel {
  margin-bottom: 14px;
  padding: 14px 18px 2px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.filter-panel :deep(.el-form-item) {
  margin-right: 12px;
}
.filter-panel :deep(.el-form-item__label) {
  padding-bottom: 4px;
  color: var(--text-muted);
  font-size: 11px;
}
.filter-panel :deep(.el-input) {
  width: 190px;
}
.filter-panel :deep(.el-select) {
  width: 170px;
}
.filter-actions {
  align-self: flex-end;
}
.summary-row {
  margin-bottom: 14px;
}
.summary-item {
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.summary-item span,
.summary-item strong {
  display: block;
}
.summary-item span {
  color: var(--text-muted);
  font-size: 11px;
}
.summary-item strong {
  margin-top: 5px;
  font-size: 20px;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  overflow-x: auto;
}
@media (max-width: 760px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
    padding-top: 22px;
  }
  .page-heading .el-button {
    width: 100%;
  }
  .page-heading :deep(.el-space),
  .page-heading :deep(.el-space__item),
  .page-heading :deep(.el-upload) {
    width: 100%;
  }
  .filter-panel :deep(.el-form),
  .filter-panel :deep(.el-form-item) {
    display: block;
    margin-right: 0;
  }
  .filter-panel :deep(.el-input),
  .filter-panel :deep(.el-select),
  .filter-panel :deep(.el-date-editor) {
    width: 100%;
  }
  .summary-row :deep(.el-col + .el-col) {
    margin-top: 10px;
  }
  .pagination {
    justify-content: flex-start;
  }
}
</style>
