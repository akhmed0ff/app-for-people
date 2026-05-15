-- Баг 6: DriverBalance нигде не использовался, баланс хранится в Driver.balance
-- Удаляем мёртвую таблицу

ALTER TABLE "Driver" DROP COLUMN IF EXISTS "balanceAccount";
DROP TABLE IF EXISTS "DriverBalance";
