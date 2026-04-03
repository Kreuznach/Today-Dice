-- 003: dice_streak_state 테이블 생성
CREATE TABLE IF NOT EXISTS dice_streak_state (
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
