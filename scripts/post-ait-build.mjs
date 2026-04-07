/**
 * scripts/post-ait-build.mjs
 *
 * `ait build` 완료 이후 실행되는 후처리 스크립트.
 *
 * [역할]
 * 생성된 today-dice.ait 바이너리(AITBUNDL 포맷)에서 deploymentId를 읽어
 * public/app.json 과 app.json 을 최신화합니다.
 *
 * Granite CLI는 ait build 마다 새 UUIDv7 deploymentId를 생성하므로,
 * 이 스크립트를 통해 소스 파일과 항상 동기화합니다.
 *
 * [주의] adUnitId 는 절대 자동 생성하지 않습니다.
 * adUnitId 는 Toss 파트너 포털에서 발급된 고정 값이며 deploymentId 와 무관합니다.
 * 현재 값: ait.v2.live.544f01132f2a43ec
 *
 * [호출]
 * package.json 의 build:ait 스크립트 끝에 체이닝됩니다:
 *   "ait build && node scripts/post-ait-build.mjs"
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { AppsInTossBundle } = require('@apps-in-toss/ait-format')

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const AIT_FILE    = resolve(ROOT, 'today-dice.ait')
const PUB_APP_JSON = resolve(ROOT, 'public', 'app.json')
const ROOT_APP_JSON = resolve(ROOT, 'app.json')

if (!existsSync(AIT_FILE)) {
  console.error('❌ today-dice.ait 가 없습니다. ait build 를 먼저 실행하세요.')
  process.exit(1)
}

// AIT 바이너리에서 deploymentId 추출
const buffer = readFileSync(AIT_FILE)
const reader = AppsInTossBundle.reader(new Uint8Array(buffer))
const deploymentId = reader.deploymentId

if (!deploymentId) {
  console.error('❌ AIT 바이너리에서 deploymentId를 읽지 못했습니다.')
  process.exit(1)
}

const adUnitId = 'ait.v2.live.544f01132f2a43ec'
console.log(`\n📦 deploymentId 동기화: ${deploymentId}`)

// public/app.json 갱신 (Granite 스키마)
if (existsSync(PUB_APP_JSON)) {
  const json = JSON.parse(readFileSync(PUB_APP_JSON, 'utf-8'))
  json.deploymentId = deploymentId
  writeFileSync(PUB_APP_JSON, JSON.stringify(json, null, 2) + '\n')
  console.log(`✅ public/app.json 갱신`)
}

// app.json 갱신 (레거시 AIT v2 스키마)
if (existsSync(ROOT_APP_JSON)) {
  const json = JSON.parse(readFileSync(ROOT_APP_JSON, 'utf-8'))
  json.deploymentId = deploymentId
  if (json.ait) {
    json.ait.deploymentId = deploymentId
    json.ait.adUnitId     = adUnitId
  }
  writeFileSync(ROOT_APP_JSON, JSON.stringify(json, null, 2) + '\n')
  console.log(`✅ app.json 갱신`)
}

console.log(`\n✅ 완료. 다음 배포 전 Toss 파트너 포털에 deploymentId를 등록하세요.`)
console.log(`   deploymentId: ${deploymentId}`)
console.log(`   adUnitId    : ${adUnitId}\n`)
