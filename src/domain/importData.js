// 负责校验和清洗信用卡、交易流水 JSON 导入数据，阻止无效字段进入账本。
import { resolveCardColor } from './cardAppearance.js'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function requiredString(value, field, index) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`第 ${index + 1} 条数据的 ${field} 无效`)
  return value.trim()
}

function optionalId(value, field, index) {
  if (value === undefined || value === null || value === '') return crypto.randomUUID()
  return requiredString(value, field, index)
}

function integer(value, field, index, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`第 ${index + 1} 条数据的 ${field} 无效`)
  return value
}

function numericInteger(value, field, index, minimum = 0) {
  const normalized = typeof value === 'string' ? value.trim() : value
  const converted = typeof normalized === 'number' ? normalized : Number(normalized)
  if (normalized === '' || typeof normalized === 'boolean' || !Number.isInteger(converted) || converted < minimum) throw new Error(`第 ${index + 1} 条数据的 ${field} 无效`)
  return converted
}

function yuanToFen(value, field, index) {
  const normalized = typeof value === 'string' ? value.trim() : value
  const yuan = typeof normalized === 'number' ? normalized : Number(normalized)
  const fen = Math.round(yuan * 100)
  // 信用卡 JSON 面向人工编辑使用“元”，进入账本前再转成整数分，避免浮点金额参与业务计算。
  if (normalized === '' || typeof normalized === 'boolean' || !Number.isFinite(yuan) || yuan < 0 || !Number.isSafeInteger(fen) || Math.abs(yuan * 100 - fen) > 1e-8) throw new Error(`第 ${index + 1} 条数据的 ${field} 无效`)
  return fen
}

export function validateCardImport(items) {
  return items.map((item, index) => {
    const last4 = requiredString(item.last4, 'last4', index)
    if (!/^\d{4}$/.test(last4)) throw new Error(`第 ${index + 1} 条数据的 last4 必须是 4 位数字`)
    return {
      // 未提供 ID 代表新增；显式提供 ID 时仍可按同 ID 合并更新现有数据。
      id: optionalId(item.id, 'id', index), bank: requiredString(item.bank, 'bank', index), name: requiredString(item.name, 'name', index), last4,
      limitFen: yuanToFen(item.limitFen, 'limitFen', index), statementDay: numericInteger(item.statementDay, 'statementDay', index, 1), paymentDay: numericInteger(item.paymentDay, 'paymentDay', index, 1),
      color: resolveCardColor(item.bank, item.color), status: item.status === 'inactive' ? 'inactive' : 'active', hasCheckIn: Boolean(item.hasCheckIn),
      pointsRating: ['good', 'average', 'poor'].includes(item.pointsRating) ? item.pointsRating : 'average', pointsRedemptionPath: typeof item.pointsRedemptionPath === 'string' ? item.pointsRedemptionPath.slice(0, 160) : '',
      pointsProducts: Array.isArray(item.pointsProducts) ? item.pointsProducts.map((product, productIndex) => ({ id: optionalId(product.id, `pointsProducts[${productIndex}].id`, index), name: requiredString(product.name, `pointsProducts[${productIndex}].name`, index), pointsCost: integer(product.pointsCost, `pointsProducts[${productIndex}].pointsCost`, index, 1), cashValueFen: integer(product.cashValueFen || 0, `pointsProducts[${productIndex}].cashValueFen`, index), note: typeof product.note === 'string' ? product.note.slice(0, 80) : '' })) : [],
    }
  }).map((card, index) => {
    if (card.statementDay > 31 || card.paymentDay > 31) throw new Error(`第 ${index + 1} 条数据的账单日或还款日必须在 1-31 之间`)
    return card
  })
}

export function prepareCardsForExport(cards) {
  // 外部 JSON 的 limitFen 按产品约定使用元；内部字段仍存分，保持现有账单计算不变。
  return cards.map((card) => ({ ...card, limitFen: card.limitFen / 100 }))
}

export function validateTransactionImport(items, cardIds) {
  return items.map((item, index) => {
    const cardId = requiredString(item.cardId, 'cardId', index)
    if (!cardIds.has(cardId)) throw new Error(`第 ${index + 1} 条交易引用了不存在的信用卡`)
    const date = requiredString(item.date, 'date', index)
    if (!DATE_PATTERN.test(date)) throw new Error(`第 ${index + 1} 条交易日期格式应为 YYYY-MM-DD`)
    return { id: optionalId(item.id, 'id', index), cardId, date, amountFen: integer(item.amountFen, 'amountFen', index, 1), feeFen: integer(item.feeFen || 0, 'feeFen', index), note: typeof item.note === 'string' ? item.note.slice(0, 80) : '', createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString() }
  })
}
