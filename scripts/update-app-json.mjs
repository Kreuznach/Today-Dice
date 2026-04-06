/**
 * scripts/update-app-json.mjs
 *
 * ait build 파이프라인 내에서 next build 완료 후 실행되는 후처리 스크립트.
 *
 * [역할]
 * Granite CLI(ait build)가 빌드 시 생성한 UUIDv7 deploymentId를
 * AIT_DEPLOYMENT_ID 환경변수로 주입합니다.
 * 이 스크립트는 그 값을 읽어 out/app.json 의 deploymentId 를 갱신합니다.
 *
 * 덕분에 AIT 바이너리 메타데이터의 deploymentId 와
 * 번들 내부 out/app.json 의 deploymentId 가 항상 일치하게 됩니다.
 *
 * [호출 위치]
 * granite.config.ts 의 commands.build 끝에 체이닝됨:
 *   "next build && node scripts/update-app-json.mjs"
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const OUT_APP_JSON = resolve(ROOT, 'out', 'app.json')
const PUB_APP_JSON = resolve(ROOT, 'public', 'app.json')

const deploymentId = process.env.AIT_DEPLOYMENT_ID

if (!deploymentId) {
  // AIT_DEPLOYMENT_ID 가 없으면 standalone next build 로 간주, 조용히 종료
  process.exit(0)
}

// out/app.json 업데이트
if (existsSync(OUT_APP_JSON)) {
  const json = JSON.parse(readFileSync(OUT_APP_JSON, 'utf-8'))
  json.deploymentId = deploymentId
  writeFileSync(OUT_APP_JSON, JSON.stringify(json, null, 2) + '\n')
  console.log(`✅ out/app.json deploymentId 갱신: ${deploymentId}`)
}

// public/app.json 도 동기화 (다음 빌드를 위한 기준값 유지)
if (existsSync(PUB_APP_JSON)) {
  const json = JSON.parse(readFileSync(PUB_APP_JSON, 'utf-8'))
  json.deploymentId = deploymentId
  writeFileSync(PUB_APP_JSON, JSON.stringify(json, null, 2) + '\n')
  console.log(`✅ public/app.json deploymentId 갱신: ${deploymentId}`)
}
