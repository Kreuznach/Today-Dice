/**
 * AIT 빌드 스크립트 — 앱인토스(App-in-Toss) 심사 제출용 패키지 생성
 *
 * 생성 파일: today-dice.ait (ZIP 형식)
 * 포함 내용: public/app.json + public/ + .next/static/
 *
 * 실행: npm run build:ait
 */

import { execSync } from 'node:child_process'
import { existsSync, rmSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const APP_JSON = resolve(ROOT, 'public', 'app.json')
const TEMP_ZIP = resolve(ROOT, 'today-dice.zip')
const AIT_FILE = resolve(ROOT, 'today-dice.ait')

// public/app.json 존재 확인
if (!existsSync(APP_JSON)) {
  console.error('❌ public/app.json 파일이 없습니다. 프로젝트의 public/ 폴더에 app.json을 생성하세요.')
  process.exit(1)
}

// .next/static 존재 확인
const NEXT_STATIC = resolve(ROOT, '.next', 'static')
if (!existsSync(NEXT_STATIC)) {
  console.error('❌ .next/static 디렉터리가 없습니다. 먼저 npm run build를 실행하세요.')
  process.exit(1)
}

// 기존 파일 정리
if (existsSync(AIT_FILE)) { rmSync(AIT_FILE); console.log('🗑  기존 today-dice.ait 삭제') }
if (existsSync(TEMP_ZIP)) rmSync(TEMP_ZIP)

// public/app.json 정보 출력
const appMeta = JSON.parse(readFileSync(APP_JSON, 'utf-8'))
console.log(`📦 AIT 패키지 생성 중...`)
console.log(`   앱 ID       : ${appMeta.id}`)
console.log(`   표시 이름   : ${appMeta.name}`)
console.log(`   배포 ID     : ${appMeta.deploymentId}`)

// PowerShell Compress-Archive는 .zip만 지원 → .zip 생성 후 .ait으로 변경
const paths = ['public\\app.json', 'public', '.next\\static'].join("','")
const cmd = [
  `Compress-Archive -Path '${paths}' -DestinationPath '${TEMP_ZIP}' -Force`,
  `Rename-Item -Path '${TEMP_ZIP}' -NewName 'today-dice.ait'`,
].join('; ')

try {
  execSync(`powershell -NoProfile -Command "${cmd}"`, { stdio: 'inherit', cwd: ROOT })
  console.log(`\n✅ AIT 패키지 생성 완료: today-dice.ait`)
  console.log(`   → Toss 파트너 포털에 업로드하여 심사를 요청하세요.`)
} catch (err) {
  console.error('❌ AIT 패키지 생성 실패:', err.message)
  process.exit(1)
}
