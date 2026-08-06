// 汇总卡片额度、账单状态和流水展示数据，保持与 Vue 和持久化实现解耦。
import { daysUntil, getBillingCycle, getNextPaymentDate } from './billing.js'

export function summarizeCards(cards, transactions, repayments = [], now = new Date()) {
  return cards.map((card) => {
    const items = transactions.filter((item) => item.cardId === card.id)
    const repaidFen = repayments.filter((item) => item.cardId === card.id && item.date <= formatLocalDate(now)).reduce((sum, item) => sum + item.amountFen, 0)
    const balanceFen = Math.max(0, items.reduce((sum, item) => sum + item.amountFen, 0) - repaidFen)
    // 已出账只统计账单日不晚于当前日期的交易，未出账由总占用减去已出账得到。
    const issuedFen = items
      .filter((item) => getBillingCycle(item.date, card).statementDate <= now)
      .reduce((sum, item) => sum + item.amountFen, 0)
    const issuedAfterRepaymentFen = Math.max(0, issuedFen - repaidFen)
    const nextPaymentDate = getNextPaymentDate(card, now)
    return {
      ...card,
      balanceFen,
      issuedFen: issuedAfterRepaymentFen,
      unissuedFen: Math.max(0, balanceFen - issuedAfterRepaymentFen),
      availableFen: Math.max(0, card.limitFen - balanceFen),
      usage: card.limitFen ? balanceFen / card.limitFen : 0,
      nextPaymentDate,
      daysToPayment: daysUntil(nextPaymentDate, now),
    }
  })
}

export function summarizeLedger(cardRows) {
  return cardRows.reduce((total, card) => ({
    limitFen: total.limitFen + card.limitFen,
    balanceFen: total.balanceFen + card.balanceFen,
    issuedFen: total.issuedFen + card.issuedFen,
    unissuedFen: total.unissuedFen + card.unissuedFen,
  }), { limitFen: 0, balanceFen: 0, issuedFen: 0, unissuedFen: 0 })
}

export function enrichTransactions(transactions, cards) {
  return transactions.map((transaction) => {
    const card = cards.find((item) => item.id === transaction.cardId)
    return { ...transaction, card, billingCycle: getBillingCycle(transaction.date, card) }
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function buildRepaymentPlans(cards, transactions, now = new Date()) {
  const plans = new Map()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  transactions.forEach((transaction) => {
    const card = cards.find((item) => item.id === transaction.cardId)
    if (!card) return
    const cycle = getBillingCycle(transaction.date, card)
    // 未到出账日的交易不进入待还计划，避免将未出账金额当作需要立即还款。
    if (cycle.statementDate > today) return
    const key = `${card.id}:${cycle.statementDate.getFullYear()}-${cycle.statementDate.getMonth()}-${cycle.statementDate.getDate()}`
    const existing = plans.get(key)
    if (existing) {
      existing.amountFen += transaction.amountFen
      existing.feeFen += transaction.feeFen
      existing.transactionCount += 1
      return
    }
    plans.set(key, {
      id: key,
      card,
      statementDate: cycle.statementDate,
      paymentDate: cycle.paymentDate,
      amountFen: transaction.amountFen,
      feeFen: transaction.feeFen,
      transactionCount: 1,
    })
  })

  return [...plans.values()].map((plan) => {
    const daysToPayment = daysUntil(plan.paymentDate, today)
    let status = 'planned'
    if (daysToPayment < 0) status = 'overdue'
    else if (daysToPayment <= 3) status = 'urgent'
    else if (daysToPayment <= 7) status = 'upcoming'
    return { ...plan, daysToPayment, status }
  }).sort((left, right) => left.paymentDate - right.paymentDate || left.card.bank.localeCompare(right.card.bank, 'zh-CN'))
}

function formatLocalDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

export function applyRepaymentsToPlans(plans, repayments, now = new Date()) {
  const remaining = new Map(plans.map((plan) => [plan.id, plan.amountFen]))
  repayments.filter((item) => item.date <= formatLocalDate(now)).sort((a, b) => a.date.localeCompare(b.date)).forEach((repayment) => {
    let amount = repayment.amountFen
    plans.filter((plan) => plan.card.id === repayment.cardId).sort((a, b) => a.paymentDate - b.paymentDate).forEach((plan) => {
      const applied = Math.min(amount, remaining.get(plan.id))
      remaining.set(plan.id, remaining.get(plan.id) - applied)
      amount -= applied
    })
  })
  return plans.map((plan) => {
    const outstandingFen = remaining.get(plan.id)
    const paidFen = plan.amountFen - outstandingFen
    const status = outstandingFen === 0 ? 'paid' : plan.status
    return { ...plan, paidFen, outstandingFen, status }
  })
}
