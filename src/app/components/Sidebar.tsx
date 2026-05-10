import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItemProps {
  to: string;
  dotColor: string;
  label: string;
}

function NavItem({ to, dotColor, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === '/app'}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 transition-colors ${
          isActive ? 'bg-white border-l-2 font-medium' : 'hover:bg-white'
        }`
      }
      style={({ isActive }) => ({
        borderLeftColor: isActive ? '#185FA5' : 'transparent',
        color: isActive ? '#185FA5' : '#444441',
      })}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      <span style={{ fontSize: '13px' }}>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'PM';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div
      className="w-[200px] h-screen flex flex-col shadow-sm"
      style={{
        backgroundColor: '#F5F5F3',
        borderRight: '1px solid #E5E5E3',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Leaf size={16} style={{ color: '#1D9E75' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>
            PhytoMiner
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#888780' }}>
          Plantas medicinales CO
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: '#E5E5E3' }} />

      {/* Sección Análisis */}
      <div className="pt-4 pb-2">
        <div
          className="px-3 mb-2"
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            color: '#888780',
            letterSpacing: '0.5px',
          }}
        >
          Análisis
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavItem to="/app"                 dotColor="#378ADD" label="Cargar artículo"       />
          <NavItem to="/app/nlp-results"     dotColor="#7F77DD" label="Resultados NLP"        />
          <NavItem to="/app/data-explorer"   dotColor="#1D9E75" label="Explorador de datos"   />
          <NavItem to="/app/knowledge-graph" dotColor="#BA7517" label="Grafo de conocimiento" />
        </nav>
      </div>

      <div style={{ height: '1px', backgroundColor: '#E5E5E3' }} />

      {/* Sección Cuenta */}
      <div className="pt-4 pb-2 mt-auto">
        <div
          className="px-3 mb-2"
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            color: '#888780',
            letterSpacing: '0.5px',
          }}
        >
          Cuenta
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavItem to="/app/historial" dotColor="#888780" label="Historial" />
        </nav>
      </div>

      {/* Usuario + cerrar sesión */}
      <div
        className="flex items-center gap-2 px-3 py-4"
        style={{ borderTop: '1px solid #E5E5E3' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: '#E6F1FB',
            color: '#185FA5',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          {initials}
        </div>
        <div style={{ fontSize: '12px', color: '#1A1A1A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name ?? 'Usuario'}
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#888780',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ↩
        </button>
      </div>
    </div>
  );
}