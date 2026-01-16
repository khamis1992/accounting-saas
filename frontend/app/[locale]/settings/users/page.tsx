'use client';

/**
 * Settings - Users Management Page
 * Admin-only page for managing organization users
 */

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Search,
  Mail,
  Shield,
  MoreVertical,
  UserX,
  UserCheck,
  Edit,
  User as UserIcon,
} from 'lucide-react';
import { usersApi, UserProfile, InviteUserDto } from '@/lib/api/users';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstNameAr: '',
    firstNameEn: '',
    lastNameAr: '',
    lastNameEn: '',
    preferredLanguage: 'en',
    timezone: 'Asia/Qatar',
    roleIds: [] as string[],
    message: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const data = await usersApi.listUsers(filters);
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.first_name_en?.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name_ar?.includes(search) ||
      user.last_name_en?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name_ar?.includes(search) ||
      user.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleInvite = () => {
    setInviteForm({
      email: '',
      firstNameAr: '',
      firstNameEn: '',
      lastNameAr: '',
      lastNameEn: '',
      preferredLanguage: 'en',
      timezone: 'Asia/Qatar',
      roleIds: [],
      message: '',
    });
    setDialogOpen(true);
  };

  const handleSubmitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const inviteDto: InviteUserDto = {
        email: inviteForm.email,
        firstNameAr: inviteForm.firstNameAr,
        firstNameEn: inviteForm.firstNameEn,
        lastNameAr: inviteForm.lastNameAr || undefined,
        lastNameEn: inviteForm.lastNameEn || undefined,
        preferredLanguage: inviteForm.preferredLanguage as 'ar' | 'en',
        timezone: inviteForm.timezone,
        roleIds: inviteForm.roleIds,
        message: inviteForm.message || undefined,
      };

      const result = await usersApi.inviteUser(inviteDto);

      toast.success(`User invited successfully! Temporary password: ${result.tempPassword}`);
      setDialogOpen(false);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to deactivate ${user.first_name_en}?`)) {
      return;
    }

    try {
      await usersApi.deactivateUser(user.id);
      toast.success('User deactivated successfully');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  const handleActivate = async (user: UserProfile) => {
    try {
      await usersApi.activateUser(user.id);
      toast.success('User activated successfully');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      pending: 'destructive',
      suspended: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage your organization users and their access
            </p>
          </div>
          <Button onClick={handleInvite} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search users..."
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
              <div className="py-8 text-center text-zinc-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">No users found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserIcon className="h-4 w-4 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.first_name_en} {user.last_name_en}
                            </div>
                            <div className="text-sm text-zinc-500" dir="rtl">
                              {user.first_name_ar} {user.last_name_ar}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-zinc-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles?.map((ur) => (
                            <Badge key={ur.roles.id} variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              {ur.roles.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {user.status === 'active' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeactivate(user)}
                              title="Deactivate user"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleActivate(user)}
                              title="Activate user"
                            >
                              <UserCheck className="h-4 w-4" />
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

        {/* Invite User Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user to join your organization
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstNameEn">First Name (English) *</Label>
                  <Input
                    id="firstNameEn"
                    value={inviteForm.firstNameEn}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, firstNameEn: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstNameAr">First Name (Arabic) *</Label>
                  <Input
                    id="firstNameAr"
                    value={inviteForm.firstNameAr}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, firstNameAr: e.target.value })
                    }
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastNameEn">Last Name (English)</Label>
                  <Input
                    id="lastNameEn"
                    value={inviteForm.lastNameEn}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, lastNameEn: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastNameAr">Last Name (Arabic)</Label>
                  <Input
                    id="lastNameAr"
                    value={inviteForm.lastNameAr}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, lastNameAr: e.target.value })
                    }
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={inviteForm.preferredLanguage}
                    onValueChange={(value) =>
                      setInviteForm({ ...inviteForm, preferredLanguage: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={inviteForm.timezone}
                    onValueChange={(value) =>
                      setInviteForm({ ...inviteForm, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Qatar">Qatar (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <textarea
                  id="message"
                  className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:focus:ring-zinc-300"
                  rows={3}
                  value={inviteForm.message}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, message: e.target.value })
                  }
                  placeholder="Add a personal message to the invitation email..."
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
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
