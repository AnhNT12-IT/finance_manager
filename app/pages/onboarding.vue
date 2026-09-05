<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { createFamily, hasFamily, loadFamilyContext, isLoading, errorMessage } = useFamily()
const { user } = useAuth()

const familyName = ref('')
const displayName = ref('')
const localError = ref('')

onMounted(async () => {
  await loadFamilyContext()

  if (hasFamily.value) {
    await navigateTo('/')
  }

  displayName.value = (user.value?.user_metadata?.display_name as string) || ''
})

/**
 * Create family then go to dashboard.
 */
const handleSubmit = async () => {
  localError.value = ''

  if (!familyName.value.trim()) {
    localError.value = 'Vui lòng nhập tên gia đình.'
    return
  }

  try {
    await createFamily(familyName.value, displayName.value)
    await navigateTo('/')
  } catch {
    localError.value = errorMessage.value || 'Không tạo được gia đình.'
  }
}
</script>

<template>
  <section class="panel auth-card stack">
    <div>
      <h1 class="page-title">
        Tạo gia đình
      </h1>
      <p class="page-subtitle">
        Bạn chưa thuộc gia đình nào. Tạo mới để bắt đầu (bạn sẽ là OWNER).
      </p>
    </div>

    <form
      class="form-grid"
      @submit.prevent="handleSubmit"
    >
      <div class="field">
        <label for="family-name">Tên gia đình</label>
        <input
          id="family-name"
          v-model="familyName"
          type="text"
          required
        >
      </div>

      <div class="field">
        <label for="owner-display-name">Tên hiển thị của bạn</label>
        <input
          id="owner-display-name"
          v-model="displayName"
          type="text"
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
        {{ isLoading ? 'Đang tạo...' : 'Tạo gia đình' }}
      </button>
    </form>
  </section>
</template>
