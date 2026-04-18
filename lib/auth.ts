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


