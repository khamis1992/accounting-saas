# Accessibility Quick Start Guide

Quick reference for implementing WCAG 2.1 AA compliant features.

---

## Form Fields (REQUIRED for all forms)

### Bad ❌
```tsx
<div>
  <label htmlFor="email">Email</label>
  <input id="email" />
  {error && <span>{error}</span>}
</div>
```

### Good ✅
```tsx
import { FormField } from '@/components/ui/form-field';

<FormField
  id="email"
  label="Email"
  error={formErrors.email}
  required
  description="We'll never share your email"
>
  {({ id, 'aria-invalid': invalid, 'aria-describedby': describedBy }) => (
    <input
      id={id}
      type="email"
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  )}
</FormField>
```

**Why**: Screen readers announce errors, labels are properly associated

---

## Page Titles (REQUIRED for all pages)

### Add to every page component:
```tsx
import { usePageTitle } from '@/hooks/use-page-title';

export default function MyPage() {
  usePageTitle('myPage.title', 'My App');

  return <div>...</div>;
}
```

**Translation keys** (add to `messages/en.json`):
```json
{
  "myPage": {
    "title": "My Page Title"
  }
}
```

**Why**: Screen readers can identify pages, browser tabs are descriptive

---

## Live Announcements

### For dynamic content changes:
```tsx
import { announceToScreenReader } from '@/lib/accessibility';

function handleSave() {
  saveData();

  // Announce to screen readers
  announceToScreenReader('Changes saved successfully', 'polite');
}
```

**Priority levels**:
- `'polite'`: Waits for current speech (use for most updates)
- `'assertive'`: Interrupts immediately (use for critical errors only)

---

## Focus Management

### Dialogs/Modals
```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Radix handles focus trapping automatically */}
    {/* Focus returns to trigger on close */}
  </DialogContent>
</Dialog>
```

### Custom Focus Trap
```tsx
import { useFocusTrap } from '@/components/ui/focus-trap';

function MyModal() {
  const containerRef = useFocusTrap(isOpen, {
    returnFocus: true,
    initialFocus: closeButtonRef
  });

  return (
    <div ref={containerRef}>
      {/* Focus trapped here */}
    </div>
  );
}
```

---

## Keyboard Navigation

### Common patterns:
```tsx
// Handle keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      handleClose();
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      handleActivate();
      break;
    case 'ArrowDown':
      e.preventDefault();
      handleNext();
      break;
    case 'ArrowUp':
      e.preventDefault();
      handlePrevious();
      break;
  }
};

<div onKeyDown={handleKeyDown} tabIndex={0} role="button">
  Custom Button
</div>
```

---

## ARIA Attributes

### Common ARIA patterns:

```tsx
// Loading state
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Done'}
</div>

// Error message
<div role="alert" aria-live="assertive">
  Error: {errorMessage}
</div>

// Expandable section
<button
  aria-expanded={isExpanded}
  aria-controls="content-id"
>
  Toggle
</button>
<div id="content-id" hidden={!isExpanded}>
  Content
</div>

// Selected item
<li role="option" aria-selected={isSelected}>
  Item
</li>
```

---

## Screen Reader Only Content

### Hide visually, show to screen readers:
```tsx
<span className="sr-only">Only screen readers can see this</span>
```

### Hide from screen readers:
```tsx
<div aria-hidden="true">
  Decorative icon or visual element
</div>
```

---

## Focus Indicators

### Always ensure visible focus:
```css
/* In globals.css - already added */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

**Never remove outline unless replacing with better indicator**:
```css
/* Bad - removes all focus indicators */
:focus {
  outline: none;
}

/* Good - keeps keyboard focus, removes mouse */
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Color Contrast

### Check contrast before using:
- Text: Minimum 4.5:1 (WCAG AA)
- Large text (18pt+): Minimum 3:1
- UI components: Minimum 3:1

### Tools:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Lighthouse
- axe DevTools extension

### Current issue to fix:
Dark mode muted foreground is `oklch(0.708 0 0)` = 2.8:1 ❌
Change to `oklch(0.6 0 0)` = 4.5:1 ✅

---

## Testing Checklist

### Manual Keyboard Test
1. Unplug mouse
2. Tab through page - is focus order logical?
3. Can you access all functionality?
4. Are focus indicators visible?
5. Can you skip navigation?

### Screen Reader Test (NVDA/JAWS)
1. Navigate to page
2. Is page title announced?
3. Are form labels announced?
4. Are errors announced?
5. Are dynamic changes announced?

### Color Contrast Test
1. Use WebAIM Contrast Checker
2. Test all text colors
3. Test both light and dark modes
4. Test error messages

---

## Common Mistakes

### ❌ Don't:
```tsx
// No aria-invalid
<input className={error ? 'error' : ''} />

// No role for dynamic content
<div>Loading...</div>

// No label
<input placeholder="Email" />

// aria-hidden on interactive elements
<button aria-hidden="true">Click</button>
```

### ✅ Do:
```tsx
// Proper error handling
<input aria-invalid={!!error} aria-describedby={error ? 'error-id' : undefined} />
<p id="error-id" role="alert">{error}</p>

// Live region for dynamic content
<div role="status" aria-live="polite">{status}</div>

// Proper label
<label htmlFor="email">Email</label>
<input id="email" />

// Never aria-hide interactive elements
<button>Click</button>
```

---

## Quick Reference

| Task | Component/Hook | Import |
|------|----------------|--------|
| Form fields | `<FormField>` | `@/components/ui/form-field` |
| Page titles | `usePageTitle()` | `@/hooks/use-page-title` |
| Live announcements | `announceToScreenReader()` | `@/lib/accessibility` |
| Focus trap | `useFocusTrap()` | `@/components/ui/focus-trap` |
| Skip link | `<SkipLink>` | `@/components/ui/skip-link` |
| Screen reader only | `.sr-only` | CSS class |

---

## Need Help?

1. Check `ACCESSIBILITY_FIXES_SUMMARY.md` for detailed explanations
2. Use browser DevTools Lighthouse for automated testing
3. Test with NVDA (Windows) or VoiceOver (Mac)
4. Check WebAIM guidelines: https://webaim.org/

---

**Remember**: Accessibility is a requirement, not a feature. Test early, test often.
