<!-- 负责独立管理单张信用卡的积分商城优质商品，支持新增、修改和删除。 -->
<script setup>
import { computed, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({ modelValue: Boolean, card: { type: Object, default: null }, submitHandler: { type: Function, required: true } })
const emit = defineEmits(['update:modelValue'])
const products = ref([])
const saving = ref(false)
const drawerSize = computed(() => window.innerWidth <= 640 ? '100%' : '620px')
const title = computed(() => props.card ? `${props.card.bank} · 积分商品` : '积分商品')

watch(() => props.modelValue, (open) => {
  if (!open || !props.card) return
  // 使用副本编辑，用户取消抽屉时不会污染列表中的已保存数据。
  products.value = (props.card.pointsProducts || []).map((item) => ({ ...item, cashValueYuan: item.cashValueFen / 100 }))
})

function addProduct() { products.value.push({ id: crypto.randomUUID(), name: '', pointsCost: null, cashValueYuan: null, note: '' }) }
function removeProduct(index) { products.value.splice(index, 1) }

async function save() {
  if (products.value.some((item) => !item.name.trim() || !Number.isInteger(item.pointsCost) || item.pointsCost <= 0)) { ElMessage.warning('请填写商品名称和大于 0 的整数积分'); return }
  saving.value = true
  try {
    const payload = products.value.map((item) => ({ id: item.id, name: item.name.trim(), pointsCost: item.pointsCost, cashValueFen: Math.round((item.cashValueYuan || 0) * 100), note: item.note.trim() }))
    await props.submitHandler(props.card.id, payload)
    emit('update:modelValue', false)
  } finally { saving.value = false }
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="title" :size="drawerSize" destroy-on-close @close="emit('update:modelValue', false)">
    <div class="drawer-heading"><p>管理值得兑换的商品，修改输入框内容即可编辑。</p><el-button type="primary" @click="addProduct"><el-icon><Plus /></el-icon>添加商品</el-button></div>
    <el-empty v-if="!products.length" :image-size="72" description="暂无商品，点击上方按钮添加" />
    <div v-for="(product, index) in products" :key="product.id" class="product-item">
      <div class="product-index">商品 {{ index + 1 }}</div><el-button class="delete-button" text type="danger" aria-label="删除商品" @click="removeProduct(index)"><el-icon><Delete /></el-icon>删除</el-button>
      <div class="form-grid"><el-form-item label="商品名称" required><el-input v-model="product.name" maxlength="40" placeholder="例如：京东购物卡" /></el-form-item><el-form-item label="所需积分" required><el-input-number v-model="product.pointsCost" :min="1" :step="100" :precision="0" controls-position="right" style="width:100%" /></el-form-item><el-form-item label="参考价值（元）"><el-input-number v-model="product.cashValueYuan" :min="0" :precision="2" :step="10" controls-position="right" style="width:100%" /></el-form-item><el-form-item label="商品说明"><el-input v-model="product.note" maxlength="80" placeholder="例如：10 元电子卡或商品规格" /></el-form-item></div>
    </div>
    <template #footer><div class="drawer-actions"><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存商品</el-button></div></template>
  </el-drawer>
</template>

<style scoped>
.drawer-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }.drawer-heading p { margin: 0; color: var(--text-secondary); font-size: 12px; }.product-item { position: relative; margin-bottom: 14px; padding: 16px 16px 0; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-subtle); }.product-index { margin-bottom: 14px; font-size: 13px; font-weight: 600; }.delete-button { position: absolute; top: 8px; right: 8px; }.form-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 0 12px; }.drawer-actions { display: flex; justify-content: flex-end; gap: 8px; }.drawer-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 640px) { .drawer-heading { align-items: stretch; flex-direction: column; }.drawer-heading .el-button { width: 100%; }.form-grid { grid-template-columns: 1fr; } }
</style>
