ALTER TABLE "Task"
ADD COLUMN "userId" TEXT;

UPDATE "Task" AS "task"
SET "userId" = "goal"."userId"
FROM "Goal" AS "goal"
WHERE "task"."goalId" = "goal"."id";

ALTER TABLE "Task"
ALTER COLUMN "goalId" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Task"
DROP CONSTRAINT "Task_goalId_fkey";

ALTER TABLE "Task"
ADD CONSTRAINT "Task_goalId_fkey"
FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Task_userId_idx" ON "Task"("userId");
