-- Additive suppression list for Google Ads enhanced conversions.
-- Stores SHA-256 hashes of a trimmed, lowercased email or an E.164 phone.
-- No raw email or phone number is written.
CREATE TABLE IF NOT EXISTS "enhanced_conversion_suppressions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kind" text NOT NULL,
  "value_hash" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "enhanced_conversion_suppressions_value_hash_unique"
  ON "enhanced_conversion_suppressions" ("value_hash");
