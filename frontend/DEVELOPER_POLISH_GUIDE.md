# Developer Polish Guide - Quick Reference

**Last Updated:** 2025-01-17
**For:** Frontend Developers

---

## 🚀 Quick Commands

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Run linter
npm run lint

# Analyze bundle size
npm run analyze

# Add file headers
node scripts/add-file-headers.js

# Find inline styles
grep -rn "style={{" components/ app/ --include="*.tsx"
```

---

## 📝 Code Style Checklist

### ✅ DO
- Use constants from `@/lib/constants`
- Add JSDoc comments to exported functions
- Keep functions under 50 lines
- Use Tailwind classes instead of inline styles
- Run `npm run format` before committing
- Add file headers to new files

### ❌ DON'T
- Use hardcoded strings (use constants)
- Write inline styles (use Tailwind)
- Create functions >50 lines (break them down)
- Skip JSDoc comments
- Commit unformatted code
- Leave unused imports

---

## 🎨 Common Replacements

### Magic Strings → Constants

```typescript
// ❌ Before
const route = '/dashboard';
const duration = 3000;

// ✅ After
import { NAVIGATION, UI } from '@/lib/constants';
const route = NAVIGATION.ROUTES.DASHBOARD;
const duration = UI.TOAST.DURATION.NORMAL;
```

### Inline Styles → Tailwind

```typescript
// ❌ Before
<div style={{ display: 'flex', height: '400px' }}>

// ✅ After
<div className="flex h-[400px]">
```

### Long Functions → Small Helpers

```typescript
// ❌ Before - 80 lines
function processData(data) {
  // 80 lines...
}

// ✅ After - 4 functions of 20 lines each
function processData(data) {
  const validated = validateData(data);
  const transformed = transformData(validated);
  return saveData(transformed);
}
```

---

## 📚 Available Constants

```typescript
import {
  NAVIGATION,   // Routes, query params
  AUTH,         // Error codes, cookies
  UI,           // Animations, breakpoints, z-index
  FORM,         // Validation limits
  TABLE,        // Pagination, sorting
  DATETIME,     // Date formats
  FILE_UPLOAD,  // File size limits
  FEATURES,     // Feature flags
  KEYBOARD,     // Keyboard shortcuts
} from '@/lib/constants';
```

---

## ✍️ JSDoc Template

```typescript
/**
 * Brief description
 *
 * Longer description if needed.
 *
 * @param param1 - Description
 * @param param2 - Description
 * @returns Return value description
 * @throws {Error} When it errors
 *
 * @example
 * ```ts
 * functionName(arg1, arg2)
 * ```
 */
export function functionName(param1: string, param2: number): boolean {
  // Implementation
}
```

---

## 🔧 File Header Template

```typescript
/**
 * ComponentName Component
 *
 * Brief description of what this component does.
 *
 * @fileoverview ComponentName React component
 * @author Frontend Team
 * @created 2025-01-17
 * @updated 2025-01-17
 */
```

---

## 📋 Pre-Commit Checklist

- [ ] Ran `npm run format`
- [ ] Ran `npm run lint` (no errors)
- [ ] Added file header to new files
- [ ] Used constants instead of magic strings
- [ ] No inline styles (except truly dynamic)
- [ ] Functions <50 lines
- [ ] JSDoc on exported functions
- [ ] Tests added/updated

---

## 🎯 Priority Tasks

### High Priority
1. Replace inline styles (19 found)
2. Remove unused imports
3. Add JSDoc to API functions

### Medium Priority
4. Break down long functions
5. Add component tests
6. Document complex logic

### Low Priority
7. Refactor for readability
8. Optimize bundle size
9. Improve accessibility

---

## 📊 Current Status

```
File Headers:        ✅ 100% (170/170)
Constants:           ✅ 100% implemented
Linting:             ✅ Active
Formatting:          ✅ Active
Bundle Monitoring:   ✅ Active
File Naming:         ✅ 100% compliant
JSDoc Comments:      📝 10% complete
Inline Styles:       ⚠️  19 remaining
Long Functions:      📝 Several to refactor
Tests:               📝 ~30% coverage
```

---

## 💡 Tips

### Quick Tailwind Lookups
- Flex: `flex`, `flex-col`, `flex-row`
- Spacing: `p-4`, `m-2`, `px-2`, `py-1`
- Sizes: `w-full`, `h-screen`, `max-w-md`
- Colors: `bg-white`, `text-zinc-900`
- Display: `hidden`, `block`, `inline`

### Dynamic Values
```typescript
// Keep inline style for truly dynamic values
<div style={{ height: `${dynamicHeight}px` }}>

// Or use CSS custom properties
<div style={{ '--height': `${dynamicHeight}px` } as React.CSSProperties}>
```

### Complex Styles
```typescript
// Use cn() helper for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  anotherCondition && 'another-class'
)}>
```

---

**Need Help?** Check `POLISH_FIXES_IMPLEMENTATION_REPORT.md` for detailed guides.
