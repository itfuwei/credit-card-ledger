<!-- 负责录入一笔实际还款，并将金额转换为领域层使用的分整数。 -->
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Wallet } from '@element-plus/icons-vue'

const props = defineProps({ modelValue: Boolean, cards: { type: Array, required: true }, submitHandler: { type: Function, required: true } })
const emit = defineEmits(['update:modelValue'])
const formRef = ref()
const submitting = ref(false)
const form = reactive({ cardId: '', date: '', amountYuan: null, note: '' })
const drawerSize = computed(() => window.innerWidth <= 640 ? '100%' : '480px')
const rules = { cardId: [{ required: true, message: '请选择信用卡', trigger: 'change' }], date: [{ required: true, message: '请选择还款日期', trigger: 'change' }], amountYuan: [{ required: true, type: 'number', min: 0.01, message: '请输入大于 0 的还款金额', trigger: 'blur' }] }

watch(() => props.modelValue, (open) => {
  if (!open) return
  // 使用本地自然日，避免 UTC 转换使东八区的默认日期提前一天。
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  Object.assign(form, { cardId: props.cards.find((card) => card.status === 'active')?.id || '', date: today, amountYuan: null, note: '' })
})

async function submit() {
  if (!await formRef.value.validate().catch(() => false)) return
  submitting.value = true
  try {
    // 持久化只保存整数分，计划分配和额度计算不会引入浮点累计误差。
    await props.submitHandler({ cardId: form.cardId, date: form.date, amountFen: Math.round(form.amountYuan * 100), note: form.note.trim() })
    emit('update:modelValue', false)
  } finally { submitting.value = false }
}
</script>

<template>
  <el-drawer :model-value="modelValue" title="记录还款" :size="drawerSize" destroy-on-close @close="emit('update:modelValue', false)">
    <p class="drawer-description">还款会优先冲减这张卡最早到期的已出账账期；当前不自动分配到未出账金额。</p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="信用卡" prop="cardId"><el-select v-model="form.cardId" style="width:100%"><el-option v-for="card in cards.filter((item) => item.status === 'active')" :key="card.id" :label="`${card.bank} · ${card.name} ${card.last4}`" :value="card.id" /></el-select></el-form-item>
      <el-form-item label="还款日期" prop="date"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></el-form-item>
      <el-form-item label="还款金额（元）" prop="amountYuan"><el-input-number v-model="form.amountYuan" :min="0.01" :precision="2" :step="1000" controls-position="right" style="width:100%" /></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.note" maxlength="80" show-word-limit placeholder="选填，例如还款渠道或说明" /></el-form-item>
    </el-form>
    <template #footer><div class="drawer-actions"><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="submitting" @click="submit"><el-icon><Wallet /></el-icon>保存还款</el-button></div></template>
  </el-drawer>
</template>

<style scoped>
.drawer-description { margin: 0 0 22px; color: var(--text-secondary); font-size: 12px; line-height: 1.7; }.drawer-actions { display: flex; justify-content: flex-end; gap: 8px; }.drawer-actions :deep(.el-button + .el-button) { margin-left: 0; }
</style>
