import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Pagina de autentificare a adminilor
export default function Login() {
  // Contextul de autentificare si navigarea dupa login
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Linkul cu ?demo=1 completeaza automat contul demo
  const isDemo = searchParams.get('demo') === '1';
  // Valorile din formular si starea lui: parola vizibila, eroare, incarcare, incercari esuate si blocare
  const [username, setUsername] = useState(isDemo ? 'demo' : '');
  const [password, setPassword] = useState(isDemo ? 'demo' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animatia de intrare porneste dupa o scurta pauza
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Trimite datele de autentificare; dupa 3 incercari esuate formularul se blocheaza 30 de secunde
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    if (!username || !password) {
      setError('Completează toate câmpurile');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const n = attempts + 1;
      setAttempts(n);
      if (n >= 3) {
        setLocked(true);
        setTimeout(() => { setLocked(false); setAttempts(0); }, 30000);
        setError('Prea multe încercări. Așteaptă 30 secunde.');
      } else {
        setError(err.response?.data?.detail || 'Username sau parolă incorectă');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Panoul din stanga */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(150deg, #162440 0%, #1a3060 55%, #132038 100%)' }}>
        {/* Forme decorative de fundal */}
        <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.35) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Cercuri decorative */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center flex-shrink-0"
            style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
            <svg width="29" height="29" viewBox="0 0 40 40" fill="none">
              <path d="M8 12C8 9 10 7 13 7H23C26 7 28 9 28 12V15C28 18 26 20 23 20H15L11 24V20H10C8 20 8 18 8 18V12Z"
                stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M14 20V22C14 25 16 27 19 27H27L31 31V27H30C32 27 34 25 34 22V18C34 15 32 13 29 13H28"
                stroke="white" strokeWidth="2.5" strokeOpacity="0.45" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.6px', color: 'white' }}>Chatingo</span>
        </div>

        {/* Textul din centru */}
        <div className="relative z-10 max-w-[400px]">
          <h2 className="text-[34px] font-bold leading-snug mb-5"
            style={{ letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #60a5fa 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Platforma ta de administrare a chatboților
          </h2>
          <p className="text-white/55 text-[16px] leading-relaxed">
            Gestionează conversații, analizează date și configurează botul tău dintr-un singur loc.
          </p>
        </div>

        <p className="relative z-10 text-white/30 text-xs">&copy; 2026 RGSoft.ro - Toate drepturile rezervate</p>
      </div>

      {/* Panoul din dreapta */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <div className={`w-full max-w-[380px] transition-all duration-600 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          {/* Logo-ul pentru ecranele mici */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center flex-shrink-0"
              style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#2563eb', boxShadow: '4px 4px 0 #1e40af' }}>
              <svg width="29" height="29" viewBox="0 0 40 40" fill="none">
                <path d="M8 12C8 9 10 7 13 7H23C26 7 28 9 28 12V15C28 18 26 20 23 20H15L11 24V20H10C8 20 8 18 8 18V12Z"
                  stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M14 20V22C14 25 16 27 19 27H27L31 31V27H30C32 27 34 25 34 22V18C34 15 32 13 29 13H28"
                  stroke="white" strokeWidth="2.5" strokeOpacity="0.45" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.6px', color: '#0a0a0a' }}>Chatingo</span>
          </div>

          <h2 className="text-3xl font-bold text-[#0E1726] mb-1 text-center">Autentificare</h2>
          <p className="text-slate-400 text-sm mb-9 text-center">Introdu datele contului tău</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg h-11 px-4 text-[#0E1726] text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all shadow-sm"
                placeholder="admin" autoComplete="username" maxLength={50} disabled={locked} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Parola</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg h-11 px-4 pr-10 text-[#0E1726] text-sm focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a] outline-none transition-all shadow-sm"
                  placeholder="••••••••" autoComplete="current-password" maxLength={128} disabled={locked} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                  {/* Iconita se schimba dupa cum parola este vizibila sau ascunsa */}
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mesajul de eroare apare doar cand exista o eroare */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 px-3.5 py-2.5 rounded-lg">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || locked}
              className="w-full h-11 bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white font-semibold text-sm rounded-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50 mt-1">
              {/* In timpul autentificarii butonul arata un indicator de incarcare */}
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Autentificare...
                </span>
              ) : locked ? 'Blocat (30s)' : (
                <span className="flex items-center justify-center gap-2">
                  Autentificare
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
