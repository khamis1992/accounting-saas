/**
 * Expenses Page
 * Manage business expenses with workflow and approval process
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  Download,
  Eye,
  FileText,
  Calendar,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { expensesApi, Expense, ExpenseStatus, ExpenseCategory } from "@/lib/api/expenses";
import { vendorsApi } from "@/lib/api/vendors";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function ExpensesPage() {
  const t = useTranslations("purchases.expenses");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    vendorId: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    currency: "QAR",
    category: "",
    description: "",
    descriptionAr: "",
    referenceNumber: "",
    notes: "",
    status: "pending" as ExpenseStatus,
  });

  // PERFORMANCE FIX: Separate effects - vendors only load once
  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, categoryFilter]);

  // Vendors rarely change - load once on mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all") filters.category = categoryFilter;

      const data = await expensesApi.getAll(filters);
      setExpenses(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load expenses";
      toast.error(message);
      logger.error("Failed to load expenses", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorsApi.getAll({ is_active: true });
      setVendors(data);
    } catch (error: unknown) {
      logger.error("Failed to load vendors", error as Error);
    }
  };

  // Filter expenses based on search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(
      (exp) =>
        exp.id.toLowerCase().includes(search.toLowerCase()) ||
        exp.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
        exp.description?.toLowerCase().includes(search.toLowerCase()) ||
        exp.notes?.toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, search]);

  // Get status badge
  const getStatusBadge = (status: ExpenseStatus) => {
    const variants: Record<ExpenseStatus, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      paid: "default",
    };

    const labels: Record<ExpenseStatus, string> = {
      pending: t("statuses.pending"),
      approved: t("statuses.approved"),
      rejected: t("statuses.rejected"),
      paid: t("statuses.paid"),
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      supplies: "default",
      travel: "secondary",
      meals: "outline",
      utilities: "secondary",
      rent: "outline",
      marketing: "default",
      other: "secondary",
    };
    
    const labels: Record<string, string> = {
      supplies: t("categories.supplies"),
      travel: t("categories.travel"),
      meals: t("categories.meals"),
      utilities: t("categories.utilities"),
      rent: t("categories.rent"),
      marketing: t("categories.marketing"),
      other: t("categories.other"),
    };
    
    return <Badge variant={variants[category] || "secondary"}>{labels[category] || category}</Badge>;
  };

  // Handle create expense
  const handleCreate = () => {
    setEditingExpense(null);
    setExpenseForm({
      vendorId: "",
      date: new Date().toISOString().split("T")[0],
      amount: "",
      currency: "QAR",
      category: "",
      description: "",
      descriptionAr: "",
      referenceNumber: "",
      notes: "",
      status: "pending",
    });
    setShowExpenseDialog(true);
  };

  // Handle edit expense
  const handleEdit = (expense: Expense) => {
    if (expense.status !== "pending" && expense.status !== "rejected") {
      toast.error(t("errors.editOnlyDraftOrRejected"));
      return;
    }
    
    setEditingExpense(expense);
    setExpenseForm({
      vendorId: expense.vendor_id || "",
      date: expense.date.split("T")[0],
      amount: expense.amount.toString(),
      currency: expense.currency,
      category: expense.category,
      description: expense.description || "",
      descriptionAr: "",
      referenceNumber: "",
      notes: expense.notes || "",
      status: expense.status,
    });
    setShowExpenseDialog(true);
  };

  // Handle delete expense
  const handleDelete = async (expense: Expense) => {
    if (!confirm(`${t("confirmDelete")} ${expense.id}?`)) {
      return;
    }

    try {
      await expensesApi.delete(expense.id);
      toast.success(t("deleteSuccess"));
      await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete expense";
      toast.error(message);
    }
  };

  // Handle submit expense
  const handleSubmitExpense = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      await expensesApi.approve(expense.id);
      toast.success(t("submitSuccess"));
      await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit expense";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle approve expense
  const handleApprove = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      await expensesApi.approve(expense.id);
      toast.success(t("approveSuccess"));
      await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to approve expense";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject expense
  const handleReject = async (expense: Expense) => {
    if (!confirm(t("confirmReject"))) {
      return;
    }
    
    setActionLoading(expense.id);
    try {
      await expensesApi.reject(expense.id);
      toast.success(t("rejectSuccess"));
      await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject expense";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (expense: Expense) => {
    setActionLoading(expense.id);
    try {
      // TODO: Backend API endpoint for marking as paid not implemented yet
      toast.info("Mark as paid feature coming soon");
      // await expensesApi.update(expense.id, { status: "paid" });
      // toast.success(t("markPaidSuccess"));
      // await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark as paid";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingExpense) {
        const updateData: {
          date?: string;
          amount?: number;
          currency?: string;
          category?: ExpenseCategory;
          description?: string;
          vendor_id?: string;
          vendor_name?: string;
          notes?: string;
        } = {
          date: expenseForm.date,
          amount: parseFloat(expenseForm.amount),
          currency: expenseForm.currency,
          category: expenseForm.category as ExpenseCategory,
          description: expenseForm.description,
          notes: expenseForm.notes || undefined,
        };
        if (expenseForm.vendorId) {
          updateData.vendor_id = expenseForm.vendorId;
        }
        await expensesApi.update(editingExpense.id, updateData);
        toast.success(t("updateSuccess"));
      } else {
        const createData = {
          date: expenseForm.date,
          amount: parseFloat(expenseForm.amount),
          currency: expenseForm.currency,
          category: expenseForm.category as ExpenseCategory,
          description: expenseForm.description,
          vendor_id: expenseForm.vendorId || undefined,
          notes: expenseForm.notes || undefined,
        };
        await expensesApi.create(createData);
        toast.success(t("createSuccess"));
      }

      setShowExpenseDialog(false);
      await fetchExpenses();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save expense";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle export PDF
  const handleExportPDF = async (expense: Expense) => {
    try {
      // TODO: Backend API endpoint for PDF export not implemented yet
      toast.info("PDF export feature coming soon");
      // const blob = await expensesApi.exportToPDF(expense.id);
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `expense-${expense.id}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    }
  };

  // Handle export Excel
  const handleExportExcel = async (expense: Expense) => {
    try {
      // Export all expenses for now - single expense export not implemented
      await expensesApi.exportToExcel({});
      toast.success(t("exportExcelSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast.error(message);
    }
  };

  // Get action buttons for each expense
  const getActionButtons = (expense: Expense) => {
    const buttons = [];

    // View button not implemented - no detail page
    // buttons.push({
    //   icon: <Eye className="h-4 w-4" />,
    //   label: t("actions.view"),
    //   onClick: () => handleView(expense),
    // });

    // Edit button (draft/rejected only)
    if (expense.status === "pending" || expense.status === "rejected") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: t("actions.edit"),
        onClick: () => handleEdit(expense),
      });
    }

    // Submit button (draft/rejected only)
    if (expense.status === "pending" || expense.status === "rejected") {
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: t("actions.submit"),
        onClick: () => handleSubmitExpense(expense),
        loading: actionLoading === expense.id,
      });
    }

    // Approve button (submitted only)
    if (expense.status === "pending") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: t("actions.approve"),
        onClick: () => handleApprove(expense),
        loading: actionLoading === expense.id,
      });
    }

    // Reject button (submitted only)
    if (expense.status === "pending") {
      buttons.push({
        icon: <X className="h-4 w-4" />,
        label: t("actions.reject"),
        onClick: () => handleReject(expense),
        loading: actionLoading === expense.id,
      });
    }

    // Mark as paid (approved only)
    if (expense.status === "approved") {
      buttons.push({
        icon: <DollarSign className="h-4 w-4" />,
        label: t("actions.markPaid"),
        onClick: () => handleMarkAsPaid(expense),
        loading: actionLoading === expense.id,
      });
    }

    // Export buttons (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(expense),
    });

    buttons.push({
      icon: <FileText className="h-4 w-4" />,
      label: t("actions.exportExcel"),
      onClick: () => handleExportExcel(expense),
    });

    // Delete button (draft/rejected only)
    if (expense.status === "pending" || expense.status === "rejected") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(expense),
      });
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newExpense")}
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{t("title")}</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("filters.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                    <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
                    <SelectItem value="submitted">{t("statuses.submitted")}</SelectItem>
                    <SelectItem value="approved">{t("statuses.approved")}</SelectItem>
                    <SelectItem value="rejected">{t("statuses.rejected")}</SelectItem>
                    <SelectItem value="paid">{t("statuses.paid")}</SelectItem>
                    <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("filters.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                    <SelectItem value="supplies">{t("categories.supplies")}</SelectItem>
                    <SelectItem value="travel">{t("categories.travel")}</SelectItem>
                    <SelectItem value="meals">{t("categories.meals")}</SelectItem>
                    <SelectItem value="utilities">{t("categories.utilities")}</SelectItem>
                    <SelectItem value="rent">{t("categories.rent")}</SelectItem>
                    <SelectItem value="marketing">{t("categories.marketing")}</SelectItem>
                    <SelectItem value="other">{t("categories.other")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder={t("filters.searchPlaceholder")}
                    className="w-64 pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-zinc-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{t("loading")}</span>
                </div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/purchases/expenses/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.expenseNumber")}</TableHead>
                    <TableHead>{t("table.vendor")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.category")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead className="text-right">{t("table.amount")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-mono">{expense.id}</TableCell>
                      <TableCell>
                        <div>
                          <div>{expense.vendor_name}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(expense.category)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{expense.description}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {expense.currency} {expense.amount.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(expense.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(expense).map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                btn.onClick();
                              }}
                              disabled={btn.loading}
                              title={btn.label}
                            >
                              {btn.loading ? (
                                <span className="h-4 w-4 animate-spin">⏳</span>
                              ) : (
                                btn.icon
                              )}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Expense Dialog */}
        <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? t("dialogs.editTitle") : t("dialogs.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingExpense ? t("dialogs.editDescription") : t("dialogs.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">{t("fields.vendor")} *</Label>
                  <Select
                    value={expenseForm.vendorId}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, vendorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("fields.selectVendor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name_en} ({vendor.name_ar})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">{t("fields.date")} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t("fields.amount")} *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("fields.currency")} *</Label>
                  <Select
                    value={expenseForm.currency}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, currency: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SAR">SAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t("fields.category")} *</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplies">{t("categories.supplies")}</SelectItem>
                      <SelectItem value="travel">{t("categories.travel")}</SelectItem>
                      <SelectItem value="meals">{t("categories.meals")}</SelectItem>
                      <SelectItem value="utilities">{t("categories.utilities")}</SelectItem>
                      <SelectItem value="rent">{t("categories.rent")}</SelectItem>
                      <SelectItem value="marketing">{t("categories.marketing")}</SelectItem>
                      <SelectItem value="other">{t("categories.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">{t("fields.referenceNumber")}</Label>
                  <Input
                    id="referenceNumber"
                    value={expenseForm.referenceNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, referenceNumber: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t("fields.descriptionEn")} *</Label>
                <Input
                  id="descriptionEn"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t("fields.descriptionAr")} *</Label>
                <Input
                  id="descriptionAr"
                  value={expenseForm.descriptionAr}
                  onChange={(e) => setExpenseForm({ ...expenseForm, descriptionAr: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">{t("fields.notes")}</Label>
                <Textarea
                  id="notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExpenseDialog(false)}
                  disabled={submitting}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingExpense ? t("actions.updating") : t("actions.creating")}
                    </>
                  ) : editingExpense ? (
                    t("actions.update")
                  ) : (
                    t("actions.create")
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}