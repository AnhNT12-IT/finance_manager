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
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Quản lý chi tiêu gia đình' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
})
