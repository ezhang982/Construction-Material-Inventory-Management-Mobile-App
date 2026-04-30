import { apiFetch } from './client';

export interface WarehouseRow {
    id: number;
    warehouseAddress: string;
}

export interface DeliveryRow {
    id: number;
    warehouseId: number;
    packingSlipId: string;
    destinationAddress: string;
    arrivedAt: string;
}

export async function getWarehouses(): Promise<WarehouseRow[]> {
    const res = await apiFetch('/warehouses');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch warehouses');
    return data;
}

export async function createWarehouse(warehouseAddress: string): Promise<WarehouseRow> {
    const res = await apiFetch('/warehouses', {
        method: 'POST',
        body: JSON.stringify({ warehouseAddress }),
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
