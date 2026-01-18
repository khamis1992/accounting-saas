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
 * Bank Reconciliation Page
 * Two-panel interface for matching bank statements to book transactions
 */

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { bankingApi, BankTransaction, Reconciliation } from "@/lib/api/banking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  CheckSquare,
  AlertCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function BankReconciliationPage() {
  const t = useTranslations("banking.reconciliation");
  const common = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get("accountId");

  // State
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accountIdParam || "");
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [currentReconciliation, setCurrentReconciliation] = useState<Reconciliation | null>(null);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [bookTransactions, setBookTransactions] = useState<any[]>([]);
  const [selectedBankTx, setSelectedBankTx] = useState<string | null>(null);
  const [selectedBookTx, setSelectedBookTx] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingReconciliation, setStartingReconciliation] = useState(false);
  const [statementDate, setStatementDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [statementBalance, setStatementBalance] = useState<string>("");

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch reconciliations when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchReconciliations();
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const data = await bankingApi.getAccounts();
      setAccounts(data);
      if (!selectedAccountId && data.length > 0) {
        setSelectedAccountId(data[0].id);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load accounts");
    }
  };

  const fetchReconciliations = async () => {
    if (!selectedAccountId) return;

    try {
      setLoading(true);
      const data = await bankingApi.getReconciliations(selectedAccountId);
      setReconciliations(data);
      // Find in-progress reconciliation
      const inProgress = data.find((r) => r.status === "in-progress");
      if (inProgress) {
        await loadReconciliation(inProgress.id);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load reconciliations");
    } finally {
      setLoading(false);
    }
  };

  const loadReconciliation = async (reconciliationId: string) => {
    try {
      setLoading(true);
      const [reconciliation, unmatched] = await Promise.all([
        bankingApi.getReconciliation(reconciliationId),
        bankingApi.getUnmatchedTransactions(selectedAccountId, reconciliationId),
      ]);
      setCurrentReconciliation(reconciliation);
      setBankTransactions(unmatched.bankTransactions);
      setBookTransactions(unmatched.bookTransactions);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load reconciliation");
    } finally {
      setLoading(false);
    }
  };

  const handleStartReconciliation = async () => {
    if (!selectedAccountId || !statementDate || !statementBalance) {
      toast.error("Please fill in all fields");
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
      toast.success(t("messages.started"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to start reconciliation");
    } finally {
      setStartingReconciliation(false);
    }
  };

  const handleMatchTransactions = async () => {
    if (!currentReconciliation || !selectedBankTx || !selectedBookTx) {
      toast.error("Please select one bank transaction and one book transaction to match");
      return;
    }

    try {
      setLoading(true);
      await bankingApi.matchTransactions(currentReconciliation.id, selectedBankTx, selectedBookTx);
      toast.success(t("messages.matched"));
      setSelectedBankTx(null);
      setSelectedBookTx(null);
      await loadReconciliation(currentReconciliation.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to match transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatchTransaction = async (matchId: string) => {
    if (!currentReconciliation) return;

    try {
      setLoading(true);
      await bankingApi.unmatchTransactions(currentReconciliation.id, matchId);
      toast.success(t("messages.unmatched"));
      await loadReconciliation(currentReconciliation.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to unmatch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteReconciliation = async () => {
    if (!currentReconciliation) return;

    if (currentReconciliation.difference !== 0) {
      toast.error(t("errors.differenceNotZero"));
      return;
    }

    try {
      setLoading(true);
      await bankingApi.completeReconciliation(currentReconciliation.id);
      toast.success(t("messages.completed"));
      setCurrentReconciliation(null);
      setBankTransactions([]);
      setBookTransactions([]);
      await fetchReconciliations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to complete reconciliation");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Auto-match suggestions
  const getAutoMatchSuggestions = () => {
    if (!selectedBankTx) return [];

    const bankTx = bankTransactions.find((tx) => tx.id === selectedBankTx);
    if (!bankTx) return [];

    return bookTransactions.filter(
      (bookTx) =>
        Math.abs(bookTx.amount - bankTx.amount) < 0.01 &&
        Math.abs(new Date(bookTx.date).getTime() - new Date(bankTx.date).getTime()) <
          7 * 24 * 60 * 60 * 1000 // Within 7 days
    );
  };

  const suggestions = getAutoMatchSuggestions();

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchReconciliations} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {common("refresh")}
            </Button>
          </div>
        </div>

        {!currentReconciliation ? (
          <>
            {/* Start New Reconciliation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("new.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {/* Account Selector */}
                  <div className="space-y-2">
                    <Label htmlFor="account">{t("new.account")}</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger id="account">
                        <SelectValue placeholder={t("new.selectAccount")} />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_name} - {account.bank_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statement Date */}
                  <div className="space-y-2">
                    <Label htmlFor="statementDate">{t("new.statementDate")}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="statementDate"
                        type="date"
                        className="pl-9"
                        value={statementDate}
                        onChange={(e) => setStatementDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Statement Balance */}
                  <div className="space-y-2">
                    <Label htmlFor="statementBalance">{t("new.statementBalance")}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="statementBalance"
                        type="number"
                        step="0.01"
                        className="pl-9"
                        placeholder="0.00"
                        value={statementBalance}
                        onChange={(e) => setStatementBalance(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleStartReconciliation}
                    disabled={
                      startingReconciliation ||
                      !selectedAccountId ||
                      !statementDate ||
                      !statementBalance
                    }
                  >
                    {startingReconciliation ? t("new.starting") : t("new.start")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reconciliation History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("history.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {reconciliations.length === 0 ? (
                  <div className="flex min-h-[200px] items-center justify-center text-center">
                    <div>
                      <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("history.table.date")}</TableHead>
                          <TableHead>{t("history.table.statementBalance")}</TableHead>
                          <TableHead>{t("history.table.bookBalance")}</TableHead>
                          <TableHead>{t("history.table.difference")}</TableHead>
                          <TableHead>{t("history.table.status")}</TableHead>
                          <TableHead>{common("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reconciliations.map((reconciliation) => (
                          <TableRow key={reconciliation.id}>
                            <TableCell>
                              {format(new Date(reconciliation.statement_date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(reconciliation.statement_balance)}
                            </TableCell>
                            <TableCell>{formatCurrency(reconciliation.book_balance)}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-medium",
                                  Math.abs(reconciliation.difference) < 0.01
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {formatCurrency(Math.abs(reconciliation.difference))}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  reconciliation.status === "completed" ? "default" : "secondary"
                                }
                              >
                                {t(`status.${reconciliation.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reconciliation.status === "in-progress" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadReconciliation(reconciliation.id)}
                                >
                                  {common("view")}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Reconciliation Progress */}
            <Card
              className={cn(
                "border-2",
                Math.abs(currentReconciliation.difference) < 0.01
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
              )}
            >
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {Math.abs(currentReconciliation.difference) < 0.01 ? (
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {t("progress.reconciling")} -{" "}
                        {format(new Date(currentReconciliation.statement_date), "MMM dd, yyyy")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("progress.difference")}:{" "}
                        {formatCurrency(Math.abs(currentReconciliation.difference))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentReconciliation(null);
                        setBankTransactions([]);
                        setBookTransactions([]);
                      }}
                    >
                      {common("cancel")}
                    </Button>
                    <Button
                      onClick={handleCompleteReconciliation}
                      disabled={Math.abs(currentReconciliation.difference) >= 0.01 || loading}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      {t("progress.complete")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matched Transactions */}
            {currentReconciliation.matches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    {t("matched.title")} ({currentReconciliation.matches.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("matched.bankTransaction")}</TableHead>
                          <TableHead>{t("matched.bookTransaction")}</TableHead>
                          <TableHead className="text-right">{common("amount")}</TableHead>
                          <TableHead className="text-right">{common("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentReconciliation.matches.map((match, index) => {
                          const bankTx = bankTransactions.find(
                            (tx) => tx.id === match.bank_transaction_id
                          );
                          return (
                            <TableRow key={index}>
                              <TableCell className="text-sm">
                                {bankTx ? (
                                  <div>
                                    <div className="font-medium">{bankTx.description}</div>
                                    <div className="text-muted-foreground">
                                      {format(new Date(bankTx.date), "MMM dd, yyyy")}
                                    </div>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell className="text-sm">{match.book_transaction_id}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(match.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleUnmatchTransaction(match.bank_transaction_id)
                                  }
                                >
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Two-Panel Matching Interface */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Bank Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("unmatched.bankTransactions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>{common("date")}</TableHead>
                          <TableHead>{common("description")}</TableHead>
                          <TableHead className="text-right">{common("amount")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankTransactions.map((tx) => (
                          <TableRow
                            key={tx.id}
                            className={cn("cursor-pointer", selectedBankTx === tx.id && "bg-muted")}
                            onClick={() => setSelectedBankTx(tx.id)}
                          >
                            <TableCell>
                              <div className="flex h-4 w-4 items-center justify-center rounded border">
                                {selectedBankTx === tx.id && (
                                  <CheckCircle className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(tx.date), "MMM dd")}
                            </TableCell>
                            <TableCell className="text-sm">{tx.description}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium",
                                tx.type === "debit" ? "text-red-600" : "text-green-600"
                              )}
                            >
                              {tx.type === "debit" ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {bankTransactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              {t("unmatched.noBankTransactions")}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Book Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("unmatched.bookTransactions")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>{common("date")}</TableHead>
                          <TableHead>{common("description")}</TableHead>
                          <TableHead className="text-right">{common("amount")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookTransactions.map((tx) => (
                          <TableRow
                            key={tx.id}
                            className={cn("cursor-pointer", selectedBookTx === tx.id && "bg-muted")}
                            onClick={() => setSelectedBookTx(tx.id)}
                          >
                            <TableCell>
                              <div className="flex h-4 w-4 items-center justify-center rounded border">
                                {selectedBookTx === tx.id && (
                                  <CheckCircle className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(tx.date), "MMM dd")}
                            </TableCell>
                            <TableCell className="text-sm">{tx.description}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {bookTransactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              {t("unmatched.noBookTransactions")}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match Actions */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    {/* Auto-match suggestions */}
                    {suggestions.length > 0 && selectedBankTx && (
                      <div className="space-y-2">
                        <Label className="text-sm">{t("suggestions.title")}</Label>
                        <div className="flex flex-wrap gap-2">
                          {suggestions.map((tx) => (
                            <Button
                              key={tx.id}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedBookTx(tx.id)}
                              className={selectedBookTx === tx.id ? "border-primary" : ""}
                            >
                              <Link2 className="mr-2 h-3 w-3" />
                              {format(new Date(tx.date), "MMM dd")} - {tx.description} -{" "}
                              {formatCurrency(tx.amount)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBankTx && selectedBookTx && (
                      <Button onClick={handleMatchTransactions} disabled={loading}>
                        <Link2 className="mr-2 h-4 w-4" />
                        {t("actions.match")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBankTx(null);
                        setSelectedBookTx(null);
                      }}
                    >
                      {t("actions.clear")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
  );
}
