import React from 'react';
import { EntityType } from './EntityTag';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  type?: EntityType;
}

const chipStyles = {
  protein: { bg: '#EEEDFE', text: '#3C3489' },
  plant: { bg: '#E1F5EE', text: '#085041' },
  compound: { bg: '#FAEEDA', text: '#633806' },
  disease: { bg: '#FAECE7', text: '#993C1D' },
  all: { bg: '#185FA5', text: '#FFFFFF' },
};

export function FilterChip({ label, active, onClick, type = 'all' }: FilterChipProps) {
  const activeStyle = chipStyles[type];
  const inactiveStyle = { bg: '#F5F5F3', text: '#888780' };
  
  const style = active ? activeStyle : inactiveStyle;
  
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 transition-all hover:opacity-80"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontSize: '12px',
        fontWeight: active ? 500 : 400,
        borderRadius: '99px',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
