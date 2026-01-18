# Accessibility Testing Guide

Complete guide for testing WCAG 2.1 AA compliance features.

---

## Setup

### Required Tools
1. **Screen Reader** (choose one):
   - Windows: NVDA (free) or JAWS (paid)
   - Mac: VoiceOver (built-in)
   - Chrome: ChromeVox extension

2. **Browser**: Chrome 120+, Firefox 120+, or Safari 17+

3. **Contrast Checker**:
   - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - axe DevTools Chrome extension

---

## Test 1: Skip Navigation Link

### Objective
Keyboard users can skip navigation menu and jump to main content.

### Steps
1. Open any authenticated page (e.g., Dashboard)
2. **Unplug your mouse** (force keyboard-only)
3. Press `Tab` key once
4. **Expected**: "Skip to main content" link appears at top-left
5. Press `Enter`
6. **Expected**: Focus jumps to main content area
7. Press `Tab` again
8. **Expected**: Focus moves to first interactive element in main content

### Pass Criteria
- Skip link appears on first tab
- Link has high contrast (visible when focused)
- Pressing Enter jumps to main content
- Focus moves to first element in main content

### Browser DevTools Check
```javascript
// Open Console and run:
document.querySelector('a[href="#main-content"]')?.innerText
// Should return: "Skip to main content"

document.getElementById('main-content')
// Should return: <main> element
```

---

## Test 2: Form Error Announcements

### Objective
Screen readers announce all form errors.

### Steps
1. Navigate to Sign In page (`/en/signin`)
2. Start screen reader (NVDA: Ctrl+Alt+N)
3. Navigate to email field
4. **Do not fill email field**
5. Press `Enter` to submit form
6. **Expected (Screen Reader)**:
   - "Error: Email is required"
   - "Error: Password is required"
7. Press `Tab`
8. **Expected**: Focus moves to email field
9. **Expected (Screen Reader)**: "Email, edit, required, invalid, Email is required"

### Pass Criteria
- Errors announced with `role="alert"` and `aria-live="polite"`
- Input has `aria-invalid="true"`
- Input has `aria-describedby` linking to error message
- Label properly associated via `htmlFor`

### Browser DevTools Check
```javascript
// After triggering error:
const emailInput = document.getElementById('email');
console.log(emailInput?.getAttribute('aria-invalid'));
// Should return: "true"

console.log(emailInput?.getAttribute('aria-describedby'));
// Should return: "email-error"

const errorElement = document.getElementById('email-error');
console.log(errorElement?.getAttribute('role'));
// Should return: "alert"
```

---

## Test 3: Focus Management in Dialogs

### Objective
Focus is trapped in dialogs and returns to trigger on close.

### Steps
1. Open Dashboard page
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
3. **Expected**: Command palette opens
4. **Expected**: Focus moves to search input
5. Press `Tab` multiple times
6. **Expected**: Focus cycles within dialog only
7. Press `Esc`
8. **Expected**: Dialog closes
9. **Expected**: Focus returns to button that opened dialog

### Pass Criteria
- Focus moves into dialog when opened
- Focus trapped within dialog (Tab cycles)
- Pressing Esc closes dialog
- Focus returns to trigger element
- No focus escapes to background elements

### Browser DevTools Check
```javascript
// After opening dialog:
const activeElement = document.activeElement;
console.log(activeElement?.closest('[role="dialog"]'));
// Should return: Dialog element

// Check focus is in dialog
console.log(document.activeElement);
// Should be: Search input inside dialog
```

---

## Test 4: Page Titles

### Objective
Each page has unique, descriptive title for screen readers.

### Steps
1. Navigate to Dashboard
2. Check browser tab title
3. **Expected**: "Dashboard - Accounting SaaS"
4. Navigate to different pages
5. **Expected**: Tab title changes for each page
6. Start screen reader
7. Navigate to any page
8. **Expected**: Screen reader announces page title on load

### Pass Criteria
- Each page has unique title
- Title includes page name
- Title includes app name (optional but recommended)
- Screen reader announces title on page load

### Browser DevTools Check
```javascript
// Run on different pages:
console.log(document.title);
// Should be unique and descriptive for each page
```

---

## Test 5: Focus Visibility

### Objective
All interactive elements have visible focus indicator.

### Steps
1. Unplug mouse
2. Press `Tab` repeatedly
3. **Expected**: Each focused element has visible outline
4. Check all element types:
   - Links
   - Buttons
   - Inputs
   - Dropdowns
   - Custom interactive elements

### Pass Criteria
- Focus indicator visible on all interactive elements
- Focus indicator has high contrast (minimum 3:1)
- Focus indicator thickness at least 2px
- Focus indicator offset from element (outline-offset)

---

## Test 6: Color Contrast

### Objective
All text meets WCAG AA contrast requirements.

### Automated Test (axe DevTools)
1. Install axe DevTools Chrome extension
2. Open any page
3. Click axe icon in toolbar
4. Click "Scan ALL of my page"
5. **Expected**: No contrast errors

### Manual Test (WebAIM)
1. Open https://webaim.org/resources/contrastchecker/
2. Test all text colors:
   - Body text: foreground vs background
   - Headings: foreground vs background
   - Links: foreground vs background
   - Error messages: foreground vs background
   - Disabled text: foreground vs background
3. **Expected**: All ratios >= 4.5:1
4. Large text (18pt+): >= 3:1

### Known Issue (To Fix)
```css
/* Dark mode muted foreground - FAILS */
--muted-foreground: oklch(0.708 0 0); /* 2.8:1 ❌ */

/* Should be - PASSES */
--muted-foreground: oklch(0.6 0 0); /* 4.5:1 ✅ */
```

---

## Test 7: Screen Reader Navigation

### Objective
All functionality accessible via screen reader.

### Steps (NVDA on Windows)
1. Start NVDA: `Ctrl+Alt+N`
2. Navigate to Dashboard
3. **Test Reading**:
   - Arrow down: Read line by line
   - Arrow right: Read character by character
   - `H`: Jump to next heading
   - `1`: Jump to level 1 heading
   - `2`: Jump to level 2 heading
4. **Test Navigation**:
   - `Tab`: Next interactive element
   - `Shift+Tab`: Previous interactive element
   - `Enter`: Activate button/link
   - `Space`: Toggle checkbox
5. **Test Lists**:
   - `L`: Jump to list
   - `I`: Jump to list item
6. **Test Landmarks**:
   - `D`: Jump to landmark (region)
   - `M`: Jump to main content

### Pass Criteria
- All content readable with screen reader
- All interactive elements accessible
- Proper heading structure (h1 -> h2 -> h3)
- Landmarks properly defined (main, nav, header, footer)

---

## Test 8: Keyboard-Only Navigation

### Objective
Entire application usable without mouse.

### Steps
1. **Unplug mouse**
2. Navigate through entire app using only keyboard:
   - `Tab`: Next element
   - `Shift+Tab`: Previous element
   - `Enter`: Activate
   - `Space`: Toggle/select
   - `Esc`: Close dialog/menu
   - `Arrow keys`: Navigate lists/menus
3. Try common tasks:
   - Login
   - Navigate to different pages
   - Open command palette (`Cmd+K`)
   - Fill and submit form
   - Close dialogs

### Pass Criteria
- All features accessible via keyboard
- Logical tab order
- No keyboard traps
- Skip link available
- Focus visible on all interactive elements

---

## Automated Testing

### Lighthouse (Chrome DevTools)
1. Open DevTools: `F12` or `Cmd+Option+I`
2. Click "Lighthouse" tab
3. Select "Accessibility" only
4. Click "Analyze page load"
5. **Expected**: Score >= 90

### axe DevTools
1. Install extension: https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd
2. Click axe icon in toolbar
3. Click "Scan ALL of my page"
4. **Expected**: Zero critical violations

---

## Checklist Summary

### Keyboard Navigation
- [ ] Tab through page - logical order
- [ ] Shift+Tab - reverse order
- [ ] Skip link appears on first tab
- [ ] Enter/Space activates buttons
- [ ] Esc closes dialogs
- [ ] Arrow keys navigate lists
- [ ] Focus visible on all elements

### Screen Reader
- [ ] Page titles announced
- [ ] Headings properly structured
- [ ] Landmarks defined
- [ ] Labels announced for inputs
- [ ] Errors announced
- [ ] Dynamic changes announced

### Visual
- [ ] Focus indicators visible
- [ ] Color contrast >= 4.5:1
- [ ] Text resizable to 200%
- [ ] No low-contrast text

### Forms
- [ ] All inputs have labels
- [ ] Errors properly associated
- [ ] Required fields marked
- [ ] Instructions provided
- [ ] Invalid states marked

---

## Common Issues Found

### Issue 1: Focus Not Visible
**Fix**: Add `*:focus-visible` styles to CSS
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Issue 2: Form Errors Not Announced
**Fix**: Use FormField component with ARIA attributes
```tsx
<FormField id="email" error={error} required>
  {({ id, 'aria-invalid', 'aria-describedby' }) => (
    <input {...{ id, 'aria-invalid', 'aria-describedby' }} />
  )}
</FormField>
```

### Issue 3: Low Contrast Text
**Fix**: Increase color lightness in dark mode
```css
/* Before: oklch(0.708 0 0) - 2.8:1 */
--muted-foreground: oklch(0.6 0 0); /* 4.5:1 */
```

### Issue 4: No Page Title
**Fix**: Add usePageTitle hook to all pages
```tsx
import { usePageTitle } from '@/hooks/use-page-title';
usePageTitle('page.title', 'App Name');
```

---

## Reporting Issues

When reporting accessibility issues, include:
1. **Page URL**: Where issue occurs
2. **Screen Reader**: NVDA, JAWS, VoiceOver, etc.
3. **Browser**: Chrome, Firefox, Safari, etc.
4. **Steps**: Exact steps to reproduce
5. **Expected**: What should happen
6. **Actual**: What actually happens
7. **WCAG Criterion**: Which success criterion is violated

Example:
```
**Issue**: Form errors not announced by screen reader
**Page**: /en/signin
**Screen Reader**: NVDA 2023.3
**Browser**: Chrome 120
**Steps**:
1. Navigate to signin page
2. Submit form without filling fields
3. NVDA does not announce error messages
**Expected**: NVDA should announce "Email is required, Password is required"
**Actual**: No error announcement
**WCAG**: 3.3.1 Error Identification
```

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Guidelines](https://webaim.org/)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [VoiceOver macOS Guide](https://www.apple.com/accessibility/voiceover/guide/)

---

**Remember**: Test with real users, including assistive technology users, for best results.
