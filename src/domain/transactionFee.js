// 负责按交易金额和万分比费率计算手续费，并统一向上取整到分。
export function calculateFeeFen(amountYuan, ratePerTenThousand) {
  const amountFen = Math.round(Number(amountYuan) * 100)
  if (!Number.isSafeInteger(amountFen) || amountFen <= 0) return 0
  // 先以整数分计算，再向上取整，确保任何不足一分钱的手续费都按一分钱计入。
  return Math.ceil(amountFen * ratePerTenThousand / 10000)
}
