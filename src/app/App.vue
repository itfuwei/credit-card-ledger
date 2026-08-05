<!-- 负责装配应用框架与当前页面，并在框架顶栏和页面间共享交易录入抽屉状态。 -->
<script setup>
import { ref, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import AppShell from '../components/layout/AppShell.vue'
import TransactionDrawer from '../components/transactions/TransactionDrawer.vue'
import { useLedger } from '../composables/useLedger'
import { useAuth } from '../composables/useAuth'
import LoginView from '../views/LoginView.vue'
import CardsView from '../views/CardsView.vue'
import ActivitiesView from '../views/ActivitiesView.vue'
import DashboardView from '../views/DashboardView.vue'
import RepaymentsView from '../views/RepaymentsView.vue'
import TransactionsView from '../views/TransactionsView.vue'

const activeNavigation = ref('dashboard')
const transactionEntryOpen = ref(false)
const editingTransaction = ref(null)
const fixedTransactionCardId = ref('')
const { cards, createTransaction, updateTransaction, loadLedgerData, resetState } = useLedger()
const { user, loading: authLoading, signOut } = useAuth()

// 认证状态变化时加载或清空数据。
watch(() => user.value, async (newUser) => {
  if (newUser) {
    await loadLedgerData()
  } else {
    resetState()
    activeNavigation.value = 'dashboard'
  }
})

function openCreateTransaction(cardId = '') {
  editingTransaction.value = null
  fixedTransactionCardId.value = typeof cardId === 'string' ? cardId : ''
  transactionEntryOpen.value = true
}

function openEditTransaction(transaction) {
  editingTransaction.value = transaction
  fixedTransactionCardId.value = ''
  transactionEntryOpen.value = true
}

async function saveTransaction(payload) {
  if (editingTransaction.value) await updateTransaction(editingTransaction.value.id, payload)
  else await createTransaction(payload)
}

async function handleSignOut() {
  await signOut()
}
</script>

<template>
  <!-- 认证加载中 -->
  <div v-if="authLoading" class="auth-loading">
    <el-icon class="is-loading" :size="32"><Loading /></el-icon>
  </div>

  <!-- 未登录 -->
  <LoginView v-else-if="!user" />

  <!-- 已登录 -->
  <template v-else>
    <AppShell v-model="activeNavigation" :user-email="user.email" @create-transaction="openCreateTransaction" @sign-out="handleSignOut">
      <DashboardView v-if="activeNavigation === 'dashboard'" @create="openCreateTransaction" />
      <CardsView v-else-if="activeNavigation === 'cards'" @create-transaction="openCreateTransaction" />
      <TransactionsView v-else-if="activeNavigation === 'transactions'" @create="openCreateTransaction" @edit="openEditTransaction" />
      <RepaymentsView v-else-if="activeNavigation === 'repayments'" />
      <ActivitiesView v-else-if="activeNavigation === 'activities'" />
    </AppShell>
    <TransactionDrawer v-model="transactionEntryOpen" :cards="cards" :transaction="editingTransaction" :fixed-card-id="fixedTransactionCardId" :submit-handler="saveTransaction" />
  </template>
</template>

<style scoped>
.auth-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: var(--text-secondary);
}
</style>
