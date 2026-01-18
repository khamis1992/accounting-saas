# Animation Components

A comprehensive animation library built with Framer Motion for smooth, performant transitions in Next.js applications.

## Features

- **Smooth Page Transitions** - Fade, slide, and scale animations
- **Accessibility First** - Respects `prefers-reduced-motion`
- **Performance Optimized** - 60fps animations with minimal re-renders
- **Easy to Use** - Simple, composable components
- **TypeScript Support** - Fully typed components
- **RTL Compatible** - Works seamlessly with Arabic/RTL layouts

## Installation

Framer Motion is already installed in the project:

```bash
npm install framer-motion
```

## Quick Start

### 1. Page Transitions

Wrap your page content with `PageTransition` for smooth navigation:

```tsx
import { PageTransition } from "@/components/animations";

export default function MyPage() {
  return (
    <PageTransition>
      <div>Your page content</div>
    </PageTransition>
  );
}
```

### 2. Fade Transitions

Simple fade in/out:

```tsx
import { FadeTransition } from "@/components/animations";

<FadeTransition duration={0.3}>
  <Content />
</FadeTransition>;
```

### 3. Slide Transitions

Slide from any direction:

```tsx
import { SlideTransition } from "@/components/animations";

<SlideTransition direction="right" duration={0.3}>
  <Content />
</SlideTransition>;
```

### 4. Scale Transitions

Grow/shrink with fade:

```tsx
import { ScaleTransition } from "@/components/animations";

<ScaleTransition duration={0.2}>
  <ModalContent />
</ScaleTransition>;
```

### 5. Stagger Animations

Animate lists with cascading effects:

```tsx
import { StaggerChildren } from "@/components/animations";

<StaggerChildren staggerDelay={0.05}>
  <Item>Item 1</Item>
  <Item>Item 2</Item>
  <Item>Item 3</Item>
</StaggerChildren>;
```

### 6. Loading Skeletons

Animated loading states:

```tsx
import { SkeletonWithAnimation, SkeletonCard } from '@/components/loading';

<SkeletonWithAnimation className="h-12 w-full" />
<SkeletonCard />
```

## Animation Presets

Use pre-configured animation presets:

```tsx
import { useAnimationPreset } from "@/hooks";

function MyComponent() {
  const preset = useAnimationPreset("fadeIn");

  return <motion.div {...preset}>Content</motion.div>;
}
```

Available presets:

- `fadeIn` - Simple fade
- `slideInRight` - Slide from right
- `slideInLeft` - Slide from left
- `scaleIn` - Scale with fade
- `springIn` - Springy scale
- `slideUp` - Slide from bottom

## Hooks

### useReducedMotion

Automatically respects user's motion preferences:

```tsx
import { useReducedMotion } from "@/hooks";

function MyComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ scale: reducedMotion ? 1 : 1.1 }}
      transition={reducedMotion ? { duration: 0 } : undefined}
    >
      Content
    </motion.div>
  );
}
```

### useRouteTransition

Track route changes for coordinated animations:

```tsx
import { useRouteTransition } from "@/hooks";

function MyComponent() {
  const { isTransitioning, pathname, direction } = useRouteTransition();

  return <div className={isTransitioning ? "opacity-50" : "opacity-100"}>Content</div>;
}
```

## Accessibility

All animation components respect the `prefers-reduced-motion` media query. Users who prefer reduced motion will see simplified or disabled animations.

For custom animations, use `AdaptiveAnimation`:

```tsx
import { AdaptiveAnimation } from "@/components/animations";

<AdaptiveAnimation initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
  <Content />
</AdaptiveAnimation>;
```

## Performance Tips

1. **Use CSS transforms** - Animate `x`, `y`, `scale` instead of `top`, `left`
2. **Avoid layout thrashing** - Don't animate width/height
3. **Use will-change sparingly** - Only for complex animations
4. **Test on low-end devices** - Ensure animations stay smooth
5. **Respect reduced motion** - Always provide accessible alternatives

## Examples

### Animated List

```tsx
import { StaggerChildren } from "@/components/animations";

function UserList({ users }) {
  return (
    <StaggerChildren staggerDelay={0.05}>
      {users.map((user) => (
        <div key={user.id} className="p-4 border rounded">
          {user.name}
        </div>
      ))}
    </StaggerChildren>
  );
}
```

### Animated Modal

```tsx
import { ScaleTransition } from "@/components/animations";

function Modal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <ScaleTransition>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2>Modal Title</h2>
          <p>Modal content</p>
          <button onClick={onClose}>Close</button>
        </div>
      </ScaleTransition>
    </div>
  );
}
```

### Animated Cards

```tsx
import { motion } from "framer-motion";

function AnimatedCard({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-6 border rounded-lg"
    >
      {children}
    </motion.div>
  );
}

// Usage with stagger
function CardGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <AnimatedCard delay={0}>Card 1</AnimatedCard>
      <AnimatedCard delay={0.1}>Card 2</AnimatedCard>
      <AnimatedCard delay={0.2}>Card 3</AnimatedCard>
    </div>
  );
}
```

## Integration with Layouts

The animation components are already integrated into the app:

- **Root Layout** - Uses `TemplateTransition` for global transitions
- **Authenticated Layout** - Uses `PageTransition` for authenticated pages

## Testing

Checklist for animations:

- [ ] Animations are smooth (60fps)
- [ ] No janky movements
- [ ] Respects prefers-reduced-motion
- [ ] Works on mobile
- [ ] Works in RTL layouts
- [ ] No console errors
- [ ] No visual glitches
- [ ] Loading states animate properly
- [ ] List items stagger correctly

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Animations not working

1. Check if Framer Motion is installed
2. Verify components are marked `'use client'`
3. Check browser console for errors
4. Ensure `AnimatePresence` is used for exit animations

### Poor performance

1. Reduce animation duration
2. Simplify animation variants
3. Use `will-change` CSS property
4. Test on slower devices
5. Profile with React DevTools

### Accessibility issues

1. Test with prefers-reduced-motion
2. Provide static alternatives
3. Ensure animations can be skipped
4. Test with screen readers

## Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Web Accessibility: Animations](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## Contributing

When adding new animations:

1. Test performance on multiple devices
2. Add TypeScript types
3. Include accessibility considerations
4. Document usage examples
5. Test with reduced motion

## License

MIT
