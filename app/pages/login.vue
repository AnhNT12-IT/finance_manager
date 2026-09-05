<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
})

const { login, authError, isLoading } = useAuth()

const email = ref('')
const password = ref('')
const localError = ref('')

/**
 * Submit login form.
 */
const handleSubmit = async () => {
  localError.value = ''

  if (!email.value.trim() || !password.value) {
    localError.value = 'Vui lòng nhập email và mật khẩu.'
    return
  }

  try {
    await login(email.value, password.value)
    const { loadFamilyContext, hasFamily } = useFamily()
    await loadFamilyContext()
    await navigateTo(hasFamily.value ? '/' : '/onboarding')
  } catch {
    localError.value = authError.value || 'Đăng nhập thất bại.'
  }
}
</script>

<template>
  <section class="panel auth-card stack">
    <div>
      <h1 class="page-title">
        Đăng nhập
      </h1>
      <p class="page-subtitle">
        Quản lý chi tiêu gia đình cùng nhau.
      </p>
    </div>

    <form
      class="form-grid"
      @submit.prevent="handleSubmit"
    >
      <div class="field">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
        >
      </div>

      <div class="field">
        <label for="login-password">Mật khẩu</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </div>

      <p
        v-if="localError"
        class="error-text"
        role="alert"
      >
        {{ localError }}
      </p>

      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </button>
    </form>

    <p class="muted">
      Chưa có tài khoản?
      <NuxtLink to="/register">
        Đăng ký
      </NuxtLink>
    </p>
  </section>
</template>
