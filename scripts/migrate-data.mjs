/**
 * 数据迁移脚本 — 将本地备份数据导入到当前 Supabase 用户账户下
 *
 * 用法：
 *   nvm use 22
 *   node scripts/migrate-data.mjs
 *
 * 脚本会：
 *   1. 读取 .env.local 获取 Supabase 配置
 *   2. 提示输入邮箱和密码
 *   3. 登录 Supabase Auth
 *   4. 按顺序导入 cards → points_products → transactions → repayments → activities
 *   5. 保留原始 UUID，保证外键引用（card_id）一致
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { createInterface } from 'readline'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// ─── 读取 .env.local ───────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(projectRoot, '.env.local')
  let content = ''
  try {
    content = readFileSync(envPath, 'utf-8')
  } catch {
    console.error('找不到 .env.local，请先配置 Supabase 环境变量')
    process.exit(1)
  }
  const env = {}
  for (const line of content.split('\n')) {
    const m = line.match(/^VITE_(\w+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error('.env.local 中缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }
  return { url: env.SUPABASE_URL, key: env.SUPABASE_ANON_KEY }
}

// ─── camelCase → snake_case ────────────────────────────────────
function toSnakeCase(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/([A-Z])/g, '_$1').toLowerCase(),
        toSnakeCase(v),
      ])
    )
  }
  return obj
}

// ─── 交互式输入 ────────────────────────────────────────────────
function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// ─── 主流程 ────────────────────────────────────────────────────
async function main() {
  const { url, key } = loadEnv()
  const backupPath = resolve(projectRoot, '..', '数据备份.json')

  let backup
  try {
    backup = JSON.parse(readFileSync(backupPath, 'utf-8'))
  } catch {
    console.error(`找不到备份文件：${backupPath}`)
    process.exit(1)
  }

  console.log('═══════════════════════════════════════════════')
  console.log('  数据迁移工具 — 导入备份数据到 Supabase')
  console.log('═══════════════════════════════════════════════')
  console.log(`备份文件：${backupPath}`)
  console.log(`数据统计：`)
  console.log(`  卡片：${backup.cards?.length || 0} 张`)
  console.log(`  交易：${backup.transactions?.length || 0} 笔`)
  console.log(`  还款：${backup.repayments?.length || 0} 条`)
  console.log(`  活动：${backup.activities?.length || 0} 条`)
  console.log('')

  // 支持命令行参数：node scripts/migrate-data.mjs <email> <password>
  let email = process.argv[2]
  let password = process.argv[3]
  if (!email || !password) {
    email = await prompt('请输入登录邮箱：')
    password = await prompt('请输入密码：')
  }
  console.log('')

  // 创建 Supabase 客户端
  const supabase = createClient(url, key)

  // 登录
  console.log('正在登录...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError) {
    console.error('登录失败：', authError.message)
    process.exit(1)
  }
  console.log(`登录成功！用户ID：${authData.user.id}\n`)

  let success = 0
  let failed = 0

  // ─── 1. 导入卡片 ───────────────────────────────────────────
  console.log('━━━ 导入卡片 ━━━')
  for (const card of backup.cards || []) {
    const { pointsProducts, ...cardFields } = card
    const snake = toSnakeCase(cardFields)
    delete snake.created_at
    delete snake.user_id

    const { error } = await supabase.from('cards').insert(snake)
    if (error) {
      console.error(`  ✗ 卡片「${card.name}」导入失败：${error.message}`)
      failed++
    } else {
      console.log(`  ✓ 卡片「${card.name}」导入成功`)
      success++

      // 导入该卡片的积分商品
      if (pointsProducts?.length) {
        for (const pp of pointsProducts) {
          const ppSnake = toSnakeCase(pp)
          delete ppSnake.created_at
          delete ppSnake.user_id
          // card_id 已在数据中，保留原值
          const { error: ppError } = await supabase.from('points_products').insert(ppSnake)
          if (ppError) {
            console.error(`    ✗ 积分商品「${pp.name}」导入失败：${ppError.message}`)
          } else {
            console.log(`    ✓ 积分商品「${pp.name}」导入成功`)
          }
        }
      }
    }
  }

  // ─── 2. 导入交易 ───────────────────────────────────────────
  console.log('━━━ 导入交易 ━━━')
  for (const tx of backup.transactions || []) {
    const snake = toSnakeCase(tx)
    delete snake.created_at
    delete snake.user_id

    const { error } = await supabase.from('transactions').insert(snake)
    if (error) {
      console.error(`  ✗ 交易 ${tx.date} ¥${(tx.amountFen / 100).toFixed(2)} 导入失败：${error.message}`)
      failed++
    } else {
      console.log(`  ✓ 交易 ${tx.date} ¥${(tx.amountFen / 100).toFixed(2)} 导入成功`)
      success++
    }
  }

  // ─── 3. 导入还款 ───────────────────────────────────────────
  console.log('━━━ 导入还款 ━━━')
  for (const rep of backup.repayments || []) {
    const snake = toSnakeCase(rep)
    delete snake.created_at
    delete snake.user_id

    const { error } = await supabase.from('repayments').insert(snake)
    if (error) {
      console.error(`  ✗ 还款 ${rep.date} ¥${(rep.amountFen / 100).toFixed(2)} 导入失败：${error.message}`)
      failed++
    } else {
      console.log(`  ✓ 还款 ${rep.date} ¥${(rep.amountFen / 100).toFixed(2)} 导入成功`)
      success++
    }
  }

  // ─── 4. 导入活动 ───────────────────────────────────────────
  console.log('━━━ 导入活动 ━━━')
  for (const act of backup.activities || []) {
    const snake = toSnakeCase(act)
    delete snake.created_at
    delete snake.user_id

    const { error } = await supabase.from('activities').insert(snake)
    if (error) {
      console.error(`  ✗ 活动「${act.title}」导入失败：${error.message}`)
      failed++
    } else {
      console.log(`  ✓ 活动「${act.title}」导入成功`)
      success++
    }
  }

  // ─── 汇总 ─────────────────────────────────────────────────
  console.log('')
  console.log('═══════════════════════════════════════════════')
  console.log(`  迁移完成！成功 ${success} 条，失败 ${failed} 条`)
  console.log('═══════════════════════════════════════════════')

  // 退出
  await supabase.auth.signOut()
  process.exit(0)
}

main().catch((err) => {
  console.error('迁移脚本异常：', err)
  process.exit(1)
})
