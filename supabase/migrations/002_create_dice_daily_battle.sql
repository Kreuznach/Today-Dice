-- 002: dice_daily_battle 테이블 생성
CREATE TABLE IF NOT EXISTS dice_daily_battle (
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

CREATE INDEX IF NOT EXISTS dice_daily_battle_user_date_idx ON dice_daily_battle(user_id, battle_date);
