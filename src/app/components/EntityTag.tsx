import React from 'react';

export type EntityType = 'protein' | 'plant' | 'compound' | 'disease' | 'all';

interface EntityTagProps {
  type: EntityType;
  label: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const entityStyles = {
  protein: {
    fill: '#EEEDFE',
    text: '#3C3489',
    dot: '#7F77DD',
  },
  plant: {
    fill: '#E1F5EE',
    text: '#085041',
    dot: '#1D9E75',
  },
  compound: {
    fill: '#FAEEDA',
    text: '#633806',
    dot: '#BA7517',
  },
  disease: {
    fill: '#FAECE7',
    text: '#993C1D',
    dot: '#D85A30',
  },
  all: {
    fill: '#185FA5',
    text: '#FFFFFF',
    dot: '#185FA5',
  },
};

export function EntityTag({ type, label, size = 'md', showDot = true }: EntityTagProps) {
  const styles = entityStyles[type];
  const fontSize = size === 'sm' ? '10px' : '12px';
  
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5"
      style={{
        backgroundColor: styles.fill,
        color: styles.text,
        fontSize,
        fontWeight: 500,
        borderRadius: '99px',
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: styles.dot }}
        />
      )}
      {label}
    </span>
  );
}
