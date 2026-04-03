/** MVP: localStorage 기반 임시 사용자 ID 관리 (Toss SDK 연동 전까지 사용) */

const STORAGE_KEY = 'today_dice_user_id'

/** 클라이언트에서 임시 사용자 ID 조회 또는 생성 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

/**
 * 요청 헤더의 Authorization 토큰에서 toss_user_id를 추출하거나
 * MVP fallback으로 헤더의 x-user-id를 반환
 */
export function extractUserId(request: Request): string | null {
  // Authorization: Bearer <user_id> (MVP 임시 방식)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token) return token
  }
  // fallback
  return request.headers.get('x-user-id')
}
