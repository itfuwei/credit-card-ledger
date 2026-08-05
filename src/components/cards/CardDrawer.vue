<!-- 负责新增和编辑信用卡档案，并把用户输入转换为领域层使用的分整数。 -->
<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({ modelValue: Boolean, card: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'submit'])
const formRef = ref()
const submitting = ref(false)
const form = reactive({ bank: '', name: '', last4: '', limitYuan: null, statementDay: 1, paymentDay: 1, color: '#3f6fb6', status: 'active', hasCheckIn: false, pointsRating: 'average', pointsRedemptionPath: '' })
const drawerTitle = computed(() => props.card ? '编辑信用卡' : '添加信用卡')
const drawerSize = computed(() => window.innerWidth <= 640 ? '100%' : '500px')
const rules = {
  bank: [{ required: true, message: '请输入发卡银行', trigger: 'blur' }],
  name: [{ required: true, message: '请输入卡片名称', trigger: 'blur' }],
  last4: [{ required: true, pattern: /^\d{4}$/, message: '请输入 4 位卡号后四位', trigger: 'blur' }],
  limitYuan: [{ required: true, type: 'number', min: 0.01, message: '请输入大于 0 的固定额度', trigger: 'blur' }],
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  const card = props.card
  // 表单使用元以方便输入，提交时再转为分，避免在累计计算中使用浮点数。
  Object.assign(form, card ? { ...card, limitYuan: card.limitFen / 100 } : { bank: '', name: '', last4: '', limitYuan: null, statementDay: 1, paymentDay: 1, color: '#3f6fb6', status: 'active', hasCheckIn: false, pointsRating: 'average', pointsRedemptionPath: '' })
})

async function submit() {
  if (!await formRef.value.validate().catch(() => false)) return
  submitting.value = true
  try {
    await emit('submit', { bank: form.bank.trim(), name: form.name.trim(), last4: form.last4, limitFen: Math.round(form.limitYuan * 100), statementDay: form.statementDay, paymentDay: form.paymentDay, color: form.color, status: form.status, hasCheckIn: form.hasCheckIn, pointsRating: form.pointsRating, pointsRedemptionPath: form.pointsRedemptionPath.trim() })
    emit('update:modelValue', false)
  } finally { submitting.value = false }
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="drawerTitle" :size="drawerSize" destroy-on-close @close="emit('update:modelValue', false)">
    <p class="drawer-description">只保存银行、卡片名称和后四位，不要填写完整卡号或任何支付密码。</p>
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <div class="form-row"><el-form-item label="发卡银行" prop="bank"><el-input v-model="form.bank" maxlength="20" placeholder="例如：招商银行" /></el-form-item><el-form-item label="卡片名称" prop="name"><el-input v-model="form.name" maxlength="30" placeholder="例如：经典白金卡" /></el-form-item></div>
      <div class="form-row"><el-form-item label="卡号后四位" prop="last4"><el-input v-model="form.last4" maxlength="4" inputmode="numeric" placeholder="例如：8891" /></el-form-item><el-form-item label="固定额度（元）" prop="limitYuan"><el-input-number v-model="form.limitYuan" :min="0.01" :precision="2" :step="1000" controls-position="right" style="width:100%" /></el-form-item></div>
      <div class="form-row"><el-form-item label="账单日"><el-input-number v-model="form.statementDay" :min="1" :max="31" controls-position="right" style="width:100%" /></el-form-item><el-form-item label="还款日"><el-input-number v-model="form.paymentDay" :min="1" :max="31" controls-position="right" style="width:100%" /></el-form-item></div>
      <div class="form-row"><el-form-item label="卡片标识色"><el-color-picker v-model="form.color" /></el-form-item><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio-button value="active">启用</el-radio-button><el-radio-button value="inactive">停用</el-radio-button></el-radio-group></el-form-item></div>
      <div class="form-row"><el-form-item label="是否需要签到"><el-switch v-model="form.hasCheckIn" inline-prompt active-text="是" inactive-text="否" /></el-form-item><el-form-item label="积分等级"><el-radio-group v-model="form.pointsRating"><el-radio-button value="good">优</el-radio-button><el-radio-button value="average">良</el-radio-button><el-radio-button value="poor">差</el-radio-button></el-radio-group></el-form-item></div>
      <el-form-item label="积分兑换路径"><el-input v-model="form.pointsRedemptionPath" type="textarea" :rows="2" maxlength="160" show-word-limit placeholder="例如：银行 App → 积分专区 → 礼品兑换；也可填写兑换页面地址" /></el-form-item>
    </el-form>
    <template #footer><div class="drawer-actions"><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="submitting" @click="submit">保存</el-button></div></template>
  </el-drawer>
</template>

<style scoped>
.drawer-description { margin: 0 0 22px; color: var(--text-secondary); font-size: 12px; line-height: 1.7; }.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.drawer-actions { display: flex; justify-content: flex-end; gap: 8px; }.drawer-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 520px) { .form-row { grid-template-columns: 1fr; gap: 0; } }
</style>
