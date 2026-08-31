import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initMockDb } from './lib/mockApi';
import './index.css';

// Ensure mock database is initialized immediately on startup
initMockDb();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
