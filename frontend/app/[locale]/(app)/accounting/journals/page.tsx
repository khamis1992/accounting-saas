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
 * Journals Page
 * Displays journal entries list with filtering and actions
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import { Plus, Search, Eye, Edit, Trash2, Send, Check, Upload, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { journalsApi, Journal } from "@/lib/api/journals";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { SUCCESS_MESSAGES } from "@/lib/constants";
import logger from "@/lib/logger";

export default function JournalsPage() {
  const t = useTranslations("journals");
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJournals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.journalType = typeFilter;

      const data = await journalsApi.getAll(filters);
      setJournals(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load journals";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      submitted: "outline",
      approved: "outline",
      posted: "default",
      reversed: "secondary",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`statuses.${status}` as `statuses.${string}`)}
      </Badge>
    );
  };

  const filteredJournals = journals.filter(
    (j) =>
      j.journal_number.toLowerCase().includes(search.toLowerCase()) ||
      j.description_en?.toLowerCase().includes(search.toLowerCase()) ||
      j.description_ar?.includes(search) ||
      j.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    router.push(`/${locale}/accounting/journals/new`);
  };

  const handleView = (journal: Journal) => {
    router.push(`/${locale}/accounting/journals/${journal.id}`);
  };

  const handleEdit = (journal: Journal) => {
    if (journal.status !== "draft") {
      toast.error("Can only edit draft journals");
      return;
    }
    router.push(`/${locale}/accounting/journals/${journal.id}/edit`);
  };

  const handleDelete = async (journal: Journal) => {
    if (!confirm(`Are you sure you want to delete ${journal.journal_number}?`)) {
      return;
    }

    try {
      await journalsApi.delete(journal.id);
      toast.success("Journal deleted successfully");
      await fetchJournals();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete journal";
      toast.error(message);
    }
  };

  const handleSubmit = async (journal: Journal) => {
    setActionLoading(journal.id);
    try {
      await journalsApi.submit(journal.id);
      toast.success("Journal submitted successfully");
      await fetchJournals();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit journal";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (journal: Journal) => {
    setActionLoading(journal.id);
    try {
      await journalsApi.approve(journal.id);
      toast.success("Journal approved successfully");
      await fetchJournals();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve journal";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePost = async (journal: Journal) => {
    setActionLoading(journal.id);
    try {
      await journalsApi.post(journal.id);
      toast.success("Journal posted successfully");
      await fetchJournals();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post journal";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const getActionButtons = (journal: Journal) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: "View",
      onClick: () => handleView(journal),
    });

    // Edit button (draft only)
    if (journal.status === "draft") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: "Edit",
        onClick: () => handleEdit(journal),
      });
    }

    // Delete button (draft only)
    if (journal.status === "draft") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: () => handleDelete(journal),
      });
    }

    // Submit button (draft only)
    if (journal.status === "draft") {
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: "Submit",
        onClick: () => handleSubmit(journal),
        loading: actionLoading === journal.id,
      });
    }

    // Approve button (submitted only)
    if (journal.status === "submitted") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: "Approve",
        onClick: () => handleApprove(journal),
        loading: actionLoading === journal.id,
      });
    }

    // Post button (approved only)
    if (journal.status === "approved") {
      buttons.push({
        icon: <Upload className="h-4 w-4" />,
        label: "Post",
        onClick: () => handlePost(journal),
        loading: actionLoading === journal.id,
      });
    }

    return buttons;
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage your journal entries</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addJournal")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Journal Entries</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder={t("search")}
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
              <TableSkeleton columns={8} rows={5} />
            ) : filteredJournals.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={
                  search || typeFilter || statusFilter ? "No journals found" : "No journals yet"
                }
                description={
                  search || typeFilter || statusFilter
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first journal entry"
                }
                actionLabel="Add Journal"
                onAction={handleCreate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("journalNumber")}</TableHead>
                    <TableHead>{t("entryDate")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("totalDebit")}</TableHead>
                    <TableHead className="text-right">{t("totalCredit")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJournals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell className="font-mono">{journal.journal_number}</TableCell>
                      <TableCell>
                        {new Date(journal.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="capitalize">{journal.journal_type}</TableCell>
                      <TableCell>{journal.description_en || journal.description_ar}</TableCell>
                      <TableCell>{getStatusBadge(journal.status)}</TableCell>
                      <TableCell className="text-right">
                        QAR {journal.total_debit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        QAR {journal.total_credit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(journal).map((btn, idx) => (
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
                                <span className="h-4 w-4 animate-spin">⌛</span>
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
    </AuthenticatedLayout>
  );
}
