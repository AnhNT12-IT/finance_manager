// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  nitro: {
    preset: 'static',
  },
  modules: ['@vite-pwa/nuxt'],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '',
    },
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'vi',
        translate: 'no',
      },
      title: 'Chi tiêu gia đình',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Quản lý chi tiêu gia đình' },
        { name: 'theme-color', content: '#1f7a55' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Chi tiêu gia đình',
      short_name: 'Chi tiêu',
      lang: 'vi',
      display: 'standalone',
      background_color: '#f3f6f4',
      theme_color: '#1f7a55',
      icons: [
        { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
    },
    client: {
      installPrompt: false,
    },
  },
})
