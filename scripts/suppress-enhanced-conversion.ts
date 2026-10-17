import { addEnhancedConversionSuppression, type SuppressionKind } from "../lib/enhancedConversionSuppression.ts";

async function run() {
  const [kind, raw] = process.argv.slice(2);
  if ((kind !== "email" && kind !== "phone") || !raw) {
    console.error("usage: tsx scripts/suppress-enhanced-conversion.ts email|phone <value>");
    process.exit(1);
  }
  const saved = await addEnhancedConversionSuppression(kind as SuppressionKind, raw);
  console.log(`suppressed ${saved.kind} ${saved.valueHash}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
