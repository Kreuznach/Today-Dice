# 🎲 오늘의 주사위

> **"오늘의 운을 10초 만에 확인하는 1일 1회 AI 주사위 대결"**

하루 한 번, AI 상대방과 주사위를 굴려 오늘의 운을 확인하세요.  
경품도, 포인트도 없습니다. 오직 **연승 기록**과 **재미**가 전부입니다.

## 주요 기능

- **1일 1회 플레이** — 하루에 한 번만 주사위 대결 가능
- **연승 기록** — 연속으로 이긴 기록을 추적하고 뱃지로 표시
- **재대결** — 결과가 아쉬울 때 광고 시청 후 한 번 더 도전
- **랭킹** — 연승 TOP5 리더보드 확인

## 기술 스택

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: [Supabase](https://supabase.com) (PostgreSQL + Auth + Edge Functions)

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/Kreuznach/Today-Dice.git
cd Today-Dice
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력합니다:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_ENV=production
TZ=Asia/Seoul
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
# AIT 빌드 시 Supabase Edge Functions URL 설정 (로컬 개발 시 비워두기)
NEXT_PUBLIC_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인하세요.

## 프로젝트 구조

```
app/                  # Next.js App Router 페이지 및 API Routes
  api/                # 서버 API 엔드포인트
components/           # 공통 UI 컴포넌트
features/             # 기능별 컴포넌트 / 훅
lib/                  # 유틸리티 및 Supabase 클라이언트
supabase/             # DB 마이그레이션 및 Edge Functions
types/                # TypeScript 타입 정의
docs/                 # 기획서 및 기술 설계 문서
```

## 데이터베이스 설정

`supabase/migrations/` 폴더의 SQL 파일을 Supabase 프로젝트에 순서대로 실행합니다.

## Supabase Edge Functions 배포

API 백엔드는 Supabase Edge Functions로 구현되어 있습니다.  
AIT 번들의 WebView는 `intoss-private://` 스킴을 사용하므로 상대 경로 `/api/*` 를 호출할 수 없습니다.  
Supabase Edge Functions의 절대 URL을 사용하여 이 문제를 해결합니다.

```bash
# Supabase CLI 로그인 (최초 1회)
npx supabase login

# 5개 Edge Function 한 번에 배포 (JWT 검증 비활성화 — 자체 Bearer UUID 인증 사용)
npx supabase functions deploy today-status play rematch ranking my-records --no-verify-jwt
```

배포 후 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL`을 확인하세요:
```
NEXT_PUBLIC_API_BASE_URL=https://<project-ref>.supabase.co/functions/v1
```

## Toss in App (TIA) 심사 제출

### 사전 확인 사항

| 항목 | 상태 | 비고 |
|------|------|------|
| AIT SDK 버전 | ✅ v2 | 광고 ID `ait.v2.live.*` 접두사로 확인 |
| Deployment ID | ✅ 자동 생성 | `ait build` 시 Granite CLI가 UUIDv7 자동 생성 |
| `public/app.json` | ✅ 작성됨 | Granite 스키마 (schemaVersion 1) — 빌드 후 자동 갱신 |
| `app.json` | ✅ 작성됨 | 레거시 AIT v2 스키마 호환용 |
| `granite.config.ts` | ✅ 작성됨 | `@apps-in-toss/web-framework` 빌드 설정 |
| `NEXT_PUBLIC_APP_ENV` | ✅ `production` | `.env.local.example` 참조 |
| `NEXT_PUBLIC_API_BASE_URL` | ⚠️ **AIT 빌드 필수** | Supabase Edge Functions URL. 로컬 개발 시 비워두기 |

### AIT 빌드 생성

```bash
# Granite CLI가 next build → RN 0.84/0.72 빌드 → AIT 바이너리 패키징 수행
npm run build:ait
```

빌드 완료 후 터미널에 아래와 같은 출력이 표시되어야 합니다:
```
◇  [1/2] Built for RN 0.84.0
◇  [2/2] Built for RN 0.72.6
◇  Creating .ait artifact...
◆  AIT build completed (today-dice.ait)
●  deploymentId: <생성된-UUIDv7>
```

생성 파일: `today-dice.ait` (AITBUNDL 바이너리 형식)  
포함 내용: RN 0.84/0.72 프리빌드 번들 + Next.js 정적 내보내기(`out/`) + `public/app.json`

> `today-dice.ait` 파일은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.  
> 빌드할 때마다 새 deploymentId가 생성됩니다. `scripts/update-app-json.mjs`가 `public/app.json`을 자동으로 최신화합니다.
> 제출 전 출력된 `deploymentId`를 Toss 파트너 포털에 등록하세요.
