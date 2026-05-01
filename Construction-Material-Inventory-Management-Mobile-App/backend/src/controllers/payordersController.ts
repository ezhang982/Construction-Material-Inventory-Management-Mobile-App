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
                    p.fulfillment_status AS "fulfillmentStatus",
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
             VALUES ($1, $2, $3, NOW())
             RETURNING id, payorder_number AS "payorderNumber", uploaded_by AS "uploadedBy",
                       uploaded_at AS "uploadedAt", jobsite_id AS "jobsiteId",
                       fulfillment_status AS "fulfillmentStatus"`,
            [jobsiteId, nextNum, req.user?.email || 'unknown']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const MAT_COLS   = `id, material_name AS "name", material_description AS "description", material_amount AS "amount", fulfilled_amount AS "fulfilledAmount"`;
const EQUIP_COLS  = `id, equipment_name AS "name", equipment_serial_number AS "serialNumber", equipment_description AS "description", equipment_amount AS "amount", fulfilled_amount AS "fulfilledAmount"`;
const TOOL_COLS   = `id, tool_name AS "name", tool_id_number AS "idNumber", tool_amount AS "amount", fulfilled_amount AS "fulfilledAmount"`;

// GET /payorders/:id/inventory
export async function getPayorderInventory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const [materials, equipment, tools] = await Promise.all([
            pool.query(`SELECT ${MAT_COLS}   FROM materials  WHERE payorder_id = $1`, [id]),
            pool.query(`SELECT ${EQUIP_COLS} FROM equipment  WHERE payorder_id = $1`, [id]),
            pool.query(`SELECT ${TOOL_COLS}  FROM tools      WHERE payorder_id = $1`, [id]),
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
                `INSERT INTO tools (payorder_id, tool_name, tool_id_number, tool_amount)
         VALUES ($1, $2, $3, $4) RETURNING *`,
                [id, name, itemId || '', amount || 1]
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

// DELETE /payorders/:id/inventory/:itemType/:itemRowId
export async function removePayorderItem(req: Request, res: Response): Promise<void> {
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
            `DELETE FROM ${table} WHERE id = $1 RETURNING id`,
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

// PATCH /payorders/:id/inventory/:itemType/:itemRowId/fulfillment
export async function updateItemFulfillment(req: Request, res: Response): Promise<void> {
    const { id: payorderId, itemType, itemRowId } = req.params;
    const { fulfilledAmount, isFulfilled } = req.body;

    try {
        if (itemType === 'material' || itemType === 'equipment') {
            const table = itemType === 'material' ? 'materials' : 'equipment';
            if (typeof fulfilledAmount !== 'number' || fulfilledAmount < 0) {
                res.status(400).json({ error: 'fulfilledAmount must be a non-negative number' });
                return;
            }
            const result = await pool.query(
                `UPDATE ${table} SET fulfilled_amount = $1 WHERE id = $2 RETURNING id`,
                [fulfilledAmount, itemRowId]
            );
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }
        } else if (itemType === 'tool') {
            if (typeof fulfilledAmount !== 'number' || fulfilledAmount < 0) {
                res.status(400).json({ error: 'fulfilledAmount must be a non-negative number' });
                return;
            }
            const result = await pool.query(
                'UPDATE tools SET fulfilled_amount = $1 WHERE id = $2 RETURNING id',
                [fulfilledAmount, itemRowId]
            );
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }
        } else {
            res.status(400).json({ error: 'itemType must be material, equipment, or tool' });
            return;
        }

        // Recalculate and save payorder-level fulfillment status
        const newStatus = await recalculatePayorderStatus(payorderId);
        await pool.query(
            'UPDATE payorders SET fulfillment_status = $1 WHERE id = $2',
            [newStatus, payorderId]
        );

        res.json({ fulfillmentStatus: newStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function recalculatePayorderStatus(payorderId: string): Promise<string> {
    const [mats, equips, tools] = await Promise.all([
        pool.query('SELECT material_amount AS amount, fulfilled_amount FROM materials WHERE payorder_id = $1', [payorderId]),
        pool.query('SELECT equipment_amount AS amount, fulfilled_amount FROM equipment WHERE payorder_id = $1', [payorderId]),
        pool.query('SELECT tool_amount AS amount, fulfilled_amount FROM tools WHERE payorder_id = $1', [payorderId]),
    ]);

    const allItems = [
        ...mats.rows.map(r => ({ received: r.fulfilled_amount, ordered: r.amount })),
        ...equips.rows.map(r => ({ received: r.fulfilled_amount, ordered: r.amount })),
        ...tools.rows.map(r => ({ received: r.fulfilled_amount, ordered: r.amount })),
    ];

    if (allItems.length === 0) return 'pending';

    const anyReceived  = allItems.some(i => i.received > 0);
    const allFulfilled = allItems.every(i => i.received >= i.ordered);

    if (allFulfilled) return 'fulfilled';
    if (anyReceived)  return 'partial';
    return 'pending';
}

// PATCH /payorders/:id/status
export async function updatePayorderStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { fulfillmentStatus } = req.body;

    const valid = ['pending', 'partial', 'fulfilled'];
    if (!valid.includes(fulfillmentStatus)) {
        res.status(400).json({ error: 'fulfillmentStatus must be pending, partial, or fulfilled' });
        return;
    }

    try {
        const result = await pool.query(
            `UPDATE payorders SET fulfillment_status = $1 WHERE id = $2
             RETURNING fulfillment_status AS "fulfillmentStatus"`,
            [fulfillmentStatus, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Payorder not found' });
            return;
        }
        res.json(result.rows[0]);
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