import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { ValidationProvider } from '../context/ValidationContext';

function DisclaimerBanner() {
  return (
    <div style={{
      backgroundColor: '#FFFBEB',
      borderBottom: '1px solid #FDE68A',
      padding: '7px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
      <p style={{ fontSize: '10.5px', color: '#78350F', lineHeight: '1.5', margin: 0 }}>
        <strong>Uso académico y de investigación.</strong>{' '}
        Los desarrolladores no se responsabilizan por el uso indebido, interpretación o aplicación de la información publicada.
        Cualquier decisión basada en los datos proporcionados es responsabilidad exclusiva del usuario.
      </p>
    </div>
  );
}

export function Layout() {
  return (
    <ValidationProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F5F3' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DisclaimerBanner />
          <Outlet />
        </div>
      </div>
    </ValidationProvider>
  );
}