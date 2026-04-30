import { apiFetch } from './client';

export interface JobsiteRow {
    id: number;
    jobsiteName: string;
    jobsiteAddress: string;
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
