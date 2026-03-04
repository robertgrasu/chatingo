import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: 0.2, y: 0.3, r: 0.35, color: [99, 102, 241], speed: 0.0004, phase: 0 },
      { x: 0.7, y: 0.6, r: 0.3, color: [139, 92, 246], speed: 0.0003, phase: 2 },
      { x: 0.5, y: 0.8, r: 0.25, color: [59, 130, 246], speed: 0.0005, phase: 4 },
    ];

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((b) => {
        const cx = (b.x + Math.sin(t * b.speed + b.phase) * 0.08) * canvas.width;
        const cy = (b.y + Math.cos(t * b.speed * 0.7 + b.phase) * 0.06) * canvas.height;
        const r = b.r * Math.min(canvas.width, canvas.height);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, `rgba(${b.color.join(',')}, 0.12)`);
        grad.addColorStop(1, `rgba(${b.color.join(',')}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    if (username.length < 1 || password.length < 1) {
      setError('Completeaza toate campurile');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLocked(true);
        setTimeout(() => { setLocked(false); setAttempts(0); }, 30000);
        setError('Prea multe incercari. Asteapta 30 secunde.');
      } else {
        setError(err.response?.data?.detail || 'Username sau parola incorecta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060918]">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <AuroraBackground />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-white/90 font-semibold text-lg">ChatAdmin</span>
          </div>

          {/* Center text */}
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Conversatii<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                inteligente.
              </span>
            </h1>
            <p className="text-white/40 text-lg mt-6 leading-relaxed">
              Gestioneaza, monitorizeaza si optimizeaza chatbot-ul tau
              dintr-un singur loc.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-10">
            <div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-white/30 text-sm mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">&lt;200ms</div>
              <div className="text-white/30 text-sm mt-1">Response time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-white/30 text-sm mt-1">Active</div>
            </div>
          </div>
        </div>

        {/* Edge gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#060918] to-transparent z-20" />
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle bg glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/[0.04] rounded-full blur-[100px] pointer-events-none" />

        <div
          className={`w-full max-w-[400px] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg">ChatAdmin</span>
          </div>

          <div className="mb-10">
            <h2 className="text-[28px] font-bold text-white">Bine ai revenit</h2>
            <p className="text-white/35 mt-2">Introdu credentialele pentru a continua</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] text-white rounded-xl pl-12 pr-4 placeholder:text-white/20 focus:border-indigo-500/40 focus:bg-white/[0.06] outline-none transition-all duration-200"
                  placeholder="admin"
                  autoComplete="username"
                  maxLength={50}
                  disabled={locked}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-white/50 mb-2 uppercase tracking-wider">Parola</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[52px] bg-white/[0.04] border border-white/[0.08] text-white rounded-xl pl-12 pr-12 placeholder:text-white/20 focus:border-indigo-500/40 focus:bg-white/[0.06] outline-none transition-all duration-200"
                  placeholder="Introdu parola"
                  autoComplete="current-password"
                  maxLength={128}
                  disabled={locked}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 text-[13px] text-red-400 bg-red-500/[0.08] border border-red-500/10 px-4 py-3 rounded-xl animate-[fadeIn_0.2s_ease]">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || locked}
              className="w-full h-[52px] mt-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-xl transition-all duration-200 relative overflow-hidden active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin h-[18px] w-[18px]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Autentificare...
                </div>
              ) : locked ? (
                'Blocat (30s)'
              ) : (
                'Continua'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-white/15 text-[13px] text-center mt-10">
            &copy; {new Date().getFullYear()} ChatAdmin
          </p>
        </div>
      </div>
    </div>
  );
}
