// 管理用户认证状态，提供登录、注册和退出方法，监听 Supabase Auth 状态变化。
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

// 单例状态，所有使用 useAuth 的组件共享同一份认证状态。
const user = ref(null)
const loading = ref(true)
let initialized = false

export function useAuth() {
  // 初始化只执行一次：获取当前 session，注册状态监听。
  if (!initialized) {
    initialized = true
    // onAuthStateChange 在 token 刷新、登录、退出时都会触发。
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
    // 页面刷新后恢复 session 状态。
    supabase.auth.getSession().then(({ data: { session } }) => {
      user.value = session?.user || null
      loading.value = false
    })
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    // Supabase 默认可能需要邮箱确认，此时返回 session 为 null 但不算错误。
    if (error) throw error
    // 如果注册后自动登录了（关闭了邮箱确认），更新 user 状态。
    if (data.user && data.session) {
      user.value = data.user
    }
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  return { user, loading, signIn, signUp, signOut }
}
