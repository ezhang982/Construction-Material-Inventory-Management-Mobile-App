import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

const ROLE_MAP: Record<number, string> = {
    1: 'Admin',
    2: 'ProjectManager',
    3: 'Logistics',
    4: 'Foreman',
};

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void>{
    const {email, password} = req.body;

    if (!email || !password){
        res.status(400).json({error:'Email and password are required'});
        return;
    }

    try{
        const result = await pool.query(
            'SELECT * FROM credentials WHERE email = $1',
            [email.toLowerCase()]
        );

        if(result.rows.length === 0){
            res.status(401).json({error:'Invalid email or password'});
            return;
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.hashed_password);

        if(!passwordMatch){
            res.status(401).json({ error:'Invalid email or password'});
            return;
        }

        const token = jwt.sign(
            {
                email:           user.email,
                permissionLevel: user.permission_level,
                role:            ROLE_MAP[user.permission_level] || 'Unknown',
            },
            process.env.JWT_SECRET || '',
            { expiresIn: '8h' }  // token expires after 8 hours
        );

        res.json({
            token,
            user: {
                email:           user.email,
                role:            ROLE_MAP[user.permission_level],
                permissionLevel: user.permission_level,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /auth/me
// returns the currently authenticated user (decoded from the JWT).
// frontend hits this on app launch to validate a saved token without a full re-login.
export function me(req: AuthRequest, res: Response): void {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    res.json({
        email:           req.user.email,
        role:            req.user.role,
        permissionLevel: req.user.permissionLevel,
    });
}

// POST /auth/register
// Admin-only: create a new user account
export async function register(req: Request, res: Response): Promise<void> {
    const { email, password, permissionLevel } = req.body;

    if (!email || !password || !permissionLevel) {
        res.status(400).json({ error: 'Email, password, and permissionLevel are required' });
        return;
    }

    if (![1, 2, 3, 4].includes(Number(permissionLevel))) {
        res.status(400).json({ error: 'permissionLevel must be 1 (Admin), 2 (PM), 3 (Logistics), or 4 (Foreman)' });
        return;
    }

    try {
        // check if email already exists
        const existing = await pool.query(
            'SELECT email FROM credentials WHERE email = $1',
            [email.toLowerCase()]
        );
        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'An account with this email already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.query(
            'INSERT INTO credentials (email, hashed_password, permission_level) VALUES ($1, $2, $3)',
            [email.toLowerCase(), hashedPassword, permissionLevel]
        );

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// DELETE /auth/users/:email
// Admin-only: delete a user account
export async function deleteUser(req: Request, res: Response): Promise<void> {
    const { email } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM credentials WHERE email = $1 RETURNING email',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: `User ${email} deleted` });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// PATCH /auth/users/:email/permission
// Admin-only: change a user's permission level
export async function updatePermission(req: Request, res: Response): Promise<void> {
    const { email } = req.params;
    const { permissionLevel } = req.body;

    if (![1, 2, 3, 4].includes(Number(permissionLevel))) {
        res.status(400).json({ error: 'Invalid permissionLevel' });
        return;
    }

    try {
        const result = await pool.query(
            'UPDATE credentials SET permission_level = $1 WHERE email = $2 RETURNING email, permission_level',
            [permissionLevel, email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ email: result.rows[0].email, permissionLevel: result.rows[0].permission_level });
    } catch (err) {
        console.error('Update permission error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// GET /auth/users
// Admin-only: list all users
export async function listUsers(_req: Request, res: Response): Promise<void> {
    try {
        const result = await pool.query(
            'SELECT email, permission_level FROM credentials ORDER BY email'
        );
        res.json(result.rows.map(row => ({
            email:           row.email,
            permissionLevel: row.permission_level,
            role:            ROLE_MAP[row.permission_level] || 'Unknown',
        })));
    } catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}