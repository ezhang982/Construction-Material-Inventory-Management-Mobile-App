import { Request, Response } from 'express';
import pool from '../config/db';

const JOBSITE_COLS = `id, jobsite_name AS "jobsiteName", jobsite_address AS "jobsiteAddress"`;

// GET /jobsites
export async function getJobsites(_req: Request, res: Response): Promise<void> {
    try {
        const result = await pool.query(
            `SELECT ${JOBSITE_COLS} FROM jobsites ORDER BY jobsite_name`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /jobsites
export async function createJobsite(req: Request, res: Response): Promise<void> {
    const { jobsiteName, jobsiteAddress } = req.body;

    if (!jobsiteName || !jobsiteAddress) {
        res.status(400).json({ error: 'jobsiteName and jobsiteAddress are required' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO jobsites (jobsite_name, jobsite_address)
             VALUES ($1, $2) RETURNING ${JOBSITE_COLS}`,
            [jobsiteName, jobsiteAddress]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') {
            res.status(409).json({ error: 'A jobsite at this address already exists' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

// DELETE /jobsites/:id
export async function deleteJobsite(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM jobsites WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Jobsite not found' });
            return;
        }
        res.json({ message: 'Jobsite deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /jobsites/:id/inventory
export async function getJobsiteInventory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const [materials, equipment, tools] = await Promise.all([
            pool.query('SELECT * FROM materials WHERE jobsite_id = $1', [id]),
            pool.query('SELECT * FROM equipment WHERE jobsite_id = $1', [id]),
            pool.query('SELECT * FROM tools WHERE jobsite_id = $1', [id]),
        ]);

        res.json({
            jobsiteId: id,
            materials:  materials.rows,
            equipment:  equipment.rows,
            tools:      tools.rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /jobsites/:id/inventory
export async function addInventoryItem(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { itemType, name, itemId, amount, description } = req.body;

    if (!itemType || !name) {
        res.status(400).json({ error: 'itemType and name are required' });
        return;
    }

    try {
        let result;

        if (itemType === 'material') {
            result = await pool.query(
                `INSERT INTO materials (jobsite_id, material_name, material_description, material_amount)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [id, name, description || '', amount || 0]
            );
        } else if (itemType === 'equipment') {
            result = await pool.query(
                `INSERT INTO equipment (jobsite_id, equipment_name, equipment_serial_number, equipment_description, equipment_amount)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [id, name, itemId || '', description || '', amount || 0]
            );
        } else if (itemType === 'tool') {
            result = await pool.query(
                `INSERT INTO tools (jobsite_id, tool_name, tool_id_number)
                 VALUES ($1, $2, $3) RETURNING *`,
                [id, name, itemId || '']
            );
        } else {
            res.status(400).json({ error: 'itemType must be material, equipment, or tool' });
            return;
        }

        res.status(201).json(result!.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /jobsites/:id/inventory/:itemType/:itemRowId
export async function removeInventoryItem(req: Request, res: Response): Promise<void> {
    const { itemType, itemRowId } = req.params;

    const tableMap: Record<string, string> = {
        material:  'materials',
        equipment: 'equipment',
        tool:      'tools',
    };

    const table = tableMap[itemType];
    if (!table) {
        res.status(400).json({ error: 'itemType must be material, equipment, or tool' });
        return;
    }

    try {
        const result = await pool.query(
            `DELETE FROM ${table} WHERE id = $1 RETURNING *`,
            [itemRowId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Item not found' });
            return;
        }
        res.json({ message: 'Item removed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
