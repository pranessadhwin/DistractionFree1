import React from 'react';
import ReactDOM from 'react-dom/client';
import { DashboardApp } from './DashboardApp';
import './styles/dashboard.css';

const root = ReactDOM.createRoot(document.getElementById('dashboard-root') as HTMLElement);
root.render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);
