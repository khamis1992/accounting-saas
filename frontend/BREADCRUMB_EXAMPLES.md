# Breadcrumb Navigation - Visual Examples

## English (LTR)

### Example 1: Dashboard

```
Home > Dashboard
```

**Path**: `/en/dashboard`
**Visual**: 🏠 Home > Dashboard
**Current Page**: Dashboard (bold, not clickable)

### Example 2: Chart of Accounts

```
Home > Accounting > Chart of Accounts
```

**Path**: `/en/accounting/coa`
**Visual**: 🏠 Home > Accounting > Chart of Accounts
**Current Page**: Chart of Accounts (bold, not clickable)

### Example 3: Journal Entries List

```
Home > Accounting > Journals
```

**Path**: `/en/accounting/journals`
**Visual**: 🏠 Home > Accounting > Journals
**Current Page**: Journals (bold, not clickable)

### Example 4: New Journal Entry

```
Home > Accounting > Journals > New Journal Entry
```

**Path**: `/en/accounting/journals/new`
**Visual**: 🏠 Home > Accounting > Journals > New Journal Entry
**Current Page**: New Journal Entry (bold, not clickable)

### Example 5: Customers

```
Home > Sales > Customers
```

**Path**: `/en/sales/customers`
**Visual**: 🏠 Home > Sales > Customers
**Current Page**: Customers (bold, not clickable)

### Example 6: New Invoice

```
Home > Sales > Invoices > New Invoice
```

**Path**: `/en/sales/invoices/new`
**Visual**: 🏠 Home > Sales > Invoices > New Invoice
**Current Page**: New Invoice (bold, not clickable)

### Example 7: Bank Accounts

```
Home > Banking > Bank Accounts
```

**Path**: `/en/banking/accounts`
**Visual**: 🏠 Home > Banking > Bank Accounts
**Current Page**: Bank Accounts (bold, not clickable)

### Example 8: VAT Returns

```
Home > Tax > VAT Returns
```

**Path**: `/en/tax/vat-returns`
**Visual**: 🏠 Home > Tax > VAT Returns
**Current Page**: VAT Returns (bold, not clickable)

### Example 9: Company Settings

```
Home > Settings > Company
```

**Path**: `/en/settings/company`
**Visual**: 🏠 Home > Settings > Company
**Current Page**: Company (bold, not clickable)

### Example 10: Fiscal Year

```
Home > Settings > Fiscal Year
```

**Path**: `/en/settings/fiscal`
**Visual**: 🏠 Home > Settings > Fiscal Year
**Current Page**: Fiscal Year (bold, not clickable)

---

## Arabic (RTL)

### Example 1: Dashboard

```
الرئيسية > لوحة التحكم
```

**Path**: `/ar/dashboard`
**Visual**: 🏠 الرئيسية > لوحة التحكم
**Direction**: RTL (chevrons point left ◀)
**Current Page**: لوحة التحكم (bold, not clickable)

### Example 2: Chart of Accounts

```
الرئيسية > المحاسبة > دليل الحسابات
```

**Path**: `/ar/accounting/coa`
**Visual**: 🏠 الرئيسية > المحاسبة > دليل الحسابات
**Direction**: RTL (chevrons point left ◀)
**Current Page**: دليل الحسابات (bold, not clickable)

### Example 3: Journal Entries List

```
الرئيسية > المحاسبة > اليوميات
```

**Path**: `/ar/accounting/journals`
**Visual**: 🏠 الرئيسية > المحاسبة > اليوميات
**Direction**: RTL (chevrons point left ◀)
**Current Page**: اليوميات (bold, not clickable)

### Example 4: New Journal Entry

```
الرئيسية > المحاسبة > اليوميات > قيد يومي جديد
```

**Path**: `/ar/accounting/journals/new`
**Visual**: 🏠 الرئيسية > المحاسبة > اليوميات > قيد يومي جديد
**Direction**: RTL (chevrons point left ◀)
**Current Page**: قيد يومي جديد (bold, not clickable)

### Example 5: Customers

```
الرئيسية > المبيعات > العملاء
```

**Path**: `/ar/sales/customers`
**Visual**: 🏠 الرئيسية > المبيعات > العملاء
**Direction**: RTL (chevrons point left ◀)
**Current Page**: العملاء (bold, not clickable)

### Example 6: New Invoice

```
الرئيسية > المبيعات > الفواتير > فاتورة جديدة
```

**Path**: `/ar/sales/invoices/new`
**Visual**: 🏠 الرئيسية > المبيعات > الفواتير > فاتورة جديدة
**Direction**: RTL (chevrons point left ◀)
**Current Page**: فاتورة جديدة (bold, not clickable)

### Example 7: Bank Accounts

```
الرئيسية > البنوك > الحسابات البنكية
```

**Path**: `/ar/banking/accounts`
**Visual**: 🏠 الرئيسية > البنوك > الحسابات البنكية
**Direction**: RTL (chevrons point left ◀)
**Current Page**: الحسابات البنكية (bold, not clickable)

### Example 8: VAT Returns

```
الرئيسية > الضرائب > إقرارات الضريبة
```

**Path**: `/ar/tax/vat-returns`
**Visual**: 🏠 الرئيسية > الضرائب > إقرارات الضريبة
**Direction**: RTL (chevrons point left ◀)
**Current Page**: إقرارات الضريبة (bold, not clickable)

### Example 9: Company Settings

```
الرئيسية > الإعدادات > الشركة
```

**Path**: `/ar/settings/company`
**Visual**: 🏠 الرئيسية > الإعدادات > الشركة
**Direction**: RTL (chevrons point left ◀)
**Current Page**: الشركة (bold, not clickable)

### Example 10: Fiscal Year

```
الرئيسية > الإعدادات > السنة المالية
```

**Path**: `/ar/settings/fiscal`
**Visual**: 🏠 الرئيسية > الإعدادات > السنة المالية
**Direction**: RTL (chevrons point left ◀)
**Current Page**: السنة المالية (bold, not clickable)

---

## Interactive Behavior

### Clickable Breadcrumbs

All breadcrumbs except the current page are clickable:

- Hover effect: text darkens (`text-zinc-900`)
- Cursor: pointer
- Smooth transition on hover

### Home Breadcrumb Special Styling

- Home icon (🏠) instead of text
- Hover background: light gray (`bg-zinc-100`)
- Screen reader text: "Home"

### Current Page

- Bold text (`font-medium`)
- Darker color (`text-zinc-900`)
- Not clickable
- `aria-current="page"` for accessibility

---

## Responsive Design

### Desktop (≥1024px)

```
🏠 Home > Accounting > Chart of Accounts
```

Full breadcrumb trail visible

### Tablet (768px - 1023px)

```
🏠 Home > Accounting > Chart of Accounts
```

Full breadcrumb trail visible

### Mobile (<768px)

```
🏠 Home > Accounting > Chart of Accounts
```

Full breadcrumb trail visible (horizontal scroll if needed)

---

## Color Scheme

### Light Mode

- Text: `text-zinc-600` (clickable), `text-zinc-900` (current)
- Separator: `text-zinc-400`
- Hover: `hover:text-zinc-900`
- Home hover background: `hover:bg-zinc-100`

### Dark Mode

- Text: `text-zinc-400` (clickable), `text-zinc-50` (current)
- Separator: `text-zinc-600` (inherited)
- Hover: `hover:text-zinc-50`
- Home hover background: `hover:bg-zinc-800`

---

## Accessibility

### Keyboard Navigation

- Tab through breadcrumbs
- Enter/Space to navigate
- Focus visible on all clickable breadcrumbs

### Screen Reader

- "Breadcrumb" landmark announced
- Current page announced as "current page"
- Home icon announced as "Home"
- Proper reading order for RTL

### ARIA Labels

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <a href="/en">🏠 <span class="sr-only">Home</span></a>
    </li>
    <li><span aria-current="page">Accounting</span></li>
  </ol>
</nav>
```

---

## Special Cases Handled

### 1. Numeric IDs

Path: `/en/accounting/journals/123`
Breadcrumbs: `Home > Accounting > Journals`
( ID is skipped )

### 2. New + Resource

Path: `/en/sales/invoices/new`
Breadcrumbs: `Home > Sales > Invoices > New Invoice`
( "new" combined with "invoices" )

### 3. Edit + Resource

Path: `/en/customers/123/edit`
Breadcrumbs: `Home > Customers > Edit Customer`
( "edit" combined with "customers" )

### 4. Kebab-case to CamelCase

Path: `/en/accounting/chart-of-accounts`
Breadcrumbs: `Home > Accounting > Chart of Accounts`
( "chart-of-accounts" → "chartOfAccounts" )

### 5. Abbreviations

Path: `/en/accounting/coa`
Breadcrumbs: `Home > Accounting > Chart of Accounts`
( "coa" → "chartOfAccounts" )

---

## Translation Fallbacks

### 1. Direct Translation

Segment: `journals` → Translation: `Journals` ✅

### 2. Mapped Translation

Segment: `coa` → Maps to: `chartOfAccounts` → Translation: `Chart of Accounts` ✅

### 3. Compound Label

Segment: `new` + Next: `invoices` → Translation: `New Invoice` ✅

### 4. Capitalization Fallback

Segment: `unknown-route` → Fallback: `Unknown Route` ✅

---

## Icon Reference

### LTR (English)

Separator: `ChevronRight` (▶)

```
Home ▶ Accounting ▶ Journals
```

### RTL (Arabic)

Separator: `ChevronLeft` (◀)

```
الرئيسية ◀ المحاسبة ◀ اليوميات
```

### Home Icon

Icon: `Home` from lucide-react
Size: `h-4 w-4`
Visible on all locales
