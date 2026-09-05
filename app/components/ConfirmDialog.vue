<script setup lang="ts">
/**
 * Confirm dialog for destructive actions.
 */
const props = defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

/**
 * Close on Escape.
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  if (event.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    v-if="isOpen"
    class="modal-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @click.self="emit('cancel')"
  >
    <div class="modal-panel">
      <h2>{{ title }}</h2>
      <p class="muted">
        {{ message }}
      </p>
      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-ghost"
          @click="emit('cancel')"
        >
          Hủy
        </button>
        <button
          type="button"
          class="btn btn-danger"
          @click="emit('confirm')"
        >
          {{ confirmLabel || 'Xác nhận' }}
        </button>
      </div>
    </div>
  </div>
</template>
