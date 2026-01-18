# Work Breakdown Structure (WBS)
## UI/UX Implementation Plan - Accounting SaaS Application

**Project:** Al-Muhasib UI/UX Improvements
**Total Issues:** 40 identified issues
**Estimated Duration:** 12 weeks (3 months)
**Team Size:** 2-3 developers + 1 UX designer + 1 QA engineer
**Total Effort:** ~300 hours

---

## WBS Level 1: Project Phases

### Phase 1: Critical Fixes (Weeks 1-2)
**Duration:** 2 weeks (80 hours)
**Priority:** P0 (Critical)
**Goal:** Fix data integrity issues and critical mobile UX problems

### Phase 2: High Priority Improvements (Weeks 3-4)
**Duration:** 2 weeks (80 hours)
**Priority:** P1 (High)
**Goal:** Improve mobile experience and performance

### Phase 3: Medium Priority Enhancements (Weeks 5-8)
**Duration:** 4 weeks (120 hours)
**Priority:** P2 (Medium)
**Goal:** Enhance user workflows and add advanced features

### Phase 4: Polish & Optimization (Weeks 9-12)
**Duration:** 4 weeks (120 hours)
**Priority:** P3 (Low)
**Goal:** Polish UI, optimize performance, comprehensive testing

---

## WBS Level 2: Detailed Task Breakdown

### PHASE 1: CRITICAL FIXES (Weeks 1-2)

#### Epic 1.1: Data Integrity & Validation
**Story Points:** 21
**Effort:** 30 hours
**Priority:** P0

**User Story:** As a user, I need the application to handle data consistently between frontend and backend so that I don't lose data or encounter data corruption.

**Tasks:**

1. **Task 1.1.1: Fix Quotations Data Format Inconsistency**
   - **ID:** WBS-1.1.1
   - **Priority:** P0
   - **Effort:** 8 hours
   - **File:** `frontend/app/[locale]/(app)/sales/quotations/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] All API calls use snake_case consistently
     - [ ] `description_ar`, `description_en` fields properly mapped
     - [ ] Backend receives correct field names
     - [ ] No data loss on quotation create/edit
   - **Implementation:**
     ```typescript
     // Convert camelCase to snake_case before API call
     await quotationsApi.create({
       customer_id: data.customerId,
       date: data.date.toISOString(),
       valid_until: data.validUntil.toISOString(),
       items: data.items.map(item => ({
         description: item.description,
         description_ar: item.descriptionAr,
         description_en: item.descriptionEn,
         quantity: item.quantity,
         unit_price: item.unitPrice,
         discount: item.discount,
         tax_rate: item.taxRate,
       })),
       notes: data.notes,
     });
     ```

2. **Task 1.1.2: Fix Payment Allocation Race Condition**
   - **ID:** WBS-1.1.2
   - **Priority:** P0
   - **Effort:** 10 hours
   - **File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Backend filters invoices by party_id directly
     - [ ] No stale data issues
     - [ ] Cannot allocate to already-paid invoices
     - [ ] Performance improved (no client-side filtering)
   - **Implementation:**
     ```typescript
     // Backend API endpoint
     const fetchAvailableInvoices = async (partyType: string, partyId: string) => {
       const data = await invoicesApi.getAvailableForPayment({
         party_type: partyType,
         party_id: partyId,
         status: 'posted',
       });
       return data;
     }
     ```

3. **Task 1.1.3: Add Allocation Validation**
   - **ID:** WBS-1.1.3
   - **Priority:** P0
   - **Effort:** 6 hours
   - **File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx`
   - **Dependencies:** WBS-1.1.2
   - **Acceptance Criteria:**
     - [ ] Cannot allocate more than payment amount
     - [ ] Cannot allocate more than invoice outstanding amount
     - [ ] Cannot allocate negative amounts
     - [ ] Clear error messages for validation failures
   - **Implementation:**
     ```typescript
     const addAllocation = (invoiceId: string, outstandingAmount: number) => {
       const currentTotal = getTotalAllocated();
       const paymentAmount = parseFloat(formData.amount) || 0;
       const remainingToAllocate = paymentAmount - currentTotal;

       if (remainingToAllocate <= 0) {
         toast.error('Payment fully allocated');
         return;
       }

       const amountToAllocate = Math.min(outstandingAmount, remainingToAllocate);

       if (amountToAllocate <= 0) {
         toast.error('Invalid allocation amount');
         return;
       }

       setAllocations([...allocations, { invoiceId, amount: amountToAllocate }]);
     };
     ```

4. **Task 1.1.4: Test Data Integrity Fixes**
   - **ID:** WBS-1.1.4
   - **Priority:** P0
   - **Effort:** 6 hours
   - **Dependencies:** WBS-1.1.1, WBS-1.1.2, WBS-1.1.3
   - **Acceptance Criteria:**
     - [ ] Manual testing of quotation create/edit/delete
     - [ ] Manual testing of payment allocation
     - [ ] Edge case testing (concurrent updates, network failures)
     - [ ] All test cases pass

---

#### Epic 1.2: Mobile Navigation Critical Fixes
**Story Points:** 13
**Effort:** 20 hours
**Priority:** P0

**User Story:** As a mobile user, I need navigation that doesn't cause content to jump or feel disorienting so I can use the app effectively on my phone.

**Tasks:**

1. **Task 1.2.1: Fix Mobile Menu Content Jump**
   - **ID:** WBS-1.2.1
   - **Priority:** P0
   - **Effort:** 6 hours
   - **File:** `frontend/components/layout/sidebar.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Mobile menu button moved to topbar
     - [ ] No content jump when menu opens/closes
     - [ ] Smooth transition animation
     - [ ] Works on all mobile devices (375px-430px width)
   - **Implementation:**
     ```tsx
     // In topbar.tsx, add mobile menu trigger
     <Button
       variant="ghost"
       size="icon"
       className="lg:hidden size-11"
       onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
     >
       <Menu className="h-6 w-6" />
     </Button>

     // Remove duplicate menu button from sidebar.tsx (lines 187-201)
     ```

2. **Task 1.2.2: Implement Mobile Table Card Layouts**
   - **ID:** WBS-1.2.2
   - **Priority:** P0
   - **Effort:** 8 hours
   - **Files:**
     - `frontend/app/[locale]/(app)/dashboard/page.tsx`
     - `frontend/app/[locale]/(app)/sales/customers/page.tsx`
     - `frontend/app/[locale]/(app)/sales/invoices/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Tables show card layout on mobile (sm:hidden)
     - [ ] Desktop table layout preserved (hidden sm:block)
     - [ ] Progressive disclosure for detailed data
     - [ ] Action buttons accessible on cards
   - **Implementation:**
     ```tsx
     <div className="sm:hidden space-y-4">
       {customers.map((customer) => (
         <Card key={customer.id} className="p-4">
           <div className="flex justify-between items-start mb-3">
             <div>
               <div className="font-mono text-sm">{customer.code}</div>
               <div className="font-semibold">{customer.name_en}</div>
               <div className="text-sm text-zinc-500" dir="rtl">
                 {customer.name_ar}
               </div>
             </div>
             <span className={getStatusBadge(customer.is_active)}>
               {customer.is_active ? 'Active' : 'Inactive'}
             </span>
           </div>

           <div className="space-y-2 text-sm">
             {customer.email && (
               <div className="flex items-center gap-2">
                 <Mail className="h-4 w-4 text-zinc-400" />
                 <a href={`mailto:${customer.email}`} className="text-blue-600">
                   {customer.email}
                 </a>
               </div>
             )}
             {customer.phone && (
               <div className="flex items-center gap-2">
                 <Phone className="h-4 w-4 text-zinc-400" />
                 <a href={`tel:${customer.phone}`} className="text-blue-600">
                   {customer.phone}
                 </a>
               </div>
             )}
           </div>

           <div className="flex gap-2 mt-4 pt-4 border-t">
             <Button variant="outline" size="sm" className="flex-1">
               <Edit className="h-4 w-4 mr-2" />
               Edit
             </Button>
             <Button variant="ghost" size="sm" className="flex-1 text-red-600">
               <Trash2 className="h-4 w-4 mr-2" />
               Delete
             </Button>
           </div>
         </Card>
       ))}
     </div>

     <div className="hidden sm:block">
       <Table>...</Table>
     </div>
     ```

3. **Task 1.2.3: Optimize Dialog Forms for Mobile**
   - **ID:** WBS-1.2.3
   - **Priority:** P0
   - **Effort:** 6 hours
   - **Files:**
     - `frontend/app/[locale]/(app)/sales/customers/page.tsx`
     - `frontend/app/[locale]/(app)/sales/quotations/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Dialogs use bottom sheet on mobile
     - [ ] Virtual keyboard doesn't cover form fields
     - [ ] Single-column layouts on mobile
     - [ ] Smooth scroll within dialog
   - **Implementation:**
     ```tsx
     <DialogContent className="
       fixed bottom-0 left-0 right-0 top-auto
       sm:top-[50%] sm:left-[50%]
       translate-y-0 sm:translate-y-[-50%]
       rounded-t-xl sm:rounded-lg
       max-h-[90vh] sm:max-h-[85vh]
     ">
       <ScrollArea className="h-[calc(90vh-120px)]">
         {/* Form fields */}
       </ScrollArea>
     </DialogContent>

     // Single column grids
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
     ```

---

#### Epic 1.3: Error Handling
**Story Points:** 8
**Effort:** 10 hours
**Priority:** P0

**User Story:** As a user, I need to see helpful error messages instead of blank pages when something goes wrong so I can continue working or report the issue.

**Tasks:**

1. **Task 1.3.1: Add Error Boundaries to All Pages**
   - **ID:** WBS-1.3.1
   - **Priority:** P0
   - **Effort:** 8 hours
   - **Files:** All page components
   - **Dependencies:** None (error-boundary.tsx already exists)
   - **Acceptance Criteria:**
     - [ ] All pages wrapped in ErrorBoundary
     - [ ] User-friendly error messages
     - [ ] Reload page button on error
     - [ ] Errors logged to console
   - **Implementation:**
     ```tsx
     // components/error-boundary.tsx (already exists)
     export class ErrorBoundary extends React.Component {
       state = { hasError: false, error: null };

       static getDerivedStateFromError(error: Error) {
         return { hasError: true, error };
       }

       componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
         console.error('Error caught by boundary:', error, errorInfo);
       }

       render() {
         if (this.state.hasError) {
           return (
             <div className="flex items-center justify-center min-h-screen">
               <div className="text-center">
                 <h2>Something went wrong</h2>
                 <Button onClick={() => window.location.reload()}>
                   Reload Page
                 </Button>
               </div>
             </div>
           );
         }
         return this.props.children;
       }
     }

     // Wrap each page
     <ErrorBoundary>
       <QuotationsPage />
     </ErrorBoundary>
     ```

2. **Task 1.3.2: Replace Native Dialogs**
   - **ID:** WBS-1.3.2
   - **Priority:** P0
   - **Effort:** 2 hours
   - **Files:** Multiple pages (Quotations, Payments)
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] All confirm() replaced with AlertDialog
     - [ ] All prompt() replaced with Dialog
     - [ ] Consistent styling across all dialogs
   - **Implementation:**
     ```tsx
     <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
       <AlertDialogTrigger asChild>
         <Button variant="ghost" size="icon">
           <Trash2 className="h-4 w-4" />
         </Button>
       </AlertDialogTrigger>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
           <AlertDialogDescription>
             Are you sure you want to delete {quotation.quotation_number}?
             This action cannot be undone.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>Cancel</AlertDialogCancel>
           <AlertDialogAction onClick={handleDelete}>
             Delete
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
     ```

---

### PHASE 2: HIGH PRIORITY IMPROVEMENTS (Weeks 3-4)

#### Epic 2.1: Mobile Experience Enhancements
**Story Points:** 21
**Effort:** 30 hours
**Priority:** P1

**User Story:** As a mobile user, I need all interactive elements to be easy to tap and use so I can be productive on my phone.

**Tasks:**

1. **Task 2.1.1: Increase Touch Target Sizes**
   - **ID:** WBS-2.1.1
   - **Priority:** P1
   - **Effort:** 8 hours
   - **Files:** All UI components
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] All buttons 44px minimum on mobile
     - [ ] All navigation items 44px minimum
     - [ ] All icon buttons 44px minimum
     - [ ] WCAG 2.1 AAA compliant
   - **Implementation:**
     ```tsx
     // Buttons
     <Button className="size-11 sm:size-9">

     // Navigation items
     <button className="min-h-[44px] py-3 px-3 sm:py-2">

     // Icon buttons
     <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9">
     ```

2. **Task 2.1.2: Add Mobile Command Palette Trigger**
   - **ID:** WBS-2.1.2
   - **Priority:** P1
   - **Effort:** 4 hours
   - **File:** `frontend/components/layout/topbar.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Search icon visible on mobile
     - [ ] Keyboard shortcuts badge hidden on mobile
     - [ ] Opens command palette on tap
   - **Implementation:**
     ```tsx
     <Button
       variant="outline"
       onClick={openCommandPalette}
       className="relative w-full sm:w-64 justify-start"
     >
       <Search className="mr-2 h-4 w-4" />
       <span className="flex-1 text-left">{t('searchPlaceholder')}</span>
       <kbd className="hidden sm:inline-flex pointer-events-none absolute right-2 top-2 h-5 select-none rounded border border-zinc-200 bg-zinc-100 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
         {shortcutKey}
       </kbd>
     </Button>
     ```

3. **Task 2.1.3: Implement Swipe Gestures**
   - **ID:** WBS-2.1.3
   - **Priority:** P1
   - **Effort:** 6 hours
   - **File:** `frontend/components/layout/sidebar.tsx`
   - **Dependencies:** WBS-1.2.1
   - **Acceptance Criteria:**
     - [ ] Swipe left to close mobile menu
     - [ ] Swipe right to open mobile menu
     - [ ] Smooth gesture recognition
     - [ ] Works on iOS and Android
   - **Implementation:**
     ```tsx
     import { useSwipeable } from 'react-swipeable';

     const sidebarHandlers = useSwipeable({
       onSwipedLeft: () => setIsMobileMenuOpen(false),
       onSwipedRight: () => setIsMobileMenuOpen(true),
       trackMouse: true
     });

     <div {...sidebarHandlers} className="sidebar">
     ```

4. **Task 2.1.4: Add Click-to-Call/Email**
   - **ID:** WBS-2.1.4
   - **Priority:** P1
   - **Effort:** 4 hours
   - **Files:** Customer, Vendor, Invoice pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Phone numbers clickable (tel: links)
     - [ ] Email addresses clickable (mailto: links)
     - [ ] Works on all mobile devices
   - **Implementation:**
     ```tsx
     <a href={`tel:${customer.phone}`} className="flex items-center gap-2">
       <Phone className="h-4 w-4" />
       {customer.phone}
     </a>
     <a href={`mailto:${customer.email}`} className="flex items-center gap-2">
       <Mail className="h-4 w-4" />
       {customer.email}
     </a>
     ```

5. **Task 2.1.5: Optimize Topbar for Mobile**
   - **ID:** WBS-2.1.5
   - **Priority:** P1
   - **Effort:** 4 hours
   - **File:** `frontend/components/layout/topbar.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Secondary actions in dropdown on mobile
     - [ ] Less clutter on mobile header
     - [ ] Easy access to all features
   - **Implementation:**
     ```tsx
     <div className="flex items-center gap-2">
       <RecentItemsDropdown />
       <FavoritesDropdown />

       {/* Mobile-only more menu */}
       <DropdownMenu>
         <DropdownMenuTrigger asChild className="sm:hidden">
           <Button variant="ghost" size="icon">
             <MoreVertical className="h-5 w-5" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           <DropdownMenuItem onClick={() => toggleFavorite(currentPath)}>
             <Star className="mr-2 h-4 w-4" />
             {isFavorited ? 'Remove Favorite' : 'Add Favorite'}
           </DropdownMenuItem>
           <DropdownMenuItem onClick={changeLanguage}>
             <Languages className="mr-2 h-4 w-4" />
             Change Language
           </DropdownMenuItem>
           <DropdownMenuItem>
             <Bell className="mr-2 h-4 w-4" />
             Notifications
           </DropdownMenuItem>
         </DropdownMenuContent>
       </DropdownMenu>

       {/* Desktop: Show all icons */}
       <FavoritesButton className="hidden sm:flex" />
       <DropdownMenu className="hidden sm:block">
         {/* Language dropdown */}
       </DropdownMenu>
       <Button variant="ghost" size="icon" className="hidden sm">
         <Bell className="h-5 w-5" />
       </Button>
     </div>
     ```

6. **Task 2.1.6: Add Loading Skeletons**
   - **ID:** WBS-2.1.6
   - **Priority:** P1
   - **Effort:** 4 hours
   - **Files:** All data-heavy pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Loading skeletons replace text loaders
     - [ ] Consistent skeleton UI across app
     - [ ] Better perceived performance
   - **Implementation:**
     ```tsx
     {loading ? (
       <div className="space-y-4">
         {Array.from({ length: 6 }).map((_, i) => (
           <Skeleton key={i} className="h-32 w-full" />
         ))}
       </div>
     ) : (
       <ActualContent />
     )}
     ```

---

#### Epic 2.2: Performance Optimization
**Story Points:** 13
**Effort:** 20 hours
**Priority:** P1

**User Story:** As a user, I need pages to load quickly and respond fast so I can work efficiently without waiting.

**Tasks:**

1. **Task 2.2.1: Implement Pagination**
   - **ID:** WBS-2.2.1
   - **Priority:** P1
   - **Effort:** 12 hours
   - **Files:** Quotations, Payments, Customers, Invoices pages
   - **Dependencies:** Backend API changes required
   - **Acceptance Criteria:**
     - [ ] Server-side pagination implemented
     - [ ] 20 items per page default
     - [ ] Page size selector (10, 20, 50, 100)
     - [ ] Loading indicators for page changes
   - **Implementation:**
     ```typescript
     // API client
     interface PaginatedResponse<T> {
       data: T[];
       total: number;
       page: number;
       pageSize: number;
       totalPages: number;
     }

     const fetchQuotations = async (page: number = 1, pageSize: number = 20) => {
       const response = await fetch(
         `/api/quotations?page=${page}&pageSize=${pageSize}`
       );
       return response.json() as Promise<PaginatedResponse<Quotation>>;
     };

     // Component
     const [page, setPage] = useState(1);
     const [quotations, setQuotations] = useState<PaginatedResponse<Quotation>>();

     useEffect(() => {
       fetchQuotations(page).then(setQuotations);
     }, [page]);
     ```

2. **Task 2.2.2: Add Autosave for Drafts**
   - **ID:** WBS-2.2.2
   - **Priority:** P1
   - **Effort:** 8 hours
   - **Files:** Quotations, Purchase Orders, Invoices forms
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Forms autosave every 30 seconds
     - [ ] Drafts restored on reload
     - [ ] Clear indication of autosave
     - [ ] User can clear drafts
   - **Implementation:**
     ```tsx
     // hooks/use-autosave-form.ts
     export function useAutosaveForm<T>(
       key: string,
       data: T,
       interval: number = 30000 // 30 seconds
     ) {
       useEffect(() => {
         const timer = setInterval(() => {
           localStorage.setItem(key, JSON.stringify(data));
         }, interval);

         return () => clearInterval(timer);
       }, [key, data, interval]);

       useEffect(() => {
         const saved = localStorage.getItem(key);
         if (saved) {
           const parsed = JSON.parse(saved);
           // Show toast: "Draft restored from local storage"
           setData(parsed);
         }
       }, [key]);
     }

     // Usage
     const [formData, setFormData] = useState(initialFormData);
     useAutosaveForm('quotation-draft', formData);
     ```

---

### PHASE 3: MEDIUM PRIORITY ENHANCEMENTS (Weeks 5-8)

#### Epic 3.1: User Workflow Improvements
**Story Points:** 21
**Effort:** 40 hours
**Priority:** P2

**User Story:** As a user, I need efficient workflows with helpful feedback so I can complete tasks quickly and confidently.

**Tasks:**

1. **Task 3.1.1: Implement Optimistic Updates**
   - **ID:** WBS-3.1.1
   - **Priority:** P2
   - **Effort:** 12 hours
   - **Files:** All CRUD operations
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] UI updates immediately on user action
     - [ ] Rollback on API error
     - [ ] Clear success/error feedback
     - [ ] No data loss on network failures
   - **Implementation:**
     ```tsx
     const handleDelete = async (quotation: Quotation) => {
       // Optimistic update
       const previousQuotations = quotations;
       setQuotations(quotations.filter(q => q.id !== quotation.id));

       try {
         await quotationsApi.delete(quotation.id);
         toast.success('Quotation deleted');
       } catch (error) {
         // Rollback on error
         setQuotations(previousQuotations);
         toast.error('Failed to delete quotation');
       }
     };
     ```

2. **Task 3.1.2: Add Undo/Redo for Destructive Actions**
   - **ID:** WBS-3.1.2
   - **Priority:** P2
   - **Effort:** 8 hours
   - **Files:** Delete, reject, cancel actions
   - **Dependencies:** WBS-3.1.1
   - **Acceptance Criteria:**
     - [ ] Toast with undo button shown
     - [ ] Undo restores deleted items
     - [ ] Undo available for 5 seconds
     - [ ] Works for delete, reject, cancel
   - **Implementation:**
     ```tsx
     const handleDelete = async (quotation: Quotation) => {
       await quotationsApi.delete(quotation.id);

       toast.success('Quotation deleted', {
         action: {
           label: 'Undo',
           onClick: async () => {
             await quotationsApi.restore(quotation.id);
             toast.success('Quotation restored');
           }
         },
         duration: 5000
       });
     };
     ```

3. **Task 3.1.3: Improve Line Item Management**
   - **ID:** WBS-3.1.3
   - **Priority:** P2
   - **Effort:** 12 hours
   - **Files:** Quotations, Purchase Orders forms
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Drag-and-drop reordering
     - [ ] Bulk delete functionality
     - [ ] Duplicate line item
     - [ ] Quick copy from previous
   - **Implementation:**
     ```tsx
     import { DndContext, closestCenter } from '@dnd-kit/core';

     {lineItems.map((item, index) => (
       <Draggable key={item.id} id={item.id}>
         <div className="flex gap-2 items-center">
           <GripVertical className="cursor-move" />
           {/* Line item fields */}
           <Button onClick={() => duplicateLine(index)}>
             <Copy className="h-4 w-4" />
           </Button>
           <Button onClick={() => deleteLine(index)}>
             <Trash2 className="h-4 w-4" />
           </Button>
         </div>
       </Draggable>
     ))}
     ```

4. **Task 3.1.4: Add Workflow Visualization**
   - **ID:** WBS-3.1.4
   - **Priority:** P2
   - **Effort:** 8 hours
   - **File:** Payments page
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Workflow stepper shown
     - [ ] Current state highlighted
     - [ ] Tooltips explain each step
     - [ ] Clear guidance on next actions
   - **Implementation:**
     ```tsx
     <WorkflowStepper
       currentStep={payment.status}
       steps={[
         { key: 'draft', label: 'Draft', description: 'Initial state, editable' },
         { key: 'submitted', label: 'Submitted', description: 'Pending approval' },
         { key: 'approved', label: 'Approved', description: 'Ready to post' },
         { key: 'posted', label: 'Posted', description: 'Posted to ledger' }
       ]}
     />

     <Tooltip>
       <TooltipTrigger>
         <Button>Submit</Button>
       </TooltipTrigger>
       <TooltipContent>
         <p>Submit for approval. Cannot be edited after submission.</p>
       </TooltipContent>
     </Tooltip>
     ```

---

#### Epic 3.2: Advanced Features
**Story Points:** 21
**Effort:** 40 hours
**Priority:** P2

**User Story:** As a power user, I need advanced features like keyboard shortcuts and data fetching optimizations to work more efficiently.

**Tasks:**

1. **Task 3.2.1: Add Keyboard Shortcuts**
   - **ID:** WBS-3.2.1
   - **Priority:** P2
   - **Effort:** 8 hours
   - **Files:** All pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Ctrl+N: New record
     - [ ] Ctrl+F: Search
     - [ ] Ctrl+S: Save
     - [ ] Ctrl+E: Edit
     - [ ] Escape: Close dialog
     - [ ] Documentation available
   - **Implementation:**
     ```tsx
     // hooks/use-keyboard-shortcuts.ts
     export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
       useEffect(() => {
         const handleKeyDown = (e: KeyboardEvent) => {
           const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
           const modifierKey = isMac ? e.metaKey : e.ctrlKey;

           if (modifierKey) {
             const key = e.key.toLowerCase();
             const shortcut = `${isMac ? 'Cmd' : 'Ctrl'}+${key.toUpperCase()}`;

             if (shortcuts[shortcut]) {
               e.preventDefault();
               shortcuts[shortcut]();
             }
           }
         };

         document.addEventListener('keydown', handleKeyDown);
         return () => document.removeEventListener('keydown', handleKeyDown);
       }, [shortcuts]);
     }

     // Usage
     useKeyboardShortcuts({
       'Ctrl+N': () => handleNew(),
       'Ctrl+F': () => focusSearch(),
       'Escape': () => closeDialog(),
     });
     ```

2. **Task 3.2.2: Implement React Query**
   - **ID:** WBS-3.2.2
   - **Priority:** P2
   - **Effort:** 16 hours
   - **Files:** All data fetching logic
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] All data fetching uses React Query
     - [ ] Automatic caching implemented
     - [ ] Background refetching enabled
     - [ ] Optimistic updates built-in
     - [ ] Better error handling
   - **Implementation:**
     ```tsx
     // Replace:
     const [quotations, setQuotations] = useState<Quotation[]>([]);
     useEffect(() => { fetchQuotations(); }, []);

     // With:
     const { data: quotations, isLoading, error } = useQuery({
       queryKey: ['quotations', statusFilter, customerFilter],
       queryFn: () => quotationsApi.getAll({ status: statusFilter, customer_id: customerFilter }),
     });
     ```

3. **Task 3.2.3: Add i18n to Payments Page**
   - **ID:** WBS-3.2.3
   - **Priority:** P2
   - **Effort:** 4 hours
   - **File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] All strings use useTranslations()
     - [ ] Arabic translations complete
     - [ ] English translations complete
     - [ ] RTL layout tested

4. **Task 3.2.4: Improve Empty States**
   - **ID:** WBS-3.2.4
   - **Priority:** P2
   - **Effort:** 4 hours
   - **Files:** Reports, other list pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Helpful empty state messages
     - [ ] Call-to-action buttons
     - [ ] Onboarding guidance
     - [ ] Engaging illustrations
   - **Implementation:**
     ```tsx
     <div className="text-center py-12">
       <FileText className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
       <h3 className="text-lg font-medium mb-2">No reports yet</h3>
       <p className="text-zinc-500 mb-4">
         Generate your first report to see your financial insights
       </p>
       <Button onClick={() => setShowGenerateDialog(true)}>
         <Plus className="h-4 w-4 mr-2" />
         Generate First Report
       </Button>
     </div>
     ```

5. **Task 3.2.5: Fix Date Range Timezone Issues**
   - **ID:** WBS-3.2.5
   - **Priority:** P2
   - **Effort:** 4 hours
   - **File:** `frontend/app/[locale]/(app)/reports/page.tsx`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Use date-fns for date calculations
     - [ ] Consistent timezone handling
     - [ ] Correct date ranges in reports
   - **Implementation:**
     ```tsx
     import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';

     const getDateRange = (period: string) => {
       const now = new Date();

       switch (period) {
         case 'thisMonth':
           return {
             start: startOfMonth(now),
             end: endOfMonth(now)
           };
         case 'thisQuarter':
           return {
             start: startOfQuarter(now),
             end: endOfQuarter(now)
           };
         // ...
       }
     };
     ```

6. **Task 3.2.6: Add Safe Area Support**
   - **ID:** WBS-3.2.6
   - **Priority:** P2
   - **Effort:** 4 hours
   - **File:** `frontend/app/globals.css`
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Safe area insets for notches
     - [ ] Content not hidden by dynamic island
     - [ ] Works on all iPhones
   - **Implementation:**
     ```css
     @supports (padding: env(safe-area-inset-bottom)) {
       .mobile-safe-bottom {
         padding-bottom: env(safe-area-inset-bottom);
       }
       .mobile-safe-top {
         padding-top: env(safe-area-inset-top);
       }
     }
     ```

---

### PHASE 4: POLISH & OPTIMIZATION (Weeks 9-12)

#### Epic 4.1: Polish & Refinement
**Story Points:** 21
**Effort:** 60 hours
**Priority:** P3

**User Story:** As a user, I need a polished, professional application that feels great to use and performs well.

**Tasks:**

1. **Task 4.1.1: Add Report Previews**
   - **ID:** WBS-4.1.1
   - **Priority:** P3
   - **Effort:** 8 hours
   - **File:** Reports page
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Thumbnail previews of reports
     - [ ] Users know what to expect
     - [ ] Reduces wasteful generation

2. **Task 4.1.2: Implement Advanced Filtering**
   - **ID:** WBS-4.1.2
   - **Priority:** P3
   - **Effort:** 12 hours
   - **Files:** All list pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Advanced filter panel
     - [ ] Save filter presets
     - [ ] Combine multiple filters
     - [ ] Share filtered URLs

3. **Task 4.1.3: Add Bulk Actions**
   - **ID:** WBS-4.1.3
   - **Priority:** P3
   - **Effort:** 12 hours
   - **Files:** All list pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Select multiple items
     - [ ] Bulk delete
     - [ ] Bulk export
     - [ ] Bulk status change

4. **Task 4.1.4: Add Pull-to-Refresh**
   - **ID:** WBS-4.1.4
   - **Priority:** P3
   - **Effort:** 8 hours
   - **Files:** List pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Pull down to refresh
     - [ ] Visual feedback
     - [ ] Works on iOS and Android

5. **Task 4.1.5: Improve Animations**
   - **ID:** WBS-4.1.5
   - **Priority:** P3
   - **Effort:** 8 hours
   - **Files:** All transitions
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Spring animations
     - [ ] Smooth 60fps transitions
     - [ ] Natural feel
     - [ ] Reduced motion support

6. **Task 4.1.6: Add Onboarding Guides**
   - **ID:** WBS-4.1.6
   - **Priority:** P3
   - **Effort:** 8 hours
   - **Files:** All major features
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] First-run experience
     - [ ] Feature tours
     - [ ] Tooltips
     - [ ] Help documentation

7. **Task 4.1.7: Fix Hardcoded Currency**
   - **ID:** WBS-4.1.7
   - **Priority:** P3
   - **Effort:** 4 hours
   - **Files:** Throughout application
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Currency from company settings
     - [ ] Multi-currency support
     - [ ] Proper formatting

---

#### Epic 4.2: Performance & Testing
**Story Points:** 21
**Effort:** 60 hours
**Priority:** P3

**User Story:** As a user, I need the application to perform well and be bug-free so I can rely on it for my business.

**Tasks:**

1. **Task 4.2.1: Add Virtual Scrolling**
   - **ID:** WBS-4.2.1
   - **Priority:** P3
   - **Effort:** 12 hours
   - **Files:** Large list views
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] @tanstack/react-virtual implemented
     - [ ] Handles 1000+ items smoothly
     - [ ] Maintains scroll position
     - [ ] No performance degradation

2. **Task 4.2.2: Implement Code Splitting**
   - **ID:** WBS-4.2.2
   - **Priority:** P3
   - **Effort:** 8 hours
   - **Files:** Heavy components
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Dialog components lazy-loaded
     - [ ] Route-based code splitting
     - [ ] Reduced initial bundle size
     - [ ] Faster initial load

3. **Task 4.2.3: Write E2E Tests**
   - **ID:** WBS-4.2.3
   - **Priority:** P3
   - **Effort:** 20 hours
   - **Files:** All critical workflows
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Playwright/Cypress tests
     - [ ] Test coverage >80%
     - [ ] CI/CD integration
     - [ ] Automated test runs

4. **Task 4.2.4: Performance Optimization**
   - **ID:** WBS-4.2.4
   - **Priority:** P3
   - **Effort:** 12 hours
   - **Files:** All pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] Lighthouse score >90
     - [ ] Page load <2s on 3G
     - [ ] Time to interactive <1.5s
     - [ ] No layout shifts

5. **Task 4.2.5: Accessibility Audit**
   - **ID:** WBS-4.2.5
   - **Priority:** P3
   - **Effort:** 8 hours
   - **Files:** All pages
   - **Dependencies:** None
   - **Acceptance Criteria:**
     - [ ] WCAG 2.1 AA compliant
     - [ ] Screen reader tested
     - [ ] Keyboard navigation tested
     - [ ] Color contrast verified

---

## WBS Level 3: Dependencies & Relationships

### Critical Path:
```
WBS-1.1.2 (Fix Race Condition) → WBS-1.1.3 (Add Validation)
WBS-1.2.1 (Fix Menu) → WBS-2.1.3 (Swipe Gestures)
WBS-3.1.1 (Optimistic Updates) → WBS-3.1.2 (Undo/Redo)
```

### Parallel Work Streams:
1. **Stream 1 (Week 1-2):** Data integrity fixes (Epic 1.1) + Mobile navigation (Epic 1.2)
2. **Stream 2 (Week 3-4):** Mobile enhancements (Epic 2.1) + Performance (Epic 2.2)
3. **Stream 3 (Week 5-8):** Workflow improvements (Epic 3.1) + Advanced features (Epic 3.2)
4. **Stream 4 (Week 9-12):** Polish (Epic 4.1) + Testing (Epic 4.2)

### Risk Items (High Effort):
- WBS-1.2.2 (Mobile Table Card Layouts) - 8 hours
- WBS-2.2.1 (Implement Pagination) - 12 hours
- WBS-3.1.1 (Optimistic Updates) - 12 hours
- WBS-3.1.3 (Line Item Management) - 12 hours
- WBS-3.2.2 (React Query Implementation) - 16 hours
- WBS-4.2.3 (E2E Tests) - 20 hours

---

## Task Summary by Priority

### P0 (Critical) - 12 Tasks, 60 hours
- Data integrity: 3 tasks (24 hours)
- Mobile navigation: 3 tasks (20 hours)
- Error handling: 2 tasks (10 hours)
- Performance: 2 tasks (6 hours)

### P1 (High) - 11 Tasks, 50 hours
- Mobile experience: 6 tasks (30 hours)
- Performance: 2 tasks (20 hours)

### P2 (Medium) - 15 Tasks, 80 hours
- Workflow improvements: 4 tasks (40 hours)
- Advanced features: 6 tasks (40 hours)

### P3 (Low) - 13 Tasks, 110 hours
- Polish: 7 tasks (60 hours)
- Testing: 6 tasks (50 hours)

---

## Summary

**Total Epics:** 13
**Total Tasks:** 51
**Total Estimated Hours:** 300 hours
**Recommended Timeline:** 12 weeks
**Team Size:** 2-3 developers + 1 UX designer + 1 QA

**Critical Path Items:**
1. Fix data format inconsistencies
2. Fix payment allocation race condition
3. Add allocation validation
4. Fix mobile menu positioning
5. Implement mobile table layouts

**Quick Wins (Low Effort, High Impact):**
- Increase button sizes (4 hours)
- Hide keyboard shortcuts on mobile (2 hours)
- Add click-to-call/email (4 hours)
- Replace native dialogs (8 hours)
- Add loading skeletons (4 hours)

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Next Review:** After Phase 1 completion
