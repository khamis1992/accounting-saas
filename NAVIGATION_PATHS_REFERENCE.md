# Navigation Paths Quick Reference

## Route Structure Overview

The application uses Next.js Route Groups for organization. Route groups are wrapped in parentheses and don't appear in the URL.

```
frontend/app/[locale]/
├── (marketing)/         # Public pages (landing, etc.)
├── (auth)/             # Authentication pages
└── (app)/              # Protected application routes
    ├── dashboard/
    ├── accounting/
    ├── sales/
    ├── purchases/
    ├── banking/
    ├── assets/
    ├── tax/
    ├── reports/
    └── settings/
```

## Current Navigation Implementation

### ✅ Implemented Pages (Working)

| Module | Navigation Label | Route | Status | File Location |
|--------|-----------------|-------|--------|---------------|
| Dashboard | Dashboard | `/dashboard` | ✅ Working | `app/[locale]/(app)/dashboard/page.tsx` |
| Accounting | Chart of Accounts | `/accounting/coa` | ✅ Working | `app/[locale]/(app)/accounting/coa/page.tsx` |
| Accounting | Journals | `/accounting/journals` | ✅ Working | `app/[locale]/(app)/accounting/journals/page.tsx` |
| Sales | Customers | `/sales/customers` | ✅ Working | `app/[locale]/(app)/sales/customers/page.tsx` |
| Sales | Invoices | `/sales/invoices` | ✅ Working | `app/[locale]/(app)/sales/invoices/page.tsx` |
| Sales | Payments | `/sales/payments` | ✅ Working | `app/[locale]/(app)/sales/payments/page.tsx` |
| Purchases | Vendors | `/purchases/vendors` | ✅ Working | `app/[locale]/(app)/purchases/vendors/page.tsx` |
| Settings | Users | `/settings/users` | ✅ Working | `app/[locale]/(app)/settings/users/page.tsx` |

### 🚧 Coming Soon Pages (Show Toast)

| Module | Navigation Label | Route | Status |
|--------|-----------------|-------|--------|
| Accounting | General Ledger | `/accounting/general-ledger` | 🚧 Coming Soon |
| Accounting | Trial Balance | `/accounting/trial-balance` | 🚧 Coming Soon |
| Accounting | Financial Statements | `/accounting/statements` | 🚧 Coming Soon |
| Sales | Quotations | `/sales/quotations` | 🚧 Coming Soon |
| Purchases | Purchase Orders | `/purchases/orders` | 🚧 Coming Soon |
| Purchases | Expenses | `/purchases/expenses` | 🚧 Coming Soon |
| Banking | Bank Accounts | `/banking/accounts` | 🚧 Coming Soon |
| Banking | Reconciliation | `/banking/reconciliation` | 🚧 Coming Soon |
| Assets | Fixed Assets | `/assets/fixed` | 🚧 Coming Soon |
| Assets | Depreciation | `/assets/depreciation` | 🚧 Coming Soon |
| Tax | VAT | `/tax/vat` | 🚧 Coming Soon |
| Tax | VAT Returns | `/tax/vat-returns` | 🚧 Coming Soon |
| Reports | Reports | `/reports` | 🚧 Coming Soon |
| Settings | Company | `/settings/company` | 🚧 Coming Soon |
| Settings | Roles | `/settings/roles` | 🚧 Coming Soon |
| Settings | Fiscal Year | `/settings/fiscal` | 🚧 Coming Soon |
| Settings | Cost Centers | `/settings/cost-centers` | 🚧 Coming Soon |

## URL Structure with Locale

All URLs include a locale prefix (`/en/` or `/ar/`):

```
Example URLs:
- English Dashboard: https://domain.com/en/dashboard
- Arabic COA: https://domain.com/ar/accounting/coa
- English Customers: https://domain.com/en/sales/customers
- Arabic Vendors: https://domain.com/ar/purchases/vendors
```

**Important:** Route groups `(app)`, `(auth)`, and `(marketing)` do NOT appear in URLs.

## Migration from Old Structure

### Pages Moved from Accounting to Sales

| Old Path | New Path | Status |
|----------|----------|--------|
| `/accounting/customers` | `/sales/customers` | ✅ Moved |
| `/accounting/invoices` | `/sales/invoices` | ✅ Moved |
| `/accounting/payments` | `/sales/payments` | ✅ Moved |

### Pages Moved from Accounting to Purchases

| Old Path | New Path | Status |
|----------|----------|--------|
| `/accounting/vendors` | `/purchases/vendors` | ✅ Moved |

### Pages Remaining in Accounting

| Path | Status |
|------|--------|
| `/accounting/coa` | ✅ Stays |
| `/accounting/journals` | ✅ Stays |

## Updating the Implemented Pages List

When implementing a new page, update the `implementedPages` array in `sidebar.tsx`:

```typescript
const implementedPages = [
  `/${locale}/dashboard`,
  `/${locale}/accounting/coa`,
  `/${locale}/accounting/journals`,
  `/${locale}/sales/customers`,
  `/${locale}/sales/invoices`,
  `/${locale}/sales/payments`,
  `/${locale}/purchases/vendors`,
  `/${locale}/settings/users`,
  // Add new pages here
];
```

## Testing Navigation

To test if a navigation item is working:

1. Click the navigation item in the sidebar
2. **Working:** Page loads without errors
3. **Coming Soon:** Toast notification appears with message
4. Check browser console for any errors
5. Verify active route highlighting in sidebar

## File Locations

### Sidebar Component
```
frontend/components/layout/sidebar.tsx
```

### Page Components
```
frontend/app/[locale]/(app)/
├── dashboard/page.tsx
├── accounting/
│   ├── coa/page.tsx
│   └── journals/page.tsx
├── sales/
│   ├── customers/page.tsx
│   ├── invoices/page.tsx
│   └── payments/page.tsx
├── purchases/
│   └── vendors/page.tsx
└── settings/
    └── users/page.tsx
```

### Translations
```
frontend/messages/
├── en.json (English translations)
└── ar.json (Arabic translations)
```

## Navigation Component Architecture

```
Sidebar (container)
├── NavItem (single item, no children)
│   └── Button with click handler
└── NavItemGroup (expandable section)
    ├── Toggle button (shows/hides children)
    └── NavItem[] (child navigation items)
```

## Quick Checklist for Adding New Pages

- [ ] Create page component in appropriate route group folder
- [ ] Add translation keys to `messages/en.json` and `messages/ar.json`
- [ ] Add navigation item to `navItems` array in `sidebar.tsx`
- [ ] Add page path to `implementedPages` array in `sidebar.tsx`
- [ ] Test navigation works and highlights correctly
- [ ] Test mobile menu functionality
- [ ] Test with both locales (`/en/` and `/ar/`)
- [ ] Verify no console errors
- [ ] Run `npm run build` to check for TypeScript errors

## Notes

- All navigation uses Next.js App Router
- Active route detection uses `usePathname()` hook
- Navigation uses `useRouter()` for programmatic routing
- Toast notifications use `sonner` library
- Mobile menu state managed with `useState`
- Translation keys use `next-intl` library
