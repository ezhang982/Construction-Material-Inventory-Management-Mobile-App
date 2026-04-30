// src/api/auth.ts
// these are all API calls related to authentication.

import { BASE_URL } from './client';

export interface LoginResponse {
    token: string;
    user: {
        email:           string;
        role:            string;
        permissionLevel: number;
    };
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