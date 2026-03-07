import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from './database.types'

// ─── Env vars ─────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// ─── SecureStore auth adapter ─────────────────────────────────────────────────
// expo-secure-store is synchronous on native but the Supabase adapter interface
// expects Promises. We wrap here so auth tokens are stored in the device keychain
// (not AsyncStorage / plain localStorage).

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key)
  },
}

// ─── Supabase client ──────────────────────────────────────────────────────────

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // Disable URL-based session detection — not relevant in React Native
    detectSessionInUrl: false,
  },
})

// ─── useSession hook ──────────────────────────────────────────────────────────

interface SessionState {
  session: Session | null
  user: User | null
  /** true while the initial session is being retrieved from SecureStore */
  loading: boolean
}

/**
 * Returns the current Supabase session and user.
 * Subscribes to auth state changes so the returned values are always fresh.
 *
 * @example
 * const { user, loading } = useSession()
 * if (loading) return <LoadingScreen />
 * if (!user)   return <AuthScreen />
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    loading: true,
  })

  useEffect(() => {
    // 1. Hydrate from SecureStore on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false })
    })

    // 2. Stay in sync with auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return state
}
