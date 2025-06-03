import React, { createContext, useContext, useState, useMemo } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const getInitialUser = () => localStorage.getItem('soeid');
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);

  const login = (soeid) => {
    setUser(soeid);
    localStorage.setItem('soeid', soeid);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('soeid');
  };

  const value = useMemo(() => ({
    user,
    login,
    logout,
    loading,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
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