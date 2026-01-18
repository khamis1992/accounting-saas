# Animation Testing Checklist

## Pre-Flight Checks

- [ ] Framer Motion installed (`npm list framer-motion`)
- [ ] Build passes without errors
- [ ] TypeScript compilation succeeds
- [ ] No console errors during development

## Basic Animation Tests

### Page Transitions

- [ ] Navigate between pages smoothly
- [ ] Fade effect is visible (not instant, not too slow)
- [ ] No visual glitches during transition
- [ ] Animation completes before next page renders

### Authenticated Layout

- [ ] Page transition wraps content correctly
- [ ] Breadcrumb doesn't interfere with animation
- [ ] Sidebar and topbar remain stable during navigation

### Template Transition

- [ ] Template remounts on navigation
- [ ] Animation triggers on every route change
- [ ] Scale effect is subtle and smooth

## Component-Specific Tests

### FadeTransition

- [ ] Content fades in smoothly
- [ ] Custom duration works
- [ ] Custom delay works
- [ ] Exit animation works

### SlideTransition

- [ ] Slides from correct direction (right, left, up, down)
- [ ] Distance parameter works
- [ ] Duration parameter works
- [ ] Works in RTL layouts

### ScaleTransition

- [ ] Scale effect is smooth
- [ ] Initial scale parameter works
- [ ] Good for modals and dialogs

### StaggerChildren

- [ ] Items animate in sequence
- [ ] Stagger delay parameter works
- [ ] Works with dynamic number of children
- [ ] Works with lists and grids

### SkeletonWithAnimation

- [ ] Pulse animation is smooth
- [ ] Custom width/height work
- [ ] SkeletonCard displays correctly
- [ ] Loading state looks professional

## Accessibility Tests

### Reduced Motion

- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Animations are disabled or simplified
- [ ] Content still accessible without animations
- [ ] No motion sickness triggers

### Keyboard Navigation

- [ ] Tab navigation works with animations
- [ ] Focus indicators visible during transitions
- [ ] No keyboard traps during animations

### Screen Readers

- [ ] Content announced correctly after animation
- [ ] No unnecessary announcements during transitions
- [ ] ARIA live regions work properly

## Performance Tests

### Frame Rate

- [ ] Animations run at 60fps
- [ ] No janky movements
- [ ] Smooth on mobile devices
- [ ] Smooth on low-end devices

### Bundle Size

- [ ] Framer Motion bundle size acceptable
- [ ] Tree-shaking works correctly
- [ ] No unnecessary code imported

### Memory

- [ ] No memory leaks during navigation
- [ ] Animations clean up properly
- [ ] No lingering event listeners

## Browser Compatibility

### Desktop Browsers

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers

- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet
- [ ] Firefox Mobile

## RTL (Right-to-Left) Tests

- [ ] Animations work in Arabic layout
- [ ] Slide directions respect RTL
- [ ] No horizontal scrollbar issues
- [ ] Text alignment correct during animation

## Real-World Scenarios

### Dashboard Navigation

- [ ] Animating between dashboard sections
- [ ] Charts and data animate smoothly
- [ ] No layout shift during transitions

### Forms

- [ ] Form validation messages animate
- [ ] Modal forms animate smoothly
- [ ] Form submission loading states animate

### Lists and Tables

- [ ] Table rows animate on load
- [ ] Pagination triggers animation
- [ ] Filtering/sorting triggers animation

### Modals and Drawers

- [ ] Modal open animation smooth
- [ ] Modal close animation smooth
- [ ] Drawer slide animation works
- [ ] Backdrop blur animation works

## Edge Cases

### Fast Navigation

- [ ] Clicking multiple links quickly doesn't break
- [ ] Animations cancel properly
- [ ] No animation pile-up

### Slow Network

- [ ] Animations work with slow data loading
- [ ] Skeletons display correctly
- [ ] No FOUC (Flash of Unstyled Content)

### Error States

- [ ] Error pages animate correctly
- [ ] Error messages animate
- [ ] No animation on critical errors

## Mobile-Specific Tests

### Touch Interactions

- [ ] Tap animations work
- [ ] Swipe gestures work with animations
- [ ] No delay on touch

### Orientation Changes

- [ ] Animations survive orientation change
- [ ] No layout break on rotate
- [ ] Smooth transition between orientations

### Viewport Size

- [ ] Works on small screens (320px)
- [ ] Works on large screens
- [ ] Responsive during animation

## Performance Profiling

### Chrome DevTools

- [ ] Performance recording shows 60fps
- [ ] No long tasks (>50ms)
- [ ] No layout thrashing
- [ ] Paint times acceptable

### React DevTools

- [ ] No unnecessary re-renders
- [ ] Component updates optimized
- [ ] Memoization working where needed

## User Experience

### Perception

- [ ] Animations feel natural
- [ ] Not too fast, not too slow
- [ ] Consistent timing across app
- [ ] Pleasant to watch

### Feedback

- [ ] Visual feedback on interactions
- [ ] Loading states clear
- [ ] Progress indication
- [ ] Success/error states animate

## Documentation Tests

### Code Examples

- [ ] Examples in README work
- [ ] Demo page renders correctly
- [ ] TypeScript types accurate
- [ ] Props documented

## Regression Tests

### Navigation

- [ ] All pages accessible
- [ ] No broken routes
- [ ] Back button works
- [ ] Browser forward button works

### State Management

- [ ] Form state preserved during navigation
- [ ] Scroll position preserved
- [ ] User sessions maintained

## Final Checklist

### Must-Have

- [ ] Zero console errors
- [ ] All animations smooth (60fps)
- [ ] Accessibility compliant
- [ ] Works on all target browsers
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] RTL compatible

### Nice-to-Have

- [ ] Spring animations for playful interactions
- [ ] Custom easing curves
- [ ] Stagger animations for lists
- [ ] Layout animations for reordering
- [ ] Shared element transitions

## Testing Commands

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Production preview
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## Testing URLs

After starting dev server, test these URLs:

- http://localhost:3000/en/animations - Animation examples
- http://localhost:3000/en/dashboard - With page transitions
- http://localhost:3000/en/sales/invoices - List with stagger
- http://localhost:3000/en/settings/profile - Form animations

## Automated Testing (Future)

Consider adding:

- [ ] Visual regression tests (Percy, Chromatic)
- [ ] Performance budgets (Lighthouse CI)
- [ ] A11y tests (axe-core)
- [ ] Animation unit tests (Jest + testing-library)

## Sign-Off

Tested by: ******\_******
Date: ******\_******
Browser/Device: ******\_******
Notes: ******\_******
