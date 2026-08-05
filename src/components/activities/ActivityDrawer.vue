<!-- 负责新增和编辑信用卡活动规则、奖励及领取信息。 -->
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Present } from '@element-plus/icons-vue'

const props = defineProps({ modelValue: Boolean, cards: { type: Array, required: true }, activity: { type: Object, default: null }, submitHandler: { type: Function, required: true } })
const emit = defineEmits(['update:modelValue'])
const formRef = ref()
const saving = ref(false)
const drawerSize = computed(() => window.innerWidth <= 640 ? '100%' : '540px')
const drawerTitle = computed(() => props.activity ? '编辑活动' : '添加活动')
const form = reactive({ cardId: '', title: '', activityPeriod: [], thresholdYuan: null, rewardType: 'points', rewardDescription: '', claimPath: '', claimPeriod: [], claimed: false, claimedAt: '' })
const rules = { cardId: [{ required: true, message: '请选择信用卡', trigger: 'change' }], title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }], activityPeriod: [{ required: true, type: 'array', min: 2, message: '请选择活动时间', trigger: 'change' }], thresholdYuan: [{ required: true, type: 'number', min: 0.01, message: '请输入消费门槛', trigger: 'blur' }], rewardDescription: [{ required: true, message: '请输入奖励内容', trigger: 'blur' }], claimPeriod: [{ required: true, type: 'array', min: 2, message: '请选择领取时间', trigger: 'change' }] }

watch(() => props.modelValue, (open) => {
  if (!open) return
  const item = props.activity
  Object.assign(form, item ? { ...item, activityPeriod: [item.startDate, item.endDate], claimPeriod: [item.claimStartDate, item.claimEndDate], thresholdYuan: item.thresholdFen / 100 } : { cardId: props.cards.find((card) => card.status === 'active')?.id || '', title: '', activityPeriod: [], thresholdYuan: null, rewardType: 'points', rewardDescription: '', claimPath: '', claimPeriod: [], claimed: false, claimedAt: '' })
})

async function submit() {
  if (!await formRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    await props.submitHandler({ cardId: form.cardId, title: form.title.trim(), startDate: form.activityPeriod[0], endDate: form.activityPeriod[1], thresholdFen: Math.round(form.thresholdYuan * 100), rewardType: form.rewardType, rewardDescription: form.rewardDescription.trim(), claimPath: form.claimPath.trim(), claimStartDate: form.claimPeriod[0], claimEndDate: form.claimPeriod[1], claimed: form.claimed, claimedAt: form.claimed ? (form.claimedAt || form.claimPeriod[0]) : '' })
    emit('update:modelValue', false)
  } finally { saving.value = false }
}
</script>

<template>
  <el-drawer :model-value="modelValue" :title="drawerTitle" :size="drawerSize" destroy-on-close @close="emit('update:modelValue', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="信用卡" prop="cardId"><el-select v-model="form.cardId" style="width:100%"><el-option v-for="card in cards" :key="card.id" :label="`${card.bank} · ${card.name} ${card.last4}`" :value="card.id" /></el-select></el-form-item>
      <el-form-item label="活动名称" prop="title"><el-input v-model="form.title" maxlength="40" placeholder="例如：暑期消费达标礼" /></el-form-item>
      <el-form-item label="活动时间" prop="activityPeriod"><el-date-picker v-model="form.activityPeriod" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" range-separator="至" style="width:100%" /></el-form-item>
      <el-form-item label="消费门槛（元）" prop="thresholdYuan"><el-input-number v-model="form.thresholdYuan" :min="0.01" :precision="2" :step="1000" controls-position="right" style="width:100%" /></el-form-item>
      <div class="form-row"><el-form-item label="奖励类型"><el-select v-model="form.rewardType" style="width:100%"><el-option label="积分" value="points" /><el-option label="立减金" value="cash" /><el-option label="优惠券" value="coupon" /><el-option label="实物" value="gift" /><el-option label="其他" value="other" /></el-select></el-form-item><el-form-item label="奖励内容" prop="rewardDescription"><el-input v-model="form.rewardDescription" maxlength="80" placeholder="例如：赠送 10000 积分" /></el-form-item></div>
      <el-form-item label="领取入口"><el-input v-model="form.claimPath" type="textarea" :rows="2" maxlength="160" placeholder="例如：银行 App → 活动中心 → 我的奖励" /></el-form-item>
      <el-form-item label="可领取时间" prop="claimPeriod"><el-date-picker v-model="form.claimPeriod" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始领取" end-placeholder="领取截止" range-separator="至" style="width:100%" /></el-form-item>
      <div class="form-row"><el-form-item label="是否已领取"><el-switch v-model="form.claimed" inline-prompt active-text="是" inactive-text="否" /></el-form-item><el-form-item v-if="form.claimed" label="领取日期"><el-date-picker v-model="form.claimedAt" type="date" value-format="YYYY-MM-DD" placeholder="选择领取日期" style="width:100%" /></el-form-item></div>
    </el-form>
    <template #footer><div class="drawer-actions"><el-button @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="saving" @click="submit"><el-icon><Present /></el-icon>保存活动</el-button></div></template>
  </el-drawer>
</template>

<style scoped>
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }.drawer-actions { display: flex; justify-content: flex-end; gap: 8px; }.drawer-actions :deep(.el-button + .el-button) { margin-left: 0; }
@media (max-width: 520px) { .form-row { grid-template-columns: 1fr; gap: 0; } }
</style>
