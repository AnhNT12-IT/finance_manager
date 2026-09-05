<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'family'],
})

const {
  family,
  members,
  currentMember,
  isOwner,
  isLoading,
  errorMessage,
  loadFamilyContext,
  renameFamily,
  addMemberByEmail,
  removeMember,
} = useFamily()

const familyName = ref('')
const memberEmail = ref('')
const memberDisplayName = ref('')
const localError = ref('')
const successMessage = ref('')
const pendingRemoveId = ref<string | null>(null)

onMounted(async () => {
  await loadFamilyContext()
  familyName.value = family.value?.name || ''
})

/**
 * Rename family.
 */
const handleRename = async () => {
  localError.value = ''
  successMessage.value = ''

  if (!familyName.value.trim()) {
    localError.value = 'Tên gia đình không được để trống.'
    return
  }

  try {
    await renameFamily(familyName.value)
    successMessage.value = 'Đã cập nhật tên gia đình.'
  } catch {
    localError.value = errorMessage.value || 'Đổi tên thất bại.'
  }
}

/**
 * Add member by email.
 */
const handleAddMember = async () => {
  localError.value = ''
  successMessage.value = ''

  if (!memberEmail.value.trim()) {
    localError.value = 'Nhập email thành viên đã đăng ký.'
    return
  }

  try {
    await addMemberByEmail(memberEmail.value, memberDisplayName.value)
    memberEmail.value = ''
    memberDisplayName.value = ''
    successMessage.value = 'Đã thêm thành viên.'
  } catch {
    localError.value = errorMessage.value || 'Thêm thành viên thất bại.'
  }
}

/**
 * Confirm remove member.
 */
const handleConfirmRemove = async () => {
  if (!pendingRemoveId.value) {
    return
  }

  localError.value = ''
  successMessage.value = ''

  try {
    await removeMember(pendingRemoveId.value)
    successMessage.value = 'Đã xóa thành viên.'
  } catch {
    localError.value = errorMessage.value || 'Xóa thành viên thất bại.'
  } finally {
    pendingRemoveId.value = null
  }
}
</script>

<template>
  <section class="stack">
    <div>
      <h1 class="page-title">
        Family Settings
      </h1>
      <p class="page-subtitle">
        Quản lý gia đình và thành viên
      </p>
    </div>

    <p
      v-if="localError"
      class="error-text"
      role="alert"
    >
      {{ localError }}
    </p>
    <p
      v-if="successMessage"
      class="muted"
    >
      {{ successMessage }}
    </p>

    <div class="panel stack">
      <h2>Thông tin gia đình</h2>
      <form
        class="form-grid"
        @submit.prevent="handleRename"
      >
        <div class="field">
          <label for="settings-family-name">Tên gia đình</label>
          <input
            id="settings-family-name"
            v-model="familyName"
            type="text"
            :disabled="!isOwner || isLoading"
          >
        </div>
        <button
          v-if="isOwner"
          type="submit"
          class="btn btn-primary"
          :disabled="isLoading"
        >
          Lưu tên
        </button>
        <p
          v-else
          class="muted"
        >
          Chỉ OWNER mới đổi được tên gia đình.
        </p>
      </form>
    </div>

    <div class="panel stack">
      <h2>Thành viên</h2>
      <div
        v-for="member in members"
        :key="member.id"
        class="list-row"
      >
        <div>
          <strong>{{ member.display_name }}</strong>
          <div class="muted">
            {{ member.role }}
            <span v-if="member.id === currentMember?.id"> · Bạn</span>
          </div>
        </div>
        <button
          v-if="isOwner && member.id !== currentMember?.id"
          type="button"
          class="btn btn-danger"
          @click="pendingRemoveId = member.id"
        >
          Xóa
        </button>
      </div>
    </div>

    <div
      v-if="isOwner"
      class="panel stack"
    >
      <h2>Thêm thành viên</h2>
      <p class="muted">
        Thành viên phải đăng ký tài khoản trước. Nhập đúng email đã dùng khi đăng ký.
      </p>
      <form
        class="form-grid"
        @submit.prevent="handleAddMember"
      >
        <div class="field">
          <label for="member-email">Email</label>
          <input
            id="member-email"
            v-model="memberEmail"
            type="email"
            required
          >
        </div>
        <div class="field">
          <label for="member-display-name">Tên hiển thị (tuỳ chọn)</label>
          <input
            id="member-display-name"
            v-model="memberDisplayName"
            type="text"
          >
        </div>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isLoading"
        >
          Thêm thành viên
        </button>
      </form>
    </div>

    <ConfirmDialog
      :is-open="Boolean(pendingRemoveId)"
      title="Xóa thành viên?"
      message="Thành viên sẽ mất quyền truy cập dữ liệu gia đình. Không thể xóa nếu còn chi tiêu gắn với thành viên đó."
      confirm-label="Xóa"
      @cancel="pendingRemoveId = null"
      @confirm="handleConfirmRemove"
    />
  </section>
</template>
