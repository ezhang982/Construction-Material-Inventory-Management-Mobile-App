import { apiFetch } from './client';

export interface PayorderRow {
    id: number;
    payorderNumber: string;
    uploadedBy: string;
    uploadedAt: string;
    jobsiteId: number;
    jobsiteName: string;
    jobsiteAddress: string;
}

export async function getPayorders(): Promise<PayorderRow[]> {
    const res = await apiFetch('/payorders');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch payorders');
    return data;
}

export async function deletePayorder(id: number): Promise<void> {
    const res = await apiFetch(`/payorders/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete payorder');
    }
}
