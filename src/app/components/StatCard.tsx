import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div
      className="px-3 py-2.5"
      style={{
        backgroundColor: '#F5F5F3',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#1A1A1A',
          marginBottom: '2px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '10px',
          color: '#888780',
        }}
      >
        {label}
      </div>
    </div>
  );
}
