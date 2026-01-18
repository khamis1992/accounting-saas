# Recently Viewed Items and Favorites Implementation

## Overview

This implementation adds two key features to enhance navigation and user productivity:

1. **Recently Viewed Items** - Tracks the last 10 pages the user visited
2. **Favorites/Pinned Pages** - Allows users to pin frequently accessed pages

Both features persist data in localStorage across sessions.

## Files Created

### Hooks

1. **`hooks/use-local-storage.ts`**
   - Generic hook for localStorage management
   - Handles serialization/deserialization
   - Provides `setValue` and `removeValue` functions

2. **`hooks/use-recent-items.ts`**
   - Tracks recently viewed pages with timestamps
   - Maximum of 10 items
   - Auto-removes items older than 30 days
   - Skips auth pages and dashboard
   - Extracts page titles using breadcrumb logic

3. **`hooks/use-favorites.ts`**
   - Manages favorite/pinned pages
   - Allows adding/removing favorites
   - Persists to localStorage
   - Provides `isFavorite` check utility

### Components

1. **`components/layout/recent-items-dropdown.tsx`**
   - Clock icon in topbar
   - Dropdown showing last 5 recent items
   - Individual remove buttons
   - Clear all button
   - Only shows when there are recent items

2. **`components/layout/favorites-button.tsx`**
   - Star/StarOff icon in topbar
   - Toggles current page as favorite
   - Auto-detects page title
   - Hidden on auth pages and dashboard

3. **`components/layout/favorites-dropdown.tsx`**
   - Star icon in topbar
   - Shows all favorited pages
   - Individual remove buttons
   - Clear all button
   - Only shows when there are favorites

### Translation Updates

Updated both `messages/en.json` and `messages/ar.json` with:

**`common` section:**

- `recent` - "Recent" / "الأخيرة"
- `favorites` - "Favorites" / "المفضلة"
- `clear` - "Clear" / "مسح"
- `addFavorite` - "Add to favorites" / "إضافة للمفضلة"
- `removeFavorite` - "Remove from favorites" / "إزالة من المفضلة"

**`breadcrumbs` section:**

- `addFavorite` - "Add to favorites" / "إضافة للمفضلة"
- `removeFavorite` - "Remove from favorites" / "إزالة من المفضلة"

## Integration

The components are automatically integrated into the topbar in `components/layout/topbar.tsx`:

```tsx
<div className="flex items-center gap-2">
  <RecentItemsDropdown />
  <FavoritesDropdown />
  <FavoritesButton />
  {/* ... language switcher and notifications ... */}
</div>
```

## Usage

### As a User

1. **Track Recent Items:**
   - Navigate to any page (except auth pages and dashboard)
   - The page is automatically added to recent items
   - Access via the clock icon in the topbar
   - Click any recent item to navigate to it
   - Hover over an item and click X to remove it
   - Click "Clear" to remove all recent items

2. **Add to Favorites:**
   - Navigate to any page
   - Click the star icon in the topbar (if visible)
   - The star fills with yellow to indicate it's favorited
   - Click again to remove from favorites

3. **Access Favorites:**
   - Click the filled star icon in the topbar
   - See all favorited pages in the dropdown
   - Click any favorite to navigate to it
   - Hover over an item and click X to remove it
   - Click "Clear" to remove all favorites

### As a Developer

#### Using the Hooks Directly

```tsx
"use client";
import { useRecentItems } from "@/hooks/use-recent-items";
import { useFavorites } from "@/hooks/use-favorites";

export function MyComponent() {
  const { recentItems, clearRecent, removeRecentItem } = useRecentItems();
  const { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite } = useFavorites();

  // Check if current page is favorite
  const pathname = usePathname();
  const favorite = isFavorite(pathname);

  // Toggle favorite status
  const handleToggle = () => {
    toggleFavorite(pathname, "Page Title");
  };

  return (
    <div>
      <button onClick={handleToggle}>{favorite ? "Unfavorite" : "Favorite"}</button>
    </div>
  );
}
```

#### Using the Generic useLocalStorage Hook

```tsx
"use client";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function MyComponent() {
  const [userPreferences, setUserPreferences, removePreferences] = useLocalStorage(
    "user-preferences",
    { theme: "light", language: "en" }
  );

  const updateTheme = (theme: string) => {
    setUserPreferences((prev) => ({ ...prev, theme }));
  };

  return (
    <div>
      <button onClick={() => updateTheme("dark")}>Dark Mode</button>
    </div>
  );
}
```

## Features

### Recently Viewed Items

- **Automatic tracking**: Pages are tracked automatically as you navigate
- **Smart filtering**: Skips auth pages, dashboard, and numeric IDs
- **Title extraction**: Uses breadcrumb logic to get translated page titles
- **Age management**: Removes items older than 30 days
- **Limit**: Maximum of 10 items, oldest removed when limit reached
- **Individual removal**: Remove specific items without clearing all
- **Clear all**: Reset recent items history

### Favorites

- **Manual pinning**: Users actively choose what to favorite
- **Persistent**: Survives page refreshes and browser restarts
- **Quick access**: One-click navigation to favorited pages
- **Easy management**: Add/remove individual favorites
- **Clear all**: Reset favorites history
- **Visual feedback**: Filled star indicates favorited status

## Data Structure

### Recent Item

```typescript
interface RecentItem {
  path: string; // Full pathname
  title: string; // Translated page title
  timestamp: number; // Unix timestamp
}
```

### Favorite Item

```typescript
interface FavoriteItem {
  path: string; // Full pathname
  title: string; // Translated page title
  icon?: string; // Optional icon name
  addedAt: number; // Unix timestamp when added
}
```

## Storage

Both features use `localStorage` with the following keys:

- **`recent-items`**: Array of `RecentItem` objects
- **`favorite-pages`**: Array of `FavoriteItem` objects

Data is automatically saved to localStorage whenever the state changes.

## Browser Compatibility

- Requires `localStorage` support (available in all modern browsers)
- Falls back gracefully if localStorage is unavailable (logs errors)
- Works in both English and Arabic locales

## Accessibility

- All buttons include `aria-label` attributes
- Screen reader friendly text
- Keyboard navigation support
- Hover states for remove buttons
- Semantic HTML structure

## Performance Considerations

- localStorage operations are wrapped in try-catch to handle quota exceeded
- Only loads data once on mount (via `useEffect` with empty deps)
- Minimal re-renders thanks to stable callback functions
- No network requests - all client-side storage

## Testing

### Manual Testing Checklist

1. Visit a page → Appears in recent items ✓
2. Visit 5 pages → All 5 in recent items ✓
3. Visit 11th page → Oldest removed, still 10 items ✓
4. Click recent item → Navigates to that page ✓
5. Remove recent item → Disappears from list ✓
6. Clear all recent → List empty ✓
7. Click star button → Page added to favorites ✓
8. Click star again → Page removed from favorites ✓
9. Favorites persist after page refresh ✓
10. Recent items persist after page refresh ✓
11. Auth pages (signin/signup) don't appear in recent ✓
12. Dashboard doesn't appear in recent ✓
13. Works in both English and Arabic ✓

## Future Enhancements

Potential improvements for future iterations:

1. **Sync with backend**: Store preferences server-side for multi-device sync
2. **Custom ordering**: Allow users to reorder favorites
3. **Folders/Groups**: Organize favorites into categories
4. **Export/Import**: Allow users to backup their preferences
5. **Analytics**: Track most used pages for quick access
6. **Search**: Search within recent items and favorites
7. **Keyboard shortcuts**: Quick access via hotkeys
8. **Time-based filtering**: Show recent items from today, this week, etc.
9. **Collaborative favorites**: Share favorites with team members
10. **Smart suggestions**: Suggest pages to favorite based on usage

## Troubleshooting

### Recent Items Not Showing

- Check that you're not on auth pages or dashboard
- Ensure you've navigated to at least one page
- Check browser console for localStorage errors
- Verify that the pathname is not filtered out

### Favorites Not Persisting

- Check browser console for localStorage errors
- Ensure localStorage is not disabled in browser settings
- Check available storage space (quota may be exceeded)
- Try clearing browser cache and re-adding favorites

### Titles Not Showing Correctly

- Verify translation keys exist in both `en.json` and `ar.json`
- Check that breadcrumb logic can extract titles for your paths
- Ensure paths follow the expected format: `/locale/module/page`

## Build Verification

The implementation has been verified to build successfully:

```bash
cd frontend
npm run build
```

Result: ✓ Compiled successfully
