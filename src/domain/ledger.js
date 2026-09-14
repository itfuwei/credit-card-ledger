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

// 按卡片维度生成还款计划：每张卡固定一行，不再按账期拆分成多条记录。
// 待还金额为该卡所有未还清账期的合计，日期与状态以最早到期的未还清账期为准；
// 全部还清时，该行自动切换到下一期账单金额与还款日做预告。
export function buildCardRepaymentPlans(cards, transactions, repayments = [], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayStr = formatLocalDate(now)

  return cards.map((card) => {
    const cardTransactions = transactions.filter((item) => item.cardId === card.id)
    const cardRepayments = repayments
      .filter((item) => item.cardId === card.id && item.date <= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))

    // 已出账账期（statementDate <= today）与未出账账期（下一期预告）分别分组。
    const issuedCycles = new Map()
    const previewCycles = new Map()
    cardTransactions.forEach((transaction) => {
      const cycle = getBillingCycle(transaction.date, card)
      const bucket = cycle.statementDate > today ? previewCycles : issuedCycles
      const key = cycle.statementDate.getTime()
      const existing = bucket.get(key)
      if (existing) {
        existing.amountFen += transaction.amountFen
        existing.feeFen += transaction.feeFen
        existing.transactionCount += 1
      } else {
        bucket.set(key, {
          statementDate: cycle.statementDate,
          paymentDate: cycle.paymentDate,
          amountFen: transaction.amountFen,
          feeFen: transaction.feeFen,
          transactionCount: 1,
        })
      }
    })

    const issuedPlans = [...issuedCycles.values()]

    // 还款冲减：只冲减出账日不晚于还款日的账期（即还款时已出账的账单）。
    const remaining = new Map(issuedPlans.map((plan) => [plan.statementDate.getTime(), plan.amountFen]))
    cardRepayments.forEach((repayment) => {
      const [ry, rm, rd] = repayment.date.split('-').map(Number)
      const repaymentDate = new Date(ry, rm - 1, rd)
      let amount = repayment.amountFen
      issuedPlans
        .filter((plan) => plan.statementDate <= repaymentDate)
        .sort((a, b) => a.paymentDate - b.paymentDate)
        .forEach((plan) => {
          const key = plan.statementDate.getTime()
          const applied = Math.min(amount, remaining.get(key))
          remaining.set(key, remaining.get(key) - applied)
          amount -= applied
        })
    })

    const withOutstanding = issuedPlans.map((plan) => ({
      ...plan,
      outstandingFen: remaining.get(plan.statementDate.getTime()),
    }))

    const unpaidCycles = withOutstanding
      .filter((plan) => plan.outstandingFen > 0)
      .sort((a, b) => a.paymentDate - b.paymentDate)

    // 下一期预告：取未出账账期中最早出账的那一期。
    const nextCycle = [...previewCycles.values()].sort((a, b) => a.statementDate - b.statementDate)[0]

    if (unpaidCycles.length === 0) {
      // 全部还清：切换到下一期账单金额与还款日做预告。
      return {
        id: card.id,
        card,
        statementDate: nextCycle?.statementDate,
        paymentDate: nextCycle?.paymentDate,
        amountFen: nextCycle ? nextCycle.amountFen : 0,
        paidFen: withOutstanding.reduce((sum, plan) => sum + plan.amountFen - plan.outstandingFen, 0),
        outstandingFen: 0,
        feeFen: nextCycle ? nextCycle.feeFen : 0,
        transactionCount: nextCycle ? nextCycle.transactionCount : 0,
        daysToPayment: nextCycle ? daysUntil(nextCycle.paymentDate, today) : null,
        status: 'paid',
        isPreview: true,
      }
    }

    // 有待还：以最早到期账期为状态参照，金额为所有未还清账期合计。
    const earliest = unpaidCycles[0]
    const totals = unpaidCycles.reduce((acc, plan) => {
      acc.amountFen += plan.amountFen
      acc.outstandingFen += plan.outstandingFen
      acc.feeFen += plan.feeFen
      acc.transactionCount += plan.transactionCount
      return acc
    }, { amountFen: 0, outstandingFen: 0, feeFen: 0, transactionCount: 0 })

    const daysToPayment = daysUntil(earliest.paymentDate, today)
    let status = 'planned'
    if (daysToPayment < 0) status = 'overdue'
    else if (daysToPayment <= 3) status = 'urgent'
    else if (daysToPayment <= 7) status = 'upcoming'

    return {
      id: card.id,
      card,
      statementDate: earliest.statementDate,
      paymentDate: earliest.paymentDate,
      amountFen: totals.amountFen,
      paidFen: withOutstanding.reduce((sum, plan) => sum + plan.amountFen - plan.outstandingFen, 0),
      outstandingFen: totals.outstandingFen,
      feeFen: totals.feeFen,
      transactionCount: totals.transactionCount,
      daysToPayment,
      status,
      isPreview: false,
    }
  }).sort((left, right) => {
    const l = left.outstandingFen > 0 ? left.paymentDate.getTime() : Infinity
    const r = right.outstandingFen > 0 ? right.paymentDate.getTime() : Infinity
    return l - r || left.card.bank.localeCompare(right.card.bank, 'zh-CN')
  })
}

function formatLocalDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
