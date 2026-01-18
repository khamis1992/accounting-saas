# Accessibility Testing Checklist

**Date:** 2026-01-17
**Version:** 1.0
**Purpose:** Verify all medium priority accessibility fixes

---

## Pre-Testing Setup

### Required Tools:
- [ ] NVDA (Windows) - https://www.nvaccess.org/
- [ ] JAWS (Windows) - https://www.freedomscientific.com/
- [ ] VoiceOver (macOS) - Built-in
- [ ] TalkBack (Android) - Built-in
- [ ] axe DevTools - https://www.deque.com/axe/devtools/
- [ ] WebAIM Contrast Checker - https://webaim.org/resources/contrastchecker/

### Test Browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Chrome Mobile (Android)

---

## 1. ARIA Labels Testing

### Test Case 1.1: Icon Buttons in Sidebar
**Steps:**
1. Open the application
2. Navigate to the sidebar
3. Use screen reader to inspect icon buttons
4. Verify each button has a descriptive label

**Expected Results:**
- [ ] Menu toggle button announces "Open menu" or "Close menu"
- [ ] Close button announces "Close menu"
- [ ] All navigation items have text labels
- [ ] User avatar has "Profile picture of {name}" alt text

**Screen Reader Commands:**
- NVDA/JAWS: Tab to each button, listen to announcement
- VoiceOver: VO + → to navigate, listen

**Pass Criteria:**
✅ All icon-only buttons have aria-label
✅ Labels describe the button's purpose
✅ Labels are concise and clear

---

### Test Case 1.2: Topbar Icon Buttons
**Steps:**
1. Navigate to the top bar
2. Test each icon button with screen reader
3. Verify labels are announced

**Expected Results:**
- [ ] Language switcher announces "Change language"
- [ ] Notifications button announces "Notifications"
- [ ] Search button announces "Search"
- [ ] All buttons have aria-label

**Pass Criteria:**
✅ All icon buttons have descriptive labels
✅ Labels are consistent across pages

---

### Test Case 1.3: Dropdown Menu Buttons
**Steps:**
1. Open Recent Items dropdown
2. Open Favorites dropdown
3. Test remove icon buttons with screen reader

**Expected Results:**
- [ ] Remove recent items: "Remove {item title} from recent items"
- [ ] Remove favorites: "Remove {item title} from favorites"
- [ ] Contextual information included in labels

**Pass Criteria:**
✅ Icon buttons in dropdowns have aria-labels
✅ Labels include item context
✅ Screen reader announces full context

---

## 2. Alt Text Testing

### Test Case 2.1: Avatar Images
**Steps:**
1. Navigate to user avatar in sidebar
2. Use screen reader to inspect image
3. Verify alt text is descriptive

**Expected Results:**
- [ ] Avatar announces "Profile picture of {name or email}"
- [ ] Fallback text is used when no name available
- [ ] Alt text is never empty unless decorative

**Pass Criteria:**
✅ All avatars have descriptive alt text
✅ Alt text includes user's name or email
✅ No avatars missing alt attribute

**Screen Reader Commands:**
- NVDA: NVDA + d (describe image)
- JAWS: Insert + d (describe image)
- VoiceOver: VO + Shift + l (get image description)

---

## 3. Focus Indicator Testing

### Test Case 3.1: Tab Navigation
**Steps:**
1. Press Tab repeatedly through the page
2. Observe focus indicator on each element
3. Verify focus is clearly visible

**Expected Results:**
- [ ] Focus indicator is 3px outline
- [ ] Focus indicator has high contrast
- [ ] Focus indicator is visible in light mode
- [ ] Focus indicator is visible in dark mode
- [ ] Focus indicator has rounded corners

**Pass Criteria:**
✅ Focus is clearly visible on all interactive elements
✅ Focus indicator meets WCAG AAA (3px outline)
✅ Focus is visible in both light and dark modes

**Visual Test:**
- Light mode: Focus should be visible on white background
- Dark mode: Focus should be visible on dark background
- Color contrast should be at least 3:1 for focus indicator

---

### Test Case 3.2: Focus Order
**Steps:**
1. Press Tab through the entire page
2. Verify focus order is logical
3. Test Shift+Tab for reverse navigation

**Expected Results:**
- [ ] Focus follows visual order
- [ ] Focus moves left-to-right, top-to-bottom
- [ ] No focus jumps between unrelated sections
- [ ] Shift+Tab reverses focus order correctly

**Pass Criteria:**
✅ Focus order matches visual layout
✅ No unexpected focus jumps
✅ Reverse focus works correctly

---

## 4. Form Label Testing

### Test Case 4.1: Label Associations
**Steps:**
1. Navigate to any form (e.g., login, settings)
2. Use screen reader to inspect form fields
3. Verify labels are properly associated

**Expected Results:**
- [ ] Each input has an associated label
- [ ] Screen reader announces label when focusing input
- [ ] Clicking label focuses the input
- [ ] Required fields are marked with asterisk and aria-label

**Pass Criteria:**
✅ All form inputs have associated labels
✅ Labels are programmatically associated via htmlFor/id
✅ Required fields are clearly indicated

**Screen Reader Commands:**
- NVDA/JAWS: Tab to input, listen for label announcement
- VoiceOver: VO + → to navigate to form field

---

### Test Case 4.2: Error Messages
**Steps:**
1. Submit a form with invalid data
2. Navigate to error messages
3. Test error message links

**Expected Results:**
- [ ] Error messages are announced by screen reader
- [ ] Error messages have role="alert"
- [ ] Error messages have aria-live="polite"
- [ ] Error messages link to associated fields
- [ ] Clicking error message focuses the field

**Pass Criteria:**
✅ Error messages are announced
✅ Error messages are clickable links
✅ Clicking jumps to and focuses the field
✅ ARIA attributes link errors to fields

---

## 5. Color Contrast Testing

### Test Case 5.1: Text Contrast
**Steps:**
1. Use axe DevTools to check contrast
2. Test all text colors in light mode
3. Test all text colors in dark mode

**Expected Results:**
- [ ] All normal text meets 4.5:1 contrast ratio
- [ ] All large text (18px+) meets 3:1 contrast ratio
- [ ] All error text meets 4.5:1 contrast ratio
- [ ] Both light and dark modes pass

**Pass Criteria:**
✅ All text meets WCAG AA 4.5:1 minimum
✅ Large text exceeds WCAG AAA 7:1
✅ No color contrast failures in axe DevTools

**Tools:**
- axe DevTools: Automated contrast checking
- WebAIM Contrast Checker: Manual verification
- Chrome DevTools: Color picker with contrast ratio

---

### Test Case 5.2: Focus Indicator Contrast
**Steps:**
1. Tab to various elements
2. Measure focus indicator contrast against background
3. Verify in both light and dark modes

**Expected Results:**
- [ ] Focus indicator has 3:1 contrast minimum
- [ ] Visible on all background colors
- [ ] Visible in both light and dark modes

**Pass Criteria:**
✅ Focus indicator always visible
✅ Meets 3:1 contrast requirement
✅ No background color hides focus

---

## 6. Modal Semantics Testing

### Test Case 6.1: Dialog Roles
**Steps:**
1. Open any dialog/modal
2. Use screen reader to inspect modal
3. Verify ARIA attributes are present

**Expected Results:**
- [ ] Modal has role="dialog"
- [ ] Modal has aria-modal="true"
- [ ] Screen reader announces "dialog"
- [ ] Background content is hidden from AT

**Pass Criteria:**
✅ All modals have proper ARIA roles
✅ aria-modal is set to true
✅ Screen reader announces modal role

**Screen Reader Commands:**
- NVDA: NVDA + b (read current dialog)
- JAWS: Insert + b (read current dialog)
- VoiceOver: VO + i (read item)

---

### Test Case 6.2: Focus Trapping
**Steps:**
1. Open a dialog
2. Press Tab repeatedly
3. Verify focus stays within dialog

**Expected Results:**
- [ ] Focus cannot leave the dialog
- [ ] Tab cycles through dialog elements
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger element on close

**Pass Criteria:**
✅ Focus is trapped in modal
✅ Escape closes modal
✅ Focus returns to trigger

---

### Test Case 6.3: AlertDialog
**Steps:**
1. Open an alert dialog
2. Verify screen reader announcement
3. Test role="alertdialog"

**Expected Results:**
- [ ] Screen reader announces "alert dialog"
- [ ] aria-modal="true" is present
- [ ] Focus moves to dialog
- [ ] Dialog cannot be dismissed with Escape (requires action)

**Pass Criteria:**
✅ AlertDialog has proper role
✅ Screen reader announces it's an alert
✅ Requires user action to dismiss

---

## 7. Live Region Testing

### Test Case 7.1: Dynamic Content Announcements
**Steps:**
1. Trigger a status update (e.g., save, load)
2. Verify screen reader announces the update
3. Test with LiveRegion component

**Expected Results:**
- [ ] Status updates are announced
- [ ] role="status" is used for polite announcements
- [ ] role="alert" is used for urgent announcements
- [ ] aria-live="polite" or "assertive" is set

**Pass Criteria:**
✅ Dynamic content is announced
✅ Live region attributes are correct
✅ Announcements don't interrupt user (unless assertive)

---

### Test Case 7.2: Form Error Announcements
**Steps:**
1. Submit a form with errors
2. Verify screen reader announces errors
3. Check aria-live on error messages

**Expected Results:**
- [ ] Errors are announced automatically
- [ ] aria-live="polite" is set
- [ ] role="alert" is set
- [ ] All errors are announced

**Pass Criteria:**
✅ Form errors are announced
✅ aria-live attribute is present
✅ Multiple errors are all announced

---

## 8. Keyboard Navigation Testing

### Test Case 8.1: No Keyboard Traps
**Steps:**
1. Press Tab through entire page
2. Verify no element traps focus
3. Test all interactive components

**Expected Results:**
- [ ] Tab never gets stuck
- [ ] All modals allow focus to exit when closed
- [ ] No custom components trap focus
- [ ] Focus can always move forward and backward

**Pass Criteria:**
✅ No keyboard traps exist
✅ All components allow exit
✅ Focus can always escape

---

### Test Case 8.2: Keyboard Shortcuts
**Steps:**
1. Test keyboard shortcuts
2. Verify all actions have keyboard alternatives
3. Test modifier keys

**Expected Results:**
- [ ] Ctrl+K opens command palette
- [ ] Escape closes modals/menus
- [ ] Arrow keys navigate lists
- [ ] Enter/Space activates buttons
- [ ] Tab navigates between controls

**Pass Criteria:**
✅ All actions have keyboard alternatives
✅ No mouse-only interactions
✅ Shortcuts are documented

---

## 9. Skip Link Testing

### Test Case 9.1: Skip Link Functionality
**Steps:**
1. Load the application
2. Press Tab to focus the skip link
3. Press Enter to activate
4. Verify focus jumps to main content

**Expected Results:**
- [ ] Skip link is first focusable element
- [ ] Skip link appears when focused
- [ ] Skip link has high contrast
- [ ] Activating moves focus to main content
- [ ] Main content has id="main-content"

**Pass Criteria:**
✅ Skip link works correctly
✅ Target ID is present
✅ Focus moves to main content
✅ Skip link is visible when focused

---

## 10. Screen Reader Compatibility

### Test Case 10.1: NVDA (Windows)
**Steps:**
1. Install NVDA
2. Navigate through the application
3. Test all components

**Expected Results:**
- [ ] All buttons are announced correctly
- [ ] All labels are read
- [ ] All errors are announced
- [ ] Navigation is smooth
- [ ] No silent elements

**Pass Criteria:**
✅ NVDA can navigate entire application
✅ All elements are announced
✅ No accessibility issues

---

### Test Case 10.2: JAWS (Windows)
**Steps:**
1. Install JAWS
2. Navigate through the application
3. Test all components

**Expected Results:**
- [ ] All buttons are announced correctly
- [ ] All labels are read
- [ ] All errors are announced
- [ ] Navigation is smooth
- [ ] No silent elements

**Pass Criteria:**
✅ JAWS can navigate entire application
✅ All elements are announced
✅ No accessibility issues

---

### Test Case 10.3: VoiceOver (macOS/iOS)
**Steps:**
1. Enable VoiceOver (Cmd + F5)
2. Navigate through the application
3. Test all components

**Expected Results:**
- [ ] All buttons are announced correctly
- [ ] All labels are read
- [ ] All errors are announced
- [ ] Navigation is smooth
- [ ] No silent elements

**Pass Criteria:**
✅ VoiceOver can navigate entire application
✅ All elements are announced
✅ No accessibility issues

---

### Test Case 10.4: TalkBack (Android)
**Steps:**
1. Enable TalkBack
2. Navigate through the application
3. Test all components

**Expected Results:**
- [ ] All buttons are announced correctly
- [ ] All labels are read
- [ ] All errors are announced
- [ ] Navigation is smooth
- [ ] No silent elements

**Pass Criteria:**
✅ TalkBack can navigate entire application
✅ All elements are announced
✅ No accessibility issues

---

## Automated Testing

### axe DevTools Scan

**Steps:**
1. Install axe DevTools extension
2. Run scan on all pages
3. Review results

**Expected Results:**
- [ ] Zero violations in all categories
- [ ] No "Critical" issues
- [ ] No "Serious" issues
- [ ] All "Moderate" and "Minor" issues reviewed

**Pass Criteria:**
✅ Zero Critical/Serious violations
✅ All Medium priority issues fixed
✅ Less than 5 Minor issues (acceptable)

---

## Test Results Summary

### By Browser:
- [ ] Chrome/Edge: Pass/Fail
- [ ] Firefox: Pass/Fail
- [ ] Safari: Pass/Fail
- [ ] Mobile Safari: Pass/Fail
- [ ] Mobile Chrome: Pass/Fail

### By Screen Reader:
- [ ] NVDA: Pass/Fail
- [ ] JAWS: Pass/Fail
- [ ] VoiceOver: Pass/Fail
- [ ] TalkBack: Pass/Fail

### By Category:
1. ARIA Labels: Pass/Fail
2. Alt Text: Pass/Fail
3. Focus Indicators: Pass/Fail
4. Form Labels: Pass/Fail
5. Color Contrast: Pass/Fail
6. Error Links: Pass/Fail
7. Modal Semantics: Pass/Fail
8. Live Regions: Pass/Fail
9. Keyboard Traps: Pass/Fail
10. Skip Link: Pass/Fail

---

## Overall Assessment

**Total Test Cases:** 50
**Passed:** ___
**Failed:** ___
**Pass Rate:** ___%

**WCAG 2.1 AA Compliance:** ✅ YES / ❌ NO

**Recommendations:**
_______________________________________________
_______________________________________________
_______________________________________________

**Tester Name:** _______________
**Test Date:** _______________
**Signature:** _______________

---

## Notes

Add any additional observations, issues found, or suggestions for improvement below:

_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Next Review:** After each major release
