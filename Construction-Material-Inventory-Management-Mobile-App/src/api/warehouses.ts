import { apiFetch } from './client';
import { ItemType, AddItemPayload } from './jobsites';

export type { ItemType, AddItemPayload };

export interface WarehouseRow {
    id: number;
    warehouseName: string;
    warehouseAddress: string;
}

export interface DeliveryRow {
    id: number;
    warehouseId: number;
    packingSlipId: string;
    jobsiteId: number;
    jobsiteName: string;
    jobsiteAddress: string;
    arrivedAt: string;
}

export interface DeliveryMaterialItem  { id: number; name: string; description: string; amount: number; }
export interface DeliveryEquipmentItem { id: number; name: string; serialNumber: string; description: string; amount: number; }
export interface DeliveryToolItem      { id: number; name: string; idNumber: string; amount: number; }

export interface DeliveryInventory {
    deliveryId: string;
    materials:  DeliveryMaterialItem[];
    equipment:  DeliveryEquipmentItem[];
    tools:      DeliveryToolItem[];
}

export async function getWarehouses(): Promise<WarehouseRow[]> {
    const res = await apiFetch('/warehouses');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch warehouses');
    return data;
}

export async function createWarehouse(warehouseName: string, warehouseAddress: string): Promise<WarehouseRow> {
    const res = await apiFetch('/warehouses', {
        method: 'POST',
        body: JSON.stringify({ warehouseName, warehouseAddress }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create warehouse');
    return data;
}

export async function deleteWarehouse(id: number): Promise<void> {
    const res = await apiFetch(`/warehouses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete warehouse');
    }
}

export async function getDeliveries(warehouseId: number): Promise<DeliveryRow[]> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch deliveries');
    return data;
}

export async function createDelivery(
    warehouseId: number,
    packingSlipId: string,
    jobsiteId: number,
): Promise<DeliveryRow> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries`, {
        method: 'POST',
        body: JSON.stringify({ packingSlipId, jobsiteId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create delivery');
    return data;
}

export async function deleteDelivery(warehouseId: number, deliveryId: number): Promise<void> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries/${deliveryId}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete delivery');
    }
}

export async function getDeliveryInventory(warehouseId: number, deliveryId: number): Promise<DeliveryInventory> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries/${deliveryId}/inventory`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch delivery inventory');
    return data;
}

export async function addDeliveryItem(warehouseId: number, deliveryId: number, payload: AddItemPayload): Promise<void> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries/${deliveryId}/inventory`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add item');
    }
}

export async function removeDeliveryItem(warehouseId: number, deliveryId: number, itemType: ItemType, itemRowId: number): Promise<void> {
    const res = await apiFetch(`/warehouses/${warehouseId}/deliveries/${deliveryId}/inventory/${itemType}/${itemRowId}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove item');
    }
}
