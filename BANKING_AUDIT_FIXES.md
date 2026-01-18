# Banking Pages Critical Fixes

## Fix 1: Add BookTransaction Type to banking.ts

**File:** `frontend/lib/api/banking.ts`
**Issue:** Missing BookTransaction interface causing `any[]` type usage

```typescript
// Add this after BankTransaction interface (around line 32)

export interface BookTransaction {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  category?: string;
  is_reconciled: boolean;
  created_at: string;
}

// Update UnmatchedTransactions interface (line 52)
export interface UnmatchedTransactions {
  bankTransactions: BankTransaction[];
  bookTransactions: BookTransaction[]; // Changed from any[]
}
```

## Fix 2: Update Reconciliation Page to Use Proper Types

**File:** `frontend/app/[locale]/(app)/banking/reconciliation/page.tsx`

### Change 1: Update state type (line 64)
```typescript
// Before:
const [bookTransactions, setBookTransactions] = useState<any[]>([]);

// After:
import { bankingApi, BankTransaction, BookTransaction, Reconciliation } from '@/lib/api/banking';

const [bookTransactions, setBookTransactions] = useState<BookTransaction[]>([]);
```

### Change 2: Update matched transactions display (lines 495-497)
```typescript
// Before:
<TableCell className="text-sm">
  {match.book_transaction_id}
</TableCell>

// After:
<TableCell className="text-sm">
  {(() => {
    const bookTx = bookTransactions.find((tx) => tx.id === match.book_transaction_id);
    return bookTx ? (
      <div>
        <div className="font-medium">{bookTx.description}</div>
        <div className="text-muted-foreground">
          {format(new Date(bookTx.date), 'MMM dd, yyyy')}
        </div>
      </div>
    ) : (
      <span className="text-muted-foreground">ID: {match.book_transaction_id}</span>
    );
  })()}
</TableCell>
```

## Fix 3: Add Currency Parameter to Accounts Page

**File:** `frontend/app/[locale]/(app)/banking/accounts/page.tsx`

### Change 1: Update formatCurrency function (lines 86-93)
```typescript
// Before:
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// After:
const formatCurrency = (amount: number, currency?: string) => {
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: currency || summary?.currency || 'QAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

### Change 2: Update usage in summary cards (lines 162, 179)
```typescript
// Total Balance card (line 162)
<div className="text-2xl font-bold">
  {summary ? formatCurrency(summary.totalBalance, summary.currency) : '-'}
</div>

// This Month Changes card (line 179)
<div className="text-2xl font-bold">
  {summary ? formatCurrency(summary.thisMonthChanges, summary.currency) : '-'}
</div>
```

### Change 3: Update usage in table (line 318)
```typescript
<TableCell className="text-right font-semibold">
  {formatCurrency(account.balance, account.currency)}
</TableCell>
```

## Fix 4: Mobile-First Reconciliation Layout

**File:** `frontend/app/[locale]/(app)/banking/reconciliation/page.tsx`

### Add state for mobile tabs (after line 70)
```typescript
const [activeTab, setActiveTab] = useState<'bank' | 'book'>('bank');
```

### Update two-panel section (lines 521-637)
```typescript
{/* Two-Panel Matching Interface */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  {/* Mobile Tab Switcher - Only show on small screens */}
  <div className="lg:hidden flex gap-2 mb-4">
    <Button
      variant={activeTab === 'bank' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setActiveTab('bank')}
      className="flex-1"
    >
      {t('unmatched.bankTransactions')} ({bankTransactions.length})
    </Button>
    <Button
      variant={activeTab === 'book' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setActiveTab('book')}
      className="flex-1"
    >
      {t('unmatched.bookTransactions')} ({bookTransactions.length})
    </Button>
  </div>

  {/* Bank Transactions */}
  <Card className={activeTab === 'bank' ? 'block' : 'hidden lg:block'}>
    <CardHeader>
      <CardTitle className="text-lg">{t('unmatched.bankTransactions')}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="max-h-[calc(100vh-500px)] overflow-y-auto rounded-lg border">
        {/* Rest of the table remains the same */}
      </div>
    </CardContent>
  </Card>

  {/* Book Transactions */}
  <Card className={activeTab === 'book' ? 'block' : 'hidden lg:block'}>
    <CardHeader>
      <CardTitle className="text-lg">{t('unmatched.bookTransactions')}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="max-h-[calc(100vh-500px)] overflow-y-auto rounded-lg border">
        {/* Rest of the table remains the same */}
      </div>
    </CardContent>
  </Card>
</div>
```

## Fix 5: Add ARIA Labels for Accessibility

### Accounts page (lines 337-351)
```typescript
<TableCell className="text-right">
  <div className="flex justify-end gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/banking/accounts/${account.id}/transactions`)}
      aria-label={`View transactions for ${account.account_name}`}
    >
      <Eye className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/banking/reconciliation?accountId=${account.id}`)}
      aria-label={`Reconcile ${account.account_name}`}
    >
      <CheckCircle className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

### Reconciliation page (lines 502-509)
```typescript
<TableCell className="text-right">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => handleUnmatchTransaction(match.bank_transaction_id)}
    aria-label="Unmatch transactions"
  >
    <Unlink className="h-4 w-4" />
  </Button>
</TableCell>
```

## Fix 6: Add Performance Optimizations

### Accounts page - Memoize filtered accounts (after line 116)
```typescript
import { useMemo } from 'react';

// Replace the filteredAccounts variable with:
const filteredAccounts = useMemo(() => {
  return accounts.filter((account) => {
    const matchesSearch =
      searchQuery === '' ||
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_number.includes(searchQuery);

    const matchesType = typeFilter === 'all' || account.account_type === typeFilter;

    return matchesSearch && matchesType;
  });
}, [accounts, searchQuery, typeFilter]);
```

### Reconciliation page - Memoize suggestions (after line 242)
```typescript
const suggestions = useMemo(() => {
  if (!selectedBankTx) return [];

  const bankTx = bankTransactions.find((tx) => tx.id === selectedBankTx);
  if (!bankTx) return [];

  return bookTransactions.filter(
    (bookTx) =>
      Math.abs(bookTx.amount - bankTx.amount) < 0.01 &&
      Math.abs(new Date(bookTx.date).getTime() - new Date(bankTx.date).getTime()) <
        7 * 24 * 60 * 60 * 1000
  );
}, [selectedBankTx, bankTransactions, bookTransactions]);
```

### Reconciliation page - Wrap handlers in useCallback (before return statement)
```typescript
const handleStartReconciliation = useCallback(async () => {
  if (!selectedAccountId || !statementDate || !statementBalance) {
    toast.error('Please fill in all fields');
    return;
  }

  try {
    setStartingReconciliation(true);
    const reconciliation = await bankingApi.startReconciliation(
      selectedAccountId,
      statementDate,
      parseFloat(statementBalance)
    );
    setCurrentReconciliation(reconciliation);
    await loadReconciliation(reconciliation.id);
    toast.success(t('messages.started'));
  } catch (error: any) {
    toast.error(error.message || 'Failed to start reconciliation');
  } finally {
    setStartingReconciliation(false);
  }
}, [selectedAccountId, statementDate, statementBalance, t]);

const handleMatchTransactions = useCallback(async () => {
  if (!currentReconciliation || !selectedBankTx || !selectedBookTx) {
    toast.error('Please select one bank transaction and one book transaction to match');
    return;
  }

  try {
    setLoading(true);
    await bankingApi.matchTransactions(
      currentReconciliation.id,
      selectedBankTx,
      selectedBookTx
    );
    toast.success(t('messages.matched'));
    setSelectedBankTx(null);
    setSelectedBookTx(null);
    await loadReconciliation(currentReconciliation.id);
  } catch (error: any) {
    toast.error(error.message || 'Failed to match transactions');
  } finally {
    setLoading(false);
  }
}, [currentReconciliation, selectedBankTx, selectedBookTx, t]);
```

## Fix 7: Add Confirmation Dialog for Unmatch

**File:** `frontend/app/[locale]/(app)/banking/reconciliation/page.tsx`

### Add state for confirmation (after line 70)
```typescript
const [unmatchConfirm, setUnmatchConfirm] = useState<{ matchId: string; show: boolean }>({
  matchId: '',
  show: false,
});
```

### Update handleUnmatchTransaction (lines 179-192)
```typescript
const handleUnmatchTransaction = (matchId: string) => {
  setUnmatchConfirm({ matchId, show: true });
};

const confirmUnmatch = async () => {
  if (!currentReconciliation || !unmatchConfirm.matchId) return;

  try {
    setLoading(true);
    await bankingApi.unmatchTransactions(currentReconciliation.id, unmatchConfirm.matchId);
    toast.success(t('messages.unmatched'));
    setUnmatchConfirm({ matchId: '', show: false });
    await loadReconciliation(currentReconciliation.id);
  } catch (error: any) {
    toast.error(error.message || 'Failed to unmatch transactions');
  } finally {
    setLoading(false);
  }
};
```

### Add confirmation dialog (before closing </AuthenticatedLayout>)
```typescript
{/* Confirmation Dialog */}
{unmatchConfirm.show && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('confirmUnmatch.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t('confirmUnmatch.message')}
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setUnmatchConfirm({ matchId: '', show: false })}
          >
            {common('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmUnmatch} disabled={loading}>
            {common('confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

### Update unmatch button (line 502-509)
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleUnmatchTransaction(match.bank_transaction_id)}
  aria-label="Unmatch transactions"
>
  <Unlink className="h-4 w-4" />
</Button>
```

## Fix 8: Persist Filters in URL

**File:** `frontend/app/[locale]/(app)/banking/accounts/page.tsx`

### Update to use URL search params (after imports)
```typescript
import { useSearchParams, useRouter } from 'next/navigation';

// Inside component, replace existing state initialization:
const searchParams = useSearchParams();
const router = useRouter();

const [searchQuery, setSearchQuery] = useState(
  searchParams.get('search') || ''
);
const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>(
  (searchParams.get('type') as AccountType | 'all') || 'all'
);

// Update handlers to modify URL
const updateFilters = (search: string, type: AccountType | 'all') => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (type !== 'all') params.set('type', type);
  router.push(`?${params.toString()}`, { scroll: false });
};

// Update onChange handlers:
onChange={(e) => {
  const value = e.target.value;
  setSearchQuery(value);
  updateFilters(value, typeFilter);
}}

onValueChange={(value) => {
  const type = value as AccountType | 'all';
  setTypeFilter(type);
  updateFilters(searchQuery, type);
}}
```

---

## Testing Checklist

After applying fixes, test the following:

### Manual Testing
- [ ] Reconciliation page loads without TypeScript errors
- [ ] Book transactions display properly in matched list
- [ ] Mobile view shows tabs for bank/book transactions
- [ ] All icon buttons have aria-labels (check with screen reader)
- [ ] Currency formatting works for different currencies
- [ ] Filters persist after page refresh
- [ ] Unmatch confirmation dialog appears and works
- [ ] Performance improvements visible with large datasets

### Automated Testing
```bash
# Type check
cd frontend
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

---

## Deployment Notes

1. **Backup** current version before applying fixes
2. **Test** each fix individually in development
3. **Run** type checking after each fix
4. **Deploy** fixes in order (Fix 1 is prerequisite for Fix 2)
5. **Monitor** for runtime errors after deployment
6. **Rollback** plan: Keep original files backed up

---

## Priority Implementation Order

1. **Fix 1** (BookTransaction type) - Foundation for other fixes
2. **Fix 2** (Use proper types) - Removes TypeScript errors
3. **Fix 4** (Mobile layout) - Critical UX issue
4. **Fix 3** (Currency parameter) - Important for scalability
5. **Fix 5** (ARIA labels) - Accessibility compliance
6. **Fix 6** (Performance) - Nice to have, can be deferred
7. **Fix 7** (Confirmation dialog) - UX improvement
8. **Fix 8** (URL persistence) - Quality of life

Estimated total time: 6-8 hours for all fixes
