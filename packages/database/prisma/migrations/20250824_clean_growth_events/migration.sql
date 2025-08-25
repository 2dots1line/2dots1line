-- Add new clean fields
ALTER TABLE "growth_events" 
ADD COLUMN "dimension_key" TEXT,
ADD COLUMN "delta_value" DECIMAL(3,1),
ADD COLUMN "rationale" TEXT;

-- Populate new fields from existing growth_dimensions JSONB data
UPDATE "growth_events" 
SET 
  "dimension_key" = ("growth_dimensions"->0->>'dim_key')::TEXT,
  "delta_value" = ("growth_dimensions"->0->>'delta')::DECIMAL(3,1),
  "rationale" = ("growth_dimensions"->0->>'rationale')::TEXT
WHERE "growth_dimensions" IS NOT NULL AND jsonb_array_length("growth_dimensions") > 0;

-- Make new fields required
ALTER TABLE "growth_events" 
ALTER COLUMN "dimension_key" SET NOT NULL,
ALTER COLUMN "delta_value" SET NOT NULL,
ALTER COLUMN "rationale" SET NOT NULL;

-- Add indexes for better query performance
CREATE INDEX "idx_growth_events_dimension_key" ON "growth_events"("dimension_key");
CREATE INDEX "idx_growth_events_delta_value" ON "growth_events"("delta_value");
CREATE INDEX "idx_growth_events_user_dimension" ON "growth_events"("user_id", "dimension_key");
