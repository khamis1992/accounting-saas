# Route Group Structure - Quick Reference

**Last Updated**: 2026-01-17

---

## Directory Structure

```
frontend/app/[locale]/
├── (marketing)/              → Public pages (no auth)
│   ├── layout.tsx           → Clean layout
│   └── page.tsx             → Landing page
│
├── (auth)/                  → Authentication pages
│   ├── layout.tsx           → Centered auth layout
│   └── auth/
│       ├── signin/page.tsx
│       └── signup/page.tsx
│
└── (app)/                   → Protected pages (requires auth)
    ├── layout.tsx           → AuthenticatedLayout wrapper
    │
    ├── dashboard/
    │   └── page.tsx
    │
    ├── accounting/          → Accounting module
    │   ├── layout.tsx       → "Accounting" header
    │   ├── coa/page.tsx
    │   └── journals/
    │       ├── page.tsx
    │       └── new/page.tsx
    │
    ├── sales/               → Sales module
    │   ├── layout.tsx       → "Sales" header
    │   ├── customers/page.tsx
    │   ├── invoices/page.tsx
    │   └── payments/page.tsx
    │
    ├── purchases/           → Purchases module
    │   ├── layout.tsx       → "Purchases" header
    │   └── vendors/page.tsx
    │
    ├── banking/             → Banking module (empty)
    │   ├── layout.tsx
    │   ├── accounts/
    │   └── reconciliation/
    │
    ├── assets/              → Assets module (empty)
    │   ├── layout.tsx
    │   ├── fixed/
    │   └── depreciation/
    │
    ├── tax/                 → Tax module (empty)
    │   ├── layout.tsx
    │   ├── vat/
    │   └── vat-returns/
    │
    ├── reports/             → Reports module (empty)
    │   ├── layout.tsx
    │   └── page.tsx
    │
    └── settings/            → Settings module
        ├── layout.tsx       → "Settings" header
        ├── profile/page.tsx
        └── users/page.tsx
```

---

## URL Examples (Route Groups Don't Appear in URLs!)

### Marketing (Public)
- Home: `http://localhost:3001/`
- Home (Arabic): `http://localhost:3001/ar/`

### Auth (Public)
- Sign In: `http://localhost:3001/auth/signin`
- Sign Up: `http://localhost:3001/auth/signup`

### App (Protected)
- Dashboard: `http://localhost:3001/dashboard`
- COA: `http://localhost:3001/accounting/coa`
- Journals: `http://localhost:3001/accounting/journals`
- New Journal: `http://localhost:3001/accounting/journals/new`
- Customers: `http://localhost:3001/sales/customers`
- Invoices: `http://localhost:3001/sales/invoices`
- Payments: `http://localhost:3001/sales/payments`
- Vendors: `http://localhost:3001/purchases/vendors`
- Profile: `http://localhost:3001/settings/profile`
- Users: `http://localhost:3001/settings/users`

---

## Layout Hierarchy

```
Root Layout (fonts, providers, i18n)
  │
  ├── Marketing Layout (minimal, no sidebar)
  │   └── Landing Page
  │
  ├── Auth Layout (centered, no sidebar)
  │   ├── Sign In Page
  │   └── Sign Up Page
  │
  └── App Layout (AuthenticatedLayout)
      │
      ├── Accounting Layout ("Accounting" header)
      │   ├── COA Page
      │   └── Journals Pages
      │
      ├── Sales Layout ("Sales" header)
      │   ├── Customers Page
      │   ├── Invoices Page
      │   └── Payments Page
      │
      ├── Purchases Layout ("Purchases" header)
      │   └── Vendors Page
      │
      ├── Settings Layout ("Settings" header)
      │   ├── Profile Page
      │   └── Users Page
      │
      └── [Other module layouts...]
```

---

## Feature Layout Template

Each feature module has a layout with:
1. Module title (translated)
2. Module description (translated)
3. Wrapped in AuthenticatedLayout

Example:
```typescript
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';

export default function ModuleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = useTranslations();

  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('module.title')}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          {t('module.description')}
        </p>
      </div>
      {children}
    </AuthenticatedLayout>
  );
}
```

---

## Translation Keys

### Module Headers (en.json)
```json
{
  "accounting": {
    "title": "Accounting",
    "description": "Manage your financial records, journals, and reports"
  },
  "sales": {
    "title": "Sales",
    "description": "Manage customers, invoices, quotations, and payments"
  },
  "purchases": {
    "title": "Purchases",
    "description": "Manage vendors, purchase orders, and expenses"
  },
  "banking": {
    "title": "Banking",
    "description": "Manage bank accounts and reconciliation"
  },
  "assets": {
    "title": "Assets",
    "description": "Manage fixed assets and depreciation"
  },
  "tax": {
    "title": "Tax",
    "description": "Manage VAT and tax returns"
  },
  "reports": {
    "title": "Reports",
    "description": "Generate and view financial reports"
  },
  "settings": {
    "title": "Settings",
    "description": "Manage company settings, users, and roles"
  }
}
```

---

## Key Benefits

1. **Clean URLs** - Route groups don't appear in URLs
2. **Separation** - Public vs. protected routes clearly separated
3. **Organization** - Related pages grouped together
4. **Scalability** - Easy to add new pages to each module
5. **Maintainability** - Feature-specific layouts for each module
6. **No Breaking Changes** - Existing URLs still work

---

## Common Tasks

### Add a New Page to Existing Module

Example: Add quotations to sales module

1. Create directory: `(app)/sales/quotations/`
2. Create page: `(app)/sales/quotations/page.tsx`
3. Add to sidebar navigation (if needed)
4. Add translations (if needed)

URL will be: `/sales/quotations`

### Create a New Module

Example: Add HR module

1. Create directory: `(app)/hr/`
2. Create layout: `(app)/hr/layout.tsx`
3. Add translation keys to `en.json` and `ar.json`
4. Create pages: `(app)/hr/employees/page.tsx`, etc.
5. Add to sidebar navigation
6. Update translations

URL will be: `/hr/employees`

---

## Build Commands

```bash
# Development
cd frontend
npm run dev

# Production Build
npm run build

# Start Production Server
npm start

# Type Check
npm run type-check

# Lint
npm run lint
```

---

## Troubleshooting

### Build Errors

**Error**: "You cannot have two parallel pages that resolve to the same path"
- **Cause**: Old directories still exist outside route groups
- **Fix**: Remove old directories (accounting, sales, settings, auth) from `[locale]/`

**Error**: "Cannot find module"
- **Cause**: TypeScript cache issue
- **Fix**: Run `rm -rf .next` and rebuild

### Missing Layouts

If a page doesn't show the module header:
- Check if layout file exists in the module directory
- Verify layout exports default function
- Check for console errors

### Translation Errors

If translations are missing:
- Check `messages/en.json` and `messages/ar.json`
- Verify translation key matches layout usage
- Check for typos in key names

---

## Next Steps

1. ✅ Route groups created
2. ✅ Feature layouts created
3. ✅ Pages moved to correct locations
4. ✅ Build successful
5. ⏳ Create missing pages (Phase 2)
6. ⏳ Add breadcrumb navigation
7. ⏳ Implement notification system
8. ⏳ Add loading states
9. ⏳ Add error boundaries

---

## Files Reference

### Layouts Created
- `(marketing)/layout.tsx`
- `(auth)/layout.tsx`
- `(app)/layout.tsx`
- `(app)/accounting/layout.tsx`
- `(app)/sales/layout.tsx`
- `(app)/purchases/layout.tsx`
- `(app)/banking/layout.tsx`
- `(app)/assets/layout.tsx`
- `(app)/tax/layout.tsx`
- `(app)/reports/layout.tsx`
- `(app)/settings/layout.tsx`

### Pages Moved
- `page.tsx` → `(marketing)/page.tsx`
- `dashboard/page.tsx` → `(app)/dashboard/page.tsx`
- `accounting/coa/page.tsx` → `(app)/accounting/coa/page.tsx`
- `accounting/journals/page.tsx` → `(app)/accounting/journals/page.tsx`
- `accounting/customers/page.tsx` → `(app)/sales/customers/page.tsx`
- `accounting/invoices/page.tsx` → `(app)/sales/invoices/page.tsx`
- `accounting/payments/page.tsx` → `(app)/sales/payments/page.tsx`
- `accounting/vendors/page.tsx` → `(app)/purchases/vendors/page.tsx`
- `settings/profile/page.tsx` → `(app)/settings/profile/page.tsx`
- `settings/users/page.tsx` → `(app)/settings/users/page.tsx`

### Translation Files
- `messages/en.json` - English translations
- `messages/ar.json` - Arabic translations

---

**Status**: ✅ Complete and Ready for Use
**Build**: ✅ Passing
**Tested**: ✅ Basic functionality verified

---

**For detailed implementation notes, see**: `ROUTE_GROUP_RESTRUCTURE_SUMMARY.md`
**For testing checklist, see**: `ROUTE_GROUP_VERIFICATION_CHECKLIST.md`
