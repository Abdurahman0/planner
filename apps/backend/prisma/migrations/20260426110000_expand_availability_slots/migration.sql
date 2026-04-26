CREATE TYPE "AvailabilityType_new" AS ENUM (
    'sleep',
    'work',
    'available',
    'blocked',
    'eating',
    'study',
    'custom'
);

ALTER TABLE "AvailabilitySlot"
ALTER COLUMN "type" TYPE "AvailabilityType_new"
USING (
    CASE
        WHEN "type"::text = 'unavailable' THEN 'blocked'
        ELSE "type"::text
    END
)::"AvailabilityType_new";

ALTER TYPE "AvailabilityType" RENAME TO "AvailabilityType_old";
ALTER TYPE "AvailabilityType_new" RENAME TO "AvailabilityType";
DROP TYPE "AvailabilityType_old";

ALTER TABLE "AvailabilitySlot"
ADD COLUMN "label" TEXT;
