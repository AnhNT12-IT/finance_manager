import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Access injected Supabase client.
 */
export const useSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()

  if (!$supabase) {
    throw new Error('Supabase client is not initialized')
  }

  return $supabase as SupabaseClient
}
