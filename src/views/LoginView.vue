<template>
  <div class="login-page">
    <!-- 左侧深色品牌面板 -->
    <div class="login-brand">
      <div class="login-brand-content">
        <div class="login-brand-icon">
          <el-icon :size="32"><CreditCard /></el-icon>
        </div>
        <h1 class="login-brand-title">信用卡管理</h1>
        <p class="login-brand-subtitle">交易 · 账单 · 额度 · 还款</p>
        <div class="login-brand-features">
          <div class="login-brand-feature" v-for="f in features" :key="f.text">
            <el-icon :size="16"><component :is="f.icon" /></el-icon>
            <span>{{ f.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="login-form-area">
      <div class="login-form-wrapper">
        <div class="login-form-header">
          <h2 class="login-form-title">{{ isRegister ? '注册账号' : '欢迎回来' }}</h2>
          <p class="login-form-desc">{{ isRegister ? '创建账号开始管理你的信用卡' : '登录后继续管理你的信用卡' }}</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              :prefix-icon="Message"
              size="large"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="至少 6 位"
              :prefix-icon="Lock"
              size="large"
              @keyup.enter="handleSubmit"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="login-submit-btn"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ isRegister ? '注册' : '登录' }}
          </el-button>
        </el-form>

        <div class="login-switch">
          <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
          <a href="javascript:void(0)" @click="isRegister = !isRegister">
            {{ isRegister ? '去登录' : '去注册' }}
          </a>
        </div>

        <p v-if="hintMessage" class="login-hint">{{ hintMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CreditCard, Message, Lock, TrendCharts, Calendar, Wallet } from '@element-plus/icons-vue'
import { useAuth } from '../composables/useAuth'

const { signIn, signUp } = useAuth()

const formRef = ref()
const isRegister = ref(false)
const submitting = ref(false)
const hintMessage = ref('')

const form = reactive({
  email: '',
  password: '',
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const features = [
  { icon: TrendCharts, text: '额度占用与账单周期一目了然' },
  { icon: Calendar, text: '出账日和还款日自动计算' },
  { icon: Wallet, text: '还款记录与活动管理' },
]

async function handleSubmit() {
  if (!formRef.value) return
  hintMessage.value = ''
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (isRegister.value) {
      const data = await signUp(form.email, form.password)
      // Supabase 默认开启邮箱确认时，session 为 null，需要提示用户。
      if (data.user && !data.session) {
        hintMessage.value = '注册成功，请前往邮箱确认后登录'
        isRegister.value = false
      }
    } else {
      await signIn(form.email, form.password)
    }
  } catch (err) {
    let msg = err.message || '操作失败'
    // Supabase 邮箱未确认错误，给出更友好的提示
    if (msg.includes('Email not confirmed')) {
      msg = '邮箱尚未确认，请检查邮箱（含垃圾邮件）点击确认链接后再登录。或在 Supabase 控制台关闭邮箱确认。'
    }
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧深色品牌面板 */
.login-brand {
  flex: 0 0 420px;
  background: var(--sidebar);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-brand-content {
  max-width: 280px;
}

.login-brand-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(200, 67, 73, 0.15);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.login-brand-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}

.login-brand-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 40px;
  letter-spacing: 0.5px;
}

.login-brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-brand-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.login-brand-feature .el-icon {
  color: rgba(200, 67, 73, 0.8);
}

/* 右侧表单区域 */
.login-form-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  padding: 48px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 360px;
}

.login-form-header {
  margin-bottom: 32px;
}

.login-form-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.login-form-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.login-submit-btn {
  width: 100%;
  margin-top: 8px;
}

.login-switch {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.login-switch a {
  color: var(--brand);
  text-decoration: none;
  margin-left: 4px;
  font-weight: 500;
}

.login-switch a:hover {
  color: var(--brand-hover);
}

.login-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--success);
}

/* 响应式：小屏幕隐藏左侧品牌面板 */
@media (max-width: 768px) {
  .login-brand {
    display: none;
  }
  .login-form-area {
    padding: 24px;
  background: var(--surface);
  height: 100vh;
  display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
