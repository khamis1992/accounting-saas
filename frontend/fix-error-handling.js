const fs = require('fs');
const path = require('path');

const files = [
  'app/[locale]/(app)/assets/fixed/page.tsx',
  'app/[locale]/(app)/banking/accounts/page.tsx',
  'app/[locale]/(app)/banking/reconciliation/page.tsx',
  'app/[locale]/(app)/purchases/expenses/page.tsx',
  'app/[locale]/(app)/purchases/purchase-orders/page.tsx',
  'app/[locale]/(app)/reports/page.tsx',
  'app/[locale]/(app)/sales/invoices/page.tsx',
  'app/[locale]/(app)/sales/payments/page.tsx',
  'app/[locale]/(app)/sales/quotations/page.tsx',
  'app/[locale]/(app)/settings/company/page.tsx',
  'app/[locale]/(app)/settings/cost-centers/page.tsx',
  'app/[locale]/(app)/settings/fiscal/page.tsx',
  'app/[locale]/(app)/settings/profile/page.tsx',
  'app/[locale]/(app)/settings/roles/page.tsx',
  'app/[locale]/(app)/settings/users/page.tsx',
  'app/[locale]/(app)/tax/vat/page.tsx',
  'app/[locale]/(app)/tax/vat-returns/page.tsx',
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix pattern: toast.error(error.message || "message")
  const pattern = /toast\.error\(error\.message \|\| "([^"]+)"\)/g;
  content = content.replace(pattern, (match, defaultMessage) => {
    return `toast.error(error instanceof Error ? error.message : "${defaultMessage}")`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('Done!');
