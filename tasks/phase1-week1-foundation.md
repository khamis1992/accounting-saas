# Phase 1, Week 1: Foundation Implementation

## Objective
Restructure frontend routes using Next.js route groups, create feature-specific layouts, and fix navigation to establish a solid foundation for the 12-week system redesign.

## Business Impact
- Users will have intuitive, organized navigation
- All sidebar links will lead to valid pages
- Foundation ready for rapid page creation in Weeks 2-12
- Preserved existing functionality (zero breaking changes)

## Acceptance Criteria
- [ ] All existing pages accessible via new route group structure
- [ ] Breadcrumb navigation displays on all authenticated pages
- [ ] Sidebar navigation links work correctly (404-free)
- [ ] Feature-specific layouts created (accounting, sales, purchases)
- [ ] Zero console errors in browser
- [ ] All existing tests pass
- [ ] Middleware handles new route structure correctly

## Scope & Impact Radius

### Modules touched:
- `frontend/app/[locale]/` - Route restructuring with groups
- `frontend/components/layout/` - New breadcrumb, enhanced sidebar
- `frontend/middleware.ts` - Route handling updates
- `frontend/messages/` - Translation additions for breadcrumbs

### Out-of-scope:
- New page implementations (Week 3-8)
- UI/UX enhancements (Week 9-10)
- Backend modifications

## Risks & Mitigations

### Risk 1: Breaking existing routes during restructuring
**Mitigation**: Use route groups which preserve URLs. Test all existing pages before/after changes. Keep old routes accessible via redirects during transition.

### Risk 2: Sidebar navigation inconsistencies
**Mitigation**: Automated link checking, manual verification of all 25+ navigation items.

### Risk 3: Middleware auth bypass vulnerabilities
**Mitigation**: Security review of middleware changes, test auth flows (protected/public routes).

### Risk 4: Translation gaps for new features
**Mitigation**: Use existing translation keys where possible, add new keys for breadcrumbs only.

## Implementation Steps

### Step 1: Create Route Groups (0.5 day)
**Agent**: `frontend-developer`

Create new directory structure:
```
frontend/app/[locale]/
├── (marketing)/          # Public routes
│   ├── page.tsx          # Landing page (move if exists)
│   └── layout.tsx        # Marketing layout (minimal)
├── (auth)/               # Authentication routes
│   ├── signin/
│   │   └── page.tsx      # Move from auth/signin
│   ├── signup/
│   │   └── page.tsx      # Move from auth/signup
│   └── layout.tsx        # Auth layout (centered card)
└── (app)/                # Protected authenticated routes
    ├── layout.tsx        # Apply AuthenticatedLayout wrapper
    ├── dashboard/
    │   └── page.tsx      # Move from dashboard
    ├── accounting/
    │   ├── layout.tsx    # NEW: Accounting-specific header
    │   ├── coa/
    │   │   └── page.tsx  # Keep as-is
    │   ├── journals/
    │   │   └── page.tsx  # Keep as-is
    │   ├── customers/    # MOVE to sales/customers in Step 2
    │   ├── invoices/     # MOVE to sales/invoices in Step 2
    │   └── payments/     # MOVE to sales/payments in Step 2
    ├── sales/
    │   ├── layout.tsx    # NEW: Sales-specific header
    │   ├── customers/    # MOVE from accounting
    │   ├── invoices/     # MOVE from accounting
    │   ├── quotations/   # NEW (Week 3)
    │   └── payments/     # MOVE from accounting
    ├── purchases/
    │   ├── layout.tsx    # NEW: Purchases-specific header
    │   ├── vendors/      # MOVE from accounting
    │   ├── orders/       # NEW (Week 5)
    │   └── expenses/     # NEW (Week 5)
    └── settings/
        ├── layout.tsx    # NEW: Settings-specific header
        ├── users/
        │   └── page.tsx  # Keep as-is
        └── ...           # Other settings pages (Week 9)
```

**Key Principle**: Route groups `(name)` don't affect URLs, so existing routes continue working.

---

### Step 2: Create Feature Layouts (0.5 day)
**Agent**: `frontend-developer`

Create module-specific layouts with breadcrumbs:

**File**: `frontend/app/[locale]/(app)/accounting/layout.tsx`
```typescript
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Breadcrumb } from '@/components/layout/breadcrumb';

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <Breadcrumb />
        <h1 className="text-3xl font-bold mt-4">Accounting</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Manage your financial records</p>
      </div>
      {children}
    </AuthenticatedLayout>
  );
}
```

Repeat for:
- `frontend/app/[locale]/(app)/sales/layout.tsx`
- `frontend/app/[locale]/(app)/purchases/layout.tsx`
- `frontend/app/[locale]/(app)/settings/layout.tsx`
- `frontend/app/[locale]/(app)/(app)/layout.tsx` (wrapper for all app routes)

---

### Step 3: Create Breadcrumb Component (0.5 day)
**Agent**: `typescript-pro`

**File**: `frontend/components/layout/breadcrumb.tsx`

Features:
- Auto-generate from pathname
- Support i18n (use translation keys)
- Handle dynamic routes
- RTL support for Arabic
- Clickable navigation

**Translation keys to add** (`frontend/messages/en.json`):
```json
{
  "breadcrumbs": {
    "dashboard": "Dashboard",
    "accounting": "Accounting",
    "sales": "Sales",
    "purchases": "Purchases",
    "settings": "Settings",
    "chartOfAccounts": "Chart of Accounts",
    "journals": "Journals",
    "customers": "Customers",
    "invoices": "Invoices",
    "vendors": "Vendors",
    "users": "Users"
  }
}
```

---

### Step 4: Update Sidebar Navigation (0.5 day)
**Agent**: `frontend-developer`

**File**: `frontend/components/layout/sidebar.tsx`

Changes needed:
1. Verify all navigation paths match new route structure
2. Ensure no broken links
3. Test collapsible groups work correctly
4. Verify mobile menu functionality

**Current sidebar paths** (from analysis):
```typescript
// These paths should work after route group creation:
{ title: t('chartOfAccounts'), href: `/${locale}/accounting/coa` },
{ title: t('journals'), href: `/${locale}/accounting/journals` },
{ title: t('customers'), href: `/${locale}/sales/customers` },  // Will move
{ title: t('invoices'), href: `/${locale}/sales/invoices` },    // Will move
{ title: t('vendors'), href: `/${locale}/purchases/vendors` },  // Will move
// ... etc
```

---

### Step 5: Update Middleware (0.5 day)
**Agent**: `typescript-pro`

**File**: `frontend/middleware.ts`

Changes needed:
1. Update PUBLIC_PATHS if needed for new route structure
2. Ensure route groups don't break auth checks
3. Test redirects for authenticated/unauthenticated users
4. Verify locale handling still works

**No major changes expected** since route groups don't affect URLs, but verify auth flow works.

---

### Step 6: Move Pages to New Structure (1 day)
**Agent**: `frontend-developer`

Move pages from old structure to new route groups:

**Moves required**:
1. `frontend/app/[locale]/accounting/customers/` → `frontend/app/[locale]/(app)/sales/customers/`
2. `frontend/app/[locale]/accounting/invoices/` → `frontend/app/[locale]/(app)/sales/invoices/`
3. `frontend/app/[locale]/accounting/payments/` → `frontend/app/[locale]/(app)/sales/payments/`
4. `frontend/app/[locale]/accounting/vendors/` → `frontend/app/[locale]/(app)/purchases/vendors/`

**Implementation**:
- Use git mv to preserve history
- Update any internal imports/links
- Verify each moved page works

---

### Step 7: Comprehensive Testing (1 day)
**Agent**: `code-reviewer` + `frontend-developer`

**Test Checklist**:

1. **Authentication Flow**
   - [ ] Sign in works
   - [ ] Sign out works
   - [ ] Protected routes redirect to signin
   - [ ] Public routes accessible without auth

2. **Navigation**
   - [ ] All sidebar links work (25+ items)
   - [ ] Breadcrumbs display correctly
   - [ ] Breadcrumbs are clickable
   - [ ] Mobile menu works

3. **Existing Pages**
   - [ ] Dashboard loads
   - [ ] Chart of Accounts loads
   - [ ] Journals load
   - [ ] Customers load (after move)
   - [ ] Invoices load (after move)
   - [ ] Vendors load (after move)
   - [ ] Users/Settings load

4. **i18n**
   - [ ] English navigation works
   - [ ] Arabic navigation works
   - [ ] RTL layout works for Arabic
   - [ ] Breadcrumbs translate correctly

5. **Console**
   - [ ] Zero errors
   - [ ] Zero warnings (if possible)

6. **Responsive Design**
   - [ ] Mobile (320px+)
   - [ ] Tablet (768px+)
   - [ ] Desktop (1024px+)

---

## Rollback Plan

### If route restructuring causes issues:
1. Revert to previous directory structure
2. Restore old middleware.ts
3. Test that old structure works

### Commands:
```bash
# Rollback route changes
git revert HEAD

# Or restore from backup
git checkout -b rollback-phase1-week1
git checkout main~1 -- frontend/app/
git checkout main~1 -- frontend/middleware.ts
```

---

## Success Metrics

### Technical Metrics:
- [ ] All existing pages accessible (100%)
- [ ] Zero 404 errors from navigation
- [ ] Zero console errors
- [ ] All tests pass
- [ ] Lighthouse score > 90 (performance, accessibility)

### User Experience Metrics:
- [ ] Navigation intuitive (user testing)
- [ ] Breadcrumbs helpful (visual hierarchy)
- [ ] No confusion from route changes (invisible to users)

---

## Dependencies

### Blocking:
- None (can start immediately)

### Blocked by:
- None

### Parallel Work:
- Steps 1-3 can be done in parallel by different agents
- Step 4-6 are sequential (depend on 1-3)
- Step 7 is final validation

---

## Time Estimate

| Step | Task | Agent | Duration |
|------|------|-------|----------|
| 1 | Create Route Groups | frontend-developer | 0.5 day |
| 2 | Create Feature Layouts | frontend-developer | 0.5 day |
| 3 | Create Breadcrumb Component | typescript-pro | 0.5 day |
| 4 | Update Sidebar Navigation | frontend-developer | 0.5 day |
| 5 | Update Middleware | typescript-pro | 0.5 day |
| 6 | Move Pages to New Structure | frontend-developer | 1 day |
| 7 | Testing & Validation | code-reviewer + frontend-developer | 1 day |

**Total**: 4.5 days (within 1-week sprint)

---

## Next Steps (After Week 1)

### Week 2: Navigation Enhancement
- Keyboard navigation (Cmd+K)
- Recently viewed items
- Favorites/pinned pages
- Page transitions

### Week 3-4: Core Accounting Pages
- General Ledger
- Trial Balance
- Financial Statements

---

## Review (Post-Implementation)

### What shipped vs plan:
_To be filled after completion_

### Known limitations:
_To be filled after completion_

### Follow-ups:
_To be filled after completion_

---

**Status**: 🚀 Ready to Start
**Created**: 2026-01-17
**Priority**: HIGH (Foundation for all future work)
**Risk Level**: MEDIUM (Route restructuring is risky but mitigated)
