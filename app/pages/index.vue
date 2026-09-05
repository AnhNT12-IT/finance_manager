<script setup lang="ts">
import { formatVnd } from '~/utils/money'
import { formatShortDate } from '~/utils/date'

definePageMeta({
  middleware: ['auth', 'family'],
})

const { loadFamilyContext } = useFamily()
const { dashboard, isLoading, errorMessage, monthLabel, loadDashboard } = useDashboard()

onMounted(async () => {
  await loadFamilyContext()
  await loadDashboard()
})
</script>

<template>
  <section class="stack">
    <div>
      <h1 class="page-title">
        Dashboard
      </h1>
      <p class="page-subtitle">
        Tổng quan chi tiêu tháng hiện tại
      </p>
    </div>

    <div
      v-if="isLoading"
      class="panel loading-state"
    >
      Đang tải thống kê...
    </div>

    <p
      v-else-if="errorMessage"
      class="error-text"
    >
      {{ errorMessage }}
    </p>

    <template v-else-if="dashboard">
      <div class="panel">
        <p class="muted">
          Tổng chi tiêu tháng {{ monthLabel }}
        </p>
        <p class="stat-value">
          {{ formatVnd(dashboard.monthlyTotal) }}
        </p>
        <div class="toolbar page-toolbar page-toolbar--flush">
          <NuxtLink
            class="btn btn-primary"
            to="/expenses?action=add"
          >
            Thêm chi tiêu
          </NuxtLink>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h2>Theo danh mục</h2>
          <div
            v-if="dashboard.byCategory.length === 0"
            class="empty-state"
          >
            Chưa có chi tiêu trong tháng này.
          </div>
          <div
            v-for="item in dashboard.byCategory"
            :key="item.categoryId"
            class="list-row"
          >
            <span>{{ item.categoryName }}</span>
            <strong>{{ formatVnd(item.total) }}</strong>
          </div>
        </div>

        <div class="panel">
          <h2>Theo thành viên</h2>
          <div
            v-if="dashboard.byMember.length === 0"
            class="empty-state"
          >
            Chưa có chi tiêu trong tháng này.
          </div>
          <div
            v-for="item in dashboard.byMember"
            :key="item.memberId"
            class="list-row"
          >
            <span>{{ item.displayName }}</span>
            <strong>{{ formatVnd(item.total) }}</strong>
          </div>
        </div>
      </div>

      <div class="panel">
        <h2>Chi tiêu gần đây</h2>
        <div
          v-if="dashboard.recent.length === 0"
          class="empty-state"
        >
          Chưa có khoản chi nào.
        </div>
        <div
          v-for="expense in dashboard.recent"
          :key="expense.id"
          class="list-row"
        >
          <div>
            <div>{{ formatShortDate(expense.expense_date) }} · {{ expense.category?.name || '—' }}</div>
            <div class="muted">
              {{ expense.member?.display_name || '—' }}
              <span v-if="expense.description"> · {{ expense.description }}</span>
            </div>
          </div>
          <strong>{{ formatVnd(expense.amount) }}</strong>
        </div>
      </div>
    </template>
  </section>
</template>
