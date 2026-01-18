# Command Palette Feature

A comprehensive keyboard-driven navigation system for the accounting SaaS application.

## Features

### Core Functionality

- **Global Keyboard Shortcut**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to open
- **Fuzzy Search**: Search pages by name, keywords, or module
- **Keyboard Navigation**: Navigate results with arrow keys, select with Enter
- **Quick Escape**: Press `Esc` to close

### Smart Features

- **Favorites**: Mark frequently used pages with star icon
- **Recent Items**: Automatically tracks your 5 most recent pages
- **Persistence**: Favorites and recent items saved to localStorage
- **Grouped Results**: Pages organized by module (Accounting, Sales, etc.)
- **Implementation Status**: Shows "Coming Soon" for unimplemented pages

### UI/UX

- **Visual Hierarchy**: Favorites → Recent → All Pages (grouped)
- **Icon Support**: Each page has appropriate Lucide icon
- **Platform Detection**: Shows correct shortcut (⌘K or Ctrl+K) based on OS
- **Dark Mode**: Full dark mode support
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## File Structure

```
frontend/
├── components/
│   ├── layout/
│   │   ├── command-palette.tsx          # Main component
│   │   ├── command-palette.test.tsx     # Testing guide
│   │   ├── authenticated-layout.tsx     # Integration
│   │   └── topbar.tsx                   # Search button
├── hooks/
│   └── use-command-palette.ts           # Keyboard hook
└── lib/
    └── navigation-data.ts                # Navigation registry
```

## Usage

### For Users

1. **Open**: Press `Cmd+K` (Mac) or `Ctrl+K` (Windows)
2. **Search**: Type any page name, keyword, or module
3. **Navigate**: Use ↑↓ arrows to move, Enter to select
4. **Close**: Press `Esc` or click outside

### Search Examples

- `"coa"` → Finds "Chart of Accounts"
- `"invoice"` → Finds "Invoices"
- `"vendor"` → Finds "Vendors"
- `"clients"` → Finds "Customers" (keyword match)
- `"accounting"` → Shows all Accounting pages

### Favorites

1. Open command palette
2. Hover over any item
3. Click the ☆ icon to add to favorites
4. Click ★ icon to remove

Favorites appear at the top for quick access.

## Configuration

### Adding New Pages

Edit `frontend/lib/navigation-data.ts`:

```typescript
{
  id: 'new-page',
  label: 'New Page',
  href: '/new-page',
  icon: 'IconName',
  module: 'ModuleName',
  keywords: ['keyword1', 'keyword2'],
  implemented: true,
}
```

### Adding Icons

Icons are Lucide React components. Add new icons to the `iconMap` in `command-palette.tsx`:

```typescript
import { NewIcon } from "lucide-react";

const iconMap = {
  // ... existing icons
  NewIcon,
};
```

### Changing Keyboard Shortcut

Edit `frontend/hooks/use-command-palette.ts`:

```typescript
// Current: Cmd+K / Ctrl+K
if ((e.metaKey || e.ctrlKey) && e.key === "k") {
  // To change: modify 'k' to another key
}
```

## Technical Details

### Technologies

- **cmdk**: Command palette primitive (already installed)
- **Radix UI Dialog**: Modal dialog component
- **Lucide React**: Icon library
- **Next.js**: Routing and locale handling
- **localStorage**: Persistence layer

### State Management

- React `useState` for open/close state
- localStorage for favorites and recent items
- URL routing via Next.js router

### Performance

- Minimal re-renders with React.memo
- Efficient fuzzy search (includes matching)
- localStorage debounced on saves

## Accessibility

### Keyboard Navigation

- `Tab`: Navigate focusable elements
- `↑↓`: Move through results
- `Enter`: Select item
- `Esc`: Close dialog
- `Home/End`: Jump to first/last result

### ARIA Support

- Proper role attributes
- aria-labels for screen readers
- Focus management on open/close
- Semantic HTML structure

### Screen Reader Support

- "Command Palette" dialog title
- Search input properly labeled
- Results announced correctly
- State changes communicated

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (including ⌘ key)
- Mobile: Works with virtual keyboard

## Testing

### Manual Testing

See `command-palette.test.tsx` for comprehensive test checklist.

### Key Test Cases

1. Keyboard shortcuts (Cmd+K, Ctrl+K, Esc)
2. Search functionality (exact, partial, keyword)
3. Navigation (arrow keys, Enter)
4. Favorites (add, remove, persist)
5. Recent items (tracking, ordering, limit)
6. Implemented vs non-implemented pages
7. Platform-specific shortcuts (Mac vs Windows)
8. localStorage persistence
9. Dark mode
10. Accessibility (screen reader, keyboard only)

## Troubleshooting

### Command palette not opening

- Check if `useCommandPalette` hook is properly initialized
- Verify keyboard event listeners are attached
- Check browser console for errors

### Search not working

- Verify `navigation-data.ts` is properly formatted
- Check that items have `label`, `keywords`, and `module` fields
- Ensure fuzzy search logic is correct

### Favorites not persisting

- Check browser localStorage availability
- Verify no localStorage errors in console
- Check quota limits (usually 5-10MB)

### Navigation not working

- Verify locale is properly prepended to href
- Check router.push is being called
- Ensure pages exist in app directory

## Future Enhancements

### Planned Features

- [ ] Voice search (Web Speech API)
- [ ] Quick actions (create new invoice, etc.)
- [ ] Search history
- [ ] Advanced fuzzy matching (Fuse.js integration)
- [ ] Keyboard shortcuts for specific pages (⌘+C for Customers)
- [ ] Animated transitions (Framer Motion)
- [ ] Telemetry for most searched pages
- [ ] Custom keyboard shortcuts

### Potential Improvements

- [ ] Search within pages (search invoices, customers, etc.)
- [ ] Multi-language search support
- [ ] Command aliases (/inv for invoices)
- [ ] Integration with global search (Elasticsearch/MeiliSearch)
- [ ] Keyboard shortcut customization UI

## Contributing

When adding new navigation items:

1. Add to `navigation-data.ts` with all required fields
2. Add icon component to `command-palette.tsx` iconMap
3. Mark `implemented: false` if page doesn't exist yet
4. Test search functionality with keywords
5. Update documentation

## License

This feature is part of the accounting SaaS application.

## Credits

Built with:

- [cmdk](https://cmdk.paco.me/) - Command palette component
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- [Lucide](https://lucide.dev/) - Beautiful icons
- [shadcn/ui](https://ui.shadcn.com/) - Component architecture
