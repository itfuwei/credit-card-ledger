// 统一解析信用卡展示颜色，为未指定颜色的卡片匹配发卡银行主题色。
const DEFAULT_CARD_COLOR = '#3f6fb6'

const BANK_COLORS = [
  [['中国工商银行', '工商银行', '工行'], '#C7000B'],
  [['中国农业银行', '农业银行', '农行'], '#008566'],
  [['中国银行', '中行'], '#B31B34'],
  [['中国建设银行', '建设银行', '建行'], '#005BAC'],
  [['交通银行', '交行'], '#005BAC'],
  [['中国邮政储蓄银行', '邮储银行', '邮储'], '#00843D'],
  [['招商银行', '招行'], '#C62828'],
  [['浦发银行', '上海浦东发展银行', '浦发'], '#173B6C'],
  [['中信银行', '中信'], '#D71920'],
  [['中国光大银行', '光大银行', '光大'], '#6A2C91'],
  [['华夏银行', '华夏'], '#C8102E'],
  [['广发银行', '广东发展银行', '广发'], '#C8102E'],
  [['平安银行', '平安'], '#EA6B0B'],
  [['中国民生银行', '民生银行', '民生'], '#0099A8'],
  [['兴业银行', '兴业'], '#003B73'],
  [['北京银行'], '#E60012'],
  [['上海银行'], '#005AA9'],
]

export function bankThemeColor(bank) {
  const normalizedBank = typeof bank === 'string' ? bank.trim() : ''
  const match = BANK_COLORS.find(([names]) => names.some((name) => normalizedBank.includes(name)))
  return match?.[1] || DEFAULT_CARD_COLOR
}

export function resolveCardColor(bank, color) {
  const normalizedColor = typeof color === 'string' ? color.trim() : ''
  // 空值和早期版本的通用默认色都视为未指定，使旧数据加载后也能自动获得银行主题色。
  if (!normalizedColor || normalizedColor.toLowerCase() === DEFAULT_CARD_COLOR) return bankThemeColor(bank)
  return normalizedColor
}
