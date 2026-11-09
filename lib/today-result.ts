import { getOrCreateGuestId } from './auth'
import { getTodayKST } from './date-utils'
import { getTodayStatus } from './supabase'
import type { PlayResponse } from '@/types'

const KEY = 'play_result'

/** 이 화면에서 방금 만든 오늘 결과를 저장 (재대결 뒤에는 갱신된 결과로 덮어쓴다) */
export function saveTodayResult(result: PlayResponse): void {
  sessionStorage.setItem(KEY, JSON.stringify(result))
}

/**
 * 오늘 결과를 가져온다.
 * 임시 저장소(sessionStorage)가 비었거나 오늘 것이 아니면 서버에서 다시 불러와서,
 * 앱을 껐다 켠 뒤에도 결과 화면과 재대결에 들어올 수 있게 한다.
 */
export async function loadTodayResult(): Promise<PlayResponse | null> {
  const today = getTodayKST()
  const raw = sessionStorage.getItem(KEY)
  if (raw) {
    try {
      const saved = JSON.parse(raw) as PlayResponse
      if (saved.battle?.battle_date === today) return saved
    } catch {
      // 깨진 저장값은 무시하고 서버에서 다시 불러온다
    }
  }

  try {
    const status = await getTodayStatus(getOrCreateGuestId())
    if (!status.played || !status.battle || !status.streak) return null
    const restored: PlayResponse = { battle: status.battle, streak: status.streak }
    saveTodayResult(restored)
    return restored
  } catch {
    return null
  }
}
