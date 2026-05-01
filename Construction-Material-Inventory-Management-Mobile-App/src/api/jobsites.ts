import { apiFetch } from './client';

export interface JobsiteRow {
    id: number;
    jobsiteName: string;
    jobsiteAddress: string;
}

export interface MaterialItem  { id: number; name: string; description: string; amount: number; }
export interface EquipmentItem { id: number; name: string; serialNumber: string; description: string; amount: number; }
export interface ToolItem      { id: number; name: string; idNumber: string; }

export interface JobsiteInventory {
    jobsiteId: string;
    materials:  MaterialItem[];
    equipment:  EquipmentItem[];
    tools:      ToolItem[];
}

export async function getJobsites(): Promise<JobsiteRow[]> {
    const res = await apiFetch('/jobsites');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch jobsites');
    return data;
}

export async function createJobsite(jobsiteName: string, jobsiteAddress: string): Promise<JobsiteRow> {
    const res = await apiFetch('/jobsites', {
        method: 'POST',
        body: JSON.stringify({ jobsiteName, jobsiteAddress }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create jobsite');
    return data;
}

export async function deleteJobsite(id: number): Promise<void> {
    const res = await apiFetch(`/jobsites/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete jobsite');
    }
}

export async function getJobsiteInventory(id: number): Promise<JobsiteInventory> {
    const res = await apiFetch(`/jobsites/${id}/inventory`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory');
    return data;
}

export type ItemType = 'material' | 'equipment' | 'tool';

export interface AddItemPayload {
    itemType: ItemType;
    name: string;
    description?: string;
    amount?: number;
    itemId?: string; // serialNumber for equipment, idNumber for tools
}

export async function addJobsiteItem(jobsiteId: number, payload: AddItemPayload): Promise<void> {
    const res = await apiFetch(`/jobsites/${jobsiteId}/inventory`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add item');
    }
}

export async function removeJobsiteItem(jobsiteId: number, itemType: ItemType, itemRowId: number): Promise<void> {
    const res = await apiFetch(`/jobsites/${jobsiteId}/inventory/${itemType}/${itemRowId}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove item');
    }
}
