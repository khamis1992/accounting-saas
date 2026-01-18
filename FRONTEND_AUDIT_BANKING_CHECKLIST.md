# Banking & Assets - Developer Checklist

## Quick Fix Checklist

Use this checklist when working on Banking/Assets modules.

### Before Committing Code

- [ ] No `any` types in TypeScript (use proper interfaces)
- [ ] All API responses validated/typed
- [ ] User inputs sanitized and validated
- [ ] Error handling with user notifications
- [ ] Loading states for async operations
- [ ] No unused imports
- [ ] Components under 300 lines (split if larger)
- [ ] Expensive components use React.memo
- [ ] Filtered/sorted data uses useMemo
- [ ] Search inputs have debounce
- [ ] No native confirm() - use custom dialogs
- [ ] Accessible keyboard navigation
- [ ] ARIA labels on interactive elements
- [ ] Translation keys (no hard-coded strings)
- [ ] Error boundaries for major sections

---

## File-Specific Checks

### banking/accounts/page.tsx
- [ ] Add pagination for accounts list
- [ ] Memoize AccountRow component
- [ ] Use useMemo for filteredAccounts
- [ ] Add debounce to search input
- [ ] Validate account number format

### banking/reconciliation/page.tsx
- [ ] Split into smaller components (CRITICAL: 691 lines)
- [ ] Add keyboard navigation for transaction selection
- [ ] Implement virtual scrolling for transaction lists
- [ ] Add validation for statement balance
- [ ] Replace inline 7-day window with constant
- [ ] Add error boundary
- [ ] Improve TypeScript types (remove `any`)

### assets/fixed/page.tsx
- [ ] Add pagination for assets list
- [ ] Use translation system for category labels
- [ ] Replace native confirm() with custom dialog
- [ ] Memoize table rows
- [ ] Add currency validation
- [ ] Extract getActionButtons outside render
- [ ] Add proper type for disposeDialog state

### assets/depreciation/page.tsx
- [ ] Remove unused Select imports
- [ ] Add date range validation
- [ ] Replace native confirm() with custom dialog
- [ ] Add loading skeletons
- [ ] Validate period dates (end > start, no future)
- [ ] Add error boundary

---

## Code Review Checklist

### TypeScript Safety
```typescript
❌ DON'T
const data = await apiClient.get<any>('/endpoint');
return response.data as SomeType;

✅ DO
interface ApiResponse {
  data: SomeType[];
}
const response = await apiClient.get<ApiResponse>('/endpoint');
return response.data;
```

### Performance
```typescript
❌ DON'T
const filtered = items.filter(...); // On every render

✅ DO
const filtered = useMemo(() => items.filter(...), [items, search]);
```

### Error Handling
```typescript
❌ DON'T
catch (error: any) {
  console.error(error); // Silent failure
}

✅ DO
catch (error: ApiError) {
  console.error('Operation failed:', error);
  toast.error(error.message || 'Operation failed');
  // Optionally: retry, fallback, or reset state
}
```

### Validation
```typescript
❌ DON'T
const amount = parseFloat(inputValue);
if (amount < 0) return; // What if NaN?

✅ DO
const amount = parseFloat(inputValue);
if (isNaN(amount) || amount < 0 || amount > MAX_AMOUNT) {
  toast.error('Please enter a valid amount');
  return;
}
```

---

## Common Patterns to Avoid

### ❌ Anti-Patterns

1. **Any Type**
   ```typescript
   const [data, setData] = useState<any>([]);
   ```

2. **Native Confirm**
   ```typescript
   if (!confirm('Are you sure?')) return;
   ```

3. **Missing Memo**
   ```typescript
   {items.map(item => <ExpensiveRow item={item} />)}
   ```

4. **No Debounce**
   ```typescript
   <Input onChange={e => setSearch(e.target.value)} />
   ```

5. **Hard-coded Strings**
   ```typescript
   const label = 'Furniture'; // Not translatable
   ```

6. **Silent Failures**
   ```typescript
   catch (error) {
     console.error(error); // User doesn't know
   }
   ```

7. **Missing Validation**
   ```typescript
   const date = new Date(inputDate); // Could be invalid
   ```

8. **Large Components**
   ```typescript
   // 500+ lines in one file - split it!
   export default function HugeComponent() { ... }
   ```

---

### ✅ Best Practices

1. **Proper Types**
   ```typescript
   interface BankAccount {
     id: string;
     name: string;
     balance: number;
   }
   const [data, setData] = useState<BankAccount[]>([]);
   ```

2. **Custom Dialog**
   ```typescript
   <ConfirmDialog
     open={showConfirm}
     onConfirm={handleAction}
     message="Are you sure?"
   />
   ```

3. **Memoized Rows**
   ```typescript
   const AccountRow = React.memo(({ account }: Props) => { ... });
   ```

4. **Debounced Search**
   ```typescript
   const debouncedSearch = useDebounce(search, 300);
   ```

5. **Translated Labels**
   ```typescript
   const t = useTranslations('assets');
   const label = t(`categories.${category}`);
   ```

6. **User Notifications**
   ```typescript
   catch (error) {
     toast.error('Operation failed');
     logger.error(error);
   }
   ```

7. **Validated Input**
   ```typescript
   if (!isValidDate(date)) {
     toast.error('Invalid date');
     return;
   }
   ```

8. **Split Components**
   ```typescript
   // Main component orchestrates
   // Sub-components handle specific UI
   export default function Page() {
     return (
       <>
         <AccountList />
         <AccountForm />
         <AccountSummary />
       </>
     );
   }
   ```

---

## Testing Checklist

Before marking a feature as done:

- [ ] Unit tests for utility functions
- [ ] Integration tests for API calls
- [ ] Component tests for UI interactions
- [ ] Error scenarios tested (network failure, invalid input)
- [ ] Edge cases covered (empty data, large datasets)
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Responsive design tested (mobile, tablet, desktop)

---

## Performance Checklist

- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No layout shifts
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Bundle size analyzed and optimized
- [ ] No memory leaks (cleanup in useEffect)

---

## Security Checklist

- [ ] User input sanitized
- [ ] XSS protection in place
- [ ] CSRF tokens used
- [ ] Sensitive data not in localStorage
- [ ] API responses validated
- [ ] Error messages don't leak info
- [ ] Authentication tokens properly handled
- [ ] HTTPS enforced in production

---

## Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] Forms properly labeled
- [ ] Error messages accessible
- [ ] Responsive to zoom (200%)

---

## Quick Reference: File Locations

```
frontend/
├── app/[locale]/(app)/
│   ├── banking/
│   │   ├── layout.tsx (22 lines) ✅ Good
│   │   ├── accounts/page.tsx (364 lines) ⚠️ Needs pagination
│   │   └── reconciliation/page.tsx (691 lines) ❌ Too large
│   └── assets/
│       ├── layout.tsx (22 lines) ✅ Good
│       ├── fixed/page.tsx (516 lines) ⚠️ Needs validation
│       └── depreciation/page.tsx (501 lines) ⚠️ Remove unused
└── lib/api/
    ├── banking.ts (193 lines) ⚠️ Fix types
    └── assets.ts (187 lines) ⚠️ Fix types
```

---

## Get Help

### Questions About This Audit?
- Full details: `FRONTEND_AUDIT_BANKING.md`
- Quick summary: `FRONTEND_AUDIT_BANKING_SUMMARY.md`
- This checklist: `FRONTEND_AUDIT_BANKING_CHECKLIST.md`

### Need Examples?
Check existing codebase for patterns:
- ✅ Good example: `dashboard/page.tsx`
- ❌ Bad example: `banking/reconciliation/page.tsx` (too large)

### Common Tasks
- **Adding pagination**: See references in full audit
- **Splitting components**: See Appendix A in full audit
- **TypeScript types**: See Appendix B in full audit
- **Custom hooks**: See Appendix C in full audit

---

**Remember**: This checklist is a guide. Use your judgment and adapt based on specific requirements.

**Last Updated**: 2025-01-17
