# Accessibility Quick Reference Guide

**For Developers**
**Last Updated:** 2026-01-17

---

## TL;DR - What You Need to Know

### ✅ DO This:

1. **All icon buttons MUST have `aria-label`**
2. **All images MUST have `alt` text**
3. **All form inputs MUST have labels**
4. **All modals MUST have `aria-modal="true"`**
5. **All errors MUST use `aria-live="polite"`**

### ❌ DON'T Do This:

1. ❌ Don't use icon buttons without labels
2. ❌ Don't use empty alt text (unless decorative)
3. ❌ Don't rely on color alone
4. ❌ Don't trap keyboard focus
5. ❌ Don't hide content from screen readers

---

## Component Patterns

### Icon Buttons

**❌ WRONG:**

```tsx
<Button onClick={handleClose}>
  <X className="h-4 w-4" />
</Button>
```

**✅ RIGHT:**

```tsx
<Button onClick={handleClose} aria-label="Close dialog">
  <X className="h-4 w-4" />
  <span className="sr-only">Close</span>
</Button>
```

**Or use IconButton component:**

```tsx
<IconButton icon={<X className="h-4 w-4" />} label="Close dialog" onClick={handleClose} />
```

---

### Images & Avatars

**❌ WRONG:**

```tsx
<img src="/avatar.jpg" />
<AvatarImage src={avatarUrl} />
```

**✅ RIGHT:**

```tsx
<img src="/avatar.jpg" alt="Profile picture of John Doe" />
<AvatarImage
  src={avatarUrl}
  alt="Profile picture of John Doe"
/>
```

---

### Form Fields

**❌ WRONG:**

```tsx
<input type="email" placeholder="Email" />
```

**✅ RIGHT:**

```tsx
<FormField id="email" label="Email" error={errors.email} required>
  {({ id, ...props }) => <Input id={id} type="email" {...props} />}
</FormField>
```

---

### Modals

**❌ WRONG:**

```tsx
<Dialog open={isOpen}>
  <DialogContent>Content here</DialogContent>
</Dialog>
```

**✅ RIGHT:**

```tsx
<Dialog open={isOpen}>
  <DialogContent aria-modal="true" role="dialog">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

Note: Our Dialog component already adds these automatically!

---

### Dynamic Content (Live Regions)

**❌ WRONG:**

```tsx
{
  status && <div>{status}</div>;
}
```

**✅ RIGHT:**

```tsx
<StatusMessage message={status} />
```

Or for alerts:

```tsx
<AlertMessage message={error} />
```

Or programmatically:

```tsx
const { announceStatus } = useLiveRegion();

useEffect(() => {
  announceStatus("Data loaded successfully");
}, [data]);
```

---

### Error Messages

**❌ WRONG:**

```tsx
{
  error && <p className="text-red-500">{error}</p>;
}
```

**✅ RIGHT:**

```tsx
<FormField id="email" label="Email" error="Email is required">
  {({ id, ...props }) => <Input id={id} {...props} />}
</FormField>
```

Note: FormField automatically adds ARIA attributes and clickable links!

---

## Common Accessibility Props

### ARIA Labels

```tsx
aria-label="Descriptive text for screen readers"
aria-labelledby="element-id"  // References another element's ID
aria-describedby="description-id"  // Links to description
```

### ARIA States

```tsx
aria-expanded={isOpen}  // For toggles (dropdowns, accordions)
aria-checked={isChecked}  // For checkboxes
aria-selected={isSelected}  // For tabs
aria-disabled={isDisabled}  // For disabled state
aria-busy={isLoading}  // For loading state
```

### ARIA Live Regions

```tsx
// Polite: Wait until user is idle
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// Assertive: Interrupt immediately
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### ARIA Roles

```tsx
role = "dialog"; // Modals
role = "alertdialog"; // Alert modals
role = "navigation"; // Nav menus
role = "main"; // Main content
role = "complementary"; // Sidebars
role = "banner"; // Headers
role = "contentinfo"; // Footers
```

---

## Keyboard Navigation

### Focus Management

**Move Focus:**

```tsx
// Focus an element
document.getElementById("my-input")?.focus();

// Focus on mount
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

**Restore Focus:**

```tsx
const { returnFocus } = useFocusManagement();

// After closing modal
returnFocus();
```

**Skip Navigation:**

```tsx
// Already implemented in AuthenticatedLayout!
<SkipLink />
<MainContent>
  {children}
</MainContent>
```

---

## Color Contrast

### Minimum Requirements

- **Normal text:** 4.5:1 contrast ratio (WCAG AA)
- **Large text (18px+):** 3:1 contrast ratio (WCAG AA)
- **Interactive elements:** 3:1 contrast ratio (WCAG AA)
- **Focus indicators:** 3:1 contrast ratio (WCAG AA)

### Check Contrast

1. Use Chrome DevTools Color Picker
2. Use WebAIM Contrast Checker
3. Use axe DevTools

### Our Colors (Already Compliant)

```css
/* Light mode */
--foreground: oklch(0.145 0 0); /* 16.4:1 ✅ */
--muted-foreground: oklch(0.556 0 0); /* 4.9:1 ✅ */

/* Dark mode */
--foreground: oklch(0.985 0 0); /* 16.4:1 ✅ */
--muted-foreground: oklch(0.708 0 0); /* 5.6:1 ✅ */
```

---

## Testing Checklist

### Before Committing Code

**Visual Test:**

- [ ] Can I see the focus indicator when I tab?
- [ ] Is the text readable in both light and dark modes?
- [ ] Are there any color-only indicators?

**Keyboard Test:**

- [ ] Can I navigate the entire page with Tab?
- [ ] Can I activate all buttons with Enter/Space?
- [ ] Can I close all modals with Escape?
- [ ] Are there any keyboard traps?

**Screen Reader Test (Basic):**

- [ ] Do all buttons have aria-labels?
- [ ] Do all images have alt text?
- [ ] Do all form fields have labels?
- [ ] Are errors announced?

**Automated Test:**

- [ ] Run axe DevTools scan
- [ ] Fix any "Critical" or "Serious" issues
- [ ] Review "Moderate" and "Minor" issues

---

## Common Mistakes

### Mistake 1: Empty Alt Text

**❌ Don't do this:**

```tsx
<img src="logo.png" alt="" />  <!-- Unless decorative -->
```

**✅ Do this:**

```tsx
<img src="logo.png" alt="Company Logo" />
```

---

### Mistake 2: Placeholder as Label

**❌ Don't do this:**

```tsx
<input placeholder="Email" />
```

**✅ Do this:**

```tsx
<label htmlFor="email">Email</label>
<input id="email" />
```

---

### Mistake 3: Color-Only Indicators

**❌ Don't do this:**

```tsx
<span className="text-red-500">Error</span>
```

**✅ Do this:**

```tsx
<span className="text-red-500" role="alert" aria-live="polite">
  Error
</span>
```

---

### Mistake 4: Hidden Focus

**❌ Don't do this:**

```tsx
outline: none; // NEVER DO THIS
```

**✅ Do this:**

```css
*:focus-visible {
  outline: 3px solid var(--ring);
}
```

---

### Mistake 5: aria-label on Visible Text

**❌ Don't do this:**

```tsx
<button aria-label="Close">Close</button>  <!-- Redundant -->
```

**✅ Do this:**

```tsx
<button>Close</button>  <!-- Button text is enough -->
```

Or for icon-only:

```tsx
<button aria-label="Close">
  <XIcon />
</button>
```

---

## Available Accessibility Components

### Form Components

- `FormField` - Accessible form field with labels and errors
- `FormError` - Standalone error display
- `FormHint` - Helper text

### Layout Components

- `SkipLink` - Skip navigation link
- `MainContent` - Main content wrapper with target ID

### Dialog Components

- `Dialog` - Modal dialog (auto-includes aria-modal)
- `AlertDialog` - Alert dialog (auto-includes role="alertdialog")
- `Sheet` - Side sheet (auto-includes close button label)

### Live Region Components

- `LiveRegion` - Base live region component
- `StatusMessage` - Polite status announcements
- `AlertMessage` - Assertive alert announcements
- `useLiveRegion()` - Hook for programmatic announcements

### Utility Components

- `sr-only` class - Hide visually, keep for screen readers
- `focus:not-sr-only` class - Show element when focused

---

## Resources

### Internal Documentation

- [MEDIUM_ACCESSIBILITY_FIXES.md](../MEDIUM_ACCESSIBILITY_FIXES.md) - Detailed fixes
- [A11Y_TESTING_CHECKLIST.md](../A11Y_TESTING_CHECKLIST.md) - Testing guide

### External Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

### Browser Extensions

- axe DevTools - Automated accessibility testing
- WAVE - Visual accessibility feedback
- Colour Contrast Analyser - Contrast checking

---

## Quick Help

### "How do I make this accessible?"

**Icon Button?**
→ Use `aria-label` + `sr-only` text

**Image?**
→ Use descriptive `alt` text

**Form Field?**
→ Use `FormField` component

**Modal?**
→ Use our `Dialog` component (already accessible)

**Error Message?**
→ Use `FormField` with `error` prop

**Dynamic Update?**
→ Use `StatusMessage` or `AlertMessage`

**Loading State?**
→ Use `aria-busy="true"` + live region

---

## Accessibility First Development

### When Starting a New Component:

1. **Plan accessibility first**
   - What is the component's purpose?
   - How will screen readers announce it?
   - How will keyboard users interact?

2. **Use semantic HTML**
   - Use `<button>` for buttons
   - Use `<a>` for links
   - Use `<label>` for form fields

3. **Add ARIA attributes**
   - Start with `aria-label` for icon buttons
   - Add `aria-live` for dynamic content
   - Add `aria-modal` for modals

4. **Test with keyboard**
   - Tab through the component
   - Verify focus is visible
   - Verify no keyboard traps

5. **Test with screen reader**
   - Verify all elements are announced
   - Verify labels are descriptive
   - Verify errors are announced

---

## Getting Help

### Questions?

- Check this guide first
- Review MEDIUM_ACCESSIBILITY_FIXES.md
- Ask in #accessibility channel

### Found an Issue?

- Document it in A11Y_TESTING_CHECKLIST.md
- Tag with "accessibility" label
- Contact the accessibility team

---

**Remember:** Accessibility is not a feature, it's a fundamental requirement. Building accessible components from the start is easier than retrofitting them later.

---

**Version:** 1.0
**Last Updated:** 2026-01-17
**Maintained By:** Frontend Team
