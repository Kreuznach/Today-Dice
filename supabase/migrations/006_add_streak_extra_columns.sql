-- 006: dice_streak_state 에 같은번호 연속 / 역전승패 컬럼 추가

ALTER TABLE dice_streak_state
  ADD COLUMN IF NOT EXISTS current_same_num_streak SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_same_num_streak     SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_user_roll          SMALLINT,
  ADD COLUMN IF NOT EXISTS total_rematch_wins      INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rematch_losses    INTEGER  NOT NULL DEFAULT 0;
