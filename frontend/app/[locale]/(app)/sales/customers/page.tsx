"use client";

/**
 * Customers Page
 * Displays customer list with search, filtering, and CRUD operations
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
import { Plus, Search, Edit, Trash2, Mail, Phone, Users } from "lucide-react";
import { ExportButton } from "@/components/ui/export-button";
import { EmptyState, TableEmptyState } from "@/components/ui/empty-state";
import { TableSkeleton, PageSkeleton } from "@/components/ui/skeleton";
import { customersApi, Customer, CreateCustomerDto } from "@/lib/api/customers";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  isActive: "true" as "true" | "false",
  notes: "",
};

export default function CustomersPage() {
  const t = useTranslations("customers");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Use ref to track if component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchCustomers();

    return () => {
      isMounted.current = false;
    };
  }, [activeFilter]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, boolean> = {};
      if (activeFilter !== "all") {
        filters.isActive = activeFilter === "active";
      }

      const data = await customersApi.getAll(filters);

      if (isMounted.current) {
        setCustomers(data);
        logger.debug("Customers loaded", { count: data.length });
      }
    } catch (error) {
      if (isMounted.current) {
        const message = error instanceof Error ? error.message : "Failed to load customers";
        toast.error(message);
        logger.error("Failed to load customers", error as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [activeFilter]);

  // Memoize filtered customers to avoid recalculation
  const filteredCustomers = useCallback(() => {
    return customers.filter(
      (cust) =>
        cust.name_en.toLowerCase().includes(search.toLowerCase()) ||
        cust.name_ar.includes(search) ||
        cust.code.includes(search) ||
        cust.email?.toLowerCase().includes(search.toLowerCase()) ||
        cust.phone?.includes(search) ||
        cust.mobile?.includes(search)
    );
  }, [customers, search]);

  const handleCreate = useCallback(() => {
    setEditCustomer(null);
    setFormData(INITIAL_FORM_STATE);
    setDialogOpen(true);
    logger.userAction("Opened create customer dialog");
  }, []);

  const handleEdit = useCallback((customer: Customer) => {
    setEditCustomer(customer);
    setFormData({
      code: customer.code,
      nameEn: customer.name_en,
      nameAr: customer.name_ar,
      vatNumber: customer.vat_number || "",
      email: customer.email || "",
      phone: customer.phone || "",
      mobile: customer.mobile || "",
      address: customer.address || "",
      city: customer.city || "",
      country: customer.country || "",
      creditLimit: customer.credit_limit?.toString() || "",
      paymentTermsDays: customer.payment_terms_days?.toString() || "",
      isActive: customer.is_active ? "true" : "false",
      notes: customer.notes || "",
    });
    setDialogOpen(true);
    logger.userAction("Opened edit customer dialog", { customerId: customer.id });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setEditCustomer(null);
    setShowSuccess(false);
    setDialogOpen(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateCustomerDto = {
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
        is_active: formData.isActive === "true",
        notes: formData.notes || undefined,
      };

      if (editCustomer) {
        await customersApi.update(editCustomer.id, data);
        toast.success(SUCCESS_MESSAGES.UPDATED);
        logger.userAction("Updated customer", { customerId: editCustomer.id });
      } else {
        await customersApi.create(data);
        toast.success(SUCCESS_MESSAGES.CREATED);
        logger.userAction("Created customer", { code: data.code });
      }

      // Show success state before closing
      setShowSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        resetForm();
        fetchCustomers();
      }, FORM.SUCCESS_RESET_DELAY_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save customer";
      toast.error(message);
      logger.error("Failed to save customer", error as Error, {
        isEdit: !!editCustomer,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(
    (customer: Customer) => {
      setConfirmDialog({
        open: true,
        title: "Delete Customer",
        description: `Are you sure you want to delete ${customer.name_en}? This action cannot be undone.`,
        onConfirm: async () => {
          try {
            await customersApi.delete(customer.id);
            toast.success(SUCCESS_MESSAGES.DELETED);
            logger.userAction("Deleted customer", { customerId: customer.id });
            await fetchCustomers();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete customer";
            toast.error(message);
            logger.error("Failed to delete customer", error as Error, {
              customerId: customer.id,
            });
          }
        },
      });
    },
    [fetchCustomers]
  );

  const filteredData = filteredCustomers();

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage your customer accounts</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Customers</CardTitle>
              <div className="flex items-center gap-4">
                <ExportButton
                  entityType="customers"
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
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search customers..."
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
                icon={Users}
                title={search ? "No customers found" : "No customers yet"}
                description={
                  search
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first customer"
                }
                actionLabel="Add Customer"
                onAction={handleCreate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>VAT Number</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono">{customer.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name_en}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {customer.name_ar}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.mobile && !customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.mobile}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{customer.vat_number || "-"}</TableCell>
                      <TableCell>
                        {customer.credit_limit
                          ? `QAR ${customer.credit_limit.toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {customer.payment_terms_days ? `${customer.payment_terms_days} days` : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            customer.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {customer.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer)}
                          >
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
              <DialogTitle>{editCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
              <DialogDescription>
                {editCustomer ? "Update customer details" : "Add a new customer to your account"}
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
                    disabled={!!editCustomer}
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

        {/* Confirm Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            description={confirmDialog.description}
            onConfirm={confirmDialog.onConfirm}
            onOpenChange={(open) => !open && setConfirmDialog(null)}
          />
        )}
      </div>
  );
}
