/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Expenses Page
 * Displays expense list with summary cards, search, filtering, and CRUD operations
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Package,
  Plane,
  Coffee,
  Zap,
  Building,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Upload,
  Download,
  MoreVertical,
  FileCheck,
  X,
} from "lucide-react";
import {
  expensesApi,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  CreateExpenseDto,
  ExpenseSummary,
} from "@/lib/api/expenses";
import { toast } from "sonner";
import { use } from "react";

// Category icons mapping
const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  supplies: <Package className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  meals: <Coffee className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
  rent: <Building className="h-4 w-4" />,
  marketing: <Megaphone className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

// Category colors
const categoryColors: Record<ExpenseCategory, string> = {
  supplies: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  travel: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  meals: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  utilities: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  rent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

// Status colors
const statusColors: Record<ExpenseStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function ExpensesPage() {
  const t = useTranslations("purchases.expenses");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    category: "other" as ExpenseCategory,
    description: "",
    vendorName: "",
    amount: "",
    currency: "QAR",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (categoryFilter !== "all") {
        filters.category = categoryFilter;
      }
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      const [expensesData, summaryData] = await Promise.all([
        expensesApi.getAll(filters),
        expensesApi.getSummary(),
      ]);

      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(search.toLowerCase()) ||
      expense.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      expense.employee_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditExpense(null);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      category: "other",
      description: "",
      vendorName: "",
      amount: "",
      currency: "QAR",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    setFormData({
      date: format(new Date(expense.date), "yyyy-MM-dd"),
      category: expense.category,
      description: expense.description,
      vendorName: expense.vendor_name || "",
      amount: expense.amount.toString(),
      currency: expense.currency,
      notes: expense.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateExpenseDto = {
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        vendor_id: formData.vendorName || undefined,
        notes: formData.notes || undefined,
      };

      if (editExpense) {
        await expensesApi.update(editExpense.id, data);
        toast.success("Expense updated successfully");
      } else {
        await expensesApi.create(data);
        toast.success("Expense created successfully");
      }

      setDialogOpen(false);
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (expense.status !== "pending") {
      toast.error("Only pending expenses can be deleted");
      return;
    }

    if (!confirm(`Are you sure you want to delete this expense?`)) {
      return;
    }

    try {
      await expensesApi.delete(expense.id);
      toast.success("Expense deleted successfully");
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete expense");
    }
  };

  const handleApprove = async (expense: Expense) => {
    try {
      await expensesApi.approve(expense.id);
      toast.success("Expense approved successfully");
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve expense");
    }
  };

  const handleReject = async (expense: Expense) => {
    const reason = prompt("Please enter rejection reason (optional):");
    if (reason === null) return; // User cancelled

    try {
      await expensesApi.reject(expense.id, reason || undefined);
      toast.success("Expense rejected successfully");
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to reject expense");
    }
  };

  const handleUploadReceipt = (expense: Expense) => {
    setSelectedExpense(expense);
    setReceiptDialogOpen(true);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedExpense) return;

    setUploadingReceipt(true);
    try {
      await expensesApi.uploadReceipt(selectedExpense.id, file);
      toast.success("Receipt uploaded successfully");
      setReceiptDialogOpen(false);
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to upload receipt");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleExport = async () => {
    try {
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (categoryFilter !== "all") filters.category = categoryFilter;
      if (statusFilter !== "all") filters.status = statusFilter;

      await expensesApi.exportToExcel(filters);
      toast.success("Expenses exported successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to export expenses");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
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

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("summary.totalThisMonth")}</CardTitle>
                <DollarSign className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalThisMonth, "QAR")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("summary.pendingApproval")}
                </CardTitle>
                <Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.pendingApproval, "QAR")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("summary.thisWeek")}</CardTitle>
                <FileCheck className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.thisWeek, "QAR")}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("summary.byCategory")}</CardTitle>
                <Package className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(summary.byCategory)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{formatCurrency(amount, "QAR")}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("title")}</CardTitle>
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="meals">Meals</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search expenses..."
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
              <div className="py-8 text-center text-zinc-500">Loading expenses...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                <Package className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                <p className="font-medium">{t("empty.title")}</p>
                <p className="text-sm">{t("empty.description")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.category")}</TableHead>
                      <TableHead>{t("table.description")}</TableHead>
                      <TableHead>{t("table.vendor")}</TableHead>
                      <TableHead>{t("table.amount")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.receipt")}</TableHead>
                      <TableHead className="text-right">{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(new Date(expense.date), "yyyy-MM-dd")}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${categoryColors[expense.category]}`}
                          >
                            {categoryIcons[expense.category]}
                            <span className="capitalize">{expense.category}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{expense.description}</div>
                            {expense.notes && (
                              <div className="text-sm text-zinc-500">{expense.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{expense.vendor_name || expense.employee_name || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[expense.status]}`}
                          >
                            {t(`statuses.${expense.status}`)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {expense.receipt_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(expense.receipt_url, "_blank")}
                              className="gap-1"
                            >
                              <FileCheck className="h-4 w-4" />
                              View
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUploadReceipt(expense)}
                              className="gap-1"
                            >
                              <Upload className="h-4 w-4" />
                              Upload
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {expense.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(expense)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(expense)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                              {expense.status === "approved" && (
                                <DropdownMenuItem onClick={() => handleApprove(expense)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {expense.rejection_reason && (
                                <div className="px-2 py-1 text-sm text-red-600 border-t">
                                  Reason: {expense.rejection_reason}
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editExpense ? "Edit Expense" : "New Expense"}</DialogTitle>
              <DialogDescription>
                {editExpense ? "Update expense details" : "Record a new business expense"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: ExpenseCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:focus:ring-zinc-300"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Upload Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Receipt</DialogTitle>
              <DialogDescription>Upload a receipt for this expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg p-8">
                <Upload className="h-12 w-12 text-zinc-400 mb-4" />
                <Label htmlFor="receipt-upload" className="cursor-pointer">
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload</p>
                    <p className="text-xs text-zinc-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </Label>
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReceiptDialogOpen(false)}
                  disabled={uploadingReceipt}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
