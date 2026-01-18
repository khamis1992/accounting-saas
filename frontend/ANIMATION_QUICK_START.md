# Animation Quick Start Guide

Get started with animations in 5 minutes!

## Installation

Framer Motion is already installed. If not:

```bash
npm install framer-motion
```

## Basic Usage

### 1. Page Transitions (Already Configured)

Page transitions are already integrated into the app layouts. No additional setup needed!

**What's already working:**

- Root layout uses `TemplateTransition`
- Authenticated layout uses `PageTransition`
- All pages animate smoothly on navigation

### 2. Add Animation to Any Component

```tsx
"use client";
import { FadeTransition } from "@/components/animations";

export default function MyComponent() {
  return (
    <FadeTransition duration={0.3}>
      <div>Your content here</div>
    </FadeTransition>
  );
}
```

### 3. Animate Lists

```tsx
"use client";
import { StaggerChildren } from "@/components/animations";

export default function UserList({ users }) {
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

### 4. Loading States

```tsx
"use client";
import { SkeletonWithAnimation, SkeletonCard } from "@/components/loading";

export default function LoadingState() {
  return (
    <div className="space-y-4">
      <SkeletonWithAnimation className="h-12 w-full" />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
```

### 5. Interactive Elements

```tsx
"use client";
import { motion } from "framer-motion";

export default function InteractiveButton() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Click Me
    </motion.button>
  );
}
```

## Available Components

| Component                | Purpose          | Usage                   |
| ------------------------ | ---------------- | ----------------------- |
| `PageTransition`         | Page navigation  | Wrap page content       |
| `FadeTransition`         | Fade in/out      | Simple content reveals  |
| `SlideTransition`        | Slide animations | Directional movements   |
| `ScaleTransition`        | Scale effects    | Modals, focused content |
| `StaggerChildren`        | List animations  | Sequential item reveals |
| `AdaptiveAnimation`      | Accessible       | Respects reduced motion |
| `SkeletonWithAnimation`  | Loading states   | Skeleton loaders        |
| `SharedLayoutTransition` | Layout changes   | Reordering content      |

## Common Patterns

### Modal Animation

```tsx
import { ScaleTransition } from "@/components/animations";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <ScaleTransition>
        <div className="bg-white rounded-lg shadow-lg p-6">
          {children}
          <button onClick={onClose}>Close</button>
        </div>
      </ScaleTransition>
    </div>
  );
}
```

### Card Grid Animation

```tsx
import { StaggerChildren } from "@/components/animations";

function CardGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StaggerChildren staggerDelay={0.1}>
        {cards.map((card) => (
          <div key={card.id} className="p-6 border rounded-lg">
            {card.content}
          </div>
        ))}
      </StaggerChildren>
    </div>
  );
}
```

### Animated List Items

```tsx
import { motion } from "framer-motion";

function AnimatedListItem({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
```

### Hover Effects

```tsx
import { motion } from "framer-motion";

function HoverCard({ children }) {
  return (
    <motion.div whileHover={{ scale: 1.02, y: -5 }} className="p-6 border rounded-lg shadow-sm">
      {children}
    </motion.div>
  );
}
```

## Animation Hooks

### useReducedMotion

Automatically respect user preferences:

```tsx
import { useReducedMotion } from "@/hooks";

function MyComponent() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ scale: reducedMotion ? 1 : 1.1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

### useAnimationPreset

Use pre-configured animations:

```tsx
import { useAnimationPreset } from "@/hooks";
import { motion } from "framer-motion";

function MyComponent() {
  const preset = useAnimationPreset("fadeIn");

  return <motion.div {...preset}>Content</motion.div>;
}
```

Available presets: `fadeIn`, `slideInRight`, `slideInLeft`, `scaleIn`, `springIn`, `slideUp`

## Best Practices

### 1. Keep It Short

```tsx
// Good - Snappy
<PageTransition> // 200ms default

// Too Slow - Feels sluggish
<FadeTransition duration={1.0}>
```

### 2. Use CSS Transforms

```tsx
// Good - GPU accelerated
<motion.div animate={{ x: 100 }} />

// Avoid - Triggers layout
<motion.div animate={{ left: '100px' }} />
```

### 3. Accessibility First

```tsx
// Always use AdaptiveAnimation for custom animations
import { AdaptiveAnimation } from "@/components/animations";

<AdaptiveAnimation initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
  Content
</AdaptiveAnimation>;
```

### 4. Test on Real Devices

```bash
# Development
npm run dev

# Test on mobile
# 1. Find your local IP
# 2. Open http://YOUR-IP:3000 on mobile
```

## Quick Examples

### Dashboard Cards

```tsx
"use client";
import { StaggerChildren } from "@/components/animations";
import { motion } from "framer-motion";

const stats = [
  { label: "Revenue", value: "$12,345" },
  { label: "Customers", value: "123" },
  { label: "Orders", value: "456" },
];

export default function DashboardStats() {
  return (
    <StaggerChildren staggerDelay={0.1}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-white rounded-lg border"
          >
            <h3 className="text-2xl font-bold">{stat.value}</h3>
            <p className="text-zinc-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </StaggerChildren>
  );
}
```

### Form Validation Animation

```tsx
"use client";
import { motion } from "framer-motion";

export default function FormField({ error, children }) {
  return (
    <div className="space-y-1">
      {children}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
```

### Table Row Animation

```tsx
"use client";
import { motion } from "framer-motion";

export default function TableRow({ children, index }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {children}
    </motion.tr>
  );
}
```

## Troubleshooting

### Animation Not Working?

1. **Check `'use client'` directive**

   ```tsx
   "use client"; // Required!
   import { FadeTransition } from "@/components/animations";
   ```

2. **Verify Framer Motion is installed**

   ```bash
   npm list framer-motion
   ```

3. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for red errors

### Animation Too Slow?

```tsx
// Reduce duration
<FadeTransition duration={0.15}> // Default is 0.2
```

### Want Faster Development?

Use the animation presets:

```tsx
import { useAnimationPreset } from "@/hooks";

const preset = useAnimationPreset("fadeIn");
return <motion.div {...preset}>Content</motion.div>;
```

## Learn More

- [Full Documentation](./components/animations/README.md)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Examples](http://localhost:3000/en/animations)

## Need Help?

1. Check the [Animation Examples Page](http://localhost:3000/en/animations)
2. Read the [Full Documentation](./components/animations/README.md)
3. Review the [Testing Checklist](./ANIMATION_TESTING_CHECKLIST.md)

Happy animating! 🎨✨
