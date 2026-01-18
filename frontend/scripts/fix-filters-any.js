const fs = require('fs');
const path = require('path');

const files = [
  './app/[locale]/(app)/assets/fixed/page.tsx',
  './app/[locale]/(app)/purchases/expenses/page.tsx',
  './app/[locale]/(app)/purchases/purchase-orders/page.tsx',
  './app/[locale]/(app)/sales/payments/page.tsx',
  './app/[locale]/(app)/sales/quotations/page.tsx',
  './app/[locale]/(app)/settings/users/page.tsx'
];

files.forEach(file => {
  const fullPath = path.resolve(__dirname, '../../', file);
  if (!fs.existsSync(fullPath)) {
    console.log('Skipping (not found):', file);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  content = content.replace(/filters: any/g, 'filters: Record<string, string | number | boolean | undefined>');

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed:', file);
  } else {
    console.log('No changes needed:', file);
  }
});
