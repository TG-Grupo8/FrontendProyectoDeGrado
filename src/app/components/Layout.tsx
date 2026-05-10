import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { ValidationProvider } from '../context/ValidationContext';

export function Layout() {
  return (
    <ValidationProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F5F3' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ValidationProvider>
  );
}