import React from 'react'
import { useState, useEffect } from 'react'
import Welcompage from './Welcompage'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import Seller from './Seller/Seller'
import User from './User/User'

const App = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleCustomerSelect = () => navigate('/User');
  const handleSellerSelect = () => navigate('/Seller');


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            <Welcompage
              onCustomerSelect={handleCustomerSelect}
              onSellerSelect={handleSellerSelect}
            />
          }
        />
        {/* Redirect /home to /User */}
        <Route path="/home" element={<Navigate to="/User" replace />} />
        <Route
          path="/User/*"
          element={
            <User
              currentUser={currentUser}
              onLogout={handleLogout}
              onLogin={handleLogin}
            />
          }
        />
        <Route
          path="/Seller/*"
          element={
            <Seller
              currentUser={currentUser}
              onLogout={handleLogout}
              onLogin={handleLogin}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default App