#!/usr/bin/env node

/**
 * Script to replace all `error: any` with proper error handling
 *
 * This script:
 * 1. Finds all catch blocks with `error: any`
 * 2. Replaces them with `error: unknown`
 * 3. Adds proper error handling using our error utilities
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_DIR = path.join(__dirname, "../..");

// Files to process
const filesToProcess = [
  "./app/[locale]/(app)/assets/depreciation/page.tsx",
  "./app/[locale]/(app)/assets/fixed/page.tsx",
  "./app/[locale]/(app)/banking/accounts/page.tsx",
  "./app/[locale]/(app)/banking/reconciliation/page.tsx",
  "./app/[locale]/(app)/purchases/expenses/page.tsx",
  "./app/[locale]/(app)/purchases/purchase-orders/page.tsx",
  "./app/[locale]/(app)/purchases/vendors/page.tsx",
  "./app/[locale]/(app)/sales/customers/page.tsx",
  "./app/[locale]/(app)/sales/invoices/page.tsx",
  "./app/[locale]/(app)/sales/payments/page.tsx",
  "./app/[locale]/(app)/sales/quotations/page.tsx",
  "./app/[locale]/(app)/settings/profile/page.tsx",
  "./app/[locale]/(app)/settings/roles/page.tsx",
  "./app/[locale]/(app)/settings/users/page.tsx",
  "./app/[locale]/(app)/tax/vat/page.tsx",
  "./app/[locale]/(app)/tax/vat-returns/page.tsx",
  "./app/[locale]/(app)/accounting/coa/page.tsx",
  "./app/[locale]/(app)/accounting/general-ledger/page.tsx",
  "./app/[locale]/(app)/accounting/journals/new/page.tsx",
  "./app/[locale]/(app)/accounting/journals/page.tsx",
  "./app/[locale]/(app)/accounting/trial-balance/page.tsx",
  "./app/[locale]/(app)/reports/page.tsx",
];

function processFile(filePath) {
  const fullPath = path.join(FRONTEND_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  // Check if file already has error handling import
  const hasErrorImport =
    content.includes("from '@/lib/errors'") || content.includes("from '@/lib/errors.js'");

  // Add import if not present
  if (!hasErrorImport && content.includes("error: any")) {
    // Find the last import line
    const importMatches = [...content.matchAll(/^import .+$/gm)];
    if (importMatches.length > 0) {
      const lastImport = importMatches[importMatches.length - 1];
      const insertPosition = lastImport.index + lastImport[0].length;
      const importStatement = `\nimport { handleError } from '@/lib/errors';`;
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      modified = true;
    }
  }

  // Replace `error: any` with `error: unknown`
  content = content.replace(/error: any/g, "error: unknown");
  modified = true;

  // Replace generic error handling with proper error handling
  // Pattern 1: console.error(error) -> handleError(error)
  content = content.replace(/catch \(\w+: unknown\) \{\s*console\.error\(\w+\);/g, (match) => {
    const varName = match.match(/catch \((\w+)/)?.[1];
    return `catch (${varName}: unknown) {\n    const appError = handleError(${varName});\n    console.error(appError);`;
  });

  // Pattern 2: Replace error.message with proper error handling
  content = content.replace(/catch \((\w+): unknown\) \{[\s\S]*?\n    \}/g, (match) => {
    // Only process if it has error.message references
    if (!match.includes(`${match[1]}.message`)) {
      return match;
    }

    const varName = match.match(/catch \((\w+)/)?.[1];
    const errorHandler = `    const appError = handleError(${varName});\n`;
    return match
      .replace(`catch (${varName}: unknown) {`, `catch (${varName}: unknown) {\n${errorHandler}`)
      .replace(new RegExp(`${varName}\\.message`, "g"), "appError.message");
  });

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`  ✓ Fixed ${filePath}`);
  } else {
    console.log(`  No changes needed for ${filePath}`);
  }
}

// Process all files
console.log("Starting type fix process...\n");
filesToProcess.forEach(processFile);
console.log("\n✅ All files processed!");

console.log("\nSummary:");
console.log("- Replaced `error: any` with `error: unknown`");
console.log("- Added proper error handling imports");
console.log("- Files processed:", filesToProcess.length);
