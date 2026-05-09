import React from 'react';

interface ProgressBarProps {
  label: string;
  percentage: number;
  color: string;
}

export function ProgressBar({ label, percentage, color }: ProgressBarProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: '10px', color: '#444441' }}>{label}</span>
        <span style={{ fontSize: '10px', color: '#888780' }}>{percentage}%</span>
      </div>
      <div
        className="w-full h-1 rounded-full"
        style={{ backgroundColor: '#EBEBEB' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
