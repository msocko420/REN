import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Account from './pages/account';
import LoginSignup from './pages/login';
import { UserProvider } from './components'; // Adjust the path to import UserProvider
import Render3D from './pages/render3d';

function App() {
  return (
    <UserProvider>
      <main className="app transition-all ease-in">
        <Routes>
          <Route path="/pages/account" element={<Account />} />
          <Route path="/" element={<LoginSignup />} exact />
          <Route path="/pages/Home" element={<Home />} />
          <Route path="/render3d" element={<Render3D />} />
        </Routes>        
      </main>
    </UserProvider>
  );
}

export default App;

