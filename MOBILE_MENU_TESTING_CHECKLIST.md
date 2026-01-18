# Mobile Menu Testing Checklist

## Pre-Testing Setup

### Environment Setup
- [ ] Install framer-motion: `npm install framer-motion@^11.15.0`
- [ ] Replace sidebar with enhanced version
- [ ] Clear browser cache and cookies
- [ ] Open Chrome DevTools (F12 or Cmd+Option+I)
- [ ] Toggle device toolbar (Cmd+Shift+M or Ctrl+Shift+M)
- [ ] Select mobile device preset (iPhone 12 Pro, Samsung Galaxy, etc.)

### Test Devices
**Real Devices (if available):**
- [ ] iPhone (iOS 14+)
- [ ] Android Phone (Android 10+)
- [ ] iPad (tablet view)
- [ ] Different screen sizes

**Browser Emulation:**
- [ ] Chrome DevTools (mobile emulation)
- [ ] Firefox Responsive Design Mode
- [ ] Safari Technology Preview
- [ ] Edge DevTools

---

## Visual Tests

### 1. Floating Action Button (FAB)

#### Initial State (Menu Closed)
- [ ] FAB is visible at bottom-right corner
- [ ] FAB has 14px border radius (fully circular)
- [ ] FAB has shadow effect
- [ ] FAB shows Menu icon (hamburger)
- [ ] Pulse animation is visible on FAB
- [ ] FAB is positioned correctly: `bottom-6 right-6`
- [ ] FAB has correct z-index (above all content)

#### Hover State (Desktop)
- [ ] FAB scales up to 110% on hover
- [ ] Hover transition is smooth (200ms)
- [ ] Background color darkens slightly

#### Active/Pressed State
- [ ] FAB scales down to 95% when pressed
- [ ] Active transition is smooth
- [ ] Visual feedback is immediate

#### Menu Open State
- [ ] FAB icon rotates 90 degrees clockwise
- [ ] Rotation animation is smooth (200ms)
- [ ] Pulse animation stops when menu is open
- [ ] ARIA label changes to "Close menu"

#### Accessibility
- [ ] Button is minimum 44x44px (actually 56x56px)
- [ ] Focus ring is visible when tabbing to button
- [ ] ARIA label is present: "Open menu" / "Close menu"
- [ ] ARIA expanded state is correct

---

### 2. Overlay/Backdrop

#### Visibility
- [ ] Overlay appears when menu opens
- [ ] Overlay covers entire screen
- [ ] Overlay has backdrop blur effect
- [ ] Overlay has correct z-index (below sidebar, above content)

#### Animation
- [ ] Overlay fades in smoothly (200ms)
- [ ] Overlay fades out smoothly when closing
- [ ] No visual glitches during transition

#### Interaction
- [ ] Tapping overlay closes menu
- [ ] Tap works anywhere on overlay
- [ ] Haptic feedback triggers on tap
- [ ] Menu closes immediately

#### Color/Opacity
- [ ] Overlay has correct opacity: `bg-black/30`
- [ ] Content behind overlay is visible but blurred
- [ ] Overlay is not too dark (legibility check)

---

### 3. Sidebar Animation

#### Opening Animation
- [ ] Sidebar slides in from left
- [ ] Animation uses spring physics
- [ ] Animation is smooth (60fps)
- [ ] Animation duration is appropriate (~0.5s)
- [ ] No overshoot or wobble
- [ ] Sidebar ends at correct position (x: 0)

#### Closing Animation
- [ ] Sidebar slides out to left
- [ ] Animation matches opening direction
- [ ] Animation is smooth
- [ ] Sidebar returns to `x: -100%`

#### Desktop Behavior
- [ ] Sidebar is always visible on desktop (lg breakpoint)
- [ ] Sidebar does not animate on desktop
- [ ] Sidebar has static position on desktop

---

### 4. Sidebar Content

#### Header Section
- [ ] Tenant name/logo is visible
- [ ] Close button (X) is present on mobile
- [ ] Close button works correctly
- [ ] Header has bottom border
- [ ] Header padding is correct

#### Search Bar
- [ ] Search input is visible
- [ ] Search icon is present on left
- [ ] Placeholder text says "Search menu..."
- [ ] Input field has proper styling
- [ ] Input has focus ring when focused
- [ ] Typing filters menu items
- [ ] Clear button appears when typing (optional)

#### Navigation Items
- [ ] All navigation items are visible
- [ ] Icons are aligned correctly
- [ ] Text is readable
- [ ] Items have proper spacing
- [ ] Items have minimum 44px height
- [ ] Items have proper padding (12px horizontal)

#### Active State
- [ ] Current page is highlighted
- [ ] Active item has primary color background
- [ ] Active item has dot indicator on right
- [ ] Dot indicator animation is smooth (scale in)
- [ ] Active item text color changes
- [ ] Parent group expands if child is active

#### Hover States (Desktop)
- [ ] Items have hover background color
- [ ] Hover transition is smooth
- [ ] Items scale slightly on hover (1.02)
- [ ] Cursor changes to pointer

#### Pressed States
- [ ] Items scale down when pressed (0.98)
- [ ] Scale animation is immediate
- [ ] Haptic feedback triggers

---

### 5. Navigation Groups (Accordion)

#### Collapsed State
- [ ] Group title is visible
- [ ] Chevron icon points right
- [ ] Group has background color (if active or expanded)
- [ ] Group is clickable/tappable

#### Expanded State
- [ ] Group expands smoothly
- [ ] Child items animate in
- [ ] Chevron rotates 180 degrees
- [ ] Height animates from 0 to auto
- [ ] No height jumps or glitches
- [ ] Left border appears on child items
- [ ] Child items are indented (pl-4)

#### Auto-Expand
- [ ] Groups with active items auto-expand
- [ ] Auto-expand happens on menu open
- [ ] Multiple groups can be expanded

#### Toggle Behavior
- [ ] Clicking group header toggles expansion
- [ ] Haptic feedback on toggle
- [ ] Only one group closes at a time (or multiple?)

---

### 6. Swipe Gestures

#### Swipe Left to Close
- [ ] Touch sidebar anywhere and swipe left
- [ ] Sidebar follows finger during swipe
- [ ] Visual feedback during drag (transform)
- [ ] Menu closes when swipe distance > 80px
- [ ] Menu snaps back if swipe < 80px
- [ ] Animation is smooth

#### Swipe Threshold
- [ ] Test with various swipe distances
  - [ ] 20px: Should snap back
  - [ ] 50px: Should snap back
  - [ ] 80px: Should close
  - [ ] 150px: Should close
- [ ] Threshold feels natural

#### Touch Events
- [ ] Touch start is registered correctly
- [ ] Touch move updates position smoothly
- [ ] Touch end triggers close or snap back
- [ ] No stuck touch states

---

### 7. User Menu (Bottom Section)

#### Avatar Display
- [ ] User avatar is visible
- [ ] Avatar shows first letter of email if no image
- [ ] Avatar has background color
- [ ] Avatar is 40px (h-10 w-10)

#### User Info
- [ ] User name is displayed
- [ ] User email is displayed
- [ ] Text truncates if too long
- [ ] Text is readable

#### Dropdown Menu
- [ ] Clicking user menu opens dropdown
- [ ] Dropdown has correct position
- [ ] "Edit Profile" option works
- [ ] "Sign Out" option works
- [ ] Sign out has red color
- [ ] Log out icon is present
- [ ] Haptic feedback on sign out

---

### 8. Haptic Feedback

#### Menu Interactions
- [ ] Light tap when clicking menu items
- [ ] Medium tap when opening menu
- [ ] Light tap when closing menu
- [ ] Warning tap when clicking unimplemented page
- [ ] Error tap when signing out

#### Test on Real Device
- [ ] Test on iPhone (iOS)
- [ ] Test on Android
- [ ] Verify vibration patterns are distinct
- [ ] Verify intensity is appropriate

#### Fallback
- [ ] No errors on desktop (no vibration API)
- [ ] No errors in console
- [ ] Graceful degradation

---

## Functional Tests

### 1. Navigation

#### Basic Navigation
- [ ] Click Dashboard → navigates to /dashboard
- [ ] Menu closes after navigation
- [ ] Page loads successfully
- [ ] Dashboard is highlighted as active

#### Group Navigation
- [ ] Click Accounting group → expands
- [ ] Click Chart of Accounts → navigates to /accounting/coa
- [ ] Menu closes
- [ ] Page loads
- [ ] Chart of Accounts is highlighted

#### Unimplemented Pages
- [ ] Click General Ledger → shows toast
- [ ] Toast says "General Ledger page coming soon!"
- [ ] Toast has description
- [ ] Toast stays for 3 seconds
- [ ] Menu does not close (or closes? choose behavior)
- [ ] Haptic feedback (warning pattern)

#### Back Button
- [ ] Navigate to page
- [ ] Press browser back button
- [ ] Previous page loads
- [ ] Menu state is correct

---

### 2. Search Functionality

#### Basic Search
- [ ] Type "dashboard" in search
- [ ] Only "Dashboard" item shows
- [ ] Other items are hidden
- [ ] Clear search → all items show

#### Group Search
- [ ] Type "accounting"
- [ ] Accounting group shows
- [ ] Group children show
- [ ] Other groups hide

#### Child Search
- [ ] Type "journals"
- [ ] Accounting group shows (parent)
- [ ] Journals item shows (child)
- [ ] Other items hide

#### No Results
- [ ] Type "xyz123"
- [ ] "No menu items found" message shows
- [ ] Message is centered
- [ ] Message has appropriate styling

---

### 3. Keyboard Support

#### Tab Navigation
- [ ] Tab to FAB button
- [ ] Press Enter/Space → menu opens
- [ ] Tab through menu items
- [ ] Focus rings are visible
- [ ] Press Enter/Space on item → navigates

#### Escape Key
- [ ] Open menu
- [ ] Press Escape → menu closes
- [ ] Focus returns to FAB

#### Arrow Keys
- [ ] Use arrow keys to navigate (optional)
- [ ] Up/down arrows move focus
- [ ] Left/right arrows expand/collapse groups

---

### 4. Accessibility

#### Screen Reader
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)

**Verify:**
- [ ] FAB button announces "Open menu" or "Close menu"
- [ ] Menu items are announced correctly
- [ ] Active state is announced
- [ ] Expanded/collapsed state is announced
- [ ] ARIA labels are descriptive

#### Focus Management
- [ ] Focus is trapped in menu when open
- [ ] Focus moves to first item when menu opens (optional)
- [ ] Focus returns to trigger when menu closes
- [ ] No focus loss

#### Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text)
- [ ] Focus rings are visible
- [ ] Active states have sufficient contrast
- [ ] Works in dark mode

#### Reduced Motion
- [ ] Set `prefers-reduced-motion: reduce` in DevTools
- [ ] Animations are disabled or simplified
- [ ] Functionality still works
- [ ] No loss of features

---

## Performance Tests

### Animation Performance
- [ ] Open Chrome DevTools Performance tab
- [ ] Record while opening/closing menu
- [ ] Check FPS is 60fps or higher
- [ ] Check for long tasks (>50ms)
- [ ] Check for layout thrashing
- [ ] Check for forced reflows

### Bundle Size
- [ ] Run `npm run build`
- [ ] Check bundle size report
- [ ] Framer Motion should be ~40KB gzipped
- [ ] Total bundle size increase should be minimal

### Load Time
- [ ] Measure time to interactive
- [ ] Measure first contentful paint
- [ ] Measure largest contentful paint
- [ ] No significant regression from original

### Memory Usage
- [ ] Open Chrome DevTools Memory tab
- [ ] Take heap snapshot before
- [ ] Open/close menu 50 times
- [ ] Take heap snapshot after
- [ ] No memory leaks

---

## Responsive Tests

### Breakpoints

#### Mobile (< 1024px)
- [ ] Sidebar is hidden by default
- [ ] FAB is visible
- [ ] Menu is full-screen width when open
- [ ] Overlay is present

#### Desktop (≥ 1024px - lg breakpoint)
- [ ] Sidebar is always visible
- [ ] FAB is hidden
- [ ] Sidebar has static position
- [ ] No overlay
- [ ] No swipe gestures needed

### Screen Sizes

#### Small Mobile (320px - 375px)
- [ ] iPhone SE
- [ ] Menu fits on screen
- [ ] No horizontal scroll
- [ ] Text is readable
- [ ] Buttons are tappable

#### Standard Mobile (375px - 414px)
- [ ] iPhone 12/13/14
- [ ] Samsung Galaxy S series
- [ ] All features work

#### Large Mobile (414px - 768px)
- [ ] iPhone Pro Max
- [ ] Google Pixel XL
- [ ] All features work
- [ ] Extra whitespace is acceptable

#### Tablet (768px - 1023px)
- [ ] iPad
- [ ] Samsung Galaxy Tab
- [ ] Consider showing sidebar always?
- [ ] Current implementation works

---

## Cross-Browser Tests

### Desktop Browsers
- [ ] Chrome 120+
- [ ] Firefox 120+
- [ ] Safari 17+
- [ ] Edge 120+

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile
- [ ] Edge Mobile
- [ ] Samsung Internet

### Test Each Browser For
- [ ] Menu opens
- [ ] Menu closes
- [ ] Animations work
- [ ] Swipe works (where supported)
- [ ] Haptic works (where supported)
- [ ] No console errors
- [ ] No visual glitches

---

## Regression Tests

### Existing Features
- [ ] Desktop sidebar still works
- [ ] Navigation still works
- [ ] Active states still work
- [ ] User menu still works
- [ ] Sign out still works
- [ ] i18n still works
- [ ] Dark mode still works
- [ ] All pages accessible

### No Breaking Changes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No build errors
- [ ] No runtime errors
- [ ] All tests pass

---

## Real-World Scenarios

### Scenario 1: First-Time User
1. [ ] User opens app on mobile
2. [ ] FAB is visible and pulsing
3. [ ] User taps FAB
4. [ ] Menu opens with smooth animation
5. [ ] Haptic feedback confirms action
6. [ ] User sees search bar
7. [ ] User sees navigation items
8. [ ] User taps Dashboard
9. [ ] Menu closes smoothly
10. [ ] Dashboard page loads

### Scenario 2: Power User
1. [ ] User wants to navigate quickly
2. [ ] User taps FAB
3. [ ] User immediately taps target item
4. [ ] Navigation completes in < 2 seconds
5. [ ] User continues work

### Scenario 3: Search Usage
1. [ ] User opens menu
2. [ ] User types in search
3. [ ] Menu filters in real-time
4. [ ] User sees desired item
5. [ ] User taps item
6. [ ] Navigation completes

### Scenario 4: Gesture User
1. [ ] User opens menu
2. [ ] User swipes left to close
3. [ ] Menu follows finger
4. [ ] Menu closes smoothly
5. [ ] User is back at content

### Scenario 5: Accessibility User
1. [ ] User navigates with keyboard
2. [ ] User tabs to FAB
3. [ ] User presses Enter
4. [ ] Menu opens
5. [ ] User tabs to desired item
6. [ ] User presses Enter
7. [ ] Navigation completes

---

## Bug Reporting Template

If you find issues, report them with this format:

```markdown
## Bug Title

**Environment:**
- Device: [e.g., iPhone 12 Pro]
- OS: [e.g., iOS 17.0]
- Browser: [e.g., Safari 17]
- Screen Size: [e.g., 390x844]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots/Videos:**
Attach if possible

**Console Errors:**
Paste any error messages

**Severity:**
- [ ] Critical (blocks usage)
- [ ] High (major impact)
- [ ] Medium (minor impact)
- [ ] Low (cosmetic)
```

---

## Test Summary

### Pass Criteria
- [ ] All critical tests pass (100%)
- [ ] All high-priority tests pass (95%+)
- [ ] All medium-priority tests pass (90%+)
- [ ] No critical bugs
- [ ] No high-priority bugs
- [ ] Performance meets requirements (60fps)

### Sign-Off
- [ ] Tested by: _______________
- [ ] Date: _______________
- [ ] Result: ✅ PASS / ❌ FAIL
- [ ] Notes: _______________

---

## Quick Reference

### Keyboard Shortcuts
- `Tab` - Navigate between elements
- `Enter/Space` - Activate button/link
- `Escape` - Close menu
- `Shift+Tab` - Navigate backwards

### DevTools Tips
- `Cmd+Shift+M` - Toggle device toolbar (Chrome)
- `Cmd+Option+I` - Open DevTools (Mac)
- `F12` - Open DevTools (Windows)
- `Ctrl+Shift+M` - Toggle device toolbar (Windows)

### Test URLs
- Local: `http://localhost:3000`
- Staging: `https://staging.example.com`
- Production: `https://example.com`

### Common Issues & Solutions

**Issue:** Menu not opening
- **Solution:** Check if framer-motion is installed

**Issue:** Animations are jerky
- **Solution:** Check if other processes are running

**Issue:** Swipe not working
- **Solution:** Ensure touch-action CSS is not interfering

**Issue:** No haptic feedback
- **Solution:** Test on real device, not emulator

---

**Last Updated:** 2026-01-17
**Version:** 2.0.0
**Status:** Ready for Testing
