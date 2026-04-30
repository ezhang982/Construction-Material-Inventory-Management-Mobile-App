import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your machine's LAN IP when testing on a physical device.
// e.g. 'http://192.168.1.42:3000'
export const BASE_URL = 'http://localhost:3000';

export const TOKEN_KEY = 'auth_token';

// AuthContext registers its logout function here so the client can trigger it on 401.
let _onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: () => void) {
    _onUnauthorized = cb;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

    if (res.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        _onUnauthorized?.();
    }

    return res;
}
