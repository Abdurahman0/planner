CREATE TYPE "RecurrenceType" AS ENUM (
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly'
);

ALTER TABLE "Task"
ADD COLUMN "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'none',
ADD COLUMN "recurrenceDaysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "recurrenceEndDate" TIMESTAMP(3);

ALTER TABLE "TaskProgressLog"
ADD COLUMN "occurrenceDate" TIMESTAMP(3);

CREATE TABLE "TaskOccurrence" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'todo',
    "completionPercent" DOUBLE PRECISION,
    "completedValue" DOUBLE PRECISION,
    "note" TEXT,
    "completedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskOccurrence_taskId_occurrenceDate_key" ON "TaskOccurrence"("taskId", "occurrenceDate");
CREATE INDEX "TaskOccurrence_occurrenceDate_idx" ON "TaskOccurrence"("occurrenceDate");

ALTER TABLE "AvailabilitySlot"
ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'weekly',
ADD COLUMN "recurrenceDaysOfWeek" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "recurrenceEndDate" TIMESTAMP(3);

ALTER TABLE "TaskOccurrence"
ADD CONSTRAINT "TaskOccurrence_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
