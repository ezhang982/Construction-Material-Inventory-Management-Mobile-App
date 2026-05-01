import { apiFetch } from './client';
import { MaterialItem, EquipmentItem, ToolItem, ItemType, AddItemPayload } from './jobsites';

export type { ItemType, AddItemPayload };

export interface PayorderMaterialItem  extends MaterialItem  { fulfilledAmount: number; }
export interface PayorderEquipmentItem extends EquipmentItem { fulfilledAmount: number; }
export interface PayorderToolItem      extends ToolItem      { amount: number; fulfilledAmount: number; }

export interface PayorderInventory {
    payorderId: string;
    materials:  PayorderMaterialItem[];
    equipment:  PayorderEquipmentItem[];
    tools:      PayorderToolItem[];
}

export type FulfillmentStatus = 'pending' | 'partial' | 'fulfilled';

export interface PayorderRow {
    id: number;
    payorderNumber: string;
    uploadedBy: string;
    uploadedAt: string;
    jobsiteId: number;
    jobsiteName: string;
    jobsiteAddress: string;
    fulfillmentStatus: FulfillmentStatus;
}

export async function getPayorders(): Promise<PayorderRow[]> {
    const res = await apiFetch('/payorders');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch payorders');
    return data;
}

export async function createPayorder(jobsiteId: number): Promise<PayorderRow> {
    const res = await apiFetch('/payorders', {
        method: 'POST',
        body: JSON.stringify({ jobsiteId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create payorder');
    return data;
}

export async function deletePayorder(id: number): Promise<void> {
    const res = await apiFetch(`/payorders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete payorder');
    }
}

export async function getPayorderInventory(id: number): Promise<PayorderInventory> {
    const res = await apiFetch(`/payorders/${id}/inventory`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory');
    return data;
}

export async function addPayorderItem(payorderId: number, payload: AddItemPayload): Promise<void> {
    const res = await apiFetch(`/payorders/${payorderId}/inventory`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add item');
    }
}

export async function updateItemFulfillment(
    payorderId: number,
    itemType: ItemType,
    itemRowId: number,
    payload: { fulfilledAmount: number },
): Promise<FulfillmentStatus> {
    const res = await apiFetch(`/payorders/${payorderId}/inventory/${itemType}/${itemRowId}/fulfillment`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update fulfillment');
    return data.fulfillmentStatus as FulfillmentStatus;
}

export async function updatePayorderStatus(id: number, fulfillmentStatus: FulfillmentStatus): Promise<void> {
    const res = await apiFetch(`/payorders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ fulfillmentStatus }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
    }
}

export async function removePayorderItem(payorderId: number, itemType: ItemType, itemRowId: number): Promise<void> {
    const res = await apiFetch(`/payorders/${payorderId}/inventory/${itemType}/${itemRowId}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove item');
    }
}
