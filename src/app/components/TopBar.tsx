import React from 'react';
import { Download, Play } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle: string;
  showExport?: boolean;
  showProcess?: boolean;
  exportButtons?: React.ReactNode;
  onProcess?: () => void; // ← añadido
}

export function TopBar({ 
  title, 
  subtitle, 
  showExport = false, 
  showProcess = false,
  exportButtons,
  onProcess, // ← añadido
}: TopBarProps) {
  return (
    <div
      className="h-14 flex items-center justify-between px-6"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E3',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '2px',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: '11px',
            color: '#888780',
          }}
        >
          {subtitle}
        </p>
      </div>
      {(showExport || showProcess || exportButtons) && (
        <div className="flex items-center gap-2">
          {exportButtons || (
            <>
              {showExport && (
                <button
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: '#D0D0CC',
                    backgroundColor: '#FFFFFF',
                    color: '#444441',
                    fontSize: '12px',
                    borderRadius: '6px',
                  }}
                >
                  Exportar <Download size={12} />
                </button>
              )}
              {showProcess && (
                <button
                  onClick={onProcess} // ← conectado
                  className="flex items-center gap-1.5 px-4 py-1.5 transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: '#185FA5',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Procesar <Play size={12} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}