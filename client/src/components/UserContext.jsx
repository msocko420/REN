import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <UserContext.Provider value={{ username, setUsername, isAuthenticated, setIsAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
};
