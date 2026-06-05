import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1117',
            color: '#e6edf3',
            border: '1px solid #30363d',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#00d084', secondary: '#0d1117' } },
          error: { iconTheme: { primary: '#ff4444', secondary: '#0d1117' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
