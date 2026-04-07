/**
 * lib/ads.ts
 *
 * Toss AIT 리워드 광고 유틸리티
 *
 * Today-RPS 프로젝트의 watchAd()와 동일한 2단계 처리:
 *   1단계: loadAppsInTossAdMob → 'loaded' 이벤트 대기
 *   2단계: showAppsInTossAdMob → 'dismissed' 이벤트 대기 (userEarnedReward 여부 확인)
 *
 * 개발/비-Toss 환경: 1.5초 지연 후 true를 반환하는 Mock으로 폴백합니다.
 */

import { GoogleAdMob } from '@apps-in-toss/web-framework'

/** 재도전 광고 그룹 ID — Toss 파트너 포털에서 발급된 고정 값 */
const AD_GROUP_ID = 'ait.v2.live.544f01132f2a43ec'

/**
 * AIT 환경 여부 확인
 * loadAppsInTossAdMob.isSupported() 가 true 일 때만 AIT 광고 SDK 사용
 */
function _isAitSupported(): boolean {
  try {
    return GoogleAdMob.loadAppsInTossAdMob.isSupported() === true
  } catch {
    return false
  }
}

/**
 * 광고 시청 후 보상 획득
 *
 * @returns 광고를 끝까지 시청해 보상을 받으면 true, 아니면 false
 * @throws 광고 로드 자체가 실패한 경우
 */
export async function watchAd(): Promise<boolean> {
  if (!_isAitSupported()) {
    // 개발 환경 Mock
    await new Promise<void>((r) => setTimeout(r, 1500))
    return true
  }

  // 1단계: 광고 로드
  await new Promise<void>((resolve, reject) => {
    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          cleanup()
          resolve()
        }
      },
      onError: (error) => {
        cleanup()
        reject(error)
      },
    })
  })

  // 2단계: 광고 표시 & 보상 확인
  return new Promise<boolean>((resolve) => {
    let rewarded = false
    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') rewarded = true
        if (event.type === 'dismissed') resolve(rewarded)
        if (event.type === 'failedToShow') resolve(false)
      },
      onError: () => resolve(false),
    })
  })
}
