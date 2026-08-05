<!-- 负责组合信用卡档案页的概览、列表和新增编辑抽屉，不直接处理持久化。 -->
<script setup>
import { computed, ref } from 'vue'
import { Download, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CardDirectory from '../components/cards/CardDirectory.vue'
import CardDrawer from '../components/cards/CardDrawer.vue'
import PointsProductsDrawer from '../components/cards/PointsProductsDrawer.vue'
import { useLedger } from '../composables/useLedger'
import { prepareCardsForExport, validateCardImport } from '../domain/importData'
import { downloadJson, readJsonUpload } from '../utils/jsonTransfer'

const { cards, loading, createCard, updateCard, deleteCard, importCards } = useLedger()
const emit = defineEmits(['create-transaction'])
const drawerOpen = ref(false)
const editingCard = ref(null)
const productsCard = ref(null)
const productsDrawerOpen = ref(false)
const uploadKey = ref(0)
const activeCount = computed(() => cards.value.filter((item) => item.status === 'active').length)

function openCreate() { editingCard.value = null; drawerOpen.value = true }
function openEdit(card) { editingCard.value = card; drawerOpen.value = true }
async function saveCard(payload) { if (editingCard.value) await updateCard(editingCard.value.id, payload); else await createCard(payload) }
async function toggleStatus(card) { await updateCard(card.id, { ...card, status: card.status === 'active' ? 'inactive' : 'active' }) }
function openProducts(card) { productsCard.value = card; productsDrawerOpen.value = true }
async function saveProducts(cardId, pointsProducts) { await updateCard(cardId, { pointsProducts }) }
function exportCards() { downloadJson('cards', prepareCardsForExport(cards.value)) }
async function handleCardImport(uploadFile) {
  try {
    const imported = validateCardImport(await readJsonUpload(uploadFile, 'cards'))
    await importCards(imported)
  } catch (error) { ElMessage.error(error.message || '信用卡导入失败') }
  finally { uploadKey.value += 1 }
}
</script>

<template>
  <section class="cards-intro"><div><p class="eyebrow">卡片档案</p><h2>管理你的信用卡</h2><p>维护额度、账单日和还款日，交易录入将自动使用这些规则。</p></div><el-space wrap><el-button @click="exportCards"><el-icon><Download /></el-icon>导出 JSON</el-button><el-upload :key="uploadKey" accept="application/json,.json" :auto-upload="false" :show-file-list="false" :on-change="handleCardImport"><el-button><el-icon><Upload /></el-icon>导入 JSON</el-button></el-upload><el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>添加信用卡</el-button></el-space></section>
  <el-row class="summary-row" :gutter="12"><el-col :xs="24" :sm="12"><div class="summary-item"><span>已添加卡片</span><strong>{{ cards.length }} 张</strong></div></el-col><el-col :xs="24" :sm="12"><div class="summary-item"><span>当前启用</span><strong>{{ activeCount }} 张</strong></div></el-col></el-row>
  <CardDirectory :cards="cards" :loading="loading" @edit="openEdit" @delete="deleteCard" @toggle-status="toggleStatus" @manage-products="openProducts" @create-transaction="emit('create-transaction', $event)" />
  <CardDrawer v-model="drawerOpen" :card="editingCard" @submit="saveCard" />
  <PointsProductsDrawer v-model="productsDrawerOpen" :card="productsCard" :submit-handler="saveProducts" />
</template>

<style scoped>
.cards-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 28px 0 20px; }.eyebrow { margin: 0 0 6px; color: var(--brand); font-size: 12px; font-weight: 600; }.cards-intro h2 { margin: 0; font-size: 22px; }.cards-intro > div > p:last-child { margin: 7px 0 0; color: var(--text-secondary); font-size: 13px; }.summary-row { margin-bottom: 14px; }.summary-item { padding: 15px 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }.summary-item span,.summary-item strong { display: block; }.summary-item span { color: var(--text-muted); font-size: 11px; }.summary-item strong { margin-top: 5px; color: var(--text-primary); font-size: 21px; }
@media (max-width: 640px) { .cards-intro { align-items: stretch; flex-direction: column; padding-top: 22px; }.cards-intro :deep(.el-space),.cards-intro :deep(.el-space__item),.cards-intro .el-button,.cards-intro :deep(.el-upload) { width: 100%; }.summary-row :deep(.el-col + .el-col) { margin-top: 12px; } }
</style>
