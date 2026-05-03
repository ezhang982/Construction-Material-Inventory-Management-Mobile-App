import { Request, Response } from 'express';
import pool from '../config/db';

const WAREHOUSE_COLS = `id, warehouse_name AS "warehouseName", warehouse_address AS "warehouseAddress"`;
const DELIVERY_COLS  = `d.id, d.warehouse_id AS "warehouseId", d.packing_slip_id AS "packingSlipId", d.jobsite_id AS "jobsiteId", j.jobsite_name AS "jobsiteName", j.jobsite_address AS "jobsiteAddress", d.arrived_at AS "arrivedAt"`;
const MAT_COLS       = `id, material_name AS "name", material_description AS "description", material_amount AS "amount"`;
const EQUIP_COLS     = `id, equipment_name AS "name", equipment_serial_number AS "serialNumber", equipment_description AS "description", equipment_amount AS "amount"`;
const TOOL_COLS      = `id, tool_name AS "name", tool_id_number AS "idNumber", tool_amount AS "amount"`;

// GET /warehouses
export async function getWarehouses(_req: Request, res: Response): Promise<void> {
    try {
        const result = await pool.query(`SELECT ${WAREHOUSE_COLS} FROM warehouses ORDER BY id`);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /warehouses
export async function createWarehouse(req: Request, res: Response): Promise<void> {
    const { warehouseName, warehouseAddress } = req.body;

    if (!warehouseName || !warehouseAddress) {
        res.status(400).json({ error: 'warehouseName and warehouseAddress are required' });
        return;
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM warehouses WHERE warehouse_address = $1',
            [warehouseAddress]
        );
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'A warehouse at this address already exists' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO warehouses (warehouse_name, warehouse_address) VALUES ($1, $2) RETURNING ${WAREHOUSE_COLS}`,
            [warehouseName, warehouseAddress]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /warehouses/:id
export async function deleteWarehouse(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM warehouses WHERE id = $1 RETURNING id',
            [id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Warehouse not found' });
            return;
        }
        res.json({ message: 'Warehouse deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /warehouses/:id/deliveries
export async function getDeliveries(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT ${DELIVERY_COLS}
             FROM deliveries d
             JOIN jobsites j ON j.id = d.jobsite_id
             WHERE d.warehouse_id = $1
             ORDER BY d.arrived_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /warehouses/:id/deliveries
export async function createDelivery(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { packingSlipId, jobsiteId } = req.body;

    if (!packingSlipId || !jobsiteId) {
        res.status(400).json({ error: 'packingSlipId and jobsiteId are required' });
        return;
    }

    try {
        const jobsite = await pool.query('SELECT id FROM jobsites WHERE id = $1', [jobsiteId]);
        if (jobsite.rows.length === 0) {
            res.status(404).json({ error: 'Jobsite not found' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO deliveries (warehouse_id, packing_slip_id, jobsite_id, arrived_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING id, warehouse_id AS "warehouseId", packing_slip_id AS "packingSlipId", jobsite_id AS "jobsiteId", arrived_at AS "arrivedAt"`,
            [id, packingSlipId, jobsiteId]
        );
        // enrich with jobsite fields for the response
        const row = result.rows[0];
        const js = await pool.query(
            `SELECT jobsite_name AS "jobsiteName", jobsite_address AS "jobsiteAddress" FROM jobsites WHERE id = $1`,
            [jobsiteId]
        );
        res.status(201).json({ ...row, ...js.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /warehouses/:warehouseId/deliveries/:deliveryId
export async function deleteDelivery(req: Request, res: Response): Promise<void> {
    const { deliveryId } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM deliveries WHERE id = $1 RETURNING id',
            [deliveryId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Delivery not found' });
            return;
        }
        res.json({ message: 'Delivery deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /warehouses/:warehouseId/deliveries/:deliveryId/inventory
export async function getDeliveryInventory(req: Request, res: Response): Promise<void> {
    const { deliveryId } = req.params;

    try {
        const [materials, equipment, tools] = await Promise.all([
            pool.query(`SELECT ${MAT_COLS}   FROM materials WHERE delivery_id = $1`, [deliveryId]),
            pool.query(`SELECT ${EQUIP_COLS} FROM equipment WHERE delivery_id = $1`, [deliveryId]),
            pool.query(`SELECT ${TOOL_COLS}  FROM tools     WHERE delivery_id = $1`, [deliveryId]),
        ]);
        res.json({ deliveryId, materials: materials.rows, equipment: equipment.rows, tools: tools.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// POST /warehouses/:warehouseId/deliveries/:deliveryId/inventory
export async function addDeliveryItem(req: Request, res: Response): Promise<void> {
    const { deliveryId } = req.params;
    const { itemType, name, itemId, amount, description } = req.body;

    if (!itemType || !name) {
        res.status(400).json({ error: 'itemType and name are required' });
        return;
    }

    try {
        let result;
        if (itemType === 'material') {
            result = await pool.query(
                `INSERT INTO materials (delivery_id, material_name, material_description, material_amount)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [deliveryId, name, description || '', amount || 0]
            );
        } else if (itemType === 'equipment') {
            result = await pool.query(
                `INSERT INTO equipment (delivery_id, equipment_name, equipment_serial_number, equipment_description, equipment_amount)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [deliveryId, name, itemId || '', description || '', amount || 0]
            );
        } else if (itemType === 'tool') {
            result = await pool.query(
                `INSERT INTO tools (delivery_id, tool_name, tool_id_number, tool_amount)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [deliveryId, name, itemId || '', amount || 1]
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

// DELETE /warehouses/:warehouseId/deliveries/:deliveryId/inventory/:itemType/:itemRowId
export async function removeDeliveryItem(req: Request, res: Response): Promise<void> {
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
