-- 004: dice_leaderboard_cache 테이블 생성
CREATE TABLE IF NOT EXISTS dice_leaderboard_cache (
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

CREATE INDEX IF NOT EXISTS dice_leaderboard_cache_category_rank_idx ON dice_leaderboard_cache(category, rank);
