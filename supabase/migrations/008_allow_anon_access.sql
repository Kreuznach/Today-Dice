-- 008: anon 역할 직접 접근 허용
--
-- 현재 앱은 Supabase Auth 없이 localStorage UUID(게스트 ID)를
-- 사용자 식별자로 사용합니다.
-- 기존 005 마이그레이션의 auth.uid() 기반 정책은 동작하지 않으므로
-- Today-RPS 구조와 동일하게 anon 역할에 전체 접근을 허용합니다.
--
-- Toss JWT 연동 시 아래 정책을 user_id 기반으로 교체합니다.

-- ─────────────────────────────────────────
-- 0. anon 역할에 테이블 권한 부여 (GRANT)
-- ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON dice_users           TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON dice_daily_battle    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON dice_streak_state    TO anon;
GRANT SELECT                          ON dice_leaderboard_cache TO anon;

GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;

-- ─────────────────────────────────────────
-- dice_users
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "dice_users_select_own" ON dice_users;
DROP POLICY IF EXISTS "dice_users_insert_own" ON dice_users;
DROP POLICY IF EXISTS "dice_users_update_own" ON dice_users;

CREATE POLICY "dice_users: anon full access" ON dice_users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- dice_daily_battle
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "dice_daily_battle_select_own" ON dice_daily_battle;

CREATE POLICY "dice_daily_battle: anon full access" ON dice_daily_battle
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- dice_streak_state
-- ─────────────────────────────────────────
DROP POLICY IF EXISTS "dice_streak_state_select_own" ON dice_streak_state;

CREATE POLICY "dice_streak_state: anon full access" ON dice_streak_state
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- dice_leaderboard_cache
-- ─────────────────────────────────────────
-- 기존 정책 유지 (모두 읽기 가능)
