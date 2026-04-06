# 데일리 주사위 배틀 — 기술 설계서

> 작성일: 2026-04-03  
> 최종 수정: 2026-04-06 (v1.2 — 광고 SDK 연동, 내 정보 페이지 확장)  
> 버전: v1.2  
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
| `006_add_streak_extra_columns.sql` | ⚠️ **미적용 — 아래 방법으로 적용 필요** |
| `007_add_stats_columns.sql` | ⚠️ **미적용 — 006 적용 후 이어서 적용 필요** |

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
SUPABASE_URL=https://dxuvdvvdpcbkilesovoc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dXZkdnZkcGNia2lsZXNvdm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTI1MTksImV4cCI6MjA4Nzk4ODUxOX0.506s1P5Tfyj29pfgoJ15pWeDiKcQFUjVXYwqxOKRUAU
NEXT_PUBLIC_AIT_AD_ID=ait.v2.live.544f01132f2a43ec
```

> ⚠️ ANON_KEY는 Row Level Security(RLS) 정책과 함께 사용해야 안전합니다.  
> `.env.local`에 저장하고 절대 커밋하지 않습니다.

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

| 테이블 | 읽기 | 쓰기 |
|--------|------|------|
| `dice_users` | 본인만 읽기 | 본인만 쓰기 |
| `dice_daily_battle` | 본인만 읽기 | 서버(Service Role)만 쓰기 |
| `dice_streak_state` | 본인만 읽기 | 서버(Service Role)만 쓰기 |
| `dice_leaderboard_cache` | 모두 읽기 가능 | 서버(Service Role)만 쓰기 |

> `dice_daily_battle`, `dice_streak_state` 는 클라이언트에서 직접 INSERT/UPDATE 불가.  
> 반드시 서버(Edge Function)를 통해서만 쓰기.

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

## 9. 서버 판정 및 치트 방지 최소안

### 9-1. 왜 클라이언트만 믿으면 안 되는가

| 위협 | 설명 |
|------|------|
| 주사위 결과 조작 | 클라이언트에서 항상 6을 보낼 수 있음 |
| 하루 1회 제한 우회 | 로컬 상태 초기화 후 재요청 가능 |
| 광고 재대결 중복 요청 | has_rematch 플래그를 서버에서 체크하지 않으면 무한 재시도 가능 |
| 과거 날짜 삽입 | 클라이언트 날짜를 서버와 다르게 보낼 수 있음 |

> 경품/보상이 없는 서비스라도 랭킹이 있으면 조작 동기가 생긴다.  
> 최소한 서버에서 날짜·횟수 검증은 필수.

### 9-2. 하루 1회 제한 처리 (서버)

```
[클라이언트] → POST /api/play 요청

[서버 처리]
1. 요청에서 user_id 추출 (Toss SDK 토큰 or Supabase JWT)
2. 서버 시각 기준으로 한국 날짜(KST) 계산
   - 클라이언트 날짜 파라미터는 무시
3. dice_daily_battle 에서 WHERE user_id = ? AND battle_date = today 조회
4. 행이 이미 존재하면 → 409 Conflict + "오늘은 이미 플레이했어요" 반환
5. 행이 없으면 정상 진행
```

**핵심: `battle_date`는 반드시 서버 시각으로 계산 (KST UTC+9 기준)**

```
서버 날짜 = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
```

### 9-3. 광고 재대결 1회 제한 처리 (서버)

```
[클라이언트] → POST /api/rematch 요청
                (광고 완료 토큰 포함: ad_token)

[서버 처리]
1. user_id 인증
2. 서버 기준 오늘 날짜로 dice_daily_battle 조회
3. 행이 없으면 → 400 Bad Request (아직 플레이 안 함)
4. has_rematch = true 이면 → 409 Conflict (이미 재대결 완료)
5. ad_token 유효성 검증 (광고 제공사 콜백 or 토큰 확인, 검토 필요)
6. 새 AI 주사위 서버에서 생성 (Math.random 기반 1~6)
7. 결과 판정
8. dice_daily_battle UPDATE: rematch 컬럼들, has_rematch = true, final_result 갱신
9. dice_streak_state UPSERT: 최종 결과 기준으로 스트릭 업데이트
```

> **ad_token 검증:** 광고 제공사(예: Google AdMob, Kakao AdFit 등) 서버 사이드 콜백으로  
> 실제 광고를 봤는지 확인하는 것이 이상적. MVP에서는 간소화 가능하나 추후 필수.

### 9-4. 결과 저장 및 최종 확정 흐름

```
[1차 플레이]
  → 서버에서 AI 주사위 생성
  → dice_daily_battle INSERT (final_result = result)
  → dice_streak_state UPSERT (1차 결과 기준)
  → 클라이언트에 결과 반환

[광고 후 재대결]
  → 서버에서 새 AI 주사위 생성
  → dice_daily_battle UPDATE (rematch 컬럼 + final_result = rematch_result)
  → dice_streak_state UPSERT (재대결 결과로 덮어씀)
  → 클라이언트에 최종 결과 반환
```

**중요: 스트릭 업데이트는 final_result 기준으로 단 한 번만 확정**  
1차 결과로 업데이트 후, 재대결 시 재대결 결과로 재업데이트 (덮어쓰기 방식).

### 9-5. 최소 서버 검증 체크리스트

- [x] 사용자 인증 (Supabase JWT 또는 Toss 토큰)
- [x] 날짜는 서버 KST 기준 계산
- [x] 하루 1회 제한: DB UNIQUE 제약 + 사전 조회
- [x] 재대결 1회 제한: has_rematch 컬럼 DB 확인
- [x] AI 주사위: 서버에서만 생성, 클라이언트 요청값 사용 안 함
- [x] 모든 결과 저장: 서버에서만 INSERT/UPDATE

---

## 10. 최소 API 흐름 설계

### 10-1. 설계 원칙

- API 개수 최소화 (5개 이내)
- 프론트 ↔ 서버 불필요한 왕복 제거
- 최초 진입 시 오늘 상태를 한 번에 반환 (홈 화면 즉시 렌더링)

### 10-2. API 목록

| # | 엔드포인트 | 메서드 | 설명 |
|---|-----------|--------|------|
| 1 | `/api/today-status` | GET | 오늘 플레이 상태 + 내 스트릭 |
| 2 | `/api/play` | POST | 1차 주사위 굴리기 |
| 3 | `/api/rematch` | POST | 광고 후 재대결 |
| 4 | `/api/ranking` | GET | 랭킹 TOP5 조회 |
| 5 | `/api/my-records` | GET | 내 최근 7일 기록 |

---

### 10-3. API 상세

#### GET `/api/today-status`

**호출 시점:** 앱 최초 진입 시 (홈 화면 마운트)

**응답 (예시):**
```json
{
  "today": {
    "played": true,
    "result": "lose",
    "user_roll": 3,
    "ai_roll": 5,
    "has_rematch": false,
    "final_result": "lose"
  },
  "streak": {
    "current_win_streak": 0,
    "current_lose_streak": 1,
    "max_win_streak": 5
  }
}
```

**미플레이 시 응답:**
```json
{
  "today": null,
  "streak": {
    "current_win_streak": 3,
    "current_lose_streak": 0,
    "max_win_streak": 5
  }
}
```

---

#### POST `/api/play`

**호출 시점:** 플레이 화면에서 "굴리기" 버튼 탭 시

**요청 Body:**
```json
{}
```
(사용자 식별은 JWT 헤더에서 추출, 날짜는 서버에서 결정)

**응답:**
```json
{
  "user_roll": 4,
  "ai_roll": 2,
  "result": "win",
  "current_win_streak": 4
}
```

**오류:**
- `409 Conflict` → 오늘 이미 플레이함
- `401 Unauthorized` → 인증 실패

---

#### POST `/api/rematch`

**호출 시점:** 광고 완료 후

**요청 Body:**
```json
{
  "ad_token": "광고제공사_검증토큰"
}
```

**응답:**
```json
{
  "rematch_user_roll": 4,
  "rematch_ai_roll": 6,
  "rematch_result": "lose",
  "final_result": "lose",
  "current_win_streak": 0,
  "current_lose_streak": 1
}
```

**오류:**
- `409 Conflict` → 이미 재대결 완료
- `400 Bad Request` → 오늘 플레이 기록 없음
- `400 Bad Request` → ad_token 검증 실패

---

#### GET `/api/ranking`

**호출 시점:** 랭킹 화면 진입 시

**쿼리 파라미터:**
```
category=win_streak  (MVP에서 이것만)
```

**응답:**
```json
{
  "category": "win_streak",
  "updated_at": "2026-04-03T12:00:00Z",
  "rankings": [
    { "rank": 1, "display_name": "주사위고수", "score": 12, "achieved_at": "2026-04-03T08:30:00Z" },
    { "rank": 2, "display_name": "행운아", "score": 9, "achieved_at": "2026-04-02T19:10:00Z" },
    ...
  ],
  "my_rank": {
    "rank": 14,
    "score": 4
  }
}
```

**캐시 전략:** `dice_leaderboard_cache` 에서 읽기 (실시간 집계 없음)

---

#### GET `/api/my-records`

**호출 시점:** 내 기록 화면 진입 시

**응답:**
```json
{
  "recent_7_days": [
    { "date": "2026-04-03", "user_roll": 3, "ai_roll": 5, "final_result": "lose", "had_rematch": false },
    { "date": "2026-04-02", "user_roll": 6, "ai_roll": 2, "final_result": "win",  "had_rematch": false },
    ...
  ],
  "streak": {
    "current_win_streak": 0,
    "current_lose_streak": 1,
    "max_win_streak": 5,
    "total_plays": 42,
    "total_wins": 18,
    "total_losses": 20,
    "total_draws": 4
  }
}
```

---

### 10-4. Next.js API Route 구조 (참고)

```
src/app/api/
├── today-status/route.ts     GET  → Supabase 오늘 기록 + 스트릭 조회
├── play/route.ts             POST → AI 주사위 생성, 결과 저장, 스트릭 업데이트
├── rematch/route.ts          POST → 광고 토큰 검증, 재대결 처리
├── ranking/route.ts          GET  → 캐시 테이블 조회
└── my-records/route.ts       GET  → 7일 기록 + 스트릭 조회
```

---

### 10-5. Supabase Edge Function 구조 (랭킹 갱신용)

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

*다음 문서: [03_project-plan.md](./03_project-plan.md)*
