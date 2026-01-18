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
 * Settings - Profile Page
 * User profile management with avatar upload, personal info, and password change
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User as UserIcon, Mail, Phone, Camera, Lock, Save, CheckCircle } from "lucide-react";
import { usersApi, UserProfile, UpdateProfileDto, ChangePasswordDto } from "@/lib/api/users";
import { toast } from "sonner";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  const [profileForm, setProfileForm] = useState({
    firstNameAr: "",
    firstNameEn: "",
    lastNameAr: "",
    lastNameEn: "",
    email: "",
    phone: "",
    preferredLanguage: "en",
    timezone: "Asia/Qatar",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getProfile();
      setUser(data);
      setProfileForm({
        firstNameAr: data.first_name_ar || "",
        firstNameEn: data.first_name_en || "",
        lastNameAr: data.last_name_ar || "",
        lastNameEn: data.last_name_en || "",
        email: data.email || "",
        phone: data.phone || "",
        preferredLanguage: data.preferred_language || "en",
        timezone: data.timezone || "Asia/Qatar",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateDto: UpdateProfileDto = {
        firstNameAr: profileForm.firstNameAr || undefined,
        firstNameEn: profileForm.firstNameEn || undefined,
        lastNameAr: profileForm.lastNameAr || undefined,
        lastNameEn: profileForm.lastNameEn || undefined,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        preferredLanguage: profileForm.preferredLanguage as "ar" | "en",
        timezone: profileForm.timezone,
      };

      const updated = await usersApi.updateProfile(updateDto);
      setUser(updated);
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      };

      await usersApi.changePassword(changePasswordDto);
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)$/)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setAvatarUploading(true);

    try {
      const updated = await usersApi.uploadAvatar(file);
      setUser(updated);
      toast.success("Avatar uploaded successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-zinc-500">Loading profile...</div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1">
            <CardContent className="p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "profile"
                      ? "bg-zinc-100 dark:bg-zinc-800 font-medium"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "security"
                      ? "bg-zinc-100 dark:bg-zinc-800 font-medium"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Lock className="h-5 w-5" />
                  Security
                </button>
              </nav>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === "profile" && (
              <>
                {/* Avatar Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Photo</CardTitle>
                    <CardDescription>Update your profile picture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="Avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-12 w-12 text-zinc-400" />
                          )}
                        </div>
                        {avatarUploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="text-white text-sm">Uploading...</div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="avatar-upload"
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          {avatarUploading ? "Uploading..." : "Change Photo"}
                        </Label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={avatarUploading}
                        />
                        <p className="text-sm text-zinc-500 mt-2">JPEG, PNG, or WebP. Max 5MB.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstNameEn">First Name (English) *</Label>
                          <Input
                            id="firstNameEn"
                            value={profileForm.firstNameEn}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, firstNameEn: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="firstNameAr">First Name (Arabic) *</Label>
                          <Input
                            id="firstNameAr"
                            value={profileForm.firstNameAr}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, firstNameAr: e.target.value })
                            }
                            dir="rtl"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lastNameEn">Last Name (English)</Label>
                          <Input
                            id="lastNameEn"
                            value={profileForm.lastNameEn}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, lastNameEn: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastNameAr">Last Name (Arabic)</Label>
                          <Input
                            id="lastNameAr"
                            value={profileForm.lastNameAr}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, lastNameAr: e.target.value })
                            }
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                              id="email"
                              type="email"
                              value={profileForm.email}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, email: e.target.value })
                              }
                              className="pl-9"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <Input
                              id="phone"
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, phone: e.target.value })
                              }
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="language">Preferred Language</Label>
                          <Select
                            value={profileForm.preferredLanguage}
                            onValueChange={(value) =>
                              setProfileForm({ ...profileForm, preferredLanguage: value })
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
                            value={profileForm.timezone}
                            onValueChange={(value) =>
                              setProfileForm({ ...profileForm, timezone: value })
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

                      <div className="flex justify-end">
                        <Button type="submit" disabled={saving} className="gap-2">
                          {saving ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "security" && (
              <>
                {/* Change Password */}
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Ensure your account is using a strong password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password *</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password *</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          required
                        />
                        <p className="text-xs text-zinc-500">
                          Must be at least 8 characters with uppercase, lowercase, and number
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={changingPassword}
                          variant="default"
                          className="gap-2"
                        >
                          {changingPassword ? (
                            "Changing..."
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Security Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Password must be at least 8 characters long</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Must include uppercase and lowercase letters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Must include at least one number</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Cannot match common passwords</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
  );
}
