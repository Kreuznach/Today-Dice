# 오늘의 주사위 — 구현 요청서

> 작성일: 2026-04-03  
> 목적: 이 문서를 읽는 개발자(또는 AI 코딩 어시스턴트)가  
>       VS Code에서 즉시 개발을 시작할 수 있도록 전체 구현 요청을 정리  

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 오늘의 주사위 |
| 플랫폼 | Toss in App WebView 미니앱 |
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 데이터베이스 | Supabase (PostgreSQL) |
| 스타일링 | Tailwind CSS |
| 배포 | Vercel |

---

## Supabase 연결 정보

```env
NEXT_PUBLIC_SUPABASE_URL=https://dxuvdvvdpcbkilesovoc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dXZkdnZkcGNia2lsZXNvdm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTI1MTksImV4cCI6MjA4Nzk4ODUxOX0.506s1P5Tfyj29pfgoJ15pWeDiKcQFUjVXYwqxOKRUAU
```

> `SUPABASE_SERVICE_ROLE_KEY`는 Supabase 대시보드에서 직접 확인 후 `.env.local`에 추가

---

## 구현 요청 체크리스트

아래 순서대로 구현해주세요.  
각 단계는 독립적으로 완료 가능합니다.

---

### Step 1. 프로젝트 초기화

- [ ] `npx create-next-app@latest today-dice --typescript --tailwind --app` 으로 Next.js 프로젝트 생성
- [ ] `@supabase/supabase-js` 설치
- [ ] `.env.local` 파일 생성 및 위 환경변수 입력
- [ ] `src/lib/supabase/client.ts` : 브라우저용 Supabase 클라이언트
- [ ] `src/lib/supabase/server.ts` : 서버 컴포넌트/Route Handler용 Supabase 클라이언트

---

### Step 2. Supabase 데이터베이스 설정

아래 SQL을 Supabase SQL Editor 또는 migration 파일로 실행해주세요.

#### 테이블 생성

```sql
-- 1. dice_users
CREATE TABLE dice_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toss_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '주사위 플레이어',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. dice_daily_battle
CREATE TABLE dice_daily_battle (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES dice_users(id) ON DELETE CASCADE,
  battle_date       DATE NOT NULL,
  user_roll         SMALLINT NOT NULL CHECK (user_roll BETWEEN 1 AND 6),
  ai_roll           SMALLINT NOT NULL CHECK (ai_roll BETWEEN 1 AND 6),
  result            TEXT NOT NULL CHECK (result IN ('win','lose','draw')),
  has_rematch       BOOLEAN NOT NULL DEFAULT FALSE,
  rematch_user_roll SMALLINT CHECK (rematch_user_roll BETWEEN 1 AND 6),
  rematch_ai_roll   SMALLINT CHECK (rematch_ai_roll BETWEEN 1 AND 6),
  rematch_result    TEXT CHECK (rematch_result IN ('win','lose','draw')),
  final_result      TEXT NOT NULL CHECK (final_result IN ('win','lose','draw')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rematched_at      TIMESTAMPTZ,
  UNIQUE (user_id, battle_date)
);

-- 3. dice_streak_state
CREATE TABLE dice_streak_state (
  user_id                 UUID PRIMARY KEY REFERENCES dice_users(id) ON DELETE CASCADE,
  current_win_streak      SMALLINT NOT NULL DEFAULT 0,
  current_lose_streak     SMALLINT NOT NULL DEFAULT 0,
  current_draw_streak     SMALLINT NOT NULL DEFAULT 0,
  max_win_streak          SMALLINT NOT NULL DEFAULT 0,
  max_lose_streak         SMALLINT NOT NULL DEFAULT 0,
  max_draw_streak         SMALLINT NOT NULL DEFAULT 0,
  total_wins              INTEGER NOT NULL DEFAULT 0,
  total_losses            INTEGER NOT NULL DEFAULT 0,
  total_draws             INTEGER NOT NULL DEFAULT 0,
  total_plays             INTEGER NOT NULL DEFAULT 0,
  last_streak_achieved_at TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. dice_leaderboard_cache
CREATE TABLE dice_leaderboard_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL,
  rank         SMALLINT NOT NULL,
  user_id      UUID NOT NULL REFERENCES dice_users(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  achieved_at  TIMESTAMPTZ NOT NULL,
  display_name TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, rank)
);

-- 인덱스
CREATE INDEX ON dice_daily_battle(user_id, battle_date);
CREATE INDEX ON dice_leaderboard_cache(category, rank);
```

#### RLS 정책

```sql
-- RLS 활성화
ALTER TABLE dice_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_daily_battle ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_streak_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- dice_users: 본인만 읽기/쓰기
CREATE POLICY "dice_users_select_own" ON dice_users
  FOR SELECT USING (auth.uid()::text = toss_user_id);

-- dice_daily_battle: 본인만 읽기 (쓰기는 Service Role만)
CREATE POLICY "dice_daily_battle_select_own" ON dice_daily_battle
  FOR SELECT USING (
    user_id IN (SELECT id FROM dice_users WHERE toss_user_id = auth.uid()::text)
  );

-- dice_streak_state: 본인만 읽기
CREATE POLICY "dice_streak_state_select_own" ON dice_streak_state
  FOR SELECT USING (
    user_id IN (SELECT id FROM dice_users WHERE toss_user_id = auth.uid()::text)
  );

-- dice_leaderboard_cache: 모두 읽기 가능
CREATE POLICY "dice_leaderboard_cache_select_all" ON dice_leaderboard_cache
  FOR SELECT USING (true);
```

---

### Step 3. 핵심 유틸리티 구현

#### `src/lib/game-logic.ts`
```
역할: AI 주사위 생성 + 승패 판정
함수:
- rollDice(): number — 1~6 랜덤 정수 반환
- judgeResult(userRoll: number, aiRoll: number): 'win' | 'lose' | 'draw'
- updateStreakState(current: StreakState, result: 'win'|'lose'|'draw'): StreakState
```

#### `src/lib/date-utils.ts`
```
역할: KST 기준 오늘 날짜 계산
함수:
- getTodayKST(): string — 'YYYY-MM-DD' 형식 KST 날짜 반환
```

#### `src/types/index.ts`
```
정의할 타입:
- TodayBattle: 오늘 플레이 기록
- StreakState: 스트릭 상태
- TodayStatusResponse: GET /api/today-status 응답
- PlayResponse: POST /api/play 응답
- RematchResponse: POST /api/rematch 응답
- RankingEntry: 랭킹 항목
- RankingResponse: GET /api/ranking 응답
- MyRecordsResponse: GET /api/my-records 응답
```

---

### Step 4. API Route 구현

#### `src/app/api/today-status/route.ts`
```
GET /api/today-status
- Supabase에서 오늘(KST) dice_daily_battle 조회
- dice_streak_state 조회
- 함께 반환 (왕복 최소화)
- 인증: 요청 헤더의 Authorization 토큰으로 user_id 확인
```

#### `src/app/api/play/route.ts`
```
POST /api/play
- 하루 1회 중복 체크 (DB UNIQUE + 사전 조회)
- AI 주사위 서버에서 생성 (game-logic.ts 사용)
- 결과 판정
- dice_daily_battle INSERT
- dice_streak_state UPSERT
- 결과 반환
- 오류: 409 (이미 플레이), 401 (인증 실패)
```

#### `src/app/api/rematch/route.ts`
```
POST /api/rematch
요청 body: { ad_token: string }
- 오늘 플레이 기록 확인 (없으면 400)
- has_rematch 확인 (이미 true면 409)
- ad_token 검증 (MVP: 기본 검증만, 추후 강화)
- 새 AI 주사위 서버에서 생성
- 결과 판정
- dice_daily_battle UPDATE (rematch 컬럼, final_result, has_rematch=true)
- dice_streak_state UPSERT (재대결 결과 기준 업데이트)
- 최종 결과 반환
```

#### `src/app/api/ranking/route.ts`
```
GET /api/ranking?category=win_streak
- dice_leaderboard_cache에서 해당 category TOP5 조회
- 내 순위도 함께 반환 (dice_streak_state에서 조회)
```

#### `src/app/api/my-records/route.ts`
```
GET /api/my-records
- 최근 7일 dice_daily_battle 조회
- dice_streak_state 조회
- 함께 반환
```

---

### Step 5. 화면 구현

#### 홈 화면 (`src/app/page.tsx`)
```
- 마운트 시 GET /api/today-status 호출
- 미플레이: "오늘의 주사위, 아직 안 굴렸어요" + [굴리기] 버튼
- 플레이 완료 (재대결 없음): 오늘 결과 표시 + [한 번 더] 버튼
- 플레이 완료 (재대결 있음): 오늘 최종 결과만 표시
- 하단: [랭킹] [내 기록] 이동 링크
```

#### 플레이 화면 (`src/app/play/page.tsx`)
```
- 주사위 굴리기 버튼
- 탭 → POST /api/play → 로딩 0.5~1초 애니메이션 → 결과 화면 이동
- 결과는 URL 파라미터 또는 상태로 전달
```

#### 결과 화면 (`src/app/result/page.tsx`)
```
- 내 주사위 숫자, AI 주사위 숫자, 결과(승/패/무) 표시
- 연승 현황 한 줄 표시
- 재대결 버튼 (has_rematch가 false일 때만 노출)
  버튼 문구: "오늘 한 번 더 굴려볼게요"
  하단 안내: "짧은 동영상 시청 후 오늘 마지막으로 한 번 더 굴릴 수 있어요. 단, 이 결과가 오늘의 최종 기록이 됩니다."
- [홈으로] 버튼
```

#### 최종 결과 화면 (`src/app/result/final/page.tsx`)
```
- 재대결 주사위 숫자 (내/AI), 최종 결과 표시
- "오늘의 기록이 확정됐어요" 메시지
- "내일 다시 만나요" 안내
- [홈으로] 버튼 (재시도 버튼 없음)
```

#### 랭킹 화면 (`src/app/ranking/page.tsx`)
```
- GET /api/ranking?category=win_streak 호출
- 연승 TOP5 리스트 (닉네임, 연승 수)
- 내 현재 순위 표시 (있으면)
- 마지막 갱신 시각 표시
```

#### 내 기록 화면 (`src/app/my-records/page.tsx`)
```
- GET /api/my-records 호출
- 최근 7일 날짜별 결과 (승/패/무, 주사위 숫자, 재대결 여부)
- 현재 연승/연패 수, 역대 최고 연승 수 표시
```

---

### Step 6. 컴포넌트 구현

#### `src/components/dice/DiceFace.tsx`
```
Props: value (1~6) | 'unknown'
주사위 면을 SVG 또는 CSS dots로 표시
```

#### `src/components/dice/DiceRollAnimation.tsx`
```
Props: onComplete: () => void
굴리는 애니메이션 (0.5~1초)
완료 후 onComplete 콜백 호출
```

#### `src/features/dice/components/RematchButton.tsx`
```
Props: hasRematch: boolean, onAdComplete: (adToken: string) => void
hasRematch가 true면 렌더링 안 함
광고 시청 플로우 트리거
MVP: 광고 SDK 연동 전까지 임시 버튼으로 처리 가능
```

---

### Step 7. Supabase Edge Function (랭킹 갱신)

#### `supabase/functions/update-leaderboard/index.ts`
```
역할: dice_streak_state를 집계하여 dice_leaderboard_cache 갱신
로직:
1. dice_streak_state에서 max_win_streak DESC, last_streak_achieved_at DESC 정렬
2. TOP5 추출
3. dice_leaderboard_cache UPSERT (category='win_streak', rank 1~5)
4. updated_at 갱신
실행 주기: 1시간마다 (Supabase cron)
```

---

### Step 8. 인증 처리 (검토 필요)

> Toss in App SDK 방식에 따라 구현 달라질 수 있음

**현재 가정:**
- Toss WebView에서 앱 진입 시 URL 파라미터 또는 JS Bridge로 사용자 토큰 전달
- 해당 토큰으로 Supabase `dice_users` UPSERT (신규면 생성, 기존이면 확인)
- 이후 API 요청 시 Authorization 헤더에 토큰 포함

**MVP 임시 구현:**
- Toss SDK 연동 전까지 `localStorage` 기반 임시 UUID로 개발 진행 가능
- 실제 배포 전 대체 필수

---

## 기술 스택 요약

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | Toss in App SDK (MVP: 임시 UUID) |
| 배포 | Vercel |
| 광고 | 검토 필요 (MVP: 임시 처리) |
| 애니메이션 | CSS Transitions / Framer Motion (경량) |

---

## 참고 문서

| 문서 | 내용 |
|------|------|
| [01_prd.md](./01_prd.md) | 서비스 정의, 적합성 분석, MVP 범위, 게임 규칙, 화면 IA, 랭킹, 광고 UX |
| [02_technical-design.md](./02_technical-design.md) | Supabase 테이블 설계, 서버 판정, API 흐름 |
| [03_project-plan.md](./03_project-plan.md) | 폴더 구조, 개발 순서, 최종 추천안 |
| [04_improvement-ideas.md](./04_improvement-ideas.md) | 흥미·리텐션 아이디어와 **v1.6에서 실제로 넣은 것** |

---

## 주의 사항

1. **경품/포인트/현금 보상 없음** — 서비스 전 구간에서 재산적 이익 암시 표현 금지
2. **광고 재대결 표현** — "한 번 더 기회를 산다" 뉘앙스 반드시 피할 것
3. **AI 주사위는 반드시 서버에서만 생성** — 클라이언트 요청값 신뢰 금지
4. **날짜 처리는 KST 기준** — 서버에서 `Asia/Seoul` 타임존으로 계산
5. **SUPABASE_SERVICE_ROLE_KEY는 서버에서만** — 클라이언트(`NEXT_PUBLIC_`)에 절대 노출 금지
6. **RLS 정책 반드시 적용** — dice_daily_battle과 dice_streak_state는 서버만 쓰기
