-- 005: RLS 정책 설정

-- RLS 활성화
ALTER TABLE dice_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_daily_battle ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_streak_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- dice_users: 본인만 읽기/쓰기
CREATE POLICY "dice_users_select_own" ON dice_users
  FOR SELECT USING (auth.uid()::text = toss_user_id);

CREATE POLICY "dice_users_insert_own" ON dice_users
  FOR INSERT WITH CHECK (auth.uid()::text = toss_user_id);

CREATE POLICY "dice_users_update_own" ON dice_users
  FOR UPDATE USING (auth.uid()::text = toss_user_id);

-- dice_daily_battle: 본인 읽기 / 서버(Service Role)만 쓰기
CREATE POLICY "dice_daily_battle_select_own" ON dice_daily_battle
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM dice_users WHERE toss_user_id = auth.uid()::text
    )
  );

-- dice_streak_state: 본인 읽기 / 서버(Service Role)만 쓰기
CREATE POLICY "dice_streak_state_select_own" ON dice_streak_state
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM dice_users WHERE toss_user_id = auth.uid()::text
    )
  );

-- dice_leaderboard_cache: 모두 읽기 가능 / 서버(Service Role)만 쓰기
CREATE POLICY "dice_leaderboard_cache_select_all" ON dice_leaderboard_cache
  FOR SELECT USING (true);
