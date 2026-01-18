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
 * Reports Hub Page
 * Central catalog for all reports with favorites, search, and quick generation
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  Calculator,
  Star,
  Search,
  Calendar,
  Download,
  Clock,
  Folder,
} from "lucide-react";
import { reportsApi, Report, ReportCategory, RecentReport } from "@/lib/api/reports";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const REPORT_ICONS: Record<string, React.ReactNode> = {
  financial: <Calculator className="h-5 w-5" />,
  sales: <ShoppingCart className="h-5 w-5" />,
  purchases: <Package className="h-5 w-5" />,
  banking: <DollarSign className="h-5 w-5" />,
  tax: <TrendingUp className="h-5 w-5" />,
};

export default function ReportsHubPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generationParams, setGenerationParams] = useState({
    period: "thisMonth",
    format: "pdf" as "pdf" | "excel",
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, reportsData, recentData] = await Promise.all([
        reportsApi.getCategories(),
        reportsApi.getAll(),
        reportsApi.getRecent(5),
      ]);

      setCategories(categoriesData);
      setReports(reportsData);
      setRecentReports(recentData);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(search.toLowerCase()) ||
      report.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === "all" || report.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group reports by category
  const reportsByCategory = categories.reduce(
    (acc, category) => {
      const categoryReports = filteredReports.filter(
        (report) => report.category_id === category.id
      );
      if (categoryReports.length > 0) {
        acc[category.id] = categoryReports;
      }
      return acc;
    },
    {} as Record<string, Report[]>
  );

  // Favorite reports
  const favoriteReports = reports.filter((r) => r.is_favorite);

  // Handle quick generate
  const handleQuickGenerate = async (report: Report, period: string) => {
    setSelectedReport(report);
    setGenerationParams({ ...generationParams, period });
    setGenerateDialogOpen(true);
  };

  // Handle generate with confirmation
  const handleGenerate = async () => {
    if (!selectedReport) return;

    setGenerating(true);
    try {
      const dates = getDateRange(generationParams.period);

      await reportsApi.generate({
        reportCode: selectedReport.code,
        startDate: dates.startDate,
        endDate: dates.endDate,
        format: generationParams.format,
      });

      toast.success("Report generated successfully");
      setGenerateDialogOpen(false);

      // Refresh recent reports
      const recentData = await reportsApi.getRecent(5);
      setRecentReports(recentData);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  // Handle download
  const handleDownload = async (report: Report) => {
    try {
      const dates = getDateRange("thisMonth");

      await reportsApi.download({
        reportCode: report.code,
        startDate: dates.startDate,
        endDate: dates.endDate,
        format: "pdf",
      });

      toast.success("Report downloaded successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to download report");
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const result = await reportsApi.toggleFavorite(report.id);

      // Update local state
      setReports(
        reports.map((r) => (r.id === report.id ? { ...r, is_favorite: result.isFavorite } : r))
      );

      toast.success(result.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update favorite");
    }
  };

  // Get date range based on period
  const getDateRange = (period: string) => {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case "thisMonth":
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        break;
      case "lastMonth":
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        endDate.setDate(0);
        break;
      case "thisQuarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3);
        startDate.setDate(1);
        endDate.setMonth((quarter + 1) * 3);
        endDate.setDate(0);
        break;
      case "thisYear":
        startDate.setMonth(0);
        startDate.setDate(1);
        endDate.setMonth(11);
        endDate.setDate(31);
        break;
      default:
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
    }

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading reports...</div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Section */}
        {favoriteReports.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <h2 className="text-xl font-semibold">{t("favorites")}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favoriteReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onQuickGenerate={handleQuickGenerate}
                  onDownload={handleDownload}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-zinc-500" />
                <CardTitle>{t("recentReports")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentReports.map((recent) => (
                  <div
                    key={recent.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <div>
                        <div className="font-medium">{recent.report_name}</div>
                        <div className="text-sm text-zinc-500">
                          {formatDistanceToNow(new Date(recent.generated_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </div>
                    {recent.file_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={recent.file_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports by Category */}
        {Object.entries(reportsByCategory).map(([categoryId, categoryReports]) => {
          const category = categories.find((c) => c.id === categoryId);
          if (!category) return null;

          return (
            <div key={categoryId}>
              <div className="mb-4 flex items-center gap-2">
                {REPORT_ICONS[category.id] || <Folder className="h-5 w-5" />}
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <Badge variant="outline">{categoryReports.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onQuickGenerate={handleQuickGenerate}
                    onDownload={handleDownload}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* No Reports Found */}
        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-zinc-300" />
              <h3 className="mt-4 font-semibold">{t("noReportsFound")}</h3>
              <p className="mt-2 text-sm text-zinc-500">{t("tryDifferentFilters")}</p>
            </CardContent>
          </Card>
        )}

      {/* Generate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generateReport")}</DialogTitle>
            <DialogDescription>
              {selectedReport?.name} - {t("configureParameters")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("period")}</Label>
              <Select
                value={generationParams.period}
                onValueChange={(value) =>
                  setGenerationParams({ ...generationParams, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">{t("thisMonth")}</SelectItem>
                  <SelectItem value="lastMonth">{t("lastMonth")}</SelectItem>
                  <SelectItem value="thisQuarter">{t("thisQuarter")}</SelectItem>
                  <SelectItem value="thisYear">{t("thisYear")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("format")}</Label>
              <Select
                value={generationParams.format}
                onValueChange={(value: "pdf" | "excel") =>
                  setGenerationParams({ ...generationParams, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? t("generating") : t("generate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Report Card Component
interface ReportCardProps {
  report: Report;
  onQuickGenerate: (report: Report, period: string) => void;
  onDownload: (report: Report) => void;
  onToggleFavorite: (report: Report, e: React.MouseEvent) => void;
}

function ReportCard({ report, onQuickGenerate, onDownload, onToggleFavorite }: ReportCardProps) {
  const t = useTranslations("reports");

  return (
    <Card className="group hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{report.name}</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">{report.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100"
            onClick={(e) => onToggleFavorite(report, e)}
          >
            <Star
              className={`h-4 w-4 ${
                report.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-zinc-400"
              }`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onQuickGenerate(report, "thisMonth")}
            >
              <Calendar className="mr-2 h-3 w-3" />
              {t("thisMonth")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onQuickGenerate(report, "lastMonth")}
            >
              <Calendar className="mr-2 h-3 w-3" />
              {t("lastMonth")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onQuickGenerate(report, "thisQuarter")}
            >
              <Calendar className="mr-2 h-3 w-3" />
              {t("thisQuarter")}
            </Button>
          </div>
          <Button size="sm" className="w-full" onClick={() => onDownload(report)}>
            <Download className="mr-2 h-4 w-4" />
            {t("download")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
