// 提供与 Vue 无关的账单周期、还款日期和金额展示纯函数。
const DAY_MS = 24 * 60 * 60 * 1000

export function dateAtDay(year, month, day) {
  // 账单日可设为月末附近；短月份必须收敛到真实最后一天。
  return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()))
}

export function getBillingCycle(transactionDate, card) {
  // 以本地自然日比较，保证账单日当天交易归入当期而不受时区时间影响。
  const [year, month, day] = transactionDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const closesThisMonth = dateAtDay(date.getFullYear(), date.getMonth(), card.statementDay)
  const statementDate = date <= closesThisMonth
    ? closesThisMonth
    : dateAtDay(date.getFullYear(), date.getMonth() + 1, card.statementDay)

  let paymentMonth = statementDate.getMonth()
  let paymentYear = statementDate.getFullYear()
  if (card.paymentDay <= card.statementDay) paymentMonth += 1
  const paymentDate = dateAtDay(paymentYear, paymentMonth, card.paymentDay)

  return { statementDate, paymentDate }
}

export function getNextPaymentDate(card, now = new Date()) {
  // 优先返回当前已出账周期尚未到期的还款日；到期后再切换到下一账期。
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const statementThisMonth = dateAtDay(today.getFullYear(), today.getMonth(), card.statementDay)
  let statementDate = today >= statementThisMonth
    ? statementThisMonth
    : dateAtDay(today.getFullYear(), today.getMonth() - 1, card.statementDay)

  const paymentFor = (statement) => dateAtDay(
    statement.getFullYear(),
    statement.getMonth() + (card.paymentDay <= card.statementDay ? 1 : 0),
    card.paymentDay,
  )

  let paymentDate = paymentFor(statementDate)
  if (paymentDate < today) {
    statementDate = dateAtDay(statementDate.getFullYear(), statementDate.getMonth() + 1, card.statementDay)
    paymentDate = paymentFor(statementDate)
  }
  return paymentDate
}

export function daysUntil(date, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((date - start) / DAY_MS)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(date)
}

export function formatFullDate(date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function currency(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency: 'CNY', maximumFractionDigits: 0,
  }).format(value)
}

export function formatMoneyFromFen(valueFen = 0) {
  // 领域层以分为单位保存金额，展示层在最后一步才转换为人民币元。
  return currency(valueFen / 100)
}
