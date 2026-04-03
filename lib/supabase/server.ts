import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * 서버 컴포넌트 / Route Handler 전용 Supabase 클라이언트
 * SUPABASE_SERVICE_ROLE_KEY 사용 — 절대 클라이언트에 노출하지 않을 것
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
