// 封装 Supabase 数据读写，保持与原 localStorage 版本相同的方法边界。
import { supabase } from '../lib/supabaseClient'
import { toSnakeCase, toCamelCase } from '../utils/caseConvert'
import { resolveCardColor } from '../domain/cardAppearance.js'

// 从 Supabase 响应中提取数据，遇到错误时抛出异常。
async function unwrap(result) {
  const resolved = await result
  if (resolved.error) throw resolved.error
  return resolved.data
}

// 加载当前用户的全部账本数据，并行查询 5 张表。
async function loadAll() {
  const [cardsRes, transactionsRes, repaymentsRes, activitiesRes] = await Promise.all([
    supabase.from('cards').select('*, points_products(*)').order('created_at', { ascending: true }),
    supabase.from('transactions').select('*').order('created_at', { ascending: true }),
    supabase.from('repayments').select('*').order('created_at', { ascending: true }),
    supabase.from('activities').select('*').order('created_at', { ascending: true }),
  ])

  const cards = toCamelCase((await unwrap(cardsRes)) || [])
  const transactions = toCamelCase((await unwrap(transactionsRes)) || [])
  const repayments = toCamelCase((await unwrap(repaymentsRes)) || [])
  const activities = toCamelCase((await unwrap(activitiesRes)) || [])

  // 为每张卡片解析展示颜色，并确保 pointsProducts 字段存在。
  cards.forEach((card) => {
    card.color = resolveCardColor(card.bank, card.color)
    card.pointsProducts = card.pointsProducts || []
  })

  // 循环活动：将日期替换为当月1号至月末，已领取但不在本月则重置。
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const mm = String(month + 1).padStart(2, '0')
  const monthStart = `${year}-${mm}-01`
  const monthEnd = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`
  activities.forEach((activity) => {
    if (activity.isRecurring) {
      activity.startDate = monthStart
      activity.endDate = monthEnd
      activity.claimStartDate = monthStart
      activity.claimEndDate = monthEnd
      if (activity.claimed && activity.claimedAt) {
        const claimed = new Date(activity.claimedAt)
        if (claimed.getFullYear() !== year || claimed.getMonth() !== month) {
          activity.claimed = false
          activity.claimedAt = null
        }
      }
    }
  })

  return { cards, transactions, repayments, activities }
}

// 保存积分商品：先删除该卡片的旧商品，再批量插入新商品。
async function savePointsProducts(cardId, products) {
  await supabase.from('points_products').delete().eq('card_id', cardId)
  if (!products.length) return
  const rows = products.map((item) => {
    const snake = toSnakeCase(item)
    // 触发器会自动注入 user_id，但 SDK 端也需提供 card_id。
    snake.card_id = cardId
    // 移除可能残留的 created_at，让数据库自动生成。
    delete snake.created_at
    return snake
  })
  await unwrap(supabase.from('points_products').insert(rows))
}

export const ledgerRepository = {
  async loadLedger() { return loadAll() },

  async importCards(imported) {
    // 逐条插入卡片（含触发器自动注入 user_id），再保存其积分商品。
    for (const card of imported) {
      const { pointsProducts, ...cardFields } = card
      const snake = toSnakeCase(cardFields)
      delete snake.created_at
      delete snake.user_id
      const [created] = await unwrap(supabase.from('cards').insert(snake).select('*'))
      if (pointsProducts?.length) {
        await savePointsProducts(created.id, pointsProducts)
      }
    }
    // 返回当前用户全部卡片（含积分商品），与原方法语义一致。
    const { cards } = await loadAll()
    return cards
  },

  async importTransactions(imported) {
    const rows = imported.map((item) => {
      const snake = toSnakeCase(item)
      delete snake.created_at
      delete snake.user_id
      return snake
    })
    await unwrap(supabase.from('transactions').insert(rows))
    const { transactions } = await loadAll()
    return transactions
  },

  async createTransaction(payload) {
    const snake = toSnakeCase(payload)
    delete snake.created_at
    delete snake.user_id
    const [created] = await unwrap(supabase.from('transactions').insert(snake).select('*'))
    return toCamelCase(created)
  },

  async createActivity(payload) {
    const snake = toSnakeCase(payload)
    delete snake.created_at
    delete snake.user_id
    const [created] = await unwrap(supabase.from('activities').insert(snake).select('*'))
    return toCamelCase(created)
  },

  async updateActivity(id, payload) {
    const snake = toSnakeCase(payload)
    delete snake.created_at
    delete snake.user_id
    delete snake.id
    const [updated] = await unwrap(
      supabase.from('activities').update(snake).eq('id', id).select('*')
    )
    return toCamelCase(updated)
  },

  async deleteActivity(id) {
    await unwrap(supabase.from('activities').delete().eq('id', id))
  },

  async createRepayment(payload) {
    const snake = toSnakeCase(payload)
    delete snake.created_at
    delete snake.user_id
    const [created] = await unwrap(supabase.from('repayments').insert(snake).select('*'))
    return toCamelCase(created)
  },

  async deleteRepayment(id) {
    await unwrap(supabase.from('repayments').delete().eq('id', id))
  },

  async updateTransaction(id, payload) {
    const snake = toSnakeCase(payload)
    delete snake.created_at
    delete snake.user_id
    delete snake.id
    const [updated] = await unwrap(
      supabase.from('transactions').update(snake).eq('id', id).select('*')
    )
    return toCamelCase(updated)
  },

  async createCard(payload) {
    const { pointsProducts, ...cardFields } = payload
    const snake = toSnakeCase(cardFields)
    delete snake.created_at
    delete snake.user_id
    const [created] = await unwrap(supabase.from('cards').insert(snake).select('*'))
    const card = toCamelCase(created)
    card.color = resolveCardColor(card.bank, card.color)
    card.pointsProducts = []
    return card
  },

  async updateCard(id, payload) {
    const { pointsProducts, ...cardFields } = payload
    const snake = toSnakeCase(cardFields)
    delete snake.created_at
    delete snake.user_id
    delete snake.id

    // 如果 payload 中包含 pointsProducts，先保存积分商品。
    if (pointsProducts !== undefined) {
      await savePointsProducts(id, pointsProducts)
    }

    // 如果除了 pointsProducts 之外还有其他字段需要更新。
    if (Object.keys(snake).length > 0) {
      await unwrap(supabase.from('cards').update(snake).eq('id', id))
    }

    // 重新查询单张卡片（含积分商品），返回完整对象。
    const [card] = await unwrap(
      supabase.from('cards').select('*, points_products(*)').eq('id', id)
    )
    const result = toCamelCase(card)
    result.color = resolveCardColor(result.bank, result.color)
    result.pointsProducts = result.pointsProducts || []
    return result
  },

  async deleteCard(id) {
    // 有关联流水的卡片不能删除，外键 on delete restrict 会兜底。
    // 这里先检查并给出友好错误信息。
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('card_id', id)
    if (count > 0) throw new Error('该卡已有交易记录，请先停用或清理关联流水')
    await unwrap(supabase.from('cards').delete().eq('id', id))
  },

  async deleteTransaction(id) {
    await unwrap(supabase.from('transactions').delete().eq('id', id))
  },
}
