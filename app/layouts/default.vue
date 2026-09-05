<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()
const { family, clearFamilyState } = useFamily()

const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const showAppNav = computed(() => Boolean(user.value) && !isAuthPage.value)

/**
 * Logout and clear family state.
 */
const handleLogout = async () => {
  clearFamilyState()
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--with-bottom-nav': showAppNav }"
  >
    <header
      v-if="!isAuthPage"
      class="app-header"
    >
      <NuxtLink
        to="/"
        class="brand"
      >
        {{ family?.name || 'Chi tiêu gia đình' }}
      </NuxtLink>

      <nav
        v-if="user"
        class="nav-links desktop-nav"
        aria-label="Điều hướng chính"
      >
        <NuxtLink
          class="nav-link"
          to="/"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          class="nav-link"
          to="/expenses"
        >
          Chi tiêu
        </NuxtLink>
        <NuxtLink
          class="nav-link"
          to="/family"
        >
          Gia đình
        </NuxtLink>
        <button
          type="button"
          class="btn btn-ghost"
          aria-label="Đăng xuất"
          @click="handleLogout"
        >
          Đăng xuất
        </button>
      </nav>

      <button
        v-if="user"
        type="button"
        class="btn btn-ghost mobile-logout"
        aria-label="Đăng xuất"
        @click="handleLogout"
      >
        Đăng xuất
      </button>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <nav
      v-if="showAppNav"
      class="bottom-nav"
      aria-label="Điều hướng chính"
    >
      <NuxtLink
        class="bottom-nav-link"
        to="/"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        class="bottom-nav-link"
        to="/expenses"
      >
        Chi tiêu
      </NuxtLink>
      <NuxtLink
        class="bottom-nav-link"
        to="/family"
      >
        Gia đình
      </NuxtLink>
    </nav>
  </div>
</template>
