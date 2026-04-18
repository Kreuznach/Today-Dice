# 오늘의 주사위 — 프로젝트 플랜

> 작성일: 2026-04-03  
> 버전: v0.1 (MVP 초안)  
> 기준: Next.js 14 (App Router) + Supabase + Toss in App WebView  

---

## 11. 폴더/파일 구조 제안

### 11-1. 전체 구조

```
Today-Dice/
├── docs/                           ← 기획/설계 문서
│   ├── 01_prd.md
│   ├── 02_technical-design.md
│   ├── 03_project-plan.md
│   └── implementation-request.md
│
├── src/
│   ├── app/                        ← Next.js App Router
│   │   ├── layout.tsx              ← 전체 레이아웃 (Toss WebView 최적화)
│   │   ├── page.tsx                ← 홈 화면 (/)
│   │   ├── play/
│   │   │   ├── page.tsx            ← 플레이 화면 (/play)
│   │   │   └── rematch/
│   │   │       └── page.tsx        ← 재도전 플레이 화면 (/play/rematch)
│   │   ├── result/
│   │   │   ├── page.tsx            ← 결과 화면 (/result)
│   │   │   └── final/
│   │   │       └── page.tsx        ← 최종 결과 화면 (/result/final)
│   │   ├── ranking/
│   │   │   └── page.tsx            ← 랭킹 화면 (/ranking)
│   │   ├── my-records/
│   │   │   └── page.tsx            ← 내 기록 화면 (/my-records)
│   │   └── api/                    ← Next.js API Routes
│   │       ├── today-status/
│   │       │   └── route.ts        ← GET: 오늘 상태 조회
│   │       ├── play/
│   │       │   └── route.ts        ← POST: 주사위 굴리기
│   │       ├── rematch/
│   │       │   └── route.ts        ← POST: 광고 후 재대결
│   │       ├── ranking/
│   │       │   └── route.ts        ← GET: 랭킹 TOP5 조회
│   │       └── my-records/
│   │           └── route.ts        ← GET: 내 기록 7일
│   │
│   ├── components/                 ← 공통 UI 컴포넌트
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── dice/
│   │       ├── DiceFace.tsx        ← 주사위 면 렌더링 (2D SVG, 결과 화면)
│   │       └── Dice3D.tsx          ← CSS 3D 큐브 주사위 (플레이 화면 + 애니메이션)
│   │
│   ├── features/
│   │   └── dice/
│   │       ├── hooks/
│   │       │   ├── useTodayStatus.ts   ← 오늘 상태 조회 훅
│   │       │   ├── usePlay.ts          ← 플레이 요청 훅
│   │       │   └── useRematch.ts       ← 재대결 요청 훅
│   │       ├── components/
│   │       │   ├── ResultDisplay.tsx   ← 결과 표시 컴포넌트
│   │       │   ├── StreakBadge.tsx      ← 연승 뱃지
│   │       │   └── RematchButton.tsx   ← 재대결 버튼 (조건부)
│   │       └── types.ts                ← 도메인 타입 정의
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           ← Supabase 클라이언트 (브라우저)
│   │   │   └── server.ts           ← Supabase 클라이언트 (서버)
│   │   ├── game-logic.ts           ← 주사위 판정/스트릭 로직 (서버용)
│   │   ├── date-utils.ts           ← KST 날짜 처리 유틸
│   │   ├── auth.ts                 ← Toss 사용자 인증 처리
│   │   ├── ads.ts                  ← AIT 리워드 광고 유틸 (watchAd)
│   │   └── nickname.ts             ← 랜덤 닉네임 생성 (형용사+명사+#4자리)
│   │
│   └── types/
│       └── index.ts                ← 전역 타입 (API 응답 등)
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_dice_users.sql
│   │   ├── 002_create_dice_daily_battle.sql
│   │   ├── 003_create_dice_streak_state.sql
│   │   ├── 004_create_dice_leaderboard_cache.sql
│   │   ├── 005_create_rls_policies.sql
│   │   └── 006_add_streak_extra_columns.sql  ← 같은번호·역전승패 컬럼 추가
│   └── functions/
│       └── update-leaderboard/
│           └── index.ts            ← 랭킹 갱신 Edge Function (예정)
│
├── public/
│   └── dice/                       ← 주사위 SVG/이미지 (1~6면)
│
├── .env.local                      ← 환경변수 (커밋 금지)
├── .env.example                    ← 환경변수 샘플
├── .gitignore
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 11-2. 핵심 파일 역할 요약

| 파일 | 역할 |
|------|------|
| `lib/game-logic.ts` | AI 주사위 생성 + 승패 판정 (서버에서만 사용) |
| `lib/date-utils.ts` | KST 기준 오늘 날짜 계산 |
| `lib/auth.ts` | 게스트 ID 관리 (`getOrCreateGuestId`) |
| `api/play/route.ts` | 1회 제한 체크 + 주사위 판정 + DB 저장 |
| `api/rematch/route.ts` | 재대결 제한 체크 + 광고 검증 + 재판정 |
| `supabase/functions/update-leaderboard/` | 1시간 캐시 갱신 |

### 11-3. 환경변수 (.env.local.example)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dxuvdvvdpcbkilesovoc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 앱 (production: Toss in App 배포, development: 로컬 개발)
NEXT_PUBLIC_APP_ENV=production
TZ=Asia/Seoul

# App-in-Toss 광고 SDK (AIT v2, deployment ID: 019d6168-68eb-7837-ac20-cf469e0d62ba)
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
```

> `SUPABASE_SERVICE_ROLE_KEY` 는 서버 API Route에서만 사용  
> 절대로 클라이언트(`NEXT_PUBLIC_`)에 노웈 금지  
> AIT SDK v2 확인: 광고 ID 접두사 `ait.v2.live.`  
> deployment ID `019d6168-68eb-7837-ac20-cf469e0d62ba` — `ait build` 실행 시 Granite CLI가 새 UUIDv7을 자동 생성합니다

---

## 12. 개발 순서 제안

> 기준: 1인 개발, MVP 우선, 각 단계 완료 후 다음 단계 진행

### 1단계: 기반 + 핵심 플레이 (3~4일)

**목표:** 주사위를 굴리고 결과를 볼 수 있는 최소 상태

| 작업 | 세부 내용 |
|------|-----------|
| 1-1 | Supabase 프로젝트 초기화, 테이블 생성 (migration 파일 작성) |
| 1-2 | RLS 정책 설정 (dice_daily_battle, dice_streak_state는 서버 전용 쓰기) |
| 1-3 | Next.js 프로젝트 생성, 기본 폴더 구조 셋업 |
| 1-4 | Supabase 클라이언트/서버 연결 설정 |
| 1-5 | `lib/game-logic.ts` 작성 (주사위 생성, 승패 판정 함수) |
| 1-6 | `lib/date-utils.ts` 작성 (KST 날짜 계산) |
| 1-7 | `POST /api/play` 구현 (판정 + DB 저장) |
| 1-8 | 플레이 화면 UI + 결과 화면 UI (최소한의 스타일) |

**완료 기준:** 버튼 탭 → 주사위 결과가 DB에 저장되고 화면에 표시됨

---

### 2단계: 상태 관리 + 홈 화면 (2~3일)

**목표:** 하루 1회 제한이 동작하고, 홈에서 오늘 상태를 즉시 확인 가능

| 작업 | 세부 내용 |
|------|-----------|
| 2-1 | `GET /api/today-status` 구현 (오늘 기록 + 스트릭 조회) |
| 2-2 | 홈 화면 구현 (플레이 여부 분기 처리) |
| 2-3 | `useTodayStatus` 훅 작성 |
| 2-4 | `dice_streak_state` UPSERT 로직 (`/api/play`와 연동) |
| 2-5 | 하루 1회 제한 409 처리 및 UI 피드백 |

**완료 기준:** 하루 1회만 플레이 가능하고, 홈에서 오늘 결과/연승을 즉시 확인

---

### 3단계: 내 기록 + 랭킹 (2~3일)

**목표:** 내 기록 7일치 확인, 연승 랭킹 TOP5 조회

| 작업 | 세부 내용 |
|------|-----------|
| 3-1 | `GET /api/my-records` 구현 |
| 3-2 | 내 기록 화면 UI 구현 |
| 3-3 | `supabase/functions/update-leaderboard` Edge Function 작성 |
| 3-4 | `GET /api/ranking` 구현 (캐시 테이블 조회) |
| 3-5 | 랭킹 화면 UI 구현 |
| 3-6 | Edge Function cron 설정 (1시간마다 실행) |

**완료 기준:** 내 기록 7일치 확인 가능, 연승 TOP5 랭킹 조회 가능

---

### 4단계: 광고 재대결 구현 (3~4일)

**목표:** 광고 시청 후 재대결이 자연스럽게 동작

| 작업 | 세부 내용 |
|------|-----------|
| 4-1 | 광고 제공사 선정 및 SDK 연동 검토 (검토 필요) |
| 4-2 | 재대결 버튼 UI + 안내 문구 구현 |
| 4-3 | 광고 시청 완료 후 `POST /api/rematch` 호출 플로우 구현 |
| 4-4 | `POST /api/rematch` 서버 구현 (광고 토큰 검증 + 재판정) |
| 4-5 | 최종 결과 화면 UI 구현 |
| 4-6 | `dice_streak_state` 재대결 결과로 업데이트 |

**완료 기준:** 광고 시청 → 재대결 → 최종 결과 저장, 재대결 중복 요청 차단

---

### 5단계: UX 다듬기 + 배포 (2~3일)

**목표:** Toss in App에서 어색하지 않도록 UI/UX 완성

| 작업 | 세부 내용 |
|------|-----------|
| 5-1 | 주사위 애니메이션 구현 (0.5~1초, 경량) |
| 5-2 | 전체 UX 카피 적용 (문서 7장 참고) |
| 5-3 | 모바일 WebView 최적화 (뷰포트, 터치 영역) |
| 5-4 | 에러 처리 UI (API 실패, 네트워크 오류 등) |
| 5-5 | 인증 흐름 완성 (Toss SDK 연동, 검토 필요) |
| 5-6 | Vercel 배포 또는 Toss 미니앱 등록 절차 진행 |

**완료 기준:** Toss in App WebView에서 끊김 없이 동작, UX 카피 전부 적용

---

### 전체 일정 요약

| 단계 | 기간 | 누적 |
|------|------|------|
| 1단계: 핵심 플레이 | 3~4일 | 4일 |
| 2단계: 상태 관리 | 2~3일 | 7일 |
| 3단계: 기록/랭킹 | 2~3일 | 10일 |
| 4단계: 광고 재대결 | 3~4일 | 14일 |
| 5단계: 다듬기/배포 | 2~3일 | **17일** |

---

## 13. 최종 추천안

### 13-1. MVP 핵심 추천 구조

```
[입장] → [홈: 오늘 상태 확인] → [플레이 화면] → [굴리기 1회]
       → [결과] → (선택) [재대결 버튼] → [광고 시청]
       → [재도전 플레이] → [주사위 굴리기] → [애니메이션]
       → [최종 결과] → [홈]
```

가장 단순하고, 매일 반복할 이유가 있으며, 광고가 자연스러운 구조.

---

### 13-2. 반드시 넣어야 할 것 3가지

| # | 항목 | 이유 |
|---|------|------|
| 1 | **하루 1회 제한 (서버 강제)** | 서비스 정체성이자 광고 진입점의 전제 조건 |
| 2 | **연승 기록 + 랭킹** | 매일 오는 이유를 만드는 리텐션 핵심 |
| 3 | **10초 내 플레이 완결** | 긴 세션 요구 시 Toss 사용자 이탈 |

---

### 13-3. 처음엔 빼야 할 것 3가지

| # | 항목 | 이유 |
|---|------|------|
| 1 | **소셜 공유 기능** | 구현 복잡, ROI 불명확, V2로 충분 |
| 2 | **복수 랭킹 카테고리** | 데이터 축적 전에는 의미 없음 |
| 3 | **튜토리얼/온보딩** | 주사위 대결은 설명 없이 이해 가능 |

---

### 13-4. 성공 확률을 높이는 포인트 3가지

| # | 포인트 | 설명 |
|---|--------|------|
| 1 | **"오늘 아직 안 굴렸다" 미완료 상태 활용** | Toss 앱 재방문 시 홈에 뱃지/알림 노출하면 DAU 상승 |
| 2 | **연승 기록이 끊길 위기일 때 재대결 욕구 극대화** | 연승 3 이상인 사람이 질 때 광고 전환율 최고 |
| 3 | **랭킹 TOP5에 자기 이름이 보이는 순간** | 경쟁 동기 발생 → 연속 방문으로 이어짐 |

---

### 13-5. 운영/심사 관점에서 조심할 포인트 3가지

| # | 포인트 | 조치 방향 |
|---|--------|-----------|
| 1 | **사행성/도박성 심사** | 경품·포인트·현금성 보상 완전 배제, "재미와 기록" 명시 |
| 2 | **광고 재대결 표현** | "한 번 더 살 수 있다"는 뉘앙스 절대 금지, "마지막 기회" 같은 조급함 조성 표현 금지 |
| 3 | **개인정보 처리** | Toss 사용자 식별자 외 추가 수집 없음, 별도 개인정보 처리방침 불필요 수준 유지 |

---

### 13-6. UX 카피 최종안

> [광고 UX 섹션 07에서 상세 내용 있음, 여기서는 전체 맥락 정리]

| 상황 | 문구 |
|------|------|
| **홈 - 미플레이** | 오늘의 주사위, 아직 안 굴렸어요 |
| **홈 - 플레이 완료** | 오늘 결과: 승리 / 패배 / 무승부 |
| **플레이 시작** | 굴려볼게요 |
| **승리 결과** | 오늘도 이겼어요. 연승 N회 |
| **패배 결과** | 오늘은 아쉬웠어요. 내일도 있어요 |
| **무승부 결과** | 비겼어요. 어떻게 할까요? |
| **재대결 안내** | 오늘 한 번 더 굴려볼 수 있어요 (짧은 동영상 시청 후) |
| **재대결 전 확인** | 이 결과가 오늘의 최종 기록이 됩니다 |
| **최종 결과 확정** | 오늘의 기록이 확정됐어요 |
| **내일 유도** | 내일 다시 만나요 |

---

*관련 문서: [implementation-request.md](./implementation-request.md)*
