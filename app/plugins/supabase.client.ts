import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Provide browser Supabase client with persisted session.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const anonKey = config.public.supabaseAnonKey

  if (!url || !anonKey) {
    console.warn('[supabase] Missing NUXT_PUBLIC_SUPABASE_URL or NUXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const client: SupabaseClient = createClient(url || 'http://localhost', anonKey || 'public-anon-key', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return {
    provide: {
      supabase: client,
    },
  }
})
