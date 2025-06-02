// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'; // <-- Dies ist entscheidend!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* <--- HIER MUSS DER AUTHPROVIDER SEIN! */}
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* <--- Und hier geschlossen werden. */}
    </BrowserRouter>
  </React.StrictMode>,
);