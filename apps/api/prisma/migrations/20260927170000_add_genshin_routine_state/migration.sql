-- C2a: Add GenshinRoutineState table for clock/task reliability
-- Additive only: no UPDATE, DELETE, or ALTER to existing tables.
-- Companion is useful before a Genshin import/account exists; no game FK.

CREATE TABLE "genshin_routine_state" (
    "userId"                  TEXT         NOT NULL,
    "revision"                INTEGER      NOT NULL DEFAULT 0,
    "serverId"                TEXT,
    "dailyPeriodStart"        TIMESTAMP(3),
    "commissionsDone"         BOOLEAN      NOT NULL DEFAULT false,
    "teapotChecked"           BOOLEAN      NOT NULL DEFAULT false,
    "transformerLastUsedAt"   TIMESTAMP(3),
    "resinAmount"             INTEGER,
    "resinRecordedAt"         TIMESTAMP(3),
    "weeklyPeriodStart"       TIMESTAMP(3),
    "weeklyRewardClaims"      INTEGER,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genshin_routine_state_pkey" PRIMARY KEY ("userId"),

    -- revision must be non-negative
    CONSTRAINT "genshin_routine_state_revision_check"
        CHECK ("revision" >= 0),

    -- only 'asia' is a valid server value; null means unselected
    CONSTRAINT "genshin_routine_state_server_id_check"
        CHECK ("serverId" IS NULL OR "serverId" = 'asia'),

    -- resinAmount and resinRecordedAt must both be null or both non-null
    CONSTRAINT "genshin_routine_state_resin_pair_check"
        CHECK (("resinAmount" IS NULL) = ("resinRecordedAt" IS NULL)),

    -- resinAmount must be 0–200 when present
    CONSTRAINT "genshin_routine_state_resin_amount_check"
        CHECK ("resinAmount" IS NULL OR ("resinAmount" >= 0 AND "resinAmount" <= 200)),

    -- weeklyRewardClaims must be non-negative when present (storage limit: 1000)
    CONSTRAINT "genshin_routine_state_weekly_claims_check"
        CHECK ("weeklyRewardClaims" IS NULL OR ("weeklyRewardClaims" >= 0 AND "weeklyRewardClaims" <= 1000))
);

-- Foreign key: cascade deletion from User
ALTER TABLE "genshin_routine_state"
    ADD CONSTRAINT "genshin_routine_state_userId_fkey"
        FOREIGN KEY ("userId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE;
