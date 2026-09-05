<script setup lang="ts">
const { refreshSession, subscribeAuth } = useAuth()

onMounted(async () => {
  await refreshSession()
  const unsubscribe = subscribeAuth()

  onBeforeUnmount(() => {
    unsubscribe()
  })
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
