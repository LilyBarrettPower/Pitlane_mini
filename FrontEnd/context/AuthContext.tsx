import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import { AuthOrganisation, AuthUser, LoginResponse } from '../assets/auth';

type AuthContextType = {
    token: string | null,
    user: AuthUser | null;
    organisation: AuthOrganisation | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data : LoginResponse) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'pitlane_token';
const USER_KEY = 'pitlane_user';
const ORG_KEY = 'pitlane_organisation';

export function AuthProvider({children}: {children: ReactNode}) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [organisation, setOrganisation] = useState<AuthOrganisation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    async function loadStoredAuth() {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedUser = await AsyncStorage.getItem(USER_KEY);
            const storedOrganisation = await AsyncStorage.getItem(ORG_KEY);

            if(storedToken) setToken(storedToken);
            if(storedUser) setUser(JSON.parse(storedUser));
            if(storedOrganisation) setOrganisation(JSON.parse(storedOrganisation));
        } catch (error) {
            console.error('Failed to load auth from storage:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(data: LoginResponse) {
        try {
            setToken(data.token);
            setUser(data.user);
            setOrganisation(data.organisation);

            await AsyncStorage.setItem(TOKEN_KEY, data.token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
            await AsyncStorage.setItem(ORG_KEY, JSON.stringify(data.organisation));
        } catch (error) {
            console.error('Failed to store auth', error);
            throw error;
        } 
    }

    async function logout() {
        try {
            setToken(null);
            setUser(null);
            setOrganisation(null);

            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_KEY);
            await AsyncStorage.removeItem(ORG_KEY);
        } catch (error) {
            console.error('Failed to clear auth', error);
            throw error;
        }
    }

    return (
        <AuthContext.Provider
            value={{
                token, 
                user,
                organisation,
                isAuthenticated: !!token,
                isLoading,
                login,
                logout,
            }}
            >
                {children}
            </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}