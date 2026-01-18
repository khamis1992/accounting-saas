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
 * New Journal Entry Form
 * Creates a new journal entry with double-entry validation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { journalsApi, CreateJournalDto } from "@/lib/api/journals";
import { coaApi, Account } from "@/lib/api/coa";
import { toast } from "sonner";
import { SUCCESS_MESSAGES, FORM, THRESHOLDS } from "@/lib/constants";
import logger from "@/lib/logger";

interface JournalLineForm {
  lineNumber: number;
  accountId: string;
  descriptionAr?: string;
  descriptionEn?: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  referenceId?: string;
}

export default function NewJournalPage() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<{
    journalType: "general" | "sales" | "purchase" | "payment" | "receipt" | "expense";
    descriptionAr: string;
    descriptionEn: string;
    transactionDate: string;
    referenceNumber: string;
  }>({
    journalType: "general",
    descriptionAr: "",
    descriptionEn: "",
    transactionDate: new Date().toISOString().split("T")[0],
    referenceNumber: "",
  });
  const [lines, setLines] = useState<JournalLineForm[]>([
    { lineNumber: 1, accountId: "", debit: 0, credit: 0 },
    { lineNumber: 2, accountId: "", debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await coaApi.getAll();
      setAccounts(flattenAccounts(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load accounts";
      toast.error(message);
    }
  };

  function flattenAccounts(accounts: Account[]): Account[] {
    const result: Account[] = [];
    for (const account of accounts) {
      if (account.is_posting_allowed) {
        result.push(account);
      }
      if (account.children) {
        result.push(...flattenAccounts(account.children));
      }
    }
    return result;
  }

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < THRESHOLDS.JOURNAL_BALANCE_TOLERANCE;

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        lineNumber: lines.length + 1,
        accountId: "",
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("Journal must have at least 2 lines");
      return;
    }
    const newLines = lines.filter((_, i) => i !== index);
    // Renumber lines
    newLines.forEach((line, i) => (line.lineNumber = i + 1));
    setLines(newLines);
  };

  const handleLineChange = (index: number, field: keyof JournalLineForm, value: string) => {
    const newLines = [...lines];
    if (field === "debit" || field === "credit") {
      // If setting debit, clear credit and vice versa
      if (field === "debit" && parseFloat(value) > 0) {
        newLines[index].credit = 0;
      }
      if (field === "credit" && parseFloat(value) > 0) {
        newLines[index].debit = 0;
      }
      newLines[index][field] = parseFloat(value) || 0;
    } else {
      // Type-safe assignment for string fields
      const line = newLines[index];
      if (field === "accountId") line.accountId = value;
      else if (field === "descriptionAr") line.descriptionAr = value;
      else if (field === "descriptionEn") line.descriptionEn = value;
    }
    setLines(newLines);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.descriptionAr.trim()) {
      toast.error("Description (Arabic) is required");
      return;
    }

    if (!formData.transactionDate) {
      toast.error("Transaction date is required");
      return;
    }

    // Check all lines have accounts
    const emptyAccount = lines.find((line) => !line.accountId);
    if (emptyAccount) {
      toast.error("All lines must have an account");
      return;
    }

    // Check each line has debit OR credit
    const invalidLine = lines.find(
      (line) => (line.debit === 0 && line.credit === 0) || (line.debit > 0 && line.credit > 0)
    );
    if (invalidLine) {
      toast.error("Each line must have either a debit or credit amount (not both, not neither)");
      return;
    }

    // Check balance
    if (!isBalanced) {
      toast.error(`Debit (${totalDebit.toFixed(2)}) must equal credit (${totalCredit.toFixed(2)})`);
      return;
    }

    // Check total > 0
    if (totalDebit === 0) {
      toast.error("Journal must have non-zero amounts");
      return;
    }

    setLoading(true);

    try {
      const journalData: CreateJournalDto = {
        journal_type: formData.journalType,
        description_ar: formData.descriptionAr,
        description_en: formData.descriptionEn,
        transaction_date: formData.transactionDate,
        reference_number: formData.referenceNumber,
        lines: lines.map((line) => ({
          line_number: line.lineNumber,
          account_id: line.accountId,
          description_ar: line.descriptionAr,
          description_en: line.descriptionEn,
          debit: line.debit,
          credit: line.credit,
          cost_center_id: line.costCenterId,
          reference_id: line.referenceId,
        })),
      };

      const result = await journalsApi.create(journalData);
      toast.success("Journal created successfully");
      router.push(`/${locale}/accounting/journals/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create journal";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Journal Entry</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Create a new journal entry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Journal Header */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="journalType">Journal Type *</Label>
                  <Select
                    value={formData.journalType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        journalType: value as
                          | "general"
                          | "sales"
                          | "purchase"
                          | "receipt"
                          | "payment"
                          | "expense",
                      })
                    }
                    required
                  >
                    <SelectTrigger id="journalType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionDate">Transaction Date *</Label>
                  <Input
                    id="transactionDate"
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transactionDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceNumber: e.target.value,
                      })
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionAr">Description (Arabic) *</Label>
                <Input
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descriptionAr: e.target.value,
                    })
                  }
                  dir="rtl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Input
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descriptionEn: e.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            </CardContent>
          </Card>

          {/* Journal Lines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Journal Lines</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Line
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Account *</Label>
                    <Select
                      value={line.accountId}
                      onValueChange={(value) => handleLineChange(index, "accountId", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.code} - {account.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-32">
                    <Label>Debit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.debit || ""}
                      onChange={(e) => handleLineChange(index, "debit", e.target.value)}
                      placeholder="0.00"
                      disabled={line.credit > 0}
                    />
                  </div>

                  <div className="w-32">
                    <Label>Credit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.credit || ""}
                      onChange={(e) => handleLineChange(index, "credit", e.target.value)}
                      placeholder="0.00"
                      disabled={line.debit > 0}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLine(index)}
                    disabled={lines.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Totals */}
              <div className="flex justify-end gap-8 pt-4 border-t">
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Total Debit</div>
                  <div className="text-lg font-semibold">QAR {totalDebit.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Total Credit</div>
                  <div className="text-lg font-semibold">QAR {totalCredit.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Difference</div>
                  <div
                    className={`text-lg font-semibold ${
                      isBalanced ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    QAR {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isBalanced}>
              {loading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
  );
}
