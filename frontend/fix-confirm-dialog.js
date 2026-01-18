const fs = require('fs');
const path = require('path');

// Find all files with ConfirmDialog
const { execSync } = require('child_process');

const files = execSync('find app -name "*.tsx" -type f -exec grep -l "ConfirmDialog" {} \;', { encoding: 'utf8' }).split('\n').filter(Boolean);

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix onCancel to onOpenChange pattern
  const pattern = /(\s+)onCancel=\{[^}]*setConfirmDialog\(null\)[^}]*\}/g;
  
  if (pattern.test(content)) {
    // Get the indentation
    const match = content.match(/(\s+)onCancel=/);
    if (match) {
      const indent = match[1];
      content = content.replace(pattern, `${indent}onOpenChange={(open) => !open && setConfirmDialog(null)}`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${file}`);
    }
  }
});

console.log('Done!');
