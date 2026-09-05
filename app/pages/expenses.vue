<script setup lang="ts">
import type { ExpenseInput, ExpenseWithRelations } from '~/types'
import { formatVnd } from '~/utils/money'
import { formatShortDate, getCurrentMonthKey } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'family'],
})

const route = useRoute()
const { loadFamilyContext, members, categories, currentMember } = useFamily()
const {
  expenses,
  totalCount,
  isLoading,
  errorMessage,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = useExpenses()

const month = ref(getCurrentMonthKey())
const categoryId = ref('')
const memberId = ref('')
const search = ref('')
const page = ref(1)
const pageSize = 20

const isFormOpen = ref(false)
const editingExpense = ref<ExpenseWithRelations | null>(null)
const pendingDeleteId = ref<string | null>(null)
const formError = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

/**
 * Reload list with current filters.
 */
const reload = async () => {
  await fetchExpenses({
    month: month.value || undefined,
    categoryId: categoryId.value || undefined,
    memberId: memberId.value || undefined,
    search: search.value || undefined,
    page: page.value,
    pageSize,
  })
}

onMounted(async () => {
  await loadFamilyContext()
  await reload()

  if (route.query.action === 'add') {
    openCreateForm()
  }
})

/**
 * Open create form.
 */
const openCreateForm = () => {
  editingExpense.value = null
  formError.value = ''
  isFormOpen.value = true
}

/**
 * Open edit form.
 */
const openEditForm = (expense: ExpenseWithRelations) => {
  editingExpense.value = expense
  formError.value = ''
  isFormOpen.value = true
}

/**
 * Save create or update.
 */
const handleSave = async (input: ExpenseInput) => {
  formError.value = ''

  try {
    if (editingExpense.value) {
      await updateExpense(editingExpense.value.id, input)
    } else {
      await createExpense(input)
    }

    isFormOpen.value = false
    editingExpense.value = null
    page.value = 1
    await reload()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Lưu thất bại.'
  }
}

/**
 * Confirm delete.
 */
const handleConfirmDelete = async () => {
  if (!pendingDeleteId.value) {
    return
  }

  try {
    await deleteExpense(pendingDeleteId.value)
    pendingDeleteId.value = null
    await reload()
  } catch {
    formError.value = errorMessage.value || 'Xóa thất bại.'
    pendingDeleteId.value = null
  }
}

/**
 * Apply filters from toolbar.
 */
const handleFilter = async () => {
  page.value = 1
  await reload()
}

/**
 * Change page.
 */
const goToPage = async (nextPage: number) => {
  page.value = nextPage
  await reload()
}
</script>

<template>
  <section class="stack">
    <div class="toolbar page-toolbar">
      <div>
        <h1 class="page-title">
          Chi tiêu
        </h1>
        <p class="page-subtitle">
          Thêm, lọc và quản lý các khoản chi
        </p>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        @click="openCreateForm"
      >
        Thêm chi tiêu
      </button>
    </div>

    <div class="panel">
      <div class="toolbar">
        <div class="field">
          <label for="filter-month">Tháng</label>
          <input
            id="filter-month"
            v-model="month"
            type="month"
          >
        </div>
        <div class="field">
          <label for="filter-category">Danh mục</label>
          <select
            id="filter-category"
            v-model="categoryId"
          >
            <option value="">
              Tất cả
            </option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="filter-member">Thành viên</label>
          <select
            id="filter-member"
            v-model="memberId"
          >
            <option value="">
              Tất cả
            </option>
            <option
              v-for="member in members"
              :key="member.id"
              :value="member.id"
            >
              {{ member.display_name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="filter-search">Tìm mô tả</label>
          <input
            id="filter-search"
            v-model="search"
            type="search"
            placeholder="Ví dụ: siêu thị"
          >
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          @click="handleFilter"
        >
          Lọc
        </button>
      </div>

      <div
        v-if="isLoading"
        class="loading-state"
      >
        Đang tải...
      </div>

      <p
        v-else-if="errorMessage"
        class="error-text"
      >
        {{ errorMessage }}
      </p>

      <div
        v-else-if="expenses.length === 0"
        class="empty-state"
      >
        Chưa có khoản chi phù hợp. Hãy thêm chi tiêu đầu tiên.
      </div>

      <template v-else>
        <div class="table-wrap desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Danh mục</th>
                <th>Mô tả</th>
                <th>Thành viên</th>
                <th>Số tiền</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="expense in expenses"
                :key="expense.id"
              >
                <td>{{ formatShortDate(expense.expense_date) }}</td>
                <td>{{ expense.category?.name || '—' }}</td>
                <td>{{ expense.description || '—' }}</td>
                <td>{{ expense.member?.display_name || '—' }}</td>
                <td>{{ formatVnd(expense.amount) }}</td>
                <td>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    @click="openEditForm(expense)"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    @click="pendingDeleteId = expense.id"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="expense-cards">
          <article
            v-for="expense in expenses"
            :key="`card-${expense.id}`"
            class="expense-card"
          >
            <div class="expense-card-top">
              <strong>{{ formatVnd(expense.amount) }}</strong>
              <span class="muted">{{ formatShortDate(expense.expense_date) }}</span>
            </div>
            <div>{{ expense.category?.name || '—' }}</div>
            <div class="muted">
              {{ expense.member?.display_name || '—' }}
              <span v-if="expense.description"> · {{ expense.description }}</span>
            </div>
            <div class="toolbar toolbar--card-actions">
              <button
                type="button"
                class="btn btn-secondary"
                @click="openEditForm(expense)"
              >
                Sửa
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="pendingDeleteId = expense.id"
              >
                Xóa
              </button>
            </div>
          </article>
        </div>

        <div class="pagination">
          <span class="muted">
            Trang {{ page }} / {{ totalPages }} · {{ totalCount }} khoản
          </span>
          <div class="toolbar toolbar--flush">
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="page <= 1"
              @click="goToPage(page - 1)"
            >
              Trước
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="page >= totalPages"
              @click="goToPage(page + 1)"
            >
              Sau
            </button>
          </div>
        </div>
      </template>
    </div>

    <ExpenseFormModal
      :is-open="isFormOpen"
      :expense="editingExpense"
      :categories="categories"
      :members="members"
      :default-member-id="currentMember?.id || ''"
      :error-message="formError"
      @close="isFormOpen = false"
      @save="handleSave"
    />

    <ConfirmDialog
      :is-open="Boolean(pendingDeleteId)"
      title="Xóa khoản chi?"
      message="Hành động này không thể hoàn tác."
      confirm-label="Xóa"
      @cancel="pendingDeleteId = null"
      @confirm="handleConfirmDelete"
    />
  </section>
</template>
