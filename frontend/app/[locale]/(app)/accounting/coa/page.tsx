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
 * Chart of Accounts Page - Mobile Optimized
 * Displays hierarchical account structure with create/edit/delete functionality
 * Tables transform to cards on mobile devices (<1024px)
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import { MobileTableCard, MobileCardGrid, DesktopOnly } from "@/components/ui/mobile-table-card";
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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { coaApi, Account, CreateAccountDto } from "@/lib/api/coa";
import { toast } from "sonner";

interface AccountRow extends Account {
  level: number;
  children?: AccountRow[];
}

function flattenAccounts(accounts: Account[], level = 0): AccountRow[] {
  const rows: AccountRow[] = [];
  for (const account of accounts) {
    rows.push({ ...account, level });
    if (account.children && account.children.length > 0) {
      rows.push(...flattenAccounts(account.children, level + 1));
    }
  }
  return rows;
}

export default function COAPage() {
  const t = useTranslations("coa");
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    type: "",
    parentId: "",
    balanceType: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch accounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await coaApi.getAll();
      setAccounts(flattenAccounts(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load accounts";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name_en.toLowerCase().includes(search.toLowerCase()) ||
      acc.name_ar.includes(search) ||
      acc.code.includes(search)
  );

  // Open create dialog
  const handleCreate = () => {
    setEditAccount(null);
    setFormData({
      code: "",
      nameEn: "",
      nameAr: "",
      type: "",
      parentId: "",
      balanceType: "",
    });
    setOpen(true);
  };

  // Open edit dialog
  const handleEdit = (account: Account) => {
    setEditAccount(account);
    setFormData({
      code: account.code,
      nameEn: account.name_en,
      nameAr: account.name_ar,
      type: account.type,
      parentId: account.parent_id || "",
      balanceType: account.balance_type,
    });
    setOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateAccountDto = {
        code: formData.code,
        nameEn: formData.nameEn,
        nameAr: formData.nameAr,
        type: formData.type as "asset" | "liability" | "equity" | "revenue" | "expense",
        parentId: formData.parentId || undefined,
        balanceType: formData.balanceType as "debit" | "credit",
      };

      if (editAccount) {
        await coaApi.update(editAccount.id, data);
        toast.success("Account updated successfully");
      } else {
        await coaApi.create(data);
        toast.success("Account created successfully");
      }

      setOpen(false);
      await fetchAccounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save account";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (account: Account) => {
    if (!confirm(`Are you sure you want to delete ${account.name_en}?`)) {
      return;
    }

    try {
      await coaApi.delete(account.id);
      toast.success("Account deleted successfully");
      await fetchAccounts();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete account";
      toast.error(message);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asset: t("accountTypes.assets"),
      liability: t("accountTypes.liabilities"),
      equity: t("accountTypes.equity"),
      revenue: t("accountTypes.revenue"),
      expense: t("accountTypes.expenses"),
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Manage your chart of accounts
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 self-start sm:self-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("addAccount")}</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Accounts</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="search"
                  placeholder={t("search")}
                  className="w-full sm:w-64 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">Loading accounts...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">No accounts found</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <DesktopOnly>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("code")}</TableHead>
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("type")}</TableHead>
                        <TableHead>{t("balanceType")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono">
                            <span style={{ paddingLeft: `${account.level * 20}px` }}>
                              {account.code}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span style={{ paddingLeft: `${account.level * 20}px` }}>
                              {account.name_en}
                              <span className="mr-2 text-zinc-500">({account.name_ar})</span>
                            </span>
                          </TableCell>
                          <TableCell>{getAccountTypeLabel(account.type)}</TableCell>
                          <TableCell>
                            {t(`balanceTypes.${account.balance_type}` as `balanceTypes.${string}`)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(account)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(account)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DesktopOnly>

                {/* Mobile Card View */}
                <MobileCardGrid>
                  {filteredAccounts.map((account) => (
                    <MobileTableCard
                      key={account.id}
                      title={account.name_en}
                      subtitle={`${account.name_ar} • ${account.code}`}
                      status={account.is_active ? "active" : "inactive"}
                      fields={[
                        {
                          label: "Code",
                          value: (
                            <span
                              className="font-mono text-xs"
                              style={{ paddingLeft: `${account.level * 12}px` }}
                            >
                              {account.code}
                            </span>
                          ),
                        },
                        {
                          label: "Type",
                          value: getAccountTypeLabel(account.type),
                        },
                        {
                          label: "Balance Type",
                          value: t(
                            `balanceTypes.${account.balance_type}` as `balanceTypes.${string}`
                          ),
                        },
                      ]}
                      actions={[
                        {
                          icon: <Edit className="h-4 w-4" />,
                          label: "Edit",
                          onClick: () => handleEdit(account),
                        },
                        {
                          icon: <Trash2 className="h-4 w-4" />,
                          label: "Delete",
                          onClick: () => handleDelete(account),
                          variant: "destructive",
                        },
                      ]}
                    />
                  ))}
                </MobileCardGrid>
              </>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog - Mobile Optimized */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editAccount ? t("editAccount") : t("addAccount")}</DialogTitle>
              <DialogDescription>
                {editAccount
                  ? "Update account details"
                  : "Add a new account to your chart of accounts"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("code")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  disabled={!!editAccount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{t("name")}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t("nameArabic")}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t("type")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  required
                  disabled={!!editAccount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">{t("accountTypes.assets")}</SelectItem>
                    <SelectItem value="liability">{t("accountTypes.liabilities")}</SelectItem>
                    <SelectItem value="equity">{t("accountTypes.equity")}</SelectItem>
                    <SelectItem value="revenue">{t("accountTypes.revenue")}</SelectItem>
                    <SelectItem value="expense">{t("accountTypes.expenses")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balanceType">{t("balanceType")}</Label>
                <Select
                  value={formData.balanceType}
                  onValueChange={(value) => setFormData({ ...formData, balanceType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">{t("balanceTypes.debit")}</SelectItem>
                    <SelectItem value="credit">{t("balanceTypes.credit")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Saving..." : t("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
