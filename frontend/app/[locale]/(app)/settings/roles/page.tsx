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
 * Roles Management Page
 * Create, edit, and manage user roles with permissions
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Star,
  Lock,
  Eye,
  PlusCircle,
  FileEdit,
  TrashIcon as Trash,
} from "lucide-react";
import { rolesApi, Role, Permission, CreateRoleDto } from "@/lib/api/settings";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Helper to convert between Permission format and checkbox state format
interface PermissionState {
  [key: string]: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

function permissionsToState(
  permissions: Record<string, Permission>
): Record<string, PermissionState> {
  const result: Record<string, PermissionState> = {};

  Object.entries(permissions).forEach(([moduleId, permission]) => {
    result[moduleId] = permission.actions || {
      view: false,
      create: false,
      edit: false,
      delete: false,
    };
  });

  return result;
}

function stateToPermissions(state: Record<string, PermissionState>): Record<string, Permission> {
  const result: Record<string, Permission> = {};

  Object.entries(state).forEach(([moduleId, actions]) => {
    result[moduleId] = {
      module: moduleId,
      actions: actions,
    };
  });

  return result;
}

interface PermissionModule {
  id: string;
  name: string;
  nameAr: string;
  permissions: string[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    nameAr: "لوحة التحكم",
    permissions: ["view"],
  },
  {
    id: "accounting",
    name: "Accounting",
    nameAr: "المحاسبة",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    id: "sales",
    name: "Sales",
    nameAr: "المبيعات",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    id: "purchases",
    name: "Purchases",
    nameAr: "المشتريات",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    id: "banking",
    name: "Banking",
    nameAr: "المصرفية",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    id: "inventory",
    name: "Inventory",
    nameAr: "المخزون",
    permissions: ["view", "create", "edit", "delete"],
  },
  {
    id: "reports",
    name: "Reports",
    nameAr: "التقارير",
    permissions: ["view", "create"],
  },
  {
    id: "settings",
    name: "Settings",
    nameAr: "الإعدادات",
    permissions: ["view", "edit"],
  },
];

const PERMISSION_ICONS: Record<string, React.ReactNode> = {
  view: <Eye className="h-4 w-4" />,
  create: <PlusCircle className="h-4 w-4" />,
  edit: <FileEdit className="h-4 w-4" />,
  delete: <Trash className="h-4 w-4" />,
};

export default function RolesPage() {
  const t = useTranslations("settings.roles");
  const tc = useTranslations("common");

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nameAr: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, PermissionState>>(
    {}
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getAll();
      setRoles(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  // Initialize permissions when editing
  useEffect(() => {
    if (editRole) {
      // Load role permissions - this would come from the API
      // For now, initialize with empty permissions
      const initialPermissions: Record<string, PermissionState> = {};
      PERMISSION_MODULES.forEach((module) => {
        initialPermissions[module.id] = {
          view: false,
          create: false,
          edit: false,
          delete: false,
        };
      });
      setSelectedPermissions(initialPermissions);
    } else {
      // Initialize empty permissions for new role
      const initialPermissions: Record<string, PermissionState> = {};
      PERMISSION_MODULES.forEach((module) => {
        initialPermissions[module.id] = {
          view: false,
          create: false,
          edit: false,
          delete: false,
        };
      });
      setSelectedPermissions(initialPermissions);
    }
  }, [editRole, open]);

  // Open create dialog
  const handleCreate = () => {
    setEditRole(null);
    setFormData({
      code: "",
      name: "",
      nameAr: "",
      description: "",
    });
    setOpen(true);
  };

  // Open edit dialog
  const handleEdit = async (role: Role) => {
    try {
      const roleWithPermissions = await rolesApi.getById(role.id);
      setEditRole(role);
      setFormData({
        code: role.code,
        name: role.name,
        nameAr: role.name_ar,
        description: role.description || "",
      });

      // Convert API permissions format to state format
      if (roleWithPermissions.permissions) {
        setSelectedPermissions(permissionsToState(roleWithPermissions.permissions));
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load role details");
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateRoleDto = {
        code: formData.code,
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description,
        permissions: stateToPermissions(selectedPermissions),
      };

      if (editRole) {
        await rolesApi.update(editRole.id, data);
        toast.success("Role updated successfully");
      } else {
        await rolesApi.create(data);
        toast.success("Role created successfully");
      }

      setOpen(false);
      await fetchRoles();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (role: Role) => {
    if (role.is_system_role) {
      toast.error("Cannot delete system roles");
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Delete Role",
      description: `Are you sure you want to delete role ${role.name}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await rolesApi.delete(role.id);
          toast.success("Role deleted successfully");
          await fetchRoles();
        } catch (error: unknown) {
          toast.error(error instanceof Error ? error.message : "Failed to delete role");
        }
      },
    });
  };

  // Handle set as default
  const handleSetDefault = async (role: Role) => {
    try {
      await rolesApi.setDefault(role.id);
      toast.success("Default role updated successfully");
      await fetchRoles();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update default role");
    }
  };

  // Toggle permission
  const togglePermission = (moduleId: string, action: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: !prev[moduleId]?.[action],
      },
    }));
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-zinc-500" />
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createRole")}
          </Button>
        </div>

        {/* Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("allRoles")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No roles found. Create your first role to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("roleName")}</TableHead>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead className="text-center">
                      <Users className="inline h-4 w-4" />
                    </TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {role.name}
                          {role.is_system_role && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" />
                              System
                            </Badge>
                          )}
                          {role.is_default && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              Default
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-500">{role.description || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{role.user_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_system_role ? "secondary" : "default"}>
                          {role.is_system_role ? t("system") : t("custom")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!role.is_default && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(role)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!role.is_system_role && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(role)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editRole ? t("editRole") : t("createRole")}</DialogTitle>
              <DialogDescription>
                {editRole
                  ? "Update role details and permissions"
                  : "Create a new role and configure permissions"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t("basicInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">{t("roleCode")}</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., ACCOUNTANT"
                      required
                      disabled={!!editRole}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t("roleName")}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Accountant"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nameAr">{t("roleNameArabic")}</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      dir="rtl"
                      placeholder="مثال: محاسب"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("description")}</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Role description"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-700" />

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="font-semibold">{t("permissions")}</h3>
                <Tabs defaultValue="all">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">{t("allModules")}</TabsTrigger>
                    <TabsTrigger value="accounting">{t("accounting")}</TabsTrigger>
                    <TabsTrigger value="sales">{t("sales")}</TabsTrigger>
                    <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4 mt-4">
                    {PERMISSION_MODULES.map((module) => (
                      <PermissionRow
                        key={module.id}
                        module={module}
                        permissions={selectedPermissions[module.id] || {}}
                        onToggle={(action) => togglePermission(module.id, action)}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="accounting" className="space-y-4 mt-4">
                    {PERMISSION_MODULES.filter((m) => ["accounting", "banking"].includes(m.id)).map(
                      (module) => (
                        <PermissionRow
                          key={module.id}
                          module={module}
                          permissions={selectedPermissions[module.id] || {}}
                          onToggle={(action) => togglePermission(module.id, action)}
                        />
                      )
                    )}
                  </TabsContent>

                  <TabsContent value="sales" className="space-y-4 mt-4">
                    {PERMISSION_MODULES.filter((m) =>
                      ["sales", "purchases", "inventory"].includes(m.id)
                    ).map((module) => (
                      <PermissionRow
                        key={module.id}
                        module={module}
                        permissions={selectedPermissions[module.id] || {}}
                        onToggle={(action) => togglePermission(module.id, action)}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="reports" className="space-y-4 mt-4">
                    {PERMISSION_MODULES.filter((m) => ["reports", "dashboard"].includes(m.id)).map(
                      (module) => (
                        <PermissionRow
                          key={module.id}
                          module={module}
                          permissions={selectedPermissions[module.id] || {}}
                          onToggle={(action) => togglePermission(module.id, action)}
                        />
                      )
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("saving") : tc("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        {confirmDialog && (
          <ConfirmDialog
            open={confirmDialog.open}
            onOpenChange={(open) => {
              setConfirmDialog(confirmDialog ? { ...confirmDialog, open } : null);
            }}
            title={confirmDialog.title}
            description={confirmDialog.description}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={confirmDialog.onConfirm}
            variant="destructive"
          />
        )}
      </div>
  );
}

// Permission Row Component
interface PermissionRowProps {
  module: PermissionModule;
  permissions: PermissionState;
  onToggle: (action: string) => void;
}

function PermissionRow({ module, permissions, onToggle }: PermissionRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex-1">
        <div className="font-medium">{module.name}</div>
        <div className="text-sm text-zinc-500">{module.nameAr}</div>
      </div>
      <div className="flex gap-2">
        {module.permissions.map((permission) => (
          <Button
            key={permission}
            type="button"
            variant={permissions[permission] ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(permission)}
            className="gap-2"
          >
            {PERMISSION_ICONS[permission]}
            <span className="capitalize">{permission}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
