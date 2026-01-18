/**
 * Reconciliation Page
 * Bank reconciliation functionality with transaction matching
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  Check,
  X,
  Calendar,
  RefreshCw,
  FileText,
} from "lucide-react";
import { reconciliationApi, Reconciliation, BankTransaction } from "@/lib/api/reconciliation";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function ReconciliationPage() {
  const t = useTranslations("banking.reconciliation");
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statementBalance, setStatementBalance] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchReconciliations();
    fetchBankAccounts();
  }, [statusFilter, accountFilter]);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (accountFilter && accountFilter !== "all") filters.account_id = accountFilter;

      const data = await reconciliationApi.getAll(filters);
      setReconciliations(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load reconciliations";
      toast.error(message);
      logger.error("Failed to load reconciliations", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const data = await bankAccountsApi.getAll({ is_active: true });
      setAccounts(data);
    } catch (error: unknown) {
      logger.error("Failed to load bank accounts", error as Error);
    }
  };

  // Filter reconciliations based on search
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(
      (rec) =>
        rec.reconciliation_number.toLowerCase().includes(search.toLowerCase()) ||
        rec.bank_account?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        rec.bank_account?.name_ar?.includes(search) ||
        rec.bank_account?.account_number.includes(search)
    );
  }, [reconciliations, search]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      in_progress: "outline",
      completed: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      draft: t("statuses.draft"),
      in_progress: t("statuses.inProgress"),
      completed: t("statuses.completed"),
      cancelled: t("statuses.cancelled"),
    };
    
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  // Action handlers
  const handleStartReconciliation = async () => {
    if (!selectedAccountId) {
      toast.error(t("errors.selectAccount"));
      return;
    }
    
    if (!startDate) {
      toast.error(t("errors.selectStartDate"));
      return;
    }
    
    if (!endDate) {
      toast.error(t("errors.selectEndDate"));
      return;
    }
    
    if (!statementBalance) {
      toast.error(t("errors.enterStatementBalance"));
      return;
    }
    
    try {
      const data = {
        account_id: selectedAccountId,
        start_date: startDate,
        end_date: endDate,
        statement_balance: parseFloat(statementBalance),
      };
      
      await reconciliationApi.create(data);
      toast.success(t("createSuccess"));
      setShowStartDialog(false);
      await fetchReconciliations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start reconciliation";
      toast.error(message);
    }
  };

  const handleView = (reconciliation: Reconciliation) => {
    router.push(`/${locale}/banking/reconciliation/${reconciliation.id}`);
  };

  const handleDelete = async (reconciliation: Reconciliation) => {
    if (!confirm(`${t("confirmDelete")} ${reconciliation.reconciliation_number}?`)) {
      return;
    }

    try {
      await reconciliationApi.delete(reconciliation.id);
      toast.success(t("deleteSuccess"));
      await fetchReconciliations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete reconciliation";
      toast.error(message);
    }
  };

  const handleExportPDF = async (reconciliation: Reconciliation) => {
    try {
      const blob = await reconciliationApi.exportToPDF(reconciliation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reconciliation-${reconciliation.reconciliation_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    }
  };

  const handleExportExcel = async (reconciliation: Reconciliation) => {
    try {
      const blob = await reconciliationApi.exportToExcel(reconciliation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reconciliation-${reconciliation.reconciliation_number}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportExcelSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast.error(message);
    }
  };

  // Get action buttons for each reconciliation
  const getActionButtons = (reconciliation: Reconciliation) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(reconciliation),
    });

    // Export buttons (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(reconciliation),
    });

    buttons.push({
      icon: <FileText className="h-4 w-4" />,
      label: t("actions.exportExcel"),
      onClick: () => handleExportExcel(reconciliation),
    });

    // Delete button (draft only)
    if (reconciliation.status === "draft") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(reconciliation),
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
          <Button onClick={() => setShowStartDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("startReconciliation")}
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
                    <SelectItem value="in_progress">{t("statuses.inProgress")}</SelectItem>
                    <SelectItem value="completed">{t("statuses.completed")}</SelectItem>
                    <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("filters.allAccounts")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allAccounts")}</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name_en} ({account.account_number})
                      </SelectItem>
                    ))}
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
            ) : filteredReconciliations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/banking/reconciliation/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.reconciliationNumber")}</TableHead>
                    <TableHead>{t("table.account")}</TableHead>
                    <TableHead>{t("table.period")}</TableHead>
                    <TableHead>{t("table.statementBalance")}</TableHead>
                    <TableHead>{t("table.bookBalance")}</TableHead>
                    <TableHead>{t("table.difference")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReconciliations.map((reconciliation) => (
                    <TableRow key={reconciliation.id}>
                      <TableCell className="font-mono">{reconciliation.reconciliation_number}</TableCell>
                      <TableCell>
                        <div>
                          <div>{reconciliation.bank_account?.name_en}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {reconciliation.bank_account?.name_ar}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(reconciliation.start_date), "dd/MM/yyyy")} -{" "}
                        {format(new Date(reconciliation.end_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {reconciliation.statement_balance?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {reconciliation.book_balance?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {reconciliation.difference !== 0 ? (
                          <span className={reconciliation.difference > 0 ? "text-green-600" : "text-red-600"}>
                            QAR {Math.abs(reconciliation.difference).toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span>QAR 0.00</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reconciliation.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(reconciliation).map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                btn.onClick();
                              }}
                              title={btn.label}
                            >
                              {btn.icon}
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

        {/* Start Reconciliation Dialog */}
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialogs.startTitle")}</DialogTitle>
              <DialogDescription>{t("dialogs.startDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">{t("dialogs.account")}</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("dialogs.selectAccount")} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name_en} ({account.account_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("dialogs.startDate")}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("dialogs.endDate")}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statementBalance">{t("dialogs.statementBalance")}</Label>
                <Input
                  id="statementBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                {t("dialogs.cancel")}
              </Button>
              <Button onClick={handleStartReconciliation}>
                {t("dialogs.start")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}