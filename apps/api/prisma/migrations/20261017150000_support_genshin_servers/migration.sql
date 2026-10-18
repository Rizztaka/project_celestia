-- Widen supported server selections without changing existing records or periods.
ALTER TABLE "genshin_routine_state"
  DROP CONSTRAINT "genshin_routine_state_server_id_check",
  ADD CONSTRAINT "genshin_routine_state_server_id_check"
    CHECK ("serverId" IS NULL OR "serverId" IN ('asia', 'america', 'europe', 'tw_hk_mo'));

ALTER TABLE "genshin_plan_dismissals"
  DROP CONSTRAINT "genshin_plan_dismissals_serverId_check",
  ADD CONSTRAINT "genshin_plan_dismissals_serverId_check"
    CHECK ("serverId" IN ('asia', 'america', 'europe', 'tw_hk_mo'));
