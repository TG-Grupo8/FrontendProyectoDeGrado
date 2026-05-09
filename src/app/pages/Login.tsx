import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Leaf } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'demo@phytominer.co' && password === 'demo1234') {
      navigate('/app');
    } else {
      setError('Correo o contraseña incorrectos');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D0D0CC',
    borderRadius: '8px',
    fontSize: '13px', color: '#1A1A1A',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: '#444441',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    display: 'block', marginBottom: '6px',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ backgroundColor: '#0B3D2E' }}
      >
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.15)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', backgroundColor: 'rgba(24,95,165,0.2)' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '60px', width: '160px', height: '160px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.1)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1D9E75' }}>
            <Leaf size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>PhytoMiner</span>
        </div>

        {/* Ilustración SVG planta */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-12">
          <svg viewBox="0 0 280 320" width="280" height="320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M140 300 Q138 220 142 140 Q144 80 140 40" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M140 180 Q90 140 60 100 Q100 90 140 140" fill="rgba(29,158,117,0.35)" stroke="#1D9E75" strokeWidth="1.5"/>
            <path d="M140 150 Q195 110 225 70 Q185 65 140 120" fill="rgba(29,158,117,0.25)" stroke="#1D9E75" strokeWidth="1.5"/>
            <path d="M140 230 Q100 200 75 175 Q110 168 140 205" fill="rgba(29,158,117,0.3)" stroke="#1D9E75" strokeWidth="1.5"/>
            <path d="M140 210 Q185 180 205 155 Q170 150 140 190" fill="rgba(29,158,117,0.2)" stroke="#1D9E75" strokeWidth="1.5"/>
            <circle cx="140" cy="40" r="8" fill="rgba(24,95,165,0.7)" stroke="#185FA5" strokeWidth="1.5"/>
            <circle cx="140" cy="40" r="4" fill="#185FA5"/>
            <circle cx="62" cy="99" r="5" fill="rgba(29,158,117,0.6)" stroke="#1D9E75" strokeWidth="1"/>
            <circle cx="224" cy="70" r="5" fill="rgba(29,158,117,0.6)" stroke="#1D9E75" strokeWidth="1"/>
            <path d="M140 300 Q120 305 100 295 Q115 288 140 295" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" fill="rgba(29,158,117,0.15)"/>
            <path d="M140 300 Q160 308 180 298 Q165 290 140 295" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" fill="rgba(29,158,117,0.15)"/>
            <circle cx="50" cy="240" r="3" fill="rgba(255,255,255,0.2)"/>
            <circle cx="220" cy="260" r="2" fill="rgba(255,255,255,0.15)"/>
            <circle cx="30" cy="150" r="2" fill="rgba(29,158,117,0.4)"/>
            <circle cx="250" cy="180" r="3" fill="rgba(24,95,165,0.4)"/>
          </svg>
        </div>

        {/* Copy + stats */}
        <div className="relative z-10">
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.4', marginBottom: '12px' }}>
            Extrae conocimiento de la biodiversidad colombiana
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
            Análisis NLP biomédico para plantas medicinales · Modelos entrenados en literatura científica
          </p>
          <div className="flex gap-4 mt-6">
            {[['2.4K+', 'artículos'], ['180+', 'plantas'], ['12K+', 'entidades']].map(([val, lbl]) => (
              <div key={lbl} className="flex flex-col" style={{ borderLeft: '2px solid rgba(29,158,117,0.5)', paddingLeft: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#1D9E75' }}>{val}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F7F5] p-8">
        <div className="w-full max-w-[380px]">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B3D2E' }}>
              <Leaf size={14} color="#1D9E75" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>PhytoMiner</span>
          </div>

          <div className="mb-8">
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
              Bienvenido de nuevo
            </h2>
            <p style={{ fontSize: '13px', color: '#888780' }}>
              Inicia sesión para continuar tu investigación
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="correo@ejemplo.com"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D0D0CC'}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                <label style={labelStyle}>Contraseña</label>
                <button
                  type="button"
                  style={{ fontSize: '11px', color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  style={{ ...inputStyle, paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = '#185FA5'}
                  onBlur={e => e.target.style.borderColor = '#D0D0CC'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888780' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p style={{
                fontSize: '12px',
                color: '#D85A30',
                backgroundColor: '#FAECE7',
                padding: '8px 12px',
                borderRadius: '6px',
                margin: '0',
              }}>
                ⚠ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              style={{
                width: '100%', padding: '11px',
                backgroundColor: '#185FA5', color: '#FFFFFF',
                border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', marginTop: '4px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Iniciar sesión
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E5E3' }} />
              <span style={{ fontSize: '11px', color: '#BBBBBB' }}>o</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E5E3' }} />
            </div>

            {/* Google */}
            <button
              type="button"
              style={{
                width: '100%', padding: '10px',
                backgroundColor: '#FFFFFF', border: '1px solid #D0D0CC',
                borderRadius: '8px', fontSize: '13px', color: '#444441',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.6 29.6 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.3C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.2C9.5 37.7 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.3C40.8 36.2 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          {/* Hint de credenciales demo */}
          <div style={{
            marginTop: '16px', padding: '10px 12px',
            backgroundColor: '#F0FBF7', border: '1px solid #A8E6CF',
            borderRadius: '8px',
          }}>
            <p style={{ fontSize: '11px', color: '#085041', margin: 0, lineHeight: '1.6' }}>
              <strong>Demo:</strong> demo@phytominer.co · demo1234
            </p>
          </div>

          <p style={{ marginTop: '16px', fontSize: '12px', color: '#888780', textAlign: 'center' }}>
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              style={{ color: '#185FA5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}