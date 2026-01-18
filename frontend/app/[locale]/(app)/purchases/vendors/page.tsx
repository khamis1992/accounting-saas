"use client";

/**
 * Vendors Page
 * Displays vendor list with search, filtering, and CRUD operations
 *
 * PERFORMANCE IMPROVEMENTS:
 * - Added loading skeletons for better perceived performance
 * - Added helpful empty states with CTAs
 * - Added form reset after successful submission
 * - Used constants instead of magic numbers
 * - Removed console.log statements
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Plus, Search, Edit, Trash2, Mail, Phone, Building } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { vendorsApi, Vendor, CreateVendorDto } from "@/lib/api/vendors";
import { toast } from "sonner";
import { FORM, SUCCESS_MESSAGES } from "@/lib/constants";
import logger from "@/lib/logger";

// Initial empty form state
const INITIAL_FORM_STATE = {
  code: "",
  nameEn: "",
  nameAr: "",
  vatNumber: "",
  email: "",
  phone: "",
  mobile: "",
  address: "",
  city: "",
  country: "",
  creditLimit: "",
  paymentTermsDays: "",
  bankName: "",
  bankAccountNumber: "",
  iban: "",
  swiftCode: "",
  isActive: "true" as "true" | "false",
  notes: "",
};

export default function VendorsPage() {
  const t = useTranslations("vendors");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchVendors();

    return () => {
      isMounted.current = false;
    };
  }, [activeFilter]);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, boolean> = {};
      if (activeFilter !== "all") {
        filters.isActive = activeFilter === "active";
      }

      const data = await vendorsApi.getAll(filters);

      if (isMounted.current) {
        setVendors(data);
        logger.debug("Vendors loaded", { count: data.length });
      }
    } catch (error) {
      if (isMounted.current) {
        const message = error instanceof Error ? error.message : "Failed to load vendors";
        toast.error(message);
        logger.error("Failed to load vendors", error as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeFilter]);

  const filteredVendors = useCallback(() => {
    return vendors.filter(
      (vend) =>
        vend.name_en.toLowerCase().includes(search.toLowerCase()) ||
        vend.name_ar.includes(search) ||
        vend.code.includes(search) ||
        vend.email?.toLowerCase().includes(search.toLowerCase()) ||
        vend.phone?.includes(search) ||
        vend.mobile?.includes(search) ||
        vend.bank_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vendors, search]);

  const handleCreate = useCallback(() => {
    setEditVendor(null);
    setFormData(INITIAL_FORM_STATE);
    setDialogOpen(true);
    logger.userAction("Opened create vendor dialog");
  }, []);

  const handleEdit = useCallback((vendor: Vendor) => {
    setEditVendor(vendor);
    setFormData({
      code: vendor.code,
      nameEn: vendor.name_en,
      nameAr: vendor.name_ar,
      vatNumber: vendor.vat_number || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      mobile: vendor.mobile || "",
      address: vendor.address || "",
      city: vendor.city || "",
      country: vendor.country || "",
      creditLimit: vendor.credit_limit?.toString() || "",
      paymentTermsDays: vendor.payment_terms_days?.toString() || "",
      bankName: vendor.bank_name || "",
      bankAccountNumber: vendor.bank_account_number || "",
      iban: vendor.iban || "",
      swiftCode: vendor.swift_code || "",
      isActive: vendor.is_active ? "true" : "false",
      notes: vendor.notes || "",
    });
    setDialogOpen(true);
    logger.userAction("Opened edit vendor dialog", { vendorId: vendor.id });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setEditVendor(null);
    setShowSuccess(false);
    setDialogOpen(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateVendorDto = {
        code: formData.code,
        name_en: formData.nameEn,
        name_ar: formData.nameAr,
        vat_number: formData.vatNumber || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        payment_terms_days: formData.paymentTermsDays
          ? parseInt(formData.paymentTermsDays, 10)
          : undefined,
        bank_name: formData.bankName || undefined,
        bank_account_number: formData.bankAccountNumber || undefined,
        iban: formData.iban || undefined,
        swift_code: formData.swiftCode || undefined,
        is_active: formData.isActive === "true",
        notes: formData.notes || undefined,
      };

      if (editVendor) {
        await vendorsApi.update(editVendor.id, data);
        toast.success(SUCCESS_MESSAGES.UPDATED);
        logger.userAction("Updated vendor", { vendorId: editVendor.id });
      } else {
        await vendorsApi.create(data);
        toast.success(SUCCESS_MESSAGES.CREATED);
        logger.userAction("Created vendor", { code: data.code });
      }

      setShowSuccess(true);

      setTimeout(() => {
        resetForm();
        fetchVendors();
      }, FORM.SUCCESS_RESET_DELAY_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save vendor";
      toast.error(message);
      logger.error("Failed to save vendor", error as Error, {
        isEdit: !!editVendor,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    async (vendor: Vendor) => {
      if (!confirm(`Are you sure you want to delete ${vendor.name_en}?`)) {
        return;
      }

      try {
        await vendorsApi.delete(vendor.id);
        toast.success(SUCCESS_MESSAGES.DELETED);
        logger.userAction("Deleted vendor", { vendorId: vendor.id });
        await fetchVendors();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete vendor";
        toast.error(message);
        logger.error("Failed to delete vendor", error as Error, {
          vendorId: vendor.id,
        });
      }
    },
    [fetchVendors]
  );

  const filteredData = filteredVendors();

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vendors</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage your vendor accounts</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendors</CardTitle>
              <div className="flex items-center gap-4">
                <ExportButton
                  entityType="vendors"
                  filters={{
                    isActive:
                      activeFilter === "active"
                        ? true
                        : activeFilter === "inactive"
                          ? false
                          : undefined,
                  }}
                  includeInactive={activeFilter !== "active"}
                />
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search vendors..."
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
              <TableSkeleton  columns={8} rows={5} />
            ) : filteredData.length === 0 ? (
              <EmptyState
                icon={Building}
                title={search ? "No vendors found" : "No vendors yet"}
                description={
                  search
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first vendor"
                }
                actionLabel="Add Vendor"
                onAction={handleCreate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>VAT Number</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-mono">{vendor.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.name_en}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {vendor.name_ar}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {vendor.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {vendor.phone}
                            </div>
                          )}
                          {vendor.mobile && !vendor.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {vendor.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vendor.bank_name ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Building className="h-3 w-3" />
                            {vendor.bank_name}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{vendor.vat_number || "-"}</TableCell>
                      <TableCell>
                        {vendor.credit_limit ? `QAR ${vendor.credit_limit.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            vendor.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {vendor.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
              <DialogDescription>
                {editVendor ? "Update vendor details" : "Add a new vendor to your account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={!!editVendor}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">Name (English) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">Name (Arabic) *</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                  <Input
                    id="paymentTermsDays"
                    type="number"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit (QAR)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value as "true" | "false" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-4 font-semibold">Bank Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, bankAccountNumber: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swiftCode">SWIFT Code</Label>
                    <Input
                      id="swiftCode"
                      value={formData.swiftCode}
                      onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:focus:ring-zinc-300"
                  rows={FORM.TEXTAREA_DEFAULT_ROWS}
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
                  {submitting ? "Saving..." : showSuccess ? "Saved!" : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
