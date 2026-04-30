import { Request, Response } from 'express';
import pool from '../config/db';

const WAREHOUSE_COLS = `id, warehouse_address AS "warehouseAddress"`;
const DELIVERY_COLS  = `id, warehouse_id AS "warehouseId", packing_slip_id AS "packingSlipId", destination_address AS "destinationAddress", arrived_at AS "arrivedAt"`;

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
    const { warehouseAddress } = req.body;

    if (!warehouseAddress) {
        res.status(400).json({ error: 'warehouseAddress is required' });
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
            `INSERT INTO warehouses (warehouse_address) VALUES ($1) RETURNING ${WAREHOUSE_COLS}`,
            [warehouseAddress]
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
            `SELECT ${DELIVERY_COLS} FROM deliveries WHERE warehouse_id = $1 ORDER BY arrived_at DESC`,
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
    const { packingSlipId, destinationAddress } = req.body;

    if (!packingSlipId || !destinationAddress) {
        res.status(400).json({ error: 'packingSlipId and destinationAddress are required' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO deliveries (warehouse_id, packing_slip_id, destination_address, arrived_at)
             VALUES ($1, $2, $3, NOW()) RETURNING ${DELIVERY_COLS}`,
            [id, packingSlipId, destinationAddress]
        );
        res.status(201).json(result.rows[0]);
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
