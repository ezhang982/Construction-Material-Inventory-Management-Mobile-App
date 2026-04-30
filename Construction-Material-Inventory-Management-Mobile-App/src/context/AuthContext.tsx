import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY, setUnauthorizedHandler } from '../api/client';

interface AuthUser {
    email: string;
    role: string;
    permissionLevel: number;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: AuthUser) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser]       = useState<AuthUser | null>(null);
    const [token, setToken]     = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    };

    // On mount: register logout as the 401 handler, then validate any saved token.
    useEffect(() => {
        setUnauthorizedHandler(logout);

        (async () => {
            try {
                const saved = await AsyncStorage.getItem(TOKEN_KEY);
                if (!saved) return;

                const res = await fetch(`${BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${saved}` },
                });
                if (res.ok) {
                    const me: AuthUser = await res.json();
                    setToken(saved);
                    setUser(me);
                } else {
                    await AsyncStorage.removeItem(TOKEN_KEY);
                }
            } catch {
                // network unavailable on cold start — leave as logged-out
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (newToken: string, newUser: AuthUser) => {
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
