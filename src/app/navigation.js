// 定义应用导航配置，图标统一来自 Element Plus 图标包，避免页面组件重复维护导航信息。
import { CreditCard, DataAnalysis, Present, Setting, Tickets, Wallet } from '@element-plus/icons-vue'

export const primaryNavigation = [
  { id: 'dashboard', label: '总览', icon: DataAnalysis, available: true },
  { id: 'cards', label: '信用卡', icon: CreditCard, available: true },
  { id: 'transactions', label: '交易流水', icon: Tickets, available: true },
  { id: 'repayments', label: '还款计划', icon: Wallet, available: true },
  { id: 'activities', label: '活动', icon: Present, available: true },
]

export const secondaryNavigation = [
  { id: 'settings', label: '设置', icon: Setting, available: true },
]
