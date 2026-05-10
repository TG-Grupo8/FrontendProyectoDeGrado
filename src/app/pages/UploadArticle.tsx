import React, { useState, useRef, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import { useNavigate } from 'react-router';
import {
  FileText, CheckCircle, Loader2, UploadCloud,
  Clock, ArrowRight, Sparkles, AlertCircle,
} from 'lucide-react';
import { documentsApi, jobsApi, type JobResponse } from '../lib/api';
import { metricsApi } from '../lib/api';

type ProcessStatus = 'idle' | 'processing' | 'success' | 'error';

const MAX_SIZE_MB = 10;

export function UploadArticle() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile]   = useState<string | null>(null);
  const [fileObj, setFileObj]             = useState<File | null>(null);
  const [fileError, setFileError]         = useState<string | null>(null);
  const [dragging, setDragging]           = useState(false);
  const [processStatus, setProcessStatus] = useState<ProcessStatus>('idle');
  const [progress, setProgress]           = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [currentJobId, setCurrentJobId]   = useState<string | null>(null);
  const [recentJobs, setRecentJobs]       = useState<JobResponse[]>([]);
  const [stats, setStats]                 = useState({ docs: 0, entities: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    jobsApi.list(undefined, 4).then(r => setRecentJobs(r.items)).catch(() => {});
    metricsApi.get().then(m => setStats({
      docs: m.documents.total,
      entities: (m.jobs.by_status['APPROVED'] ?? 0),
    })).catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentJobId || processStatus !== 'processing') return;
    pollRef.current = setInterval(async () => {
      try {
        const job = await jobsApi.get(currentJobId);
        setProgress(job.progress);
        if (job.progress_step) setProgressLabel(job.progress_step);
        if (job.status === 'READY_FOR_REVIEW' || job.status === 'APPROVED') {
          clearInterval(pollRef.current!);
          setProgress(100);
          setProgressLabel('Completado');
          setProcessStatus('success');
        } else if (job.status === 'FAILED') {
          clearInterval(pollRef.current!);
          setProcessStatus('error');
        }
      } catch { /* network hiccup, keep polling */ }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [currentJobId, processStatus]);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf')
      return 'El archivo debe ser un PDF.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return `El archivo supera los ${MAX_SIZE_MB} MB permitidos.`;
    return null;
  };

  const processFile = (file: File) => {
    const error = validateFile(file);
    if (error) { setFileError(error); return; }
    setFileError(null);
    setUploadedFile(file.name);
    setFileObj(file);
    setProcessStatus('idle');
    setProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setFileObj(null);
    setFileError(null);
    setProcessStatus('idle');
    setProgress(0);
    setProgressLabel('');
    setCurrentJobId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcess = async () => {
    if (!fileObj || processStatus === 'processing') return;
    setProcessStatus('processing');
    setProgress(5);
    setProgressLabel('Subiendo archivo...');
    try {
      const { job_id } = await documentsApi.upload(fileObj);
      setCurrentJobId(job_id);
      setProgress(10);
      setProgressLabel('Artículo en cola de procesamiento...');
    } catch (err: unknown) {
      setProgressLabel(err instanceof Error ? err.message : 'Error al subir');
      setProcessStatus('error');
    }
  };

  return (
    <>
      <TopBar
        title="Cargar artículo"
        subtitle="Sube un PDF para analizar"
        showExport={false}
        showProcess={!!uploadedFile && processStatus === 'idle'}
        onProcess={handleProcess}
      />

      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: '#F4F4F2' }}>
        <div className="flex gap-5 max-w-[1440px] mx-auto">

          {/* ── Columna principal ── */}
          <div className="flex-1 flex flex-col gap-5">

            {/* Banner hero */}
            <div className="relative overflow-hidden p-6 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #0B3D2E 0%, #185FA5 100%)', borderRadius: '14px', minHeight: '110px' }}>
              <div style={{ position: 'absolute', top: '-30px', right: '120px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'absolute', bottom: '-40px', right: '60px', width: '180px', height: '180px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.15)' }} />
              <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={13} color="rgba(255,255,255,0.65)" />
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                    Análisis NLP biomédico
                  </span>
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                  ¿Listo para analizar un nuevo artículo?
                </h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  El pipeline extrae automáticamente título, autores y entidades biomédicas
                </p>
              </div>
              <div className="relative z-10" style={{ opacity: 0.4 }}>
                <svg viewBox="0 0 80 90" width="80" height="90" fill="none">
                  <path d="M40 85 Q39 60 41 38 Q42 20 40 8" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40 52 Q22 40 12 26 Q28 23 40 40" fill="rgba(29,158,117,0.5)" stroke="#1D9E75" strokeWidth="1.2"/>
                  <path d="M40 42 Q58 30 66 18 Q52 16 40 34" fill="rgba(29,158,117,0.35)" stroke="#1D9E75" strokeWidth="1.2"/>
                  <path d="M40 68 Q26 58 18 48 Q32 46 40 62" fill="rgba(29,158,117,0.4)" stroke="#1D9E75" strokeWidth="1.2"/>
                  <circle cx="40" cy="8" r="4" fill="#185FA5"/>
                </svg>
              </div>
            </div>

            {/* ── Zona de carga ── */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '24px' }}>
              <div className="flex items-center gap-2 mb-5">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1D9E75' }} />
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>Fuente del artículo</h3>
              </div>

              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />

              {/* Sin archivo */}
              {!uploadedFile && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${dragging ? '#185FA5' : fileError ? '#D85A30' : '#D0D0CC'}`,
                    borderRadius: '12px',
                    backgroundColor: dragging ? 'rgba(24,95,165,0.04)' : '#FAFAFA',
                    padding: '48px 24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: dragging ? 'rgba(24,95,165,0.1)' : '#F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <UploadCloud size={26} color={dragging ? '#185FA5' : '#AAAAAA'} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: dragging ? '#185FA5' : '#444441', marginBottom: '6px' }}>
                    {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu PDF aquí o haz clic para seleccionar'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#AAAAAA', marginBottom: '20px' }}>
                    Formatos: PDF · Tamaño máximo: {MAX_SIZE_MB} MB
                  </p>
                  <div style={{ padding: '8px 20px', backgroundColor: '#185FA5', color: '#FFFFFF', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
                    Seleccionar archivo
                  </div>
                </div>
              )}

              {/* Error validación */}
              {fileError && (
                <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#FDF2EF', border: '1px solid #F5C9BB', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={14} color="#D85A30" />
                  <p style={{ fontSize: '12px', color: '#D85A30' }}>{fileError}</p>
                </div>
              )}

              {/* Archivo cargado */}
              {uploadedFile && processStatus === 'idle' && (
                <div style={{ padding: '16px 20px', border: '1px solid #C8EDE1', borderRadius: '12px', backgroundColor: '#F0FBF7', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} color="#1D9E75" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '3px' }}>{uploadedFile}</p>
                    <p style={{ fontSize: '11px', color: '#1D9E75', fontWeight: 500 }}>✓ Archivo válido — listo para procesar</p>
                  </div>
                  <button onClick={handleReset} style={{ background: 'none', border: 'none', color: '#AAAAAA', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
              )}

              {/* Estado: procesando o completado */}
              {uploadedFile && processStatus !== 'idle' && (
                <div style={{
                  padding: '20px 24px',
                  border: `1px solid ${processStatus === 'success' ? '#C8EDE1' : processStatus === 'error' ? '#F5C9BB' : '#D8E8F8'}`,
                  borderRadius: '12px',
                  backgroundColor: processStatus === 'success' ? '#F0FBF7' : processStatus === 'error' ? '#FDF2EF' : '#F0F6FD',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, backgroundColor: processStatus === 'success' ? 'rgba(29,158,117,0.12)' : 'rgba(24,95,165,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {processStatus === 'processing'
                        ? <Loader2 size={22} color="#185FA5" style={{ animation: 'spin 1s linear infinite' }} />
                        : processStatus === 'success'
                        ? <CheckCircle size={22} color="#1D9E75" />
                        : <AlertCircle size={22} color="#D85A30" />
                      }
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>
                        {processStatus === 'processing' && progressLabel}
                        {processStatus === 'success'    && `¡Análisis de "${uploadedFile}" completado!`}
                        {processStatus === 'error'      && 'Error al procesar'}
                      </p>
                      <div style={{ width: '100%', height: '6px', borderRadius: '4px', backgroundColor: '#E5E5E3', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '4px',
                          width: `${processStatus === 'success' ? 100 : progress}%`,
                          backgroundColor: processStatus === 'success' ? '#1D9E75' : processStatus === 'error' ? '#D85A30' : '#185FA5',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      {processStatus === 'processing' && (
                        <p style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>{progress}% completado</p>
                      )}
                    </div>
                  </div>

                  {/* ── Botón Ver Resultados — más visible ── */}
                  {processStatus === 'success' && (
                    <button
                      onClick={() => navigate('/app/nlp-results')}
                      style={{
                        marginTop: '16px', width: '100%', padding: '13px',
                        background: 'linear-gradient(135deg, #0B3D2E, #185FA5)',
                        color: '#FFFFFF', border: 'none', borderRadius: '10px',
                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        boxShadow: '0 4px 12px rgba(24,95,165,0.3)',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <CheckCircle size={18} />
                      Ver resultados y validar entidades
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Artículos procesados',  value: String(stats.docs),     color: '#185FA5', bg: 'rgba(24,95,165,0.08)'   },
                { label: 'Jobs aprobados',         value: String(stats.entities), color: '#1D9E75', bg: 'rgba(29,158,117,0.08)'  },
                { label: 'Analizando con NLP',     value: '∞',                   color: '#7F77DD', bg: 'rgba(127,119,221,0.08)' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E5E3', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', marginBottom: '2px' }}>{value}</p>
                  <p style={{ fontSize: '11px', color: '#888780' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: historial ── */}
          <div className="w-[280px] flex flex-col gap-5">
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E5E3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex items-center gap-2">
                  <Clock size={13} color="#888780" />
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#1A1A1A' }}>Historial reciente</h3>
                </div>
                <span
                  onClick={() => navigate('/app/historial')}
                  style={{ fontSize: '10px', color: '#185FA5', cursor: 'pointer', fontWeight: 600 }}
                >
                  Ver todo
                </span>
              </div>
              {recentJobs.map((item, idx) => (
                <button key={idx} className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#F9F9F7] transition-colors"
                  style={{ borderBottom: idx < recentJobs.length - 1 ? '1px solid #F5F5F3' : 'none' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(29,158,117,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={14} color="#1D9E75" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A', marginBottom: '2px' }}>{item.document_id.slice(0, 8)}...</p>
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: '10px', color: '#888780' }}>{item.status}</span>
                      <span style={{ fontSize: '10px', color: '#D0D0CC' }}>·</span>
                      <span style={{ fontSize: '10px', color: '#888780' }}>{new Date(item.created_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <ArrowRight size={12} color="#D0D0CC" style={{ marginTop: '4px', flexShrink: 0 }} />
                </button>
              ))}
            </div>

            {/* Tips */}
            <div style={{ background: 'linear-gradient(135deg, #0B3D2E, #0d4f3c)', borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(29,158,117,0.2)' }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(24,95,165,0.2)' }} />
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
                💡 Consejo
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
                El pipeline extrae automáticamente título, autores, año y DOI del PDF. No necesitas ingresarlos manualmente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}