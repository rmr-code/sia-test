import React, { createContext, useState, useContext } from 'react';

// Create BaseURL
// uncomment below for development
const baseUrl = 'http://localhost:8080'; 
// uncomment below for production
//const baseUrl = window.location.origin;

// Create X-Header auth string
const X_REQUEST_STR = 'XteNATqxnbBkPa6TCHcK0NTxOM1JVkQl'

// Create context
const AuthContext = createContext();

// Custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component to wrap the app
export function AuthProvider({ children }) {
  const [isAdminPasswordSet, setIsAdminPasswordSet] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  /*
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    const response = await fetch(url, options);
    return response;
  };
  */
  // Wrap the app in this provider and expose the state to all children
  return (
    <AuthContext.Provider value={{ isAdminPasswordSet, setIsAdminPasswordSet, isLoggedIn, setIsLoggedIn, baseUrl, X_REQUEST_STR  }}>
      {children}
    </AuthContext.Provider>
  );
}
