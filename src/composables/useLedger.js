// 编排账本加载、派生状态和交易写入，供多个视图共享同一份前端状态。
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { buildCardRepaymentPlans, enrichTransactions, summarizeCards, summarizeLedger } from '../domain/ledger'
import { ledgerRepository } from '../repositories/ledgerRepository'

const cards = ref([])
const transactions = ref([])
const repayments = ref([])
const activities = ref([])
const loading = ref(false)
// 防止同一页面内多个使用者重复触发初始加载并覆盖正在编辑的内存状态。
let initialized = false
let initializationPromise = null

export function useLedger() {
  const cardRows = computed(() => summarizeCards(cards.value, transactions.value, repayments.value))
  const totals = computed(() => summarizeLedger(cardRows.value))
  const transactionRows = computed(() => enrichTransactions(transactions.value, cards.value))
  const repaymentPlans = computed(() => buildCardRepaymentPlans(cards.value, transactions.value, repayments.value))

  // 登录成功后调用，从 Supabase 加载当前用户的全部数据。
  async function loadLedgerData() {
    if (initialized) return
    if (initializationPromise) return initializationPromise
    loading.value = true
    initializationPromise = (async () => {
      const ledger = await ledgerRepository.loadLedger()
      cards.value = ledger.cards
      transactions.value = ledger.transactions
      repayments.value = ledger.repayments || []
      activities.value = ledger.activities || []
      initialized = true
    })()
    try { await initializationPromise } finally { loading.value = false; initializationPromise = null }
  }

  // 退出登录时调用，清空内存状态并重置初始化标记。
  function resetState() {
    cards.value = []
    transactions.value = []
    repayments.value = []
    activities.value = []
    initialized = false
    initializationPromise = null
  }

  async function createTransaction(payload) {
    const created = await ledgerRepository.createTransaction(payload)
    transactions.value.push(created)
    ElMessage.success('交易已记录')
  }

  async function importCards(imported) {
    cards.value = await ledgerRepository.importCards(imported)
    ElMessage.success(`已导入 ${imported.length} 张信用卡`)
  }

  async function importTransactions(imported) {
    transactions.value = await ledgerRepository.importTransactions(imported)
    ElMessage.success(`已导入 ${imported.length} 笔交易`)
  }

  async function deleteTransaction(id) {
    await ledgerRepository.deleteTransaction(id)
    transactions.value = transactions.value.filter((item) => item.id !== id)
    ElMessage.success('交易已删除')
  }

  async function updateTransaction(id, payload) {
    const updated = await ledgerRepository.updateTransaction(id, payload)
    const index = transactions.value.findIndex((item) => item.id === id)
    if (index !== -1) transactions.value[index] = updated
    ElMessage.success('交易已更新')
  }

  async function createRepayment(payload) {
    const created = await ledgerRepository.createRepayment(payload)
    repayments.value.push(created)
    ElMessage.success('还款已记录')
  }

  async function deleteRepayment(id) {
    await ledgerRepository.deleteRepayment(id)
    repayments.value = repayments.value.filter((item) => item.id !== id)
    ElMessage.success('还款记录已删除')
  }

  async function createActivity(payload) {
    const created = await ledgerRepository.createActivity(payload)
    activities.value.push(created)
    ElMessage.success('活动已添加')
  }

  async function updateActivity(id, payload) {
    const updated = await ledgerRepository.updateActivity(id, payload)
    const index = activities.value.findIndex((item) => item.id === id)
    if (index !== -1) activities.value[index] = updated
    ElMessage.success('活动已更新')
  }

  async function deleteActivity(id) {
    await ledgerRepository.deleteActivity(id)
    activities.value = activities.value.filter((item) => item.id !== id)
    ElMessage.success('活动已删除')
  }

  async function createCard(payload) {
    const created = await ledgerRepository.createCard(payload)
    cards.value.push(created)
    ElMessage.success('信用卡已添加')
  }

  async function updateCard(id, payload) {
    const updated = await ledgerRepository.updateCard(id, payload)
    const index = cards.value.findIndex((item) => item.id === id)
    if (index !== -1) cards.value[index] = updated
    ElMessage.success('信用卡信息已更新')
  }

  async function deleteCard(id) {
    try {
      await ledgerRepository.deleteCard(id)
      cards.value = cards.value.filter((item) => item.id !== id)
      ElMessage.success('信用卡已删除')
    } catch (error) {
      ElMessage.warning(error.message || '删除信用卡失败')
    }
  }

  return { cards, transactions, cardRows, totals, transactionRows, repaymentPlans, repayments, activities, loading, loadLedgerData, resetState, createTransaction, updateTransaction, deleteTransaction, importCards, importTransactions, createRepayment, deleteRepayment, createActivity, updateActivity, deleteActivity, createCard, updateCard, deleteCard }
}
