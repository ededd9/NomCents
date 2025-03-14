import { createContext, useState, useEffect } from 'react';

const LoginContext = createContext();

const LoginProvider = ({ children }) => {

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Retrieve the login state from localStorage
    const savedLoginState = localStorage.getItem('isLoggedIn');
    return savedLoginState ? JSON.parse(savedLoginState) : false;
  });

  const [user, setUser] = useState(() => {
    // Retrieve the user information from localStorage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Save the login state to localStorage whenever it changes
    localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    // Save username to localStorage whenever it changes
    localStorage.setItem('user', JSON.stringify(user)); 
  }, [isLoggedIn, user]);

  return (
    <LoginContext.Provider value={{ isLoggedIn, setIsLoggedIn, user, setUser }}>
      {children}
    </LoginContext.Provider>
  );
};

export { LoginContext, LoginProvider };