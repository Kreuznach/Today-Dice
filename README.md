# 🎲 오늘의 주사위

> **"오늘의 운을 10초 만에 확인하는 1일 1회 AI 주사위 대결"**

하루 한 번, AI와 주사위를 굴려 오늘의 운을 확인합니다.  
경품도 포인트도 없습니다. **기록**과 **재미**만 남깁니다.

이 README는 프로그래밍을 처음 배우는 사람도 따라 할 수 있게 적었습니다.

## 이 앱이 하는 일 (아주 짧게)

1. 버튼을 한 번 누른다.
2. 나와 AI의 주사위가 굴러간다.
3. 큰 쪽이 이긴다. 하루 한 번만 된다.
4. 아쉬우면 광고를 보고 한 번 더 굴릴 수 있다.
5. 이기지 못해도 **연속 출석**은 남는다. 그래서 내일도 오게 된다.

## 주요 기능

- **1일 1회 플레이** — 하루에 한 번만 주사위 대결
- **연승 기록** — 연속으로 이긴 횟수를 뱃지로 표시
- **재대결** — 결과가 아쉬울 때 광고 시청 후 한 번 더
- **랭킹** — 연승·연패·같은 번호 등 여러 판
- **연속 출석** — 이겨도 져도, 오늘 오면 이어지는 숫자
- **오늘의 키워드** — 같은 5라도 요일마다 다른 한 줄
- **주간 보드 / 운의 달력** — 이번 주·최근 30일을 칸으로 봄
- **출석 이정표** — 1·3·7·14·30·100일 스티커 (능력치는 없음)

## 폴더가 헷갈릴 때

| 폴더 | 쉽게 말하면 |
|------|-------------|
| [app/](app/) | 화면. `page.tsx` 하나가 주소 하나 |
| [components/](components/) | 여러 화면에서 쓰는 작은 부품 |
| [features/dice/](features/dice/) | 주사위 게임에만 쓰는 부품 |
| [lib/](lib/) | 날짜, 운세, 점수 계산 같은 도구 상자 |
| [docs/](docs/) | 기획·설계를 글로 적어 둔 곳 |

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
app/                  # 화면 (주소마다 page.tsx)
components/           # 버튼, 카드, 주사위 그림
features/dice/        # 출석 바, 달력, 결과 카드
lib/                  # 날짜, 운세, 이정표, DB 접속
scripts/              # 검사 스크립트, AIT 빌드 도우미
supabase/             # 데이터베이스 표 만드는 SQL
types/                # 데이터 모양을 적어 둔 파일
docs/                 # 기획서와 개선안
```

## 로직이 맞는지 검사하기

데이터베이스 없이, 날짜·운세·이정표 계산만 빠르게 확인합니다.

```bash
npm run test:retention
```

성공하면 터미널에 `verify-retention: ok` 가 나옵니다.

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

**캐시 문제가 의심될 때 클린 빌드:**

```bash
# PowerShell (Windows)
Remove-Item -Recurse -Force .next, out
npm run build:ait

# bash (macOS/Linux)
rm -rf .next out && npm run build:ait
```

> **프롬프트:** 빌드 중 `Need to install the following packages: node@xx.xx.x` 메시지가 나타나면 `y`를 입력하세요.

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
> 빌드할 때마다 새 deploymentId가 생성되면 `scripts/post-ait-build.mjs`가 `public/app.json`을 자동으로 최신화합니다.  
> 제출 전 출력된 `deploymentId`를 Toss 파트너 포털에 등록하세요.

| 항목 | 값 |
|------|----|
| 최신 deploymentId | `01a02beb-0eb9-7a15-92a8-296aafc7f9cd` |
| adUnitId (고정) | `ait.v2.live.544f01132f2a43ec` |
