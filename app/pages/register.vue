<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
})

const { register, authError, isLoading } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const localError = ref('')

/**
 * Submit register form.
 */
const handleSubmit = async () => {
  localError.value = ''

  if (!displayName.value.trim() || !email.value.trim() || password.value.length < 6) {
    localError.value = 'Nhập tên hiển thị, email và mật khẩu tối thiểu 6 ký tự.'
    return
  }

  try {
    await register(email.value, password.value, displayName.value)
    await navigateTo('/onboarding')
  } catch {
    localError.value = authError.value || 'Đăng ký thất bại.'
  }
}
</script>

<template>
  <section class="panel auth-card stack">
    <div>
      <h1 class="page-title">
        Đăng ký
      </h1>
      <p class="page-subtitle">
        Tạo tài khoản để bắt đầu quản lý chi tiêu.
      </p>
    </div>

    <form
      class="form-grid"
      @submit.prevent="handleSubmit"
    >
      <div class="field">
        <label for="register-name">Tên hiển thị</label>
        <input
          id="register-name"
          v-model="displayName"
          type="text"
          autocomplete="name"
          required
        >
      </div>

      <div class="field">
        <label for="register-email">Email</label>
        <input
          id="register-email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
        >
      </div>

      <div class="field">
        <label for="register-password">Mật khẩu</label>
        <input
          id="register-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          minlength="6"
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
        {{ isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký' }}
      </button>
    </form>

    <p class="muted">
      Đã có tài khoản?
      <NuxtLink to="/login">
        Đăng nhập
      </NuxtLink>
    </p>
  </section>
</template>
