/**
 * Generate planning PDFs for /public/downloads/
 * Run: npx tsx scripts/generate-resource-pdfs.ts
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { buildResourcePdf } from '../lib/pdf/drawResourcePdf';
import {
  ADA_CANYON_PERMIT_BLOCKS,
  BUDGET_WORKSHEET_BLOCKS,
  KITCHEN_BATH_CHECKLIST_BLOCKS,
  PDF_FOOTERS,
} from '../shared/resourcePdfContent';

const OUT_DIR = path.join(process.cwd(), 'public', 'downloads');

const FILES = [
  {
    name: 'remodel-budget-worksheet.pdf',
    blocks: BUDGET_WORKSHEET_BLOCKS,
    footer: PDF_FOOTERS.budget,
  },
  {
    name: 'kitchen-bath-planning-checklist.pdf',
    blocks: KITCHEN_BATH_CHECKLIST_BLOCKS,
    footer: PDF_FOOTERS.checklist,
  },
  {
    name: 'ada-canyon-permit-guide.pdf',
    blocks: ADA_CANYON_PERMIT_BLOCKS,
    footer: PDF_FOOTERS.permits,
  },
] as const;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const file of FILES) {
    const bytes = await buildResourcePdf(file.blocks, file.footer);
    const outPath = path.join(OUT_DIR, file.name);
    await writeFile(outPath, bytes);
    console.log(`Wrote ${outPath} (${bytes.length} bytes)`);
  }

  console.log('\nDone - 3 resource PDFs generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
