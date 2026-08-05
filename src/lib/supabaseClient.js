// 负责初始化 Supabase 客户端，从 Vite 环境变量读取项目 URL 和 anon key。
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 如果环境变量未配置，给出明确提示而不是静默失败。
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未配置，请在 .env.local 中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    // 自动持久化 session 到 localStorage，刷新页面后保持登录状态。
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
