/**
 * scripts/build-for-ait.mjs
 *
 * AIT 정적 번들 빌드용 next build 래퍼.
 *
 * v1.5 이후 API Route Handler 및 Edge Function이 제거되어
 * 스텁 교체 없이 next build를 직접 실행합니다.
 */

import { execSync } from 'node:child_process'

execSync('next build', {
  stdio: 'inherit',
  env: { ...process.env, NEXT_BUILD_FOR_AIT: '1' },
})

