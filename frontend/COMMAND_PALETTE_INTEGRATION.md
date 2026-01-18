# Command Palette - Developer Integration Guide

## Overview

The Command Palette is fully integrated into the application. This guide explains how it works and how to extend it.

## Architecture

### File Structure

```
frontend/
├── components/layout/
│   ├── command-palette.tsx              # Main component
│   ├── command-palette.test.tsx         # Test specifications
│   ├── authenticated-layout.tsx         # Layout integration
│   └── topbar.tsx                       # Search button
├── hooks/
│   └── use-command-palette.ts           # Keyboard shortcut hook
└── lib/
    └── navigation-data.ts                # Central navigation registry
```

### Data Flow

```
User presses Cmd+K
  ↓
useCommandPalette hook detects keypress
  ↓
setCommandPaletteOpen(true)
  ↓
CommandPalette component renders
  ↓
User types search query
  ↓
searchNavigation() filters items
  ↓
Results grouped by module
  ↓
User selects item + presses Enter
  ↓
handleNavigate() called
  ↓
router.push(locale + href)
  ↓
Recent item saved to localStorage
  ↓
Palette closes
```

## Implementation Details

### 1. Navigation Data Registry (`navigation-data.ts`)

**Purpose**: Single source of truth for all navigation items

**Interface**:

```typescript
interface NavigationItem {
  id: string; // Unique identifier
  label: string; // Display name
  href: string; // Route path (without locale)
  icon?: string; // Lucide icon name
  module: string; // Module category
  keywords: string[]; // Search aliases
  implemented?: boolean; // Page exists?
}
```

**Adding New Pages**:

```typescript
{
  id: 'new-page',
  label: 'New Page',
  href: '/new-page',
  icon: 'FileText',
  module: 'ModuleName',
  keywords: ['alias1', 'alias2', 'alias3'],
  implemented: true,
}
```

**Helper Functions**:

- `getGroupedNavigationItems()`: Groups items by module
- `getImplementedPages()`: Filters implemented pages only
- `searchNavigation(query)`: Fuzzy search implementation

### 2. Command Palette Component (`command-palette.tsx`)

**Key Features**:

- **Favorites**: Stored in localStorage
- **Recent Items**: Tracks last 5 visited pages
- **Platform Detection**: Shows correct shortcut (⌘K or Ctrl+K)
- **Icon Mapping**: Maps icon names to Lucide components

**State Management**:

```typescript
const [recentItems, setRecentItems] = useState<string[]>([]);
const [favorites, setFavorites] = useState<string[]>([]);
```

**Navigation Handler**:

```typescript
const handleNavigate = (href: string, isImplemented: boolean) => {
  if (!isImplemented) {
    toast.info("Coming Soon");
    return;
  }
  router.push(`/${locale}${href}`);
  saveRecentItem(href);
  onOpenChange(false);
};
```

**Icon System**:

```typescript
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Book,
  // ... etc
};

const renderIcon = (iconName: string, className = 'h-4 w-4') => {
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent className={className} /> : null;
};
```

### 3. Keyboard Hook (`use-command-palette.ts`)

**Purpose**: Global keyboard shortcut listener

**Implementation**:

```typescript
export function useCommandPalette(open: boolean, setOpen: (open: boolean) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);
}
```

**Why in a hook?**

- Reusable across components
- Proper cleanup with useEffect return
- Isolates keyboard logic

### 4. Layout Integration (`authenticated-layout.tsx`)

**Pattern**: Global state at layout level

```typescript
export function AuthenticatedLayout({ children }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useCommandPalette(commandPaletteOpen, setCommandPaletteOpen);

  return (
    <div>
      <Sidebar />
      <Topbar openCommandPalette={() => setCommandPaletteOpen(true)} />
      {children}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  );
}
```

**Why here?**

- Single instance for entire authenticated app
- Keyboard shortcuts work everywhere
- State persists across page navigations

### 5. Topbar Button (`topbar.tsx`)

**Platform Detection**:

```typescript
const isMac = /Mac/.test(window.navigator.platform);
const shortcutKey = isMac ? "⌘K" : "Ctrl+K";
```

**Button Styling**:

```tsx
<Button variant="outline" onClick={openCommandPalette}>
  <Search />
  <span>Search...</span>
  <kbd>{shortcutKey}</kbd>
</Button>
```

## Extending the Command Palette

### Adding a New Navigation Item

1. **Add to navigation-data.ts**:

```typescript
{
  id: 'new-feature',
  label: 'New Feature',
  href: '/new-feature',
  icon: 'Sparkles',
  module: 'Advanced',
  keywords: ['new', 'feature', 'experimental'],
  implemented: true,
}
```

2. **Add icon to command-palette.tsx** (if new):

```typescript
import { Sparkles } from "lucide-react";

const iconMap = {
  // ... existing
  Sparkles,
};
```

3. **Test it**:
   - Press Cmd+K
   - Search for "new feature"
   - Verify it appears and navigates correctly

### Adding Quick Actions

**Example**: Add "New Invoice" action

```typescript
// In command-palette.tsx
const quickActions = [
  {
    id: 'new-invoice',
    label: 'New Invoice',
    action: () => router.push(`/${locale}/sales/invoices/new`),
    icon: 'Plus',
  },
];

// In CommandList
<CommandGroup heading="Quick Actions">
  {quickActions.map(action => (
    <CommandItem key={action.id} onSelect={action.action}>
      {renderIcon(action.icon)}
      {action.label}
    </CommandItem>
  ))}
</CommandGroup>
```

### Adding Search Categories

**Example**: Search within invoices

```typescript
// Add to navigation-data.ts
{
  id: 'search-invoices',
  label: 'Search Invoices',
  href: '/sales/invoices?search=true',
  icon: 'Search',
  module: 'Sales',
  keywords: ['find invoice', 'invoice search', 'lookup'],
  implemented: true,
}
```

### Custom Keyboard Shortcuts

**Example**: Add specific shortcuts for pages

```typescript
// In use-command-palette.ts
const shortcuts = {
  b: () => router.push("/banking/accounts"),
  c: () => router.push("/sales/customers"),
  i: () => router.push("/sales/invoices"),
};

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Check if modifier key is pressed
    if (e.metaKey || e.ctrlKey) {
      const handler = shortcuts[e.key.toLowerCase()];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }
  };
  // ...
}, []);
```

## Performance Considerations

### 1. Search Optimization

Current implementation is O(n) where n = number of items (25+)

**Optimization if needed**:

```typescript
import Fuse from "fuse.js";

const fuse = new Fuse(navigationItems, {
  keys: ["label", "keywords", "module"],
  threshold: 0.3,
});

function searchNavigation(query: string) {
  return fuse.search(query).map((r) => r.item);
}
```

### 2. Render Optimization

Already optimized:

- `useMemo` for expensive computations
- `filter(Boolean)` for type narrowing
- cmdk's built-in virtualization

**Further optimization if needed**:

```typescript
const CommandItem = React.memo(({ item, onSelect }) => {
  return <CommandItem onSelect={onSelect}>{item.label}</CommandItem>;
});
```

### 3. localStorage Optimization

Current approach: Save on every change

**Better approach**: Debounce saves

```typescript
import { debounce } from "lodash";

const debouncedSave = debounce((items) => {
  localStorage.setItem("key", JSON.stringify(items));
}, 500);

debouncedSave(newRecentItems);
```

## Testing

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './command-palette';

test('search filters items correctly', async () => {
  render(<CommandPalette open={true} onOpenChange={() => {}} />);
  const input = screen.getByPlaceholderText(/search/i);

  await fireEvent.change(input, { target: { value: 'dashboard' } });

  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
test('keyboard shortcut opens palette', () => {
  render(<AuthenticatedLayout>...</AuthenticatedLayout>);

  fireEvent.keyDown(window, { key: 'k', metaKey: true });

  expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```typescript
test("command palette navigation", async ({ page }) => {
  await page.goto("/dashboard");

  // Open palette
  await page.keyboard.press("Meta+k");

  // Search
  await page.fill('[placeholder*="search"]', "customers");

  // Navigate
  await page.keyboard.press("Enter");

  // Verify
  await expect(page).toHaveURL(/.*customers/);
});
```

## Troubleshooting

### Issue: Palette not opening

**Check**:

1. Hook is initialized in layout
2. Event listeners attached
3. No errors in console

**Fix**:

```typescript
// In authenticated-layout.tsx
useEffect(() => {
  console.log("Command palette hook initialized");
}, []);
```

### Issue: Search not working

**Check**:

1. navigation-data.ts is valid
2. Items have required fields
3. No TypeScript errors

**Fix**:

```typescript
// Validate data
console.log(navigationItems.length);
console.log(searchNavigation("test"));
```

### Issue: Favorites not saving

**Check**:

1. localStorage is enabled
2. No quota exceeded
3. No CORS issues

**Fix**:

```typescript
// Check localStorage
try {
  localStorage.setItem("test", "test");
  console.log("localStorage works");
} catch (e) {
  console.error("localStorage error:", e);
}
```

### Issue: Wrong locale in navigation

**Check**:

1. Locale from useLocale() is correct
2. Href doesn't include locale

**Fix**:

```typescript
// In navigation-data.ts
href: ("/dashboard", // No locale prefix
  // In command-palette.tsx
  router.push(`/${locale}${href}`)); // Add locale here
```

## Best Practices

### 1. Keep navigation-data.ts synchronized

- Always update when adding new pages
- Mark `implemented: false` for WIP pages
- Add meaningful keywords

### 2. Use descriptive keywords

```typescript
// Good
keywords: ["clients", "customers", "debtors", "buyers"];

// Bad
keywords: ["c", "cust", "cli"];
```

### 3. Group related pages

```typescript
module: 'Accounting',  // Logical grouping
module: 'Sales',
module: 'Purchases',
```

### 4. Mark implementation status

```typescript
implemented: true,   // Page exists
implemented: false,  // Coming soon
```

### 5. Add appropriate icons

```typescript
icon: 'Users',         // Customers
icon: 'FileText',      // Invoices
icon: 'Building2',     // Vendors
```

## Migration Guide

### From Old Sidebar Navigation

**Before**:

```typescript
const navItems = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "COA", href: "/accounting/coa" },
];
```

**After**:

```typescript
const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    module: "Main",
    keywords: ["home", "overview"],
    implemented: true,
  },
  {
    id: "coa",
    label: "Chart of Accounts",
    href: "/accounting/coa",
    icon: "Book",
    module: "Accounting",
    keywords: ["coa", "accounts", "chart"],
    implemented: true,
  },
];
```

### From Search Input

**Before**:

```typescript
<Input placeholder="Search..." />
```

**After**:

```typescript
<Button onClick={() => setCommandPaletteOpen(true)}>
  <Search />
  <span>Search...</span>
  <kbd>⌘K</kbd>
</Button>
```

## Resources

- [cmdk Documentation](https://cmdk.paco.me/)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command)

## Support

For issues or questions:

1. Check this guide first
2. Review the test file for examples
3. Check the README for user-facing docs
4. Contact the development team

---

**Remember**: The command palette is a productivity tool. Keep it fast, simple, and keyboard-friendly!
