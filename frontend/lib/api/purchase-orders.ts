/**
 * Purchase Orders API
 * All purchase order-related API calls
 */

import { apiClient } from "./client";

export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "received"
  | "closed";

export interface PurchaseOrderItem {
  id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  date: string;
  expected_delivery_date?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderDto {
  vendor_id: string;
  date: Date | string;
  expected_delivery_date?: Date | string;
  items: Omit<PurchaseOrderItem, "id" | "total">[];
  notes?: string;
}

// Alias for backward compatibility
export type PurchaseOrderCreateDto = CreatePurchaseOrderDto;

export interface UpdatePurchaseOrderDto {
  vendor_id?: string;
  date?: Date | string;
  expected_delivery_date?: Date | string;
  items?: Omit<PurchaseOrderItem, "id" | "total">[];
  notes?: string;
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  vendor_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const purchaseOrdersApi = {
  /**
   * Get all purchase orders
   */
  async getAll(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.vendor_id) params.append("vendor_id", filters.vendor_id);
    if (filters?.start_date) params.append("start_date", filters.start_date);
    if (filters?.end_date) params.append("end_date", filters.end_date);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));

    const query = params.toString();
    const response = await apiClient.get<PurchaseOrder[]>(
      query ? `/purchases/purchase-orders?${query}` : "/purchases/purchase-orders"
    );
    return response.data || [];
  },

  /**
   * Get purchase order by ID
   */
  async getById(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get<PurchaseOrder>(`/purchases/purchase-orders/${id}`);
    return response.data as PurchaseOrder;
  },

  /**
   * Create new purchase order
   */
  async create(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>("/purchases/purchase-orders", {
      vendor_id: data.vendor_id,
      date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
      expected_delivery_date: data.expected_delivery_date ? (typeof data.expected_delivery_date === 'string' ? data.expected_delivery_date : data.expected_delivery_date.toISOString()) : undefined,
      items: data.items,
      notes: data.notes,
    });
    return response.data as PurchaseOrder;
  },

  /**
   * Update purchase order
   */
  async update(id: string, data: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.patch<PurchaseOrder>(`/purchases/purchase-orders/${id}`, {
      vendor_id: data.vendor_id,
      date: data.date ? (typeof data.date === 'string' ? data.date : data.date.toISOString()) : undefined,
      expected_delivery_date: data.expected_delivery_date ? (typeof data.expected_delivery_date === 'string' ? data.expected_delivery_date : data.expected_delivery_date.toISOString()) : undefined,
      items: data.items,
      notes: data.notes,
    });
    return response.data as PurchaseOrder;
  },

  /**
   * Delete purchase order
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/purchases/purchase-orders/${id}`
    );
    return response.data as { success: boolean };
  },

  /**
   * Convert purchase order to bill
   */
  async convertToBill(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.post<PurchaseOrder>(
      `/purchases/purchase-orders/${id}/convert-to-bill`,
      {}
    );
    return response.data as PurchaseOrder;
  },

  /**
   * Export purchase order to PDF
   */
  async exportToPDF(id: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/purchases/purchase-orders/${id}/export/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiClient.getAccessToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to export PDF");
    }

    return response.blob();
  },
};
