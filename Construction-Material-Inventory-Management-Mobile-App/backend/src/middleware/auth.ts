import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

// Extend Express's Request type so controllers can access req.user
export interface AuthRequest extends Request{
    user?:{
        email: string;
        permissionLevel: number;
        role: string;
    };
}

// permission levels
export const PERMISSIONS = {
    ADMIN:           1,
    PROJECT_MANAGER: 2,
    LOGISTICS:       3,
    FOREMAN:         4,
} as const;

// verifies the JWT on every protected route.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void{
    const authHeader = req.headers.authorization;

    // check header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({error: 'Missing or invalid Authorization header'});
        return;
    }

    const token = authHeader.split(' ')[1];  // extract token string

    // verify jwt token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as AuthRequest['user'];
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({error:'Invalid or expired token'});
    }
}


// use after requireAuth to restrict a route to users at or above a given level.
// lower number = higher privilege
export function requirePermission(maxLevel: number) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({error: 'Not authenticated'});
            return;
        }
        if (req.user.permissionLevel > maxLevel) {
            res.status(403).json({error: 'Insufficient permissions'});
            return;
        }
        next();
    };
}