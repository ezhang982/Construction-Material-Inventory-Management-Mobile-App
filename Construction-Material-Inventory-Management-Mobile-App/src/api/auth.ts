// src/api/auth.ts
// these are all API calls related to authentication.

import { apiFetch, BASE_URL } from './client';

export interface LoginResponse {
    token: string;
    user: {
        email:           string;
        role:            string;
        permissionLevel: number;
    };
}

export interface User {
    email: string;
    role: string;
    permissionLevel: number;
}

// login
export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Login failed');  // data.error comes from backend
    }

    return data;
}

// get all users (admin only)
export async function listUsers(): Promise<User[]> {
    const response = await apiFetch('/auth/users', { method: 'GET' });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
    }
    
    return data;
}

// update user permission (admin only)
export async function updateUserPermission(email: string, permissionLevel: number): Promise<User> {
    const response = await apiFetch(`/auth/users/${encodeURIComponent(email)}/permission`, {
        method: 'PATCH',
        body: JSON.stringify({ permissionLevel }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to update user permission');
    }
    
    return data;
}

// delete user (admin only)
export async function deleteUserByEmail(email: string): Promise<{ message: string }> {
    const response = await apiFetch(`/auth/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
    }
    
    return data;
}