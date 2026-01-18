/**
 * Navigation Data Structure
 *
 * Central registry of all navigation items in the application.
 * Used by the sidebar, command palette, and other navigation components.
 *
 * All labels and modules now use translation keys for i18n support.
 */

export interface NavigationItem {
  id: string;
  labelKey: string; // Translation key for the label
  href: string;
  icon?: string; // Lucide icon component name
  moduleKey: string; // Translation key for the module
  keywords: string[]; // Keep keywords in English for search
  implemented?: boolean;
}

export const navigationItems: NavigationItem[] = [
  // Dashboard
  {
    id: "dashboard",
    labelKey: "nav.dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    moduleKey: "modules.main",
    keywords: ["home", "overview", "stats", "main"],
    implemented: true,
  },

  // Accounting Module
  {
    id: "coa",
    labelKey: "nav.chartOfAccounts",
    href: "/accounting/coa",
    icon: "Book",
    moduleKey: "modules.accounting",
    keywords: ["accounts", "chart", "coa", "accounting", "ledger"],
    implemented: true,
  },
  {
    id: "journals",
    labelKey: "nav.journals",
    href: "/accounting/journals",
    icon: "BookOpen",
    moduleKey: "modules.accounting",
    keywords: ["journal", "entries", "transactions", "double-entry"],
    implemented: true,
  },
  {
    id: "general-ledger",
    labelKey: "nav.generalLedger",
    href: "/accounting/general-ledger",
    icon: "FileText",
    moduleKey: "modules.accounting",
    keywords: ["ledger", "general", "gl", "account"],
    implemented: true,
  },
  {
    id: "trial-balance",
    labelKey: "nav.trialBalance",
    href: "/accounting/trial-balance",
    icon: "Scale",
    moduleKey: "modules.accounting",
    keywords: ["trial", "balance", "debits", "credits"],
    implemented: true,
  },
  {
    id: "financial-statements",
    labelKey: "nav.financialStatements",
    href: "/accounting/financial-statements",
    icon: "BarChart3",
    moduleKey: "modules.accounting",
    keywords: ["statements", "financial", "reports", "p&l", "income"],
    implemented: true,
  },

  // Sales Module
  {
    id: "customers",
    labelKey: "nav.customers",
    href: "/sales/customers",
    icon: "Users",
    moduleKey: "modules.sales",
    keywords: ["customer", "clients", "buyer", "debtors"],
    implemented: true,
  },
  {
    id: "invoices",
    labelKey: "nav.invoices",
    href: "/sales/invoices",
    icon: "FileText",
    moduleKey: "modules.sales",
    keywords: ["invoice", "billing", "sales", "receivables"],
    implemented: true,
  },
  {
    id: "quotations",
    labelKey: "nav.quotations",
    href: "/sales/quotations",
    icon: "FileStack",
    moduleKey: "modules.sales",
    keywords: ["quote", "quotation", "estimate", "proposal"],
    implemented: true,
  },
  {
    id: "sales-payments",
    labelKey: "nav.payments",
    href: "/sales/payments",
    icon: "DollarSign",
    moduleKey: "modules.sales",
    keywords: ["payment", "receipt", "collection", "received"],
    implemented: true,
  },

  // Purchases Module
  {
    id: "vendors",
    labelKey: "nav.vendors",
    href: "/purchases/vendors",
    icon: "Building2",
    moduleKey: "modules.purchases",
    keywords: ["vendor", "supplier", "seller", "creditors"],
    implemented: true,
  },
  {
    id: "purchase-orders",
    labelKey: "nav.purchaseOrders",
    href: "/purchases/orders",
    icon: "ShoppingCart",
    moduleKey: "modules.purchases",
    keywords: ["purchase", "order", "po", "procurement"],
    implemented: false,
  },
  {
    id: "expenses",
    labelKey: "nav.expenses",
    href: "/purchases/expenses",
    icon: "Receipt",
    moduleKey: "modules.purchases",
    keywords: ["expense", "spending", "cost", "payment"],
    implemented: true,
  },

  // Banking Module
  {
    id: "bank-accounts",
    labelKey: "nav.bankAccounts",
    href: "/banking/accounts",
    icon: "Landmark",
    moduleKey: "modules.banking",
    keywords: ["bank", "account", "cash", "fund"],
    implemented: true,
  },
  {
    id: "reconciliation",
    labelKey: "nav.reconciliation",
    href: "/banking/reconciliation",
    icon: "CheckCircle",
    moduleKey: "modules.banking",
    keywords: ["reconciliation", "reconcile", "match", "bank-statement"],
    implemented: true,
  },

  // Assets Module
  {
    id: "fixed-assets",
    labelKey: "nav.fixedAssets",
    href: "/assets/fixed",
    icon: "Building",
    moduleKey: "modules.assets",
    keywords: ["asset", "fixed", "property", "equipment"],
    implemented: false,
  },
  {
    id: "depreciation",
    labelKey: "nav.depreciation",
    href: "/assets/depreciation",
    icon: "TrendingDown",
    moduleKey: "modules.assets",
    keywords: ["depreciation", "amortization", "wear", "tear"],
    implemented: false,
  },

  // Tax Module
  {
    id: "vat",
    labelKey: "nav.vat",
    href: "/tax/vat",
    icon: "Percent",
    moduleKey: "modules.tax",
    keywords: ["vat", "tax", "gst", "sales-tax"],
    implemented: true,
  },
  {
    id: "vat-returns",
    labelKey: "nav.vatReturns",
    href: "/tax/vat-returns",
    icon: "FileSpreadsheet",
    moduleKey: "modules.tax",
    keywords: ["vat-return", "tax-return", "filing"],
    implemented: true,
  },

  // Reports
  {
    id: "reports",
    labelKey: "nav.reports",
    href: "/reports",
    icon: "BarChart2",
    moduleKey: "modules.reports",
    keywords: ["report", "analytics", "analysis", "data"],
    implemented: true,
  },

  // Settings Module
  {
    id: "settings-company",
    labelKey: "nav.company",
    href: "/settings/company",
    icon: "Building",
    moduleKey: "modules.settings",
    keywords: ["company", "settings", "organization", "business"],
    implemented: true,
  },
  {
    id: "settings-users",
    labelKey: "nav.users",
    href: "/settings/users",
    icon: "Users",
    moduleKey: "modules.settings",
    keywords: ["users", "team", "staff", "employees"],
    implemented: true,
  },
  {
    id: "settings-roles",
    labelKey: "nav.roles",
    href: "/settings/roles",
    icon: "Shield",
    moduleKey: "modules.settings",
    keywords: ["role", "permission", "access", "security"],
    implemented: true,
  },
  {
    id: "settings-fiscal",
    labelKey: "nav.fiscalYear",
    href: "/settings/fiscal",
    icon: "Calendar",
    moduleKey: "modules.settings",
    keywords: ["fiscal", "year", "period", "financial-year"],
    implemented: true,
  },
  {
    id: "settings-cost-centers",
    labelKey: "nav.costCenters",
    href: "/settings/cost-centers",
    icon: "Target",
    moduleKey: "modules.settings",
    keywords: ["cost", "center", "department", "division"],
    implemented: true,
  },
];

/**
 * Group items by module
 * Returns moduleKey as the key for grouping
 */
export function getGroupedNavigationItems(): Record<string, NavigationItem[]> {
  const grouped: Record<string, NavigationItem[]> = {};

  for (const item of navigationItems) {
    if (!grouped[item.moduleKey]) {
      grouped[item.moduleKey] = [];
    }
    grouped[item.moduleKey].push(item);
  }

  return grouped;
}

/**
 * Get implemented pages only
 */
export function getImplementedPages(): NavigationItem[] {
  return navigationItems.filter((item) => item.implemented);
}

/**
 * Search navigation items with fuzzy matching
 * Note: This searches in keywords and href (English only)
 * The display labels will be translated when shown to users
 */
export function searchNavigation(query: string): NavigationItem[] {
  if (!query || query.trim() === "") {
    return navigationItems;
  }

  const lowercaseQuery = query.toLowerCase().trim();

  return navigationItems.filter((item) => {
    // Search in keywords (English)
    if (item.keywords.some((kw) => kw.toLowerCase().includes(lowercaseQuery))) return true;

    // Search in href
    if (item.href.toLowerCase().includes(lowercaseQuery)) return true;

    // Search in ID
    if (item.id.toLowerCase().includes(lowercaseQuery)) return true;

    return false;
  });
}

/**
 * Get translated label for a navigation item
 * This helper function should be used by components consuming this data
 */
export function getNavigationLabel(item: NavigationItem, t: (key: string) => string): string {
  return t(item.labelKey);
}

/**
 * Get translated module name for a navigation item
 * This helper function should be used by components consuming this data
 */
export function getNavigationModule(item: NavigationItem, t: (key: string) => string): string {
  return t(item.moduleKey);
}
