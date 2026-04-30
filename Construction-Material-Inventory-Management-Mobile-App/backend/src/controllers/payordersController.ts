import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

// GET /payorders
// joins on jobsites so the response includes the address for display
export async function getPayorders(_req: Request, res: Response): Promise<void> {
    try {
        const result = await pool.query(
            `SELECT p.id, p.payorder_number AS "payorderNumber", p.uploaded_by AS "uploadedBy",
                    p.uploaded_at AS "uploadedAt", p.jobsite_id AS "jobsiteId",
                    j.jobsite_name AS "jobsiteName", j.jobsite_address AS "jobsiteAddress"
             FROM payorders p
             JOIN jobsites j ON j.id = p.jobsite_id
             ORDER BY j.jobsite_address, p.payorder_number`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /payorders
// assigns payorder_number: 0000001 for a new jobsite or next available for an existing one
export async function createPayorder(req: AuthRequest, res: Response): Promise<void> {
    const { jobsiteId } = req.body;

    if (!jobsiteId) {
        res.status(400).json({ error: 'jobsiteId is required' });
        return;
    }

    try {
        // make sure the jobsite actually exists
        const jobsite = await pool.query(
            'SELECT id FROM jobsites WHERE id = $1',
            [jobsiteId]
        );
        if (jobsite.rows.length === 0) {
            res.status(404).json({ error: 'Jobsite not found' });
            return;
        }

        // find the highest existing payorder number for this jobsite
        const existing = await pool.query(
            'SELECT MAX(payorder_number) as max_num FROM payorders WHERE jobsite_id = $1',
            [jobsiteId]
        );

        const nextNum = existing.rows[0].max_num
            ? String(Number(existing.rows[0].max_num) + 1).padStart(7, '0')
            : '0000001';

        const result = await pool.query(
            `INSERT INTO payorders (jobsite_id, payorder_number, uploaded_by, uploaded_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [jobsiteId, nextNum, req.user?.email || 'unknown']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /payorders/:id/inventory
export async function getPayorderInventory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const [materials, equipment, tools] = await Promise.all([
            pool.query('SELECT * FROM materials WHERE payorder_id = $1', [id]),
            pool.query('SELECT * FROM equipment WHERE payorder_id = $1', [id]),
            pool.query('SELECT * FROM tools WHERE payorder_id = $1', [id]),
        ]);

        res.json({ payorderId: id, materials: materials.rows, equipment: equipment.rows, tools: tools.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /payorders/:id/inventory
export async function addPayorderItem(req: Request, res: Response): Promise<void> {
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
                `INSERT INTO materials (payorder_id, material_name, material_description, material_amount)
         VALUES ($1, $2, $3, $4) RETURNING *`,
                [id, name, description || '', amount || 0]
            );
        } else if (itemType === 'equipment') {
            result = await pool.query(
                `INSERT INTO equipment (payorder_id, equipment_name, equipment_serial_number, equipment_description, equipment_amount)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [id, name, itemId || '', description || '', amount || 0]
            );
        } else if (itemType === 'tool') {
            result = await pool.query(
                `INSERT INTO tools (payorder_id, tool_name, tool_id_number)
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

// DELETE /payorders/:id
export async function deletePayorder(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM payorders WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Payorder not found' });
            return;
        }
        res.json({ message: 'Payorder deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}