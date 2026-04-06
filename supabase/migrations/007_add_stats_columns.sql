-- 007: dice_streak_state 에 주사위 숫자별 횟수 / 광고 무승부 / 출석 연속 컬럼 추가

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
