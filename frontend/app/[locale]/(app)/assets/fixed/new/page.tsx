/**
 * New Fixed Asset Page
 * Form for creating a new fixed asset
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, X, ArrowLeft } from "lucide-react";
import { assetsApi, FixedAssetCreateDto } from "@/lib/api/assets";

export default function NewFixedAssetPage() {
  const t = useTranslations("assets");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    assetCode: "",
    assetName: "",
    category: "furniture" as "furniture" | "equipment" | "vehicles" | "computers" | "buildings" | "land" | "other",
    acquisitionDate: new Date().toISOString().split("T")[0],
    purchaseDate: new Date().toISOString().split("T")[0],
    cost: "",
    salvageValue: "",
    usefulLife: "",
    depreciationMethod: "straight-line" as "straight-line" | "declining-balance" | "units-of-production",
    location: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: FixedAssetCreateDto = {
        asset_code: formData.assetCode,
        asset_name: formData.assetName,
        category: formData.category,
        purchase_date: formData.purchaseDate,
        purchase_cost: parseFloat(formData.cost) || 0,
        salvage_value: parseFloat(formData.salvageValue) || 0,
        useful_life_years: parseInt(formData.usefulLife) || 0,
        depreciation_method: formData.depreciationMethod,
        status: "active",
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      };

      await assetsApi.createAsset(data);
      toast.success("Asset created successfully");
      router.push("/assets/fixed");
    } catch (error) {
      console.error("Error creating asset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("addAsset")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Fixed Asset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetCode">Asset Code *</Label>
                    <Input
                      id="assetCode"
                      value={formData.assetCode}
                      onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                      required
                      placeholder="Asset code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: "furniture" | "equipment" | "vehicles" | "computers" | "buildings" | "land" | "other") => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="vehicles">Vehicles</SelectItem>
                        <SelectItem value="computers">Computers</SelectItem>
                        <SelectItem value="buildings">Buildings</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetName">Asset Name *</Label>
                  <Input
                    id="assetName"
                    value={formData.assetName}
                    onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                    required
                    placeholder="Asset name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
                    <Input
                      id="acquisitionDate"
                      type="date"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost *</Label>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salvageValue">Salvage Value</Label>
                    <Input
                      id="salvageValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salvageValue}
                      onChange={(e) => setFormData({ ...formData, salvageValue: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usefulLife">Useful Life (Years) *</Label>
                    <Input
                      id="usefulLife"
                      type="number"
                      min="0"
                      value={formData.usefulLife}
                      onChange={(e) => setFormData({ ...formData, usefulLife: e.target.value })}
                      required
                      placeholder="Years"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depreciationMethod">Depreciation Method *</Label>
                    <Select
                      value={formData.depreciationMethod}
                      onValueChange={(value: "straight-line" | "declining-balance" | "units-of-production") => setFormData({ ...formData, depreciationMethod: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight-line">Straight Line</SelectItem>
                        <SelectItem value="declining-balance">Declining Balance</SelectItem>
                        <SelectItem value="units-of-production">Units of Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Asset location"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the asset"
                    rows={12}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <X className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Asset
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