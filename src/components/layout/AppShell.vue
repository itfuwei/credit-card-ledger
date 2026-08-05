<!-- 负责应用整体框架，使用 Element Plus 组织侧栏导航、顶栏操作区和页面内容区。 -->
<script setup>
import { Bell, Cloudy, Plus, SwitchButton } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { primaryNavigation, secondaryNavigation } from '../../app/navigation'

const props = defineProps({ modelValue: { type: String, required: true }, userEmail: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'create-transaction', 'sign-out'])

// 页面标题从导航配置派生，新增页面时不必在框架内重复维护一份映射。
const pageTitle = computed(() => primaryNavigation.find((item) => item.id === props.modelValue)?.label || '资金与账单总览')
</script>

<template>
  <el-container class="app-shell">
    <el-aside class="sidebar" width="224px">
      <div class="brand">
        <span class="brand-mark">卡</span>
        <span class="brand-copy"><strong>卡账</strong><small>Card Ledger</small></span>
      </div>

      <el-menu :default-active="modelValue" class="navigation" background-color="transparent" text-color="#aeb4bd" active-text-color="#ffffff" @select="emit('update:modelValue', $event)">
        <el-menu-item v-for="item in primaryNavigation" :key="item.id" :index="item.id" :disabled="!item.available">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title><span>{{ item.label }}</span><el-tag v-if="!item.available" size="small" type="info" effect="plain">稍后</el-tag></template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-menu background-color="transparent" text-color="#aeb4bd">
          <el-menu-item v-for="item in secondaryNavigation" :key="item.id" :index="item.id" disabled>
            <el-icon><component :is="item.icon" /></el-icon><template #title>{{ item.label }}</template>
          </el-menu-item>
        </el-menu>
        <div class="cloud-status"><el-icon><Cloudy /></el-icon><span><strong>云端数据模式</strong><small>{{ userEmail || '已连接 Supabase' }}</small></span></div>
        <el-button class="sign-out-btn" text @click="emit('sign-out')">
          <el-icon><SwitchButton /></el-icon><span>退出登录</span>
        </el-button>
      </div>
    </el-aside>

    <el-container class="workspace" direction="vertical">
      <el-header class="topbar" height="auto">
        <div><p>云端账本 · 数据安全存储于 Supabase</p><h1>{{ pageTitle }}</h1></div>
        <el-space class="topbar-actions" :size="9">
          <el-button circle aria-label="查看提醒"><el-icon><Bell /></el-icon></el-button>
          <el-button type="primary" @click="emit('create-transaction')"><el-icon><Plus /></el-icon>记录交易</el-button>
        </el-space>
      </el-header>
      <el-main class="main-content"><slot /></el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-shell { min-height: 100vh; }.sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 27px 17px 20px; color: #fff; background: var(--sidebar); }.brand { display: flex; align-items: center; gap: 11px; padding: 0 10px 28px; }.brand-mark { width: 38px; aspect-ratio: 1; display: grid; place-items: center; border-radius: 6px; background: var(--brand); font-size: 18px; font-weight: 700; }.brand-copy strong,.brand-copy small { display: block; }.brand-copy strong { font-size: 18px; }.brand-copy small { margin-top: 2px; color: #858c98; font-size: 10px; }
.navigation,.sidebar-footer :deep(.el-menu) { border-right: 0; }.navigation :deep(.el-menu-item),.sidebar-footer :deep(.el-menu-item) { height: 42px; margin-bottom: 5px; border-radius: 6px; }.navigation :deep(.el-menu-item:hover),.navigation :deep(.el-menu-item.is-active) { background: var(--sidebar-hover); }.navigation :deep(.el-menu-item.is-active) { box-shadow: inset 3px 0 var(--brand); }.navigation :deep(.el-menu-item.is-disabled) { opacity: .48; }.navigation .el-tag { margin-left: auto; --el-tag-bg-color: transparent; --el-tag-border-color: #4b525d; --el-tag-text-color: #808995; }
.sidebar-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #303640; }.cloud-status { display: flex; gap: 9px; align-items: flex-start; margin: 18px 11px 0; color: #6f7884; }.cloud-status .el-icon { margin-top: 1px; }.cloud-status span,.cloud-status strong,.cloud-status small { display: block; }.cloud-status strong { color: #8ed1a6; font-size: 11px; font-weight: 500; }.cloud-status small { margin-top: 3px; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
.sign-out-btn { width: 100%; margin-top: 10px; padding: 0 11px; height: 36px; justify-content: flex-start; color: #8b929d; }.sign-out-btn:hover { color: #fff; background: var(--sidebar-hover); }.sign-out-btn .el-icon { margin-right: 8px; }
.workspace { min-width: 0; }.topbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 30px clamp(22px,3vw,46px) 0; }.topbar p { margin-bottom: 5px; color: var(--text-secondary); font-size: 12px; }.topbar h1 { margin: 0; font-size: 26px; }.main-content { padding: 0 clamp(22px,3vw,46px) 50px; overflow: visible; }
@media (max-width: 900px) { .sidebar { width: 74px !important; padding-inline: 10px; }.brand { padding-inline: 7px; }.brand-copy,.navigation :deep(.el-menu-item .el-menu-tooltip__trigger > span),.navigation .el-tag,.sidebar-footer { display: none; }.navigation :deep(.el-menu-item) { justify-content: center; padding: 0; }.navigation :deep(.el-menu-item .el-icon) { margin: 0; } }
@media (max-width: 640px) { .app-shell { display: block; }.sidebar { position: fixed; z-index: 20; inset: auto 0 0; width: 100% !important; height: 62px; padding: 7px 8px; }.brand,.sidebar-footer { display: none; }.navigation { display: grid; grid-template-columns: repeat(5,1fr); }.navigation :deep(.el-menu-item) { height: 48px; margin: 0; }.navigation :deep(.el-menu-item.is-active) { box-shadow: inset 0 -3px var(--brand); }.topbar { padding: 20px 15px 0; align-items: center; }.topbar h1 { font-size: 21px; }.topbar-actions :deep(.el-button:first-child) { display: none; }.main-content { padding: 0 15px 86px; } }
</style>
