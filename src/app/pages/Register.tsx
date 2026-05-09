import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, Leaf, Check } from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [agreed, setAgreed] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // lógica de registro
    navigate('/upload');
  };

  const passwordStrength =
    form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3;

  const strengthLabel = ['', 'Débil', 'Aceptable', 'Segura'];
  const strengthColor = ['', '#D85A30', '#BA7517', '#1D9E75'];

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
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.12)' }} />
        <div style={{ position: 'absolute', bottom: '60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', backgroundColor: 'rgba(24,95,165,0.18)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1D9E75' }}>
            <Leaf size={16} color="#fff" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>PhytoMiner</span>
        </div>

        {/* Ilustración grafo */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-12">
          <svg viewBox="0 0 280 280" width="280" height="280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="140" cy="140" r="28" fill="rgba(29,158,117,0.2)" stroke="#1D9E75" strokeWidth="2"/>
            <circle cx="140" cy="140" r="14" fill="rgba(29,158,117,0.5)"/>
            <circle cx="140" cy="140" r="6"  fill="#1D9E75"/>
            {[
              { cx: 60,  cy: 80,  r: 16, color: '#185FA5' },
              { cx: 220, cy: 80,  r: 12, color: '#185FA5' },
              { cx: 50,  cy: 190, r: 10, color: '#1D9E75' },
              { cx: 230, cy: 180, r: 14, color: '#1D9E75' },
              { cx: 140, cy: 40,  r: 10, color: '#185FA5' },
              { cx: 140, cy: 240, r: 12, color: '#1D9E75' },
            ].map(({ cx, cy, r, color }, i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 8} fill={`${color}18`} />
                <circle cx={cx} cy={cy} r={r} fill={`${color}40`} stroke={color} strokeWidth="1.5"/>
                <circle cx={cx} cy={cy} r={r / 2.5} fill={color}/>
                <line x1="140" y1="140" x2={cx} y2={cy} stroke={`${color}40`} strokeWidth="1" strokeDasharray="4 3"/>
              </g>
            ))}
            <rect x="28" y="62" width="64" height="20" rx="4" fill="rgba(24,95,165,0.2)" stroke="rgba(24,95,165,0.4)" strokeWidth="1"/>
            <text x="60" y="76" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">NF-κB</text>
            <rect x="186" y="60" width="70" height="20" rx="4" fill="rgba(29,158,117,0.2)" stroke="rgba(29,158,117,0.4)" strokeWidth="1"/>
            <text x="221" y="74" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">Curcumina</text>
            <rect x="195" y="162" width="62" height="20" rx="4" fill="rgba(29,158,117,0.2)" stroke="rgba(29,158,117,0.4)" strokeWidth="1"/>
            <text x="226" y="176" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">COX-2</text>
          </svg>
        </div>

        {/* Copy */}
        <div className="relative z-10">
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', lineHeight: '1.4', marginBottom: '12px' }}>
            Únete a la red de investigación fitoquímica
          </p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
            Accede a herramientas de análisis NLP, grafos de conocimiento y exportación de datos.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            {[
              'Crea tu cuenta en segundos',
              'Sube artículos científicos en PDF',
              'Extrae y visualiza entidades biomédicas',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1D9E75' }}>
                  <Check size={11} color="#fff" />
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F7F5] p-8 overflow-y-auto">
        <div className="w-full max-w-[380px] py-8">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0B3D2E' }}>
              <Leaf size={14} color="#1D9E75" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>PhytoMiner</span>
          </div>

          <div className="mb-7">
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
              Crear cuenta
            </h2>
            <p style={{ fontSize: '13px', color: '#888780' }}>
              Acceso para investigadores y estudiantes
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre */}
            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input
                type="text" value={form.name} onChange={set('name')}
                placeholder="Ej. María García López"
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D0D0CC'}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="correo@ejemplo.com"
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#185FA5'}
                onBlur={e => e.target.style.borderColor = '#D0D0CC'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Mínimo 8 caracteres"
                  required style={{ ...inputStyle, paddingRight: '40px' }}
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

              {/* Barra de fortaleza */}
              {form.password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        backgroundColor: i <= passwordStrength ? strengthColor[passwordStrength] : '#E5E5E3',
                        transition: 'background-color 0.2s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '10px', color: strengthColor[passwordStrength], marginTop: '4px' }}>
                    Contraseña {strengthLabel[passwordStrength]}
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 mt-1">
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                  border: `1.5px solid ${agreed ? '#185FA5' : '#D0D0CC'}`,
                  backgroundColor: agreed ? '#185FA5' : '#FFFFFF',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {agreed && <Check size={10} color="#fff" />}
              </div>
              <p style={{ fontSize: '11px', color: '#888780', lineHeight: '1.5' }}>
                Acepto los{' '}
                <span style={{ color: '#185FA5', cursor: 'pointer' }}>Términos de uso</span>{' '}
                y la{' '}
                <span style={{ color: '#185FA5', cursor: 'pointer' }}>Política de privacidad</span>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!agreed}
              style={{
                width: '100%', padding: '11px',
                backgroundColor: agreed ? '#185FA5' : '#D0D0CC',
                color: '#FFFFFF', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600,
                cursor: agreed ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                marginTop: '4px',
              }}
            >
              Crear cuenta
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '12px', color: '#888780', textAlign: 'center' }}>
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#185FA5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}