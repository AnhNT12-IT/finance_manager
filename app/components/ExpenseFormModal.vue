<script setup lang="ts">
import type { Category, ExpenseInput, ExpenseWithRelations, FamilyMember } from '~/types'
import { getTodayDateString } from '~/utils/date'
import { parseVndInput } from '~/utils/money'
import { validateExpenseInput } from '~/utils/validation'

const props = defineProps<{
  isOpen: boolean
  expense: ExpenseWithRelations | null
  categories: Category[]
  members: FamilyMember[]
  defaultMemberId: string
  errorMessage?: string
}>()

const emit = defineEmits<{
  close: []
  save: [ExpenseInput]
}>()

const amountText = ref('')
const categoryId = ref('')
const memberId = ref('')
const expenseDate = ref(getTodayDateString())
const description = ref('')
const fieldErrors = ref<Record<string, string>>({})

/**
 * Reset form when opened.
 */
watch(
  () => [props.isOpen, props.expense] as const,
  ([isOpen, expense]) => {
    if (!isOpen) {
      return
    }

    fieldErrors.value = {}

    if (expense) {
      amountText.value = String(expense.amount)
      categoryId.value = expense.category_id
      memberId.value = expense.member_id
      expenseDate.value = expense.expense_date
      description.value = expense.description || ''
      return
    }

    amountText.value = ''
    categoryId.value = props.categories[0]?.id || ''
    memberId.value = props.defaultMemberId || props.members[0]?.id || ''
    expenseDate.value = getTodayDateString()
    description.value = ''
  },
  { immediate: true },
)

/**
 * Validate and emit save.
 */
const handleSubmit = () => {
  const amount = parseVndInput(amountText.value)
  const validation = validateExpenseInput({
    amount,
    category_id: categoryId.value,
    member_id: memberId.value,
    expense_date: expenseDate.value,
    description: description.value,
  })

  fieldErrors.value = validation.errors as Record<string, string>

  if (!validation.isValid || amount === null) {
    return
  }

  emit('save', {
    amount,
    category_id: categoryId.value,
    member_id: memberId.value,
    expense_date: expenseDate.value,
    description: description.value,
  })
}

/**
 * Close on Escape.
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  if (event.key === 'Escape') {
    emit('close')
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
    :aria-label="expense ? 'Sửa chi tiêu' : 'Thêm chi tiêu'"
    @click.self="emit('close')"
  >
    <div class="modal-panel">
      <h2>{{ expense ? 'Sửa chi tiêu' : 'Thêm chi tiêu' }}</h2>

      <form
        class="form-grid"
        @submit.prevent="handleSubmit"
      >
        <div class="field">
          <label for="expense-amount">Số tiền (VND)</label>
          <input
            id="expense-amount"
            v-model="amountText"
            type="text"
            inputmode="numeric"
            placeholder="500000"
            required
          >
          <p
            v-if="fieldErrors.amount"
            class="field-error"
          >
            {{ fieldErrors.amount }}
          </p>
        </div>

        <div class="field">
          <label for="expense-category">Danh mục</label>
          <select
            id="expense-category"
            v-model="categoryId"
            required
          >
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <p
            v-if="fieldErrors.category_id"
            class="field-error"
          >
            {{ fieldErrors.category_id }}
          </p>
        </div>

        <div class="field">
          <label for="expense-member">Thành viên</label>
          <select
            id="expense-member"
            v-model="memberId"
            required
          >
            <option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.display_name }}
            </option>
          </select>
          <p
            v-if="fieldErrors.member_id"
            class="field-error"
          >
            {{ fieldErrors.member_id }}
          </p>
        </div>

        <div class="field">
          <label for="expense-date">Ngày chi</label>
          <input
            id="expense-date"
            v-model="expenseDate"
            type="date"
            required
          >
          <p
            v-if="fieldErrors.expense_date"
            class="field-error"
          >
            {{ fieldErrors.expense_date }}
          </p>
        </div>

        <div class="field">
          <label for="expense-description">Mô tả (tuỳ chọn)</label>
          <textarea
            id="expense-description"
            v-model="description"
          />
        </div>

        <p
          v-if="errorMessage"
          class="error-text"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-ghost"
            @click="emit('close')"
          >
            Hủy
          </button>
          <button
            type="submit"
            class="btn btn-primary"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
