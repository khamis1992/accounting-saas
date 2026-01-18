# Mobile UX Quick Reference Guide

**Purpose**: Quick reference for implementing mobile-friendly UI components

---

## Button Sizes (Touch Targets)

**Rule**: All touch targets must be **44x44px minimum** (WCAG 2.1 AAA)

```tsx
// ✅ Correct - Meets standards
<Button size="default">Submit</Button>  // 44px height
<Button size="icon"><Icon /></Button>   // 44x44px

// ❌ Wrong - Too small
<Button size="sm">Submit</Button>       // Now 44px minimum (fixed)

// Custom sizing - Always enforce minimum
<Button className="min-h-[44px] min-w-[44px]">
  Custom
</Button>
```

---

## Responsive Breakpoints

```tsx
// Tailwind default breakpoints
// sm: 640px   // Tablet portrait
// md: 768px   // Tablet landscape
// lg: 1024px  // Desktop
// xl: 1280px  // Wide desktop
// 2xl: 1536px // Extra wide

// Mobile-first approach
className="px-4 sm:px-6 lg:px-8"  // Progressive padding
className="text-sm sm:text-base"  // Responsive text
className="flex-col sm:flex-row" // Stack on mobile
```

---

## Mobile Table Card Pattern

### Basic Usage

```tsx
import {
  MobileTableCard,
  MobileCardGrid,
  DesktopOnly,
} from '@/components/ui/mobile-table-card';

// 1. Wrap desktop table
<DesktopOnly>
  <Table>
    {/* Your existing table */}
  </Table>
</DesktopOnly>

// 2. Add mobile cards
<MobileCardGrid>
  {data.map((item) => (
    <MobileTableCard
      key={item.id}
      title={item.name}
      subtitle={item.code}
      status="active"  // active | inactive | pending | overdue
      fields={[
        { label: 'Type', value: item.type },
        { label: 'Balance', value: item.balance },
      ]}
      actions={[
        {
          icon: <Edit className="h-4 w-4" />,
          label: 'Edit',
          onClick: () => handleEdit(item),
        },
        {
          icon: <Trash2 className="h-4 w-4" />,
          label: 'Delete',
          onClick: () => handleDelete(item),
          variant: 'destructive',
        },
      ]}
    />
  ))}
</MobileCardGrid>
```

### With Conditional Actions

```tsx
<MobileTableCard
  title={invoice.customer_name}
  subtitle={`INV-${invoice.number}`}
  status={invoice.status}
  fields={[
    {
      label: 'Amount',
      value: `$${invoice.amount.toFixed(2)}`,
      highlight: true,  // Highlight important fields
    },
    {
      label: 'Due Date',
      value: formatDate(invoice.due_date),
      icon: <Calendar className="h-3 w-3" />,
    },
  ]}
  actions={[
    canEdit && {
      icon: <Edit className="h-4 w-4" />,
      label: 'Edit',
      onClick: () => handleEdit(invoice),
    },
    canDelete && {
      icon: <Trash2 className="h-4 w-4" />,
      label: 'Delete',
      onClick: () => handleDelete(invoice),
      variant: 'destructive',
    },
  ].filter(Boolean)}  // Remove falsy values
/>
```

### Status Badges

```tsx
// Available statuses
status="active"    // Green
status="inactive"  // Gray
status="pending"   // Yellow
status="overdue"   // Red

// Custom status handling
const getStatus = (invoice) => {
  if (invoice.is_overdue) return 'overdue';
  if (invoice.is_paid) return 'inactive';
  return 'active';
};

<MobileTableCard status={getStatus(invoice)} {...props} />
```

---

## Form Optimization

### Responsive Dialog

```tsx
<DialogContent className="max-w-[95vw] sm:max-w-md">
  {/* Dialog content */}
</DialogContent>
```

### Stacked Form Buttons

```tsx
// Mobile: Stacked vertically
// Desktop: Side by side
<div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 gap-2">
  <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
    Cancel
  </Button>
  <Button onClick={onSubmit} className="w-full sm:w-auto">
    Submit
  </Button>
</div>
```

### Responsive Form Layout

```tsx
// Mobile: Single column
// Desktop: Multi-column
<form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div className="sm:col-span-2">  // Full width on all
    <Label>Full Width Field</Label>
    <Input />
  </div>
  <div>  // Half width on desktop
    <Label>Field 1</Label>
    <Input />
  </div>
  <div>
    <Label>Field 2</Label>
    <Input />
  </div>
</form>
```

---

## Header & Navigation

### Responsive Topbar

```tsx
// Mobile: Search icon only
// Desktop: Full command palette
<header className="px-4 lg:px-6">
  {/* Mobile search icon */}
  <Button
    variant="ghost"
    size="icon"
    onClick={openSearch}
    className="md:hidden"
  >
    <Search className="h-5 w-5" />
  </Button>

  {/* Desktop command palette */}
  <Button className="hidden md:flex w-64">
    Search...
  </Button>
</header>
```

### Mobile Menu Prevention

```tsx
// Prevent body scroll when menu is open
useEffect(() => {
  if (isMenuOpen) {
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }
}, [isMenuOpen]);
```

---

## Responsive Patterns

### Hide/Show by Breakpoint

```tsx
// Mobile only
<div className="lg:hidden">Mobile content</div>

// Desktop only
<div className="hidden lg:block">Desktop content</div>

// Tablet and up
<div className="hidden md:block">Tablet+</div>
```

### Using Helper Components

```tsx
import { MobileOnly, DesktopOnly } from '@/components/ui/mobile-table-card';

<MobileOnly>
  <MobileTableCard {...props} />
</MobileOnly>

<DesktopOnly>
  <Table>...</Table>
</DesktopOnly>
```

---

## Common Responsive Classes

### Spacing

```tsx
// Padding
className="p-4 sm:p-6 lg:p-8"
className="px-4 sm:px-6"

// Margin
className="m-2 sm:m-4"
className="space-y-2 sm:space-y-4"

// Gap
className="gap-2 sm:gap-4"
```

### Text

```tsx
// Font size
className="text-sm sm:text-base lg:text-lg"

// Font weight
className="font-medium sm:font-semibold"

// Alignment
className="text-left sm:text-center"
```

### Layout

```tsx
// Direction
className="flex-col sm:flex-row"

// Alignment
className="items-start sm:items-center"

// Grid
className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

### Width

```tsx
// Full width on mobile, auto on desktop
className="w-full sm:w-auto"

// Responsive width
className="w-full sm:w-3/4 lg:w-1/2"

// Max width
className="max-w-[95vw] sm:max-w-md"
```

---

## Testing Checklist

### Visual Testing
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPad (768px width)
- [ ] Test on desktop (1024px+)
- [ ] Check dark mode
- [ ] Check RTL (Arabic)

### Interaction Testing
- [ ] All buttons are tappable (44x44px min)
- [ ] No horizontal scroll on mobile
- [ ] Forms can be completed on mobile
- [ ] Dropdowns work on touch
- [ ] Modals fit on screen

### Accessibility Testing
- [ ] Screen reader announces content
- [ ] Keyboard navigation works
- [ ] Touch targets adequate
- [ ] Color contrast sufficient
- [ ] ARIA labels present

---

## Performance Tips

### Mobile Performance

```tsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Optimize images
<Image
  src={image}
  width={400}
  height={300}
  placeholder="blur"
  loading="lazy"
/>

// Reduce re-renders
const MobileCard = memo(({ data }) => {
  // Component code
});
```

### Touch Feedback

```tsx
// Add active states
className="active:scale-[0.98] active:bg-opacity-80 transition-transform"

// Haptic feedback (if supported)
const handleTap = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);  // 10ms vibration
  }
  onClick();
};
```

---

## Debug Mobile Issues

### Chrome DevTools

```javascript
// 1. Open DevTools (F12)
// 2. Toggle device toolbar (Ctrl+Shift+M)
// 3. Select device or enter custom dimensions

// Common mobile dimensions:
// iPhone SE: 375 x 667
// iPhone 12: 390 x 844
// iPhone 12 Pro Max: 428 x 926
// iPad: 768 x 1024
// iPad Pro: 1024 x 1366
```

### Responsive Design Mode

```javascript
// Test touch interactions
// 1. DevTools > More tools > Sensors
// 2. Enable "Touch" mode
// 3. Test all touch targets

// Emulate mobile viewport
// 1. DevTools > Device Toolbar
// 2. Select device from dropdown
// 3. Test responsiveness
```

---

## Resources

### Documentation
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.1 Touch Targets](https://www.w3.org/WAG/WCAG21/Understanding/target-size.html)
- [Mobile UX Best Practices](https://www.nngroup.com/articles/mobile-usability/

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance & accessibility
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - Component debugging

---

## Quick Templates

### Page Template

```tsx
export default function Page() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
            <p className="text-sm sm:text-base">Description</p>
          </div>
          <Button onClick={handleAction}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add New</span>
          </Button>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="p-4">
            <DesktopOnly>
              <Table>...</Table>
            </DesktopOnly>
            <MobileCardGrid>
              {data.map((item) => (
                <MobileTableCard key={item.id} {...item} />
              ))}
            </MobileCardGrid>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
```

---

**Remember**: Mobile-first design is not optional - it's essential for user adoption!
