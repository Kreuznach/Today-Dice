-- 001: dice_users 테이블 생성
CREATE TABLE IF NOT EXISTS dice_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toss_user_id  TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL DEFAULT '주사위 플레이어',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS dice_users_toss_user_id_idx ON dice_users(toss_user_id);
