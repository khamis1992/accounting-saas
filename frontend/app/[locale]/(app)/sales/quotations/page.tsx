/**
 * Quotations Page
 * Displays quotations list with filtering, workflow actions, and CRUD operations
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quotationsApi, Quotation, QuotationStatus } from "@/lib/api/quotations";
import { customersApi } from "@/lib/api/customers";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function QuotationsPage() {
  const t = useTranslations("sales.quotations");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, [statusFilter, customerFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (customerFilter && customerFilter !== "all") filters.customer_id = customerFilter;

      const data = await quotationsApi.getAll(filters);
      setQuotations(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load quotations";
      toast.error(message);
      logger.error("Failed to load quotations", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll({ is_active: true });
      setCustomers(data);
    } catch (error: unknown) {
      logger.error("Failed to load customers", error as Error);
    }
  };

  // Filter quotations based on search
  const filteredQuotations = useMemo(() => {
    return quotations.filter(
      (quo) =>
        quo.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
        quo.customer?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        quo.customer?.name_ar?.includes(search) ||
        quo.reference_number?.toLowerCase().includes(search.toLowerCase())
    );
  }, [quotations, search]);

  // Get status badge
  const getStatusBadge = (status: QuotationStatus) => {
    const variants: Record<QuotationStatus, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      rejected: "destructive",
      expired: "secondary",
      converted: "default",
    };
    
    const labels: Record<QuotationStatus, string> = {
      draft: t("statuses.draft"),
      sent: t("statuses.sent"),
      accepted: t("statuses.accepted"),
      rejected: t("statuses.rejected"),
      expired: t("statuses.expired"),
      converted: t("statuses.converted"),
    };
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Action handlers
  const handleCreate = () => {
    router.push(`/${locale}/sales/quotations/new`);
  };

  const handleEdit = (quotation: Quotation) => {
    if (quotation.status !== "draft") {
      toast.error(t("errors.editOnlyDraft"));
      return;
    }
    router.push(`/${locale}/sales/quotations/${quotation.id}/edit`);
  };

  const handleDelete = async (quotation: Quotation) => {
    if (!confirm(`${t("confirmDelete")} ${quotation.quotation_number}?`)) {
      return;
    }

    try {
      await quotationsApi.delete(quotation.id);
      toast.success(t("deleteSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete quotation";
      toast.error(message);
    }
  };

  const handleSend = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      await quotationsApi.send(quotation.id);
      toast.success(t("sendSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send quotation";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      await quotationsApi.accept(quotation.id);
      toast.success(t("acceptSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept quotation";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (quotation: Quotation) => {
    if (!confirm(t("confirmReject"))) {
      return;
    }
    setActionLoading(quotation.id);
    try {
      await quotationsApi.reject(quotation.id);
      toast.success(t("rejectSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject quotation";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      await quotationsApi.convertToInvoice(quotation.id);
      toast.success(t("convertSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to convert to invoice";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPDF = async (quotation: Quotation) => {
    try {
      const blob = await quotationsApi.exportToPDF(quotation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotation.quotation_number}.pdf`;
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

  // Get action buttons for each quotation
  const getActionButtons = (quotation: Quotation) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => router.push(`/${locale}/sales/quotations/${quotation.id}`),
    });

    if (quotation.status === "draft") {
      // Edit button (draft only)
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: t("actions.edit"),
        onClick: () => handleEdit(quotation),
      });

      // Delete button (draft only)
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(quotation),
      });

      // Send button (draft only)
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: t("actions.send"),
        onClick: () => handleSend(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    if (quotation.status === "sent") {
      // Accept button (sent only)
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: t("actions.accept"),
        onClick: () => handleAccept(quotation),
        loading: actionLoading === quotation.id,
      });

      // Reject button (sent only)
      buttons.push({
        icon: <X className="h-4 w-4" />,
        label: t("actions.reject"),
        onClick: () => handleReject(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    if (quotation.status === "accepted" && !quotation.converted_to_invoice) {
      // Convert to invoice button (accepted only, if not already converted)
      buttons.push({
        icon: <FileText className="h-4 w-4" />,
        label: t("actions.convertToInvoice"),
        onClick: () => handleConvertToInvoice(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    // Export button (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.export"),
      onClick: () => handleExportPDF(quotation),
    });

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
            {t("newQuotation")}
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
                    <SelectItem value="sent">{t("statuses.sent")}</SelectItem>
                    <SelectItem value="accepted">{t("statuses.accepted")}</SelectItem>
                    <SelectItem value="rejected">{t("statuses.rejected")}</SelectItem>
                    <SelectItem value="expired">{t("statuses.expired")}</SelectItem>
                    <SelectItem value="converted">{t("statuses.converted")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("filters.allCustomers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allCustomers")}</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name_en} ({customer.name_ar})
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
            ) : filteredQuotations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/sales/quotations/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.quotationNumber")}</TableHead>
                    <TableHead>{t("table.customer")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.validUntil")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.total")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono">{quotation.quotation_number}</TableCell>
                      <TableCell>
                        <div>
                          <div>{quotation.customer?.name_en}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {quotation.customer?.name_ar}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(quotation.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(quotation.valid_until), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(quotation.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {quotation.total_amount?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(quotation).map((btn, idx) => (
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
      </div>
  );
}