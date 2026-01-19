/**
 * Profile Page
 * User profile management with personal information and preferences
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Building2,
  CreditCard,
  Shield,
  Bell,
  Lock,
  Save,
  Camera,
  Upload,
  Languages,
  Moon,
  Sun,
  RefreshCw,
  Settings,
} from "lucide-react";
import { userProfileApi, UserProfile } from "@/lib/api/user-profile";
import { useAuth } from "@/contexts/auth-context";
import logger from "@/lib/logger";

export default function ProfilePage() {
  const t = useTranslations("settings.profile");
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await userProfileApi.get();
      setProfile(data);
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      toast.error(message);
      logger.error("Failed to load user profile", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form changes
  const handleChange = (field: keyof UserProfile, value: string | boolean) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle address changes
  const handleAddressChange = (field: string, value: string) => {
    setProfile((prev) => (prev ? { ...prev, address: { ...prev.address, [field]: value } } : null));
  };

  // Handle preferences changes
  const handlePreferencesChange = (field: string, value: string | boolean) => {
    setProfile((prev) => (prev ? { ...prev, preferences: { ...prev.preferences, [field]: value } } : null));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      // Prepare data for submission
      const formData = new FormData();
      formData.append("first_name_en", profile.first_name_en || "");
      formData.append("first_name_ar", profile.first_name_ar || "");
      formData.append("last_name_en", profile.last_name_en || "");
      formData.append("last_name_ar", profile.last_name_ar || "");
      formData.append("email", profile.email || "");
      formData.append("phone", profile.phone || "");
      formData.append("job_title", profile.job_title || "");
      formData.append("department", profile.department || "");
      formData.append("bio", profile.bio || "");
      formData.append("timezone", profile.preferences?.timezone || "Asia/Qatar");
      formData.append("language", profile.preferences?.language || "en");
      formData.append("theme", profile.preferences?.theme || "system");
      formData.append("notifications_enabled", profile.preferences?.notifications_enabled ? "true" : "false");
      formData.append("email_notifications", profile.preferences?.email_notifications ? "true" : "false");

      // Add address fields
      if (profile.address) {
        formData.append("address_street", profile.address.street || "");
        formData.append("address_city", profile.address.city || "");
        formData.append("address_state", profile.address.state || "");
        formData.append("address_postal_code", profile.address.postal_code || "");
        formData.append("address_country", profile.address.country || "QA");
      }

      // Add avatar if changed
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await userProfileApi.update(profile.id, formData);
      toast.success(t("updateSuccess"));

      // Update auth context with new profile info
      if (user) {
        await updateUser({
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: `${profile.first_name_en} ${profile.last_name_en}`,
            avatar_url: profile.avatar_url,
          },
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-zinc-400 mb-4" />
        <h3 className="text-lg font-medium">{t("errors.noProfile.title")}</h3>
        <p className="text-zinc-500">{t("errors.noProfile.description")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("personalInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt={profile.first_name_en} />
                    ) : (
                      <AvatarFallback>
                        {profile.first_name_en?.charAt(0)}
                        {profile.last_name_en?.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md cursor-pointer">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstNameEn">{t("fields.firstNameEn")} *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="firstNameEn"
                          value={profile.first_name_en || ""}
                          onChange={(e) => handleChange("first_name_en", e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="firstNameAr">{t("fields.firstNameAr")} *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="firstNameAr"
                          value={profile.first_name_ar || ""}
                          onChange={(e) => handleChange("first_name_ar", e.target.value)}
                          className="pl-9"
                          dir="rtl"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastNameEn">{t("fields.lastNameEn")} *</Label>
                      <Input
                        id="lastNameEn"
                        value={profile.last_name_en || ""}
                        onChange={(e) => handleChange("last_name_en", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastNameAr">{t("fields.lastNameAr")} *</Label>
                      <Input
                        id="lastNameAr"
                        value={profile.last_name_ar || ""}
                        onChange={(e) => handleChange("last_name_ar", e.target.value)}
                        dir="rtl"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("fields.email")} *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profile.email || ""}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("fields.phone")}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <Input
                          id="phone"
                          value={profile.phone || ""}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">{t("fields.jobTitle")}</Label>
                      <Input
                        id="jobTitle"
                        value={profile.job_title || ""}
                        onChange={(e) => handleChange("job_title", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">{t("fields.department")}</Label>
                      <Input
                        id="department"
                        value={profile.department || ""}
                        onChange={(e) => handleChange("department", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("fields.bio")}</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={4}
                  placeholder={t("placeholders.bio")}
                />
              </div>

              <Tabs defaultValue="address" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="address" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    {t("tabs.address")}
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-2">
                    <Settings className="h-4 w-4" />
                    {t("tabs.preferences")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="address" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">{t("fields.street")}</Label>
                      <Input
                        id="street"
                        value={profile.address?.street || ""}
                        onChange={(e) => handleAddressChange("street", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("fields.city")}</Label>
                      <Input
                        id="city"
                        value={profile.address?.city || ""}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">{t("fields.state")}</Label>
                      <Input
                        id="state"
                        value={profile.address?.state || ""}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">{t("fields.postalCode")}</Label>
                      <Input
                        id="postalCode"
                        value={profile.address?.postal_code || ""}
                        onChange={(e) => handleAddressChange("postal_code", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("fields.country")}</Label>
                      <Select
                        value={profile.address?.country || "QA"}
                        onValueChange={(value) => handleAddressChange("country", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QA">{t("countries.qatar")}</SelectItem>
                          <SelectItem value="SA">{t("countries.saudiArabia")}</SelectItem>
                          <SelectItem value="AE">{t("countries.unitedArabEmirates")}</SelectItem>
                          <SelectItem value="KW">{t("countries.kuwait")}</SelectItem>
                          <SelectItem value="BH">{t("countries.bahrain")}</SelectItem>
                          <SelectItem value="OM">{t("countries.oman")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">{t("fields.language")}</Label>
                      <Select
                        value={profile.preferences?.language || "en"}
                        onValueChange={(value) => handlePreferencesChange("language", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t("languages.english")}</SelectItem>
                          <SelectItem value="ar">{t("languages.arabic")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">{t("fields.timezone")}</Label>
                      <Select
                        value={profile.preferences?.timezone || "Asia/Qatar"}
                        onValueChange={(value) => handlePreferencesChange("timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Qatar">{t("timezones.qatar")}</SelectItem>
                          <SelectItem value="Asia/Dubai">{t("timezones.dubai")}</SelectItem>
                          <SelectItem value="Asia/Riyadh">{t("timezones.riyadh")}</SelectItem>
                          <SelectItem value="Europe/London">{t("timezones.london")}</SelectItem>
                          <SelectItem value="America/New_York">{t("timezones.newYork")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="theme">{t("fields.theme")}</Label>
                      <Select
                        value={profile.preferences?.theme || "system"}
                        onValueChange={(value) => handlePreferencesChange("theme", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">{t("themes.system")}</SelectItem>
                          <SelectItem value="light">{t("themes.light")}</SelectItem>
                          <SelectItem value="dark">{t("themes.dark")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications" className="text-base">
                          {t("fields.notifications")}
                        </Label>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t("descriptions.notifications")}
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={profile.preferences?.notifications_enabled ?? true}
                        onCheckedChange={(checked) => handlePreferencesChange("notifications_enabled", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications" className="text-base">
                          {t("fields.emailNotifications")}
                        </Label>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t("descriptions.emailNotifications")}
                        </p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={profile.preferences?.email_notifications ?? true}
                        onCheckedChange={(checked) => handlePreferencesChange("email_notifications", checked)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={fetchUserProfile}>
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {t("actions.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("actions.save")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
  );
}