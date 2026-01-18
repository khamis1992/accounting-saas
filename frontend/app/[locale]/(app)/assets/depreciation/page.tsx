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
 * Depreciation Page
 * Calculate and post depreciation entries
 */

import { useState, useEffect } from "react";
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
import { Calculator, Upload, Eye, CheckCircle2, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  assetsApi,
  DepreciationSchedule,
  DepreciationRun,
  JournalEntryPreview,
} from "@/lib/api/assets";
import logger from "@/lib/logger";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DepreciationPage() {
  const t = useTranslations();

  const [schedule, setSchedule] = useState<DepreciationSchedule[]>([]);
  const [history, setHistory] = useState<DepreciationRun[]>([]);
  const [journalPreview, setJournalPreview] = useState<JournalEntryPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  const [periodStart, setPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  );
  const [periodEnd, setPeriodEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0]
  );

  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await assetsApi.getDepreciationHistory();
      setHistory(data);
    } catch (error: unknown) {
      logger.error("Failed to load history:", error);
    }
  };

  const handleCalculate = async () => {
    if (!periodStart || !periodEnd) {
      toast.error("Please select period dates");
      return;
    }

    try {
      setLoading(true);
      const data = await assetsApi.calculateDepreciation(periodStart, periodEnd);
      setSchedule(data);
      toast.success(`Calculated depreciation for ${data.length} assets`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to calculate depreciation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewJournal = async () => {
    if (schedule.length === 0) {
      toast.error("Please calculate depreciation first");
      return;
    }

    try {
      setLoading(true);
      const preview = await assetsApi.previewJournalEntries(periodStart, periodEnd);
      setJournalPreview(preview);
      setShowPreviewDialog(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to preview journal entries";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePostToJournal = async () => {
    if (schedule.length === 0) {
      toast.error("Please calculate depreciation first");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to post depreciation to the journal? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setPosting(true);
      await assetsApi.postToJournal(periodStart, periodEnd);
      toast.success("Depreciation posted to journal successfully");
      setSchedule([]);
      setShowPreviewDialog(false);
      await fetchHistory();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to post depreciation";
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      "straight-line": "Straight Line",
      "declining-balance": "Declining Balance",
      "units-of-production": "Units of Production",
    };
    return labels[method] || method;
  };

  const getTotalDepreciation = () => {
    return schedule.reduce((sum, item) => sum + item.this_period_depreciation, 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Depreciation</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Calculate and post depreciation entries
            </p>
          </div>
        </div>

        {/* Period Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Depreciation Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Period Start</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-48"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period-end">Period End</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-48"
                />
              </div>

              <Button onClick={handleCalculate} disabled={loading} className="gap-2">
                <Calculator className="h-4 w-4" />
                {loading ? "Calculating..." : "Calculate Depreciation"}
              </Button>

              {schedule.length > 0 && (
                <>
                  <Button
                    onClick={handlePreviewJournal}
                    disabled={loading}
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview Journal
                  </Button>

                  <Button onClick={handlePostToJournal} disabled={posting} className="gap-2">
                    <Upload className="h-4 w-4" />
                    {posting ? "Posting..." : "Post to Journal"}
                  </Button>
                </>
              )}

              <div className="ml-auto">
                <Button
                  onClick={() => setShowHistoryDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  View History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card (shown after calculation) */}
        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Depreciation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Number of Assets</p>
                  <p className="text-2xl font-bold">{schedule.length}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Total Depreciation This Period
                  </p>
                  <p className="text-2xl font-bold">
                    QAR {getTotalDepreciation().toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">Period</p>
                  <p className="text-2xl font-bold">
                    {formatDate(periodStart)} - {formatDate(periodEnd)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Depreciation Schedule Table */}
        <Card>
          <CardHeader>
            <CardTitle>Depreciation Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                Select a period and click "Calculate Depreciation" to begin
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Code</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Salvage Value</TableHead>
                    <TableHead>Useful Life</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Annual Depreciation</TableHead>
                    <TableHead className="text-right">This Period</TableHead>
                    <TableHead className="text-right">Accumulated</TableHead>
                    <TableHead className="text-right">Net Book Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((item) => (
                    <TableRow key={item.asset_id}>
                      <TableCell className="font-mono text-sm">{item.asset_code}</TableCell>
                      <TableCell className="font-medium">{item.asset_name}</TableCell>
                      <TableCell className="text-right">QAR {item.cost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        QAR {item.salvage_value.toLocaleString()}
                      </TableCell>
                      <TableCell>{item.useful_life_years} years</TableCell>
                      <TableCell>{getMethodLabel(item.method)}</TableCell>
                      <TableCell className="text-right">
                        QAR {item.annual_depreciation.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {item.this_period_depreciation.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        QAR {item.accumulated_depreciation.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {item.net_book_value.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-medium">
                    <TableCell colSpan={7} className="text-right">
                      Total:
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {getTotalDepreciation().toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      {/* Journal Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry Preview</DialogTitle>
            <DialogDescription>Review the journal entries that will be created</DialogDescription>
          </DialogHeader>

          {journalPreview && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Date:</span>{" "}
                    <span className="font-medium">{formatDate(journalPreview.date)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Description:</span>{" "}
                    <span className="font-medium">{journalPreview.description}</span>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalPreview.entries.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{entry.account_code}</TableCell>
                      <TableCell>{entry.account_name}</TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? `QAR ${entry.debit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? `QAR ${entry.credit.toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-medium">
                    <TableCell colSpan={2} className="text-right">
                      Total:
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {journalPreview.total_debit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {journalPreview.total_credit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {journalPreview.total_debit === journalPreview.total_credit ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Journal is balanced
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  Journal is NOT balanced
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
            <Button onClick={handlePostToJournal} disabled={posting}>
              {posting ? "Posting..." : "Post to Journal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Depreciation History</DialogTitle>
            <DialogDescription>Previous depreciation calculations and postings</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {history.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">No depreciation history found</div>
            ) : (
              <div className="space-y-4">
                {history.map((run) => (
                  <Card key={run.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {formatDate(run.period_start)} - {formatDate(run.period_end)}
                          </CardTitle>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Created: {new Date(run.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={run.status === "posted" ? "default" : "secondary"}>
                            {run.status === "posted" ? "Posted" : "Calculated"}
                          </Badge>
                          <p className="text-sm font-medium">
                            QAR {run.total_depreciation.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {run.entries.length} assets
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
