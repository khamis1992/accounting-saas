/**
 * Roles Management Page
 * Define and manage user roles and permissions
 */

"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Users,
  Check,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import { rolesApi, Role, Permission } from "@/lib/api/roles";
import { permissionsApi } from "@/lib/api/permissions";
import { toast } from "sonner";
import logger from "@/lib/logger";

export default function RolesPage() {
  const t = useTranslations("settings.roles");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    isActive: true,
  });
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  // Fetch initial data
  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, [statusFilter]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.is_active = statusFilter === "active";

      const data = await rolesApi.getAll(filters);
      setRoles(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load roles";
      toast.error(message);
      logger.error("Failed to load roles", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await permissionsApi.getAll();
      setPermissions(data);
    } catch (error: unknown) {
      logger.error("Failed to load permissions", error as Error);
    }
  };

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(search.toLowerCase()) ||
        role.name_ar.includes(search) ||
        role.description?.toLowerCase().includes(search.toLowerCase()) ||
        role.description_ar?.includes(search)
    );
  }, [roles, search]);

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? t("statuses.active") : t("statuses.inactive")}
      </Badge>
    );
  };

  // Handle create role
  const handleCreate = () => {
    setEditingRole(null);
    setRoleForm({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      isActive: true,
    });
    setRolePermissions({});
    setShowRoleDialog(true);
  };

  // Handle edit role
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      nameAr: role.name_ar,
      description: role.description || "",
      descriptionAr: role.description_ar || "",
      isActive: role.is_active,
    });
    
    // Set permissions for the role
    const perms: Record<string, boolean> = {};
    role.role_permissions?.forEach((rp) => {
      perms[rp.permission_id] = rp.is_granted;
    });
    setRolePermissions(perms);
    
    setShowRoleDialog(true);
  };

  // Handle delete role
  const handleDelete = async (role: Role) => {
    if (!confirm(`${t("confirmDelete")} ${role.name}?`)) {
      return;
    }

    try {
      await rolesApi.delete(role.id);
      toast.success(t("deleteSuccess"));
      await fetchRoles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete role";
      toast.error(message);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        name: roleForm.name,
        name_ar: roleForm.nameAr,
        description: roleForm.description || undefined,
        description_ar: roleForm.descriptionAr || undefined,
        is_active: roleForm.isActive,
        permissions: Object.entries(rolePermissions)
          .filter(([_, granted]) => granted)
          .map(([permissionId]) => permissionId),
      };

      if (editingRole) {
        await rolesApi.update(editingRole.id, data);
        toast.success(t("updateSuccess"));
      } else {
        await rolesApi.create(data);
        toast.success(t("createSuccess"));
      }

      setShowRoleDialog(false);
      await fetchRoles();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save role";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle permission toggle
  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setRolePermissions((prev) => ({
      ...prev,
      [permissionId]: granted,
    }));
  };

  // Get action buttons for each role
  const getActionButtons = (role: Role) => {
    const buttons = [];

    // Edit button (always available)
    buttons.push({
      icon: <Edit className="h-4 w-4" />,
      label: t("actions.edit"),
      onClick: () => handleEdit(role),
    });

    // Delete button (for non-system roles)
    if (!role.is_system_role) {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(role),
      });
    }

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
            {t("newRole")}
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
                    <SelectItem value="active">{t("statuses.active")}</SelectItem>
                    <SelectItem value="inactive">{t("statuses.inactive")}</SelectItem>
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
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/settings/roles/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead>{t("table.permissions")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-zinc-500" dir="rtl">
                          {role.name_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{role.description}</div>
                        <div className="text-sm text-zinc-500" dir="rtl">
                          {role.description_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.role_permissions
                            ?.slice(0, 3)
                            .map((rp) => (
                              <Badge key={rp.permission_id} variant="outline" className="text-xs">
                                {rp.permission?.name}
                              </Badge>
                            ))}
                          {role.role_permissions && role.role_permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.role_permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(role.is_active)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(role).map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                btn.onClick();
                              }}
                              title={btn.label}
                            >
                              {btn.icon}
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

        {/* Create/Edit Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? t("dialogs.editTitle") : t("dialogs.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingRole ? t("dialogs.editDescription") : t("dialogs.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t("fields.nameEn")} *</Label>
                  <Input
                    id="nameEn"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameAr">{t("fields.nameAr")} *</Label>
                  <Input
                    id="nameAr"
                    value={roleForm.nameAr}
                    onChange={(e) => setRoleForm({ ...roleForm, nameAr: e.target.value })}
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t("fields.descriptionEn")}</Label>
                  <Input
                    id="descriptionEn"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t("fields.descriptionAr")}</Label>
                  <Input
                    id="descriptionAr"
                    value={roleForm.descriptionAr}
                    onChange={(e) => setRoleForm({ ...roleForm, descriptionAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={roleForm.isActive}
                  onCheckedChange={(checked) => setRoleForm({ ...roleForm, isActive: Boolean(checked) })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t("fields.isActive")}
                </Label>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t("permissions.title")}</h3>
                <p className="text-sm text-zinc-500">{t("permissions.description")}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={!!rolePermissions[permission.id]}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, Boolean(checked))}
                      />
                      <div className="grid gap-1 leading-none">
                        <Label htmlFor={`perm-${permission.id}`} className="cursor-pointer">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-zinc-500">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRoleDialog(false)}
                  disabled={submitting}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingRole ? t("actions.updating") : t("actions.creating")}
                    </>
                  ) : editingRole ? (
                    t("actions.update")
                  ) : (
                    t("actions.create")
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}