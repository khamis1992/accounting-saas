/**
 * New Bank Account Page
 * Form to create a new bank account
 */
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { bankingApi, AccountType } from "@/lib/api/banking";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import logger from "@/lib/logger";

export default function NewBankAccountPage() {
  const t = useTranslations("banking.accounts");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "checking" as AccountType,
    account_number: "",
    bank_name: "",
    currency: "QAR",
    balance: 0,
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await bankingApi.createAccount(formData);
      toast.success("Bank account created successfully");
      router.push(`/${locale}/banking/accounts`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create bank account";
      toast.error(message);
      logger.error("Failed to create bank account", error as Error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("newAccount")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("createDescription")}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t("newAccount")}</CardTitle>
          <CardDescription>
            {t("createDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="account_name">
                {t("fields.accountName")} *
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => handleChange("account_name", e.target.value)}
                required
                placeholder="e.g., Main Operating Account"
              />
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="account_type">
                {t("fields.accountType")} *
              </Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) =>
                  handleChange("account_type", value as AccountType)
                }
                required
              >
                <SelectTrigger id="account_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">
                    {t("accountTypes.checking")}
                  </SelectItem>
                  <SelectItem value="savings">
                    {t("accountTypes.savings")}
                  </SelectItem>
                  <SelectItem value="credit-card">
                    {t("accountTypes.creditCard")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bank_name">
                {t("fields.bankName")} *
              </Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleChange("bank_name", e.target.value)}
                required
                placeholder="e.g., Qatar National Bank"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="account_number">
                {t("fields.accountNumber")} *
              </Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => handleChange("account_number", e.target.value)}
                required
                placeholder="e.g., 1234567890"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                {t("fields.currency")} *
              </Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleChange("currency", value)}
                required
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Initial Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance">
                {t("fields.initialBalance")}
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  handleChange("balance", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                {common("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {common("saving")}
                  </>
                ) : (
                  common("save")
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
