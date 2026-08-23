# 오늘의 주사위 — 기술 설계서

> 작성일: 2026-04-03  
> 최종 수정: 2026-08-23 (v2.4 — 앱인토스 플로팅 탭바 반영)  
> 버전: v2.3  
> 데이터베이스: Supabase  
> 테이블 명명 규칙: 반드시 `dice_` 접두사 사용  

---

## 0. 마이그레이션 적용 가이드

### 현재 적용 상태

| 파일 | 상태 |
|------|------|
| `001_create_dice_users.sql` | ✅ 적용 완료 |
| `002_create_dice_daily_battle.sql` | ✅ 적용 완료 |
| `003_create_dice_streak_state.sql` | ✅ 적용 완료 |
| `004_create_dice_leaderboard_cache.sql` | ✅ 적용 완료 |
| `005_create_rls_policies.sql` | ✅ 적용 완료 |
| `006_add_streak_extra_columns.sql` | ✅ 적용 완료 |
| `007_add_stats_columns.sql` | ✅ 적용 완료 |
| `008_allow_anon_access.sql` | ✅ 적용 완료 |

### migration 006 적용 방법 (Supabase Dashboard)

1. [app.supabase.com](https://app.supabase.com) 접속 → 프로젝트 `dxuvdvvdpcbkilesovoc` 선택
2. 왼쪽 메뉴 **SQL Editor** 클릭
3. 아래 SQL 붙여넣기 후 실행 (Run)

```sql
ALTER TABLE dice_streak_state
  ADD COLUMN IF NOT EXISTS current_same_num_streak SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_same_num_streak     SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_user_roll          SMALLINT,
  ADD COLUMN IF NOT EXISTS total_rematch_wins      INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rematch_losses    INTEGER  NOT NULL DEFAULT 0;
```

### migration 007 적용 방법 (Supabase Dashboard)

006 적용 후 이어서 SQL Editor에서 실행:

```sql
ALTER TABLE dice_streak_state
  ADD COLUMN IF NOT EXISTS roll_count_1              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roll_count_2              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roll_count_3              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roll_count_4              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roll_count_5              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roll_count_6              INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rematch_draws       INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_attendance_streak SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attendance_streak     SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_play_date            DATE;
```

> **적용 전 동작:** 주사위 숫자별 횟수, 광고 무승부, 연속 출석은 모두 0으로 표시됩니다.  
> **적용 후 동작:** 다음 플레이부터 해당 통계가 정상 집계됩니다.

> **코드 호환성:** API 코드는 migration 006/007 적용 여부와 무관하게 정상 동작하도록  
> base 컬럼 UPSERT와 extended 컬럼 업데이트를 분리 처리합니다 (에러 무시).

---

## 8. Supabase 테이블 설계

### 8-0. 설계 원칙

1. 모든 테이블명은 `dice_` 접두사 사용
2. 최소 테이블 수로 MVP 기능 전부 커버
3. 실시간 집계 연산은 캐시 테이블로 분리
4. 하루 1회 / 광고 재대결 1회 제한을 서버에서 강제 검증 가능한 구조

### 8-1. Supabase 연결 정보

```env
NEXT_PUBLIC_SUPABASE_URL=https://dxuvdvvdpcbkilesovoc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dXZkdnZkcGNia2lsZXNvdm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTI1MTksImV4cCI6MjA4Nzk4ODUxOX0.506s1P5Tfyj29pfgoJ15pWeDiKcQFUjVXYwqxOKRUAU
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
```

> ⚠️ ANON_KEY는 Row Level Security(RLS) 정책과 함께 사용해야 안전합니다.  
> `.env.local`에 저장하고 절대 커밋하지 않습니다.  
> `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 번들에 포함되는 공개 키입니다.  
> Supabase Anon Key 자체는 공개되어도 괜찮으나, RLS 정책으로 접근 범위를 제한합니다.

---

### 8-2. 테이블 목록 (MVP 기준 4개)

```
dice_users              사용자 기본 정보
dice_daily_battle       일별 플레이 기록 + 재대결 포함
dice_streak_state       연승/연패/무승부 스트릭 현황
dice_leaderboard_cache  랭킹 집계 캐시
```

---

### 8-3. `dice_users`

#### 역할
Toss 사용자를 미니앱 내부에서 식별하기 위한 최소 정보 저장.  
Toss in App은 WebView 내부에서 사용자 식별자를 주입해줌 (검토 필요: Toss SDK 방식 확인).

#### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID (PK) | 내부 식별자 |
| `toss_user_id` | TEXT (UNIQUE) | Toss에서 넘어온 사용자 식별자 |
| `display_name` | TEXT | 표시 닉네임 (익명 처리 가능) |
| `created_at` | TIMESTAMPTZ | 최초 가입일 |
| `updated_at` | TIMESTAMPTZ | 마지막 업데이트 |

#### MVP에서 생략 가능한 컬럼
- `avatar_url` (프로필 이미지, V2)
- `timezone` (글로벌 확장 시 필요, MVP 불필요)
- `notification_token` (푸시 알림, V2)

#### 인덱스
```sql
CREATE UNIQUE INDEX ON dice_users(toss_user_id);
```

---

### 8-4. `dice_daily_battle`

#### 역할
하루 1회 플레이 기록 저장.  
1차 결과와 광고 후 재대결 결과를 한 행에 모두 담아 "오늘 최종 결과"를 단일 행으로 관리.

#### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID (PK) | 행 식별자 |
| `user_id` | UUID (FK → dice_users.id) | 사용자 |
| `battle_date` | DATE | 플레이 날짜 (한국 기준 KST) |
| `user_roll` | SMALLINT | 1차 사용자 주사위 결과 (1~6) |
| `ai_roll` | SMALLINT | 1차 AI 주사위 결과 (1~6) |
| `result` | TEXT | 1차 결과: 'win' / 'lose' / 'draw' |
| `has_rematch` | BOOLEAN | 광고 후 재대결 진행 여부 |
| `rematch_user_roll` | SMALLINT | 재대결 사용자 주사위 (NULL 가능) |
| `rematch_ai_roll` | SMALLINT | 재대결 AI 주사위 (NULL 가능) |
| `rematch_result` | TEXT | 재대결 결과: 'win'/'lose'/'draw' (NULL 가능) |
| `final_result` | TEXT | **최종 결과** (재대결 시 rematch_result, 아니면 result) |
| `created_at` | TIMESTAMPTZ | 최초 플레이 시각 |
| `rematched_at` | TIMESTAMPTZ | 재대결 시각 (NULL 가능) |

#### 유니크 제약
```sql
CREATE UNIQUE INDEX ON dice_daily_battle(user_id, battle_date);
```
→ 하루에 한 행만 존재 보장 (DB 레벨 강제).

#### MVP에서 생략 가능한 컬럼
- `session_id` (디버깅/분석용, V2)
- `ad_provider` (광고 제공사 기록, V2)

---

### 8-5. `dice_streak_state`

#### 역할
연승/연패/무승부 스트릭을 매번 전체 기록을 집계하지 않고  
최신 상태를 저장해두는 "상태 테이블".  
플레이마다 업데이트되며 랭킹 계산의 기반이 됨.

#### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `user_id` | UUID (PK, FK → dice_users.id) | 사용자 (1:1 관계) |
| `current_win_streak` | SMALLINT | 현재 연승 수 |
| `current_lose_streak` | SMALLINT | 현재 연패 수 |
| `current_draw_streak` | SMALLINT | 현재 연속 무승부 수 |
| `max_win_streak` | SMALLINT | 역대 최고 연승 수 |
| `max_lose_streak` | SMALLINT | 역대 최고 연패 수 |
| `max_draw_streak` | SMALLINT | 역대 최고 무승부 연속 수 |
| `current_same_num_streak` | SMALLINT | 현재 연속 같은 번호 수 *(migration 006)* |
| `max_same_num_streak` | SMALLINT | 역대 최고 연속 같은 번호 수 *(migration 006)* |
| `last_user_roll` | SMALLINT | 직전 날 사용자 굴림 번호 *(migration 006)* |
| `total_wins` | INTEGER | 누적 승리 수 |
| `total_losses` | INTEGER | 누적 패배 수 |
| `total_draws` | INTEGER | 누적 무승부 수 |
| `total_plays` | INTEGER | 누적 플레이 수 |
| `total_rematch_wins` | INTEGER | 광고 역전승 누적 수 *(migration 006)* |
| `total_rematch_losses` | INTEGER | 광고 역전패 누적 수 *(migration 006)* |
| `total_rematch_draws` | INTEGER | 광고 무승부 누적 수 *(migration 007)* |
| `roll_count_1` ~ `roll_count_6` | INTEGER | 주사위 숫자별 나온 횟수 (초기 플레이 기준) *(migration 007)* |
| `current_attendance_streak` | SMALLINT | 현재 연속 출석 일수 *(migration 007)* |
| `max_attendance_streak` | SMALLINT | 역대 최고 연속 출석 일수 *(migration 007)* |
| `last_play_date` | DATE | 마지막 플레이 날짜 (출석 추적용) *(migration 007)* |
| `last_streak_achieved_at` | TIMESTAMPTZ | 현재 연승 마지막 갱신 시각 (동률 처리용) |
| `updated_at` | TIMESTAMPTZ | 마지막 업데이트 |

#### 업데이트 시점
- `dice_daily_battle` INSERT 또는 재대결 UPDATE 완료 후 즉시 갱신
- Supabase 트리거 또는 Edge Function에서 처리

#### MVP에서 생략 가능한 컬럼
- (v1.1 기준 모두 구현됨)

---

### 8-6. `dice_leaderboard_cache`

#### 역할
랭킹 화면에서 매번 실시간 집계 쿼리를 날리지 않도록 미리 계산된 TOP5 결과를 저장하는 캐시 테이블.  
1시간마다 갱신 (Supabase cron 또는 Edge Function).

> ⚠️ **v1.1 현쟬는 미사용.** 랭킹 API가 `dice_streak_state` 직접 조회로 동작하며,  
> 플레이어 수가 많아지면 캐시 재적용 예정.

#### 주요 컬럼

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID (PK) | 행 식별자 |
| `category` | TEXT | 랭킹 종류: 'win_streak' (MVP에서 이것만) |
| `rank` | SMALLINT | 순위 (1~5) |
| `user_id` | UUID (FK → dice_users.id) | 해당 순위 사용자 |
| `score` | INTEGER | 해당 카테고리 점수 (연승 수) |
| `achieved_at` | TIMESTAMPTZ | 해당 점수 달성 시각 (동률 처리) |
| `display_name` | TEXT | 스냅샷된 닉네임 (JOIN 최소화) |
| `updated_at` | TIMESTAMPTZ | 캐시 마지막 갱신 시각 |

#### 인덱스
```sql
CREATE INDEX ON dice_leaderboard_cache(category, rank);
```

#### MVP에서 생략 가능한 컬럼
- `extra_data` (JSONB, 부가 정보 저장용, V2)

---

### 8-7. Row Level Security (RLS) 기본 방향

> **v1.5 변경:** 클라이언트가 Supabase에 직접 접근하는 구조로 전환됨.  
> `008_allow_anon_access.sql` 마이그레이션 적용 필요.

| 테이블 | 읽기 | 쓰기 |
|--------|------|------|
| `dice_users` | anon 자유접근 | anon 자유접근 |
| `dice_daily_battle` | anon 자유접근 | anon 자유접근 |
| `dice_streak_state` | anon 자유접근 | anon 자유접근 |
| `dice_leaderboard_cache` | 모두 읽기 가능 | — |

> 앱은 Supabase Auth 없이 localStorage UUID를 사용자 식별자로 사용합니다.  
> Toss JWT 연동 후에는 user_id 기반 RLS 정책으로 교체 예정.

---

### 8-8. 테이블 생성 SQL 스켈레톤 (참고용)

```sql
-- dice_users
CREATE TABLE dice_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toss_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '주사위 플레이어',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dice_daily_battle
CREATE TABLE dice_daily_battle (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES dice_users(id),
  battle_date      DATE NOT NULL,
  user_roll        SMALLINT NOT NULL CHECK (user_roll BETWEEN 1 AND 6),
  ai_roll          SMALLINT NOT NULL CHECK (ai_roll BETWEEN 1 AND 6),
  result           TEXT NOT NULL CHECK (result IN ('win','lose','draw')),
  has_rematch      BOOLEAN NOT NULL DEFAULT FALSE,
  rematch_user_roll SMALLINT CHECK (rematch_user_roll BETWEEN 1 AND 6),
  rematch_ai_roll  SMALLINT CHECK (rematch_ai_roll BETWEEN 1 AND 6),
  rematch_result   TEXT CHECK (rematch_result IN ('win','lose','draw')),
  final_result     TEXT NOT NULL CHECK (final_result IN ('win','lose','draw')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rematched_at     TIMESTAMPTZ,
  UNIQUE (user_id, battle_date)
);

-- dice_streak_state
CREATE TABLE dice_streak_state (
  user_id                  UUID PRIMARY KEY REFERENCES dice_users(id),
  current_win_streak       SMALLINT NOT NULL DEFAULT 0,
  current_lose_streak      SMALLINT NOT NULL DEFAULT 0,
  current_draw_streak      SMALLINT NOT NULL DEFAULT 0,
  max_win_streak           SMALLINT NOT NULL DEFAULT 0,
  max_lose_streak          SMALLINT NOT NULL DEFAULT 0,
  max_draw_streak          SMALLINT NOT NULL DEFAULT 0,
  total_wins               INTEGER NOT NULL DEFAULT 0,
  total_losses             INTEGER NOT NULL DEFAULT 0,
  total_draws              INTEGER NOT NULL DEFAULT 0,
  total_plays              INTEGER NOT NULL DEFAULT 0,
  last_streak_achieved_at  TIMESTAMPTZ,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- dice_leaderboard_cache
CREATE TABLE dice_leaderboard_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  rank          SMALLINT NOT NULL,
  user_id       UUID NOT NULL REFERENCES dice_users(id),
  score         INTEGER NOT NULL,
  achieved_at   TIMESTAMPTZ NOT NULL,
  display_name  TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, rank)
);
```

---

## 9. 데이터 접근 구조 (v1.5)

### 9-1. 클라이언트 직접 접근 방식

> **v1.5 변경:** Next.js API Route Handler와 Supabase Edge Function 프록시를 제거하고,  
> 클라이언트(브라우저)에서 Supabase JS 클라이언트를 통해 직접 접근합니다.  
> Today-RPS 프로젝트와 동일한 구조입니다.

```
[클라이언트 Web/WebView]
    │
    ├─ lib/supabase.ts  (데이터 접근 레이어)
    │      ├─ getTodayStatus(userId)
    │      ├─ savePlay(userId)
    │      ├─ saveRematch(userId)
    │      ├─ getRanking(category, userId)
    │      └─ getMyRecords(userId)
    │
    └─ Supabase (anon key + RLS)
           ├─ dice_users
           ├─ dice_daily_battle
           ├─ dice_streak_state
           └─ dice_leaderboard_cache
```

**제거된 레이어:**
- `app/api/*` Next.js Route Handlers
- `supabase/functions/*` Supabase Edge Functions
- `lib/api.ts` (API_BASE URL 헬퍼)
- `lib/supabase/server.ts` (Service Role 클라이언트)
- `@supabase/ssr` 패키지

**이유:** AIT WebView에서 상대 경로(`/api/...`)가 `intoss-private://today-dice/api/...`로  
해석되어 HTML을 반환하는 문제 해결. 절대 URL인 Supabase에 직접 접속합니다.

### 9-2. 하루 1회 / 재대결 1회 제한 처리 (클라이언트)

서버 프록시가 없으므로 중복 체크를 Supabase 쿼리로 직접 수행합니다.

```
[1차 플레이 - savePlay]
1. dice_users에서 toss_user_id로 사용자 조회 (없으면 자동 생성)
2. dice_daily_battle에서 오늘 날짜 기록 조회
3. 이미 존재하면 → 에러: "오늘은 이미 플레이했어요"
4. 클라이언트에서 주사위 생성 (Math.random 기반)
5. dice_daily_battle INSERT
6. dice_streak_state UPSERT

[재대결 - saveRematch]
1. 사용자 조회
2. 오늘 battle 기록 조회
3. has_rematch = true 면 → 에러: "오늘 재대결은 이미 완료했습니다"
4. 주사위 생성 → battle UPDATE → streak UPSERT
```

> **날짜 기준:** KST (UTC+9) 기준 `getTodayKST()` 함수 사용 (클라이언트 로컬 시간 기반).

### 9-3. 최소 검증 체크리스트

- [x] 날짜는 KST 기준 계산
- [x] 하루 1회 제한: Supabase 조회로 중복 확인
- [x] 재대결 1회 제한: has_rematch 컬럼 확인
- [x] 광고 시청 완료 확인: `watchAd()` 내 2단계 load→show 처리 — `dismissed` 이벤트 수신 시 `userEarnedReward` 여부로 최종 판별
- [ ] 광고 토큰 서버 검증 (MVP에서는 클라이언트 `userEarnedReward` 이벤트로 대체, 추후 필요)

---

## 10. 데이터 흐름 (v1.5)

### 10-1. lib/supabase.ts 함수 목록

| 함수 | 설명 |
|------|------|
| `getTodayStatus(tossUserId)` | 오늘 배틀 + 스트릭 + **이번 주 기록** 조회 |
| `savePlay(tossUserId)` | 1차 플레이 저장 |
| `saveRematch(tossUserId)` | 재대결 저장 |
| `getRanking(category, tossUserId)` | 랭킹 TOP10 조회 |
| `getMyRecords(tossUserId)` | 최근 **30일** 기록 + 스트릭 조회 (화면에서는 7일 목록 + 30일 달력) |

### 10-2. 화면만 두껍게 하는 도구 (표는 안 바꿈)

초보자를 위한 설명: **표(데이터베이스)는 그대로** 두고, 이미 있는 숫자를 더 재미있게 보여 준다.

| 파일 | 하는 일 | 쉬운 비유 |
|------|---------|-----------|
| `lib/date-utils.ts` | 한국 시간 날짜, 자정까지 남은 시간, 일주일 날짜 | 달력 계산기 |
| `lib/fortune.ts` | 눈 × 요일 × 승패로 오늘의 문장 | 운세 문장 상자 |
| `lib/milestones.ts` | 출석 이정표, 희귀 사건, 내일 예고 | 칭호·스티커 규칙 |
| `features/dice/components/AttendanceBar.tsx` | 홈 위쪽 연속 출석 막대 | “며칠째 왔는지” |
| `features/dice/components/MidnightCountdown.tsx` | 내일 0시까지 시계 | 다음 주사위 대기 |
| `features/dice/components/WeekBoard.tsx` | 일~토 7칸 | 이번 주 도장판 |
| `features/dice/components/LuckCalendar.tsx` | 최근 30칸 | 작은 달력 |
| `features/dice/components/BadgeShelf.tsx` | 1·3·7·14·30·100일 스티커 | 수집함 |
| `features/dice/components/DiceDex.tsx` | 1~6을 한 번이라도 봤는지 | 눈 도감 |
| `components/ui/FloatingTabBar.tsx` | 홈·랭킹·내 정보 사이 이동 | 화면 아래에 **떠 있는** 둥근 탭바 |

앱인토스 규칙: 탭바를 쓰면 **토스 메인처럼 바닥에 붙인 막대**가 아니라, 아래쪽에 **떠 있는(플로팅)** 모양이어야 한다.  
탭은 3개(홈 / 랭킹 / 내 정보). 주사위 굴리기·결과 화면에서는 가린다.

검사 명령: `npm run test:retention`

---

```
supabase/functions/
└── update-leaderboard/
    └── index.ts   ← 1시간마다 실행되는 cron
                      dice_streak_state를 집계해서
                      dice_leaderboard_cache를 갱신
```

**cron 설정 (Supabase Dashboard):**
```
0 * * * *   → 매 정각마다 갱신
```

---

## 11. Toss In-App 배포 구성

> 최종 수정: 2026-08-23 (v2.3 — 출석·운세 화면 + AIT 산출물 갱신)

### 11-0. AIT WebView API URL 동작 원리

AIT 번들의 WebView URL은 `granite.config.ts`의 `host/port` 와 **무관**합니다.  
프로덕션(Toss 앱 내)에서 WebView의 base URL은 Toss 네이티브가 `getWebBundleURL`로 결정합니다.  
번들의 JS가 `/api/*` 등 상대 경로로 fetch하면 **Toss 인프라 URL로 요청** → HTML 반환 → JSON parse 오류.

**해결 (v1.5):**
- Next.js API Route 및 Edge Function 프록시를 완전히 제거.
- 클라이언트에서 Supabase URL(`NEXT_PUBLIC_SUPABASE_URL`)로 직접 fetch.  
- Supabase URL은 절대 경로이므로 AIT WebView에서도 정상 동작.

### 11-1. 파일 구성

| 파일 | 역할 |
|------|------|
| `public/app.json` | **Granite 스키마 (schemaVersion 1)** — `ait build` 후 `scripts/post-ait-build.mjs`가 deploymentId를 자동 갱신 |
| `app.json` (루트) | 레거시 AIT v2 스키마 호환용 — `ait.adUnitId`, `ait.deploymentId` 포함 |
| `granite.config.ts` | `@apps-in-toss/web-framework` 설정 — `appName`, 브랜드 정보, `outdir: 'out'` |
| `next.config.ts` | AIT 빌드 시에만 `output: 'export'` (`AIT_DEPLOYMENT_ID` 또는 `NEXT_BUILD_FOR_AIT` 존재 시) |
| `lib/supabase.ts` | Supabase 직접 접근 데이터 레이어 — 모든 DB 조작 함수 포함 |
| `lib/ads.ts` | GoogleAdMob 리워드 광고 유틸리티 — 2단계 load→show 처리, `dismissed` 이벤트로 최종 결과 확정 |
| `lib/dice-reactions.ts` | 주사위 숫자(1~6)별 반응 문구 데이터 60개 + `getDiceReaction(roll)` 유틸 함수 |
| `features/dice/components/RematchButton.tsx` | 재도전 버튼 — 광고 시청 후 `/play/rematch`로 라우팅 |
| `app/play/rematch/page.tsx` | 재도전 플레이 화면 — 주사위 애니메이션 + `saveRematch()` 호출 후 `/result/final`로 이동 |
| `scripts/post-ait-build.mjs` | `ait build` 완료 후 AIT 바이너리에서 deploymentId를 읽어 `public/app.json` + `app.json` 자동 갱신 |

### 11-2. deploymentId 생성 방식

- **생성:** `ait build` 실행 때마다 Granite CLI가 새 UUIDv7을 **자동 생성**
- **동기화:** `scripts/post-ait-build.mjs`(AIT 바이너리 직접 파싱)가 빌드 후 `public/app.json` 및 `app.json`을 자동 갱신
- **등록:** 출력된 deploymentId를 Toss 파트너 포털에 등록

### 11-3. AIT 빌드 파이프라인

#### 일반 빌드

```bash
npm run build:ait   # ait build && node scripts/post-ait-build.mjs
```

#### 클린 빌드 (캐시 문제 발생 시 필수)

빌드 캐시(`.next/`)와 정적 export 결과물(`out/`)이 남아 있으면 최신 소스가 반영되지 않을 수 있습니다.  
변경사항이 `.ait`에 포함되지 않는다고 의심될 때는 반드시 클린 빌드를 실행하세요.

```bash
# 1. 캐시 제거
Remove-Item -Recurse -Force .next, out   # PowerShell (Windows)
rm -rf .next out                         # bash (macOS/Linux)

# 2. ait 파일 재빌드
npm run build:ait
```

#### 빌드 중 프롬프트 안내

`npm run build:ait` 실행 시 아래 프롬프트가 표시될 수 있습니다. `y`를 입력하면 계속 진행됩니다.

```
Need to install the following packages:
node@xx.xx.x
Ok to proceed? (y)
```

> **DEP0190 DeprecationWarning** 경고도 함께 출력될 수 있으나, `ait build` 내부의 알려진 경고이며 빌드 결과에 영향을 주지 않습니다.

#### 실행 순서
1. `ait build` CLI — RN 0.84.0 빌드 → RN 0.72.6 빌드 → `.ait` 아티팩트 패키징
2. `node scripts/post-ait-build.mjs` — AIT 바이너리에서 deploymentId 추출 → `public/app.json` + `app.json` 갱신

```
◇  [1/2] Built for RN 0.84.0
◇  [2/2] Built for RN 0.72.6
◇  Creating .ait artifact...
◆  AIT build completed (today-dice.ait)
●  deploymentId: <생성된-UUIDv7>
```

#### 현재 deploymentId

| 항목 | 값 |
|------|----|
| deploymentId (최신 빌드) | `01a02beb-0eb9-7a15-92a8-296aafc7f9cd` |
| adUnitId (고정) | `ait.v2.live.544f01132f2a43ec` |

> `deploymentId`는 `npm run build:ait` 실행마다 Granite CLI가 새 UUIDv7을 자동 생성합니다.  
> 빌드 후 Toss 파트너 포털에 출력된 최신 `deploymentId`를 등록해야 합니다.

### 11-4. 환경변수

```env
# Supabase 접속 정보 (클라이언트 공개 가능)
NEXT_PUBLIC_SUPABASE_URL=https://dxuvdvvdpcbkilesovoc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# AIT 리워드 광고 그룹 ID (Toss 파트너 포털에서 발급)
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
```

### 11-5. 리워드 광고 연동 (v1.9)

> `lib/ads.ts`에 `watchAd()` 함수로 독립 구현. Today-RPS 프로젝트와 동일한 2단계 순차 처리 방식.  
> `RematchButton.tsx`에서 import하여 사용. 광고 성공 시 `/play/rematch`로 라우팅.

**광고 흐름 (`lib/ads.ts` → `watchAd()`):**

```
[재대결 버튼 클릭] (RematchButton.tsx)
  └─ watchAd() 호출
       └─ _isAitSupported() 확인
            └─ false → 1.5초 Mock 지연 후 true 반환 (개발 환경)
            └─ true  →
                 1단계: loadAppsInTossAdMob({ adGroupId: AD_GROUP_ID })
                         → onEvent('loaded') → resolve
                         → onError() → reject
                 2단계: showAppsInTossAdMob({ adGroupId: AD_GROUP_ID })
                         → onEvent('userEarnedReward') → rewarded = true
                         → onEvent('dismissed')        → resolve(rewarded)
                         → onEvent('failedToShow')     → resolve(false)
                         → onError()                   → resolve(false)
  └─ rewarded=true  → router.push('/play/rematch')
  └─ rewarded=false → 에러 메시지 표시
```

### 11-6. 재도전 플레이 플로우 (v1.9)

> 이전(v1.8): 광고 시청 후 즉시 `saveRematch()` → `/result/final` (애니메이션 없음)  
> 현재(v1.9): 광고 시청 → 플레이 화면(`/play/rematch`) → 주사위 애니메이션 → `/result/final`

```
[/result]           [광고시청]         [/play/rematch]              [/result/final]
 재도전 버튼 ──→ watchAd() ──→ 주사위 굴리기 버튼 ──→ saveRematch() + 애니메이션 ──→ 최종 결과
                  │                                                        │
                  └─ 실패 시 에러 메시지                                    └─ sessionStorage에 저장
```

**사용 패키지:** `@apps-in-toss/web-framework` (내부적으로 `@apps-in-toss/web-bridge` re-export)

**핵심 이벤트 타입:**

| 이벤트 | 의미 |
|--------|------|
| `loaded` | 광고 프리로드 완료 — 버튼을 활성화해도 됨 |
| `userEarnedReward` | 사용자가 광고를 끝까지 시청함 — **재대결 허용** |
| `dismissed` | 사용자가 광고 창을 닫음 (시청 완료와 별개) |
| `failedToShow` | 광고 재생 실패 — 재대결 허용하지 않음 |

**광고 ID 관리 규칙 (v1.8):**

| 항목 | 값 | 비고 |
|------|-----|------|
| `NEXT_PUBLIC_AIT_AD_ID` (.env.local) | `ait.v2.live.544f01132f2a43ec` | SDK 호출 시 `adGroupId` |
| `app.json` ▸ `ait.adUnitId` | `ait.v2.live.544f01132f2a43ec` | AIT 플랫폼 메타데이터 |
| `deploymentId` | UUIDv7 (빌드마다 갱신) | `adUnitId`와 무관 |

> ⚠️ **주의**: `adUnitId`와 `adGroupId`(SDK 호출)는 반드시 동일한 값이어야 합니다.  
> Toss AIT 플랫폼은 등록된 `adUnitId`와 SDK 호출의 `adGroupId`가 일치하지 않으면 광고를 서빙하지 않습니다.  
> `post-ait-build.mjs`는 `deploymentId`만 갱신하며, `adUnitId`는 절대 건드리지 않습니다.

---

*다음 문서: [03_project-plan.md](./03_project-plan.md)*
