const fs = require('fs');
const path = require('path');

const { execSync } = require('child_process');

// Find all files with error.message in catch blocks
const files = execSync('grep -r "catch (error: unknown)" app --include="*.tsx" -l', { encoding: 'utf8' }).split('\n').filter(Boolean);

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix all error.message patterns
  // Pattern 1: toast.error(error.message || "text")
  content = content.replace(
    /toast\.error\(error\.message \|\| t\("([^"]+)"\)\)/g,
    'toast.error(error instanceof Error ? error.message : t("$1"))'
  );
  
  // Pattern 2: toast.error(error.message || 'text')
  content = content.replace(
    /toast\.error\(error\.message \|\| '([^']+)'\)/g,
    'toast.error(error instanceof Error ? error.message : \'$1\')'
  );
  
  // Pattern 3: logger.error("text", error.message)
  content = content.replace(
    /logger\.error\("([^"]+)", error\.message\)/g,
    'logger.error("$1", error instanceof Error ? error : undefined)'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('Done!');
