import React, { createContext, useContext, useState, useEffect } from 'react';
import PocketBase from 'pocketbase';

const AuthContext = createContext();

export const pb = new PocketBase('http://34.237.174.32/pb/');

export const AuthProvider = ({ children }) => {
    const [currentUser, setUser] = useState(pb.authStore.model);

    useEffect(() => {
        let unsubscribe = pb.authStore.onChange((userData) => {
            setUser(userData?.model || null);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};