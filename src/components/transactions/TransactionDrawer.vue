<!-- 负责用 Element Plus 抽屉收集交易信息，并在提交前将表单中的元转换为领域层使用的分。 -->
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { CreditCard } from '@element-plus/icons-vue'
import { calculateFeeFen } from '../../domain/transactionFee.js'

const props = defineProps({ modelValue: Boolean, cards: { type: Array, required: true }, transaction: { type: Object, default: null }, fixedCardId: { type: String, default: '' }, submitHandler: { type: Function, required: true } })
const emit = defineEmits(['update:modelValue'])
const formRef = ref()
const submitting = ref(false)
const form = reactive({ cardId: '', date: '', amountYuan: null, feeYuan: 0, note: '' })
const drawerTitle = computed(() => props.transaction ? '编辑交易' : '记录一笔交易')
const selectedCard = computed(() => props.cards.find((card) => card.id === form.cardId))
const feeRates = [22, 25, 29]
const canCalculateFee = computed(() => Number(form.amountYuan) > 0)
// 移动端用全屏抽屉，避免窄屏下双列金额字段与操作区拥挤。
const drawerSize = computed(() => window.innerWidth <= 640 ? '100%' : '480px')
const rules = {
  cardId: [{ required: true, message: '请选择信用卡', trigger: 'change' }],
  date: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  amountYuan: [{ required: true, message: '请输入交易金额', trigger: 'blur' }],
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  const transaction = props.transaction
  const today = new Intl.DateTimeFormat('en-CA').format(new Date())
  Object.assign(form, transaction ? { cardId: transaction.cardId, date: transaction.date, amountYuan: transaction.amountFen / 100, feeYuan: transaction.feeFen / 100, note: transaction.note } : { cardId: props.fixedCardId || props.cards.find((card) => card.status === 'active')?.id || '', date: today, amountYuan: null, feeYuan: 0, note: '' })
})

function applyFeeRate(rate) {
  form.feeYuan = calculateFeeFen(form.amountYuan, rate) / 100
}

async function submit() {
  if (!await formRef.value.validate().catch(() => false)) return
  submitting.value = true
  try {
    // 持久化层只接收整数分，规避 JavaScript 浮点金额在累计后的精度误差。
    await props.submitHandler({ cardId: form.cardId, date: form.date, amountFen: Math.round(form.amountYuan * 100), feeFen: Math.round((form.feeYuan || 0) * 100), note: form.note.trim() })
    emit('update:modelValue', false)
  } finally { submitting.value = false }
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="drawerTitle" :size="drawerSize" destroy-on-close @close="emit('update:modelValue', false)">
    <p class="drawer-description">账单周期、预计出账日和还款日将自动计算。</p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="信用卡" prop="cardId"><el-select v-model="form.cardId" :disabled="Boolean(fixedCardId)" style="width:100%"><el-option v-for="card in cards" :key="card.id" :disabled="card.status !== 'active' && card.id !== form.cardId" :label="`${card.bank} · ${card.name} ${card.last4}${card.status === 'active' ? '' : '（已停用）'}`" :value="card.id" /></el-select><div v-if="fixedCardId" class="fixed-card-hint">从卡片快捷入口打开，当前信用卡不可切换</div></el-form-item>
      <div v-if="selectedCard" class="billing-rules"><span>账单日<strong>每月 {{ selectedCard.statementDay }} 日</strong></span><span>还款日<strong>每月 {{ selectedCard.paymentDay }} 日</strong></span></div>
      <el-form-item label="交易日期" prop="date"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" /></el-form-item>
      <div class="form-row"><el-form-item label="交易金额（元）" prop="amountYuan"><el-input-number v-model="form.amountYuan" :min="0.01" :precision="2" :step="100" controls-position="right" style="width:100%" /></el-form-item><el-form-item label="手续费（元）"><el-input-number v-model="form.feeYuan" :min="0" :precision="2" :step="1" controls-position="right" style="width:100%" /><div class="fee-shortcuts"><span>快捷计算</span><el-tooltip v-for="rate in feeRates" :key="rate" :content="`按交易金额的万分之 ${rate} 计算，向上取整到分`" placement="top"><el-button size="small" :disabled="!canCalculateFee" @click="applyFeeRate(rate)">万{{ rate }}</el-button></el-tooltip></div></el-form-item></div>
      <el-form-item label="备注"><el-input v-model="form.note" maxlength="80" show-word-limit placeholder="选填，例如用途或交易说明" /></el-form-item>
    </el-form>
    <template #footer><div class="drawer-actions"><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="submitting" @click="submit"><el-icon><CreditCard /></el-icon>{{ transaction ? '保存修改' : '保存交易' }}</el-button></div></template>
  </el-drawer>
</template>

<style scoped>
.drawer-description { margin-bottom: 22px; color: var(--text-secondary); font-size: 12px; }.fixed-card-hint { margin-top: 5px; color: var(--text-muted); font-size: 11px; }.billing-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: -2px 0 18px; }.billing-rules span { padding: 10px 12px; border: 1px solid var(--border-soft); border-radius: 6px; color: var(--text-muted); background: var(--surface-subtle); font-size: 11px; }.billing-rules strong { display: block; margin-top: 4px; color: var(--text-primary); font-size: 13px; }.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.fee-shortcuts { width: 100%; display: flex; align-items: center; gap: 4px; margin-top: 7px; }.fee-shortcuts > span { margin-right: auto; color: var(--text-muted); font-size: 10px; }.fee-shortcuts .el-button { min-width: 40px; padding: 5px 7px; }.drawer-actions { display: flex; justify-content: flex-end; gap: 8px; }.drawer-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 520px) { .form-row { grid-template-columns: 1fr; gap: 0; } }
</style>
