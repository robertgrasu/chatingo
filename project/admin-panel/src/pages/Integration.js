import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';
import { getWidgetConfig, updateWidgetConfig } from '../api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function isValidDomain(d) {
  const t = d.trim().toLowerCase();
  if (!t || /[:/\s]/.test(t)) return false;
  const c = t.startsWith('*.') ? t.slice(2) : t;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(c)
    || c === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(c);
}

export default function Integration() {
  const { addToast } = useToast();
  const { selectedBotId } = useBot();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('snippet');

  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [savingDomains, setSavingDomains] = useState(false);
  const [domainsDirty, setDomainsDirty] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!selectedBotId) return;
    setLoadingDomains(true);
    try {
      const res = await getWidgetConfig(selectedBotId);
      setDomains(res.data.allowed_domains || []);
      setDomainsDirty(false);
    } catch { setDomains([]); }
    finally { setLoadingDomains(false); }
  }, [selectedBotId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (!d) return;
    if (!isValidDomain(d)) { addToast('Format invalid. Ex: example.com sau *.example.com', 'error'); return; }
    if (domains.includes(d)) { addToast('Domeniul exista deja.', 'error'); return; }
    setDomains((p) => [...p, d]);
    setNewDomain('');
    setDomainsDirty(true);
  };

  const removeDomain = (i) => { setDomains((p) => p.filter((_, idx) => idx !== i)); setDomainsDirty(true); };

  const saveDomains = async () => {
    setSavingDomains(true);
    try {
      await updateWidgetConfig({ allowed_domains: domains }, selectedBotId);
      addToast('Domeniile au fost salvate!', 'success');
      setDomainsDirty(false);
    } catch { addToast('Eroare la salvare.', 'error'); }
    finally { setSavingDomains(false); }
  };

  const embedCode = `<script>\n(function(w,d,s,o){w[o]=w[o]||{q:[],on:function(e,c){this.q.push([e,c])},boot:function(c){this.c=c}};w[o].boot({id:'${selectedBotId}',server:'${API_URL}'});var j=d.createElement(s);j.async=1;j.src='${API_URL}/static/widget.js';j.charset='UTF-8';d.head.appendChild(j)})(window,document,'script','AiChat');\n</script>`;

  const displayCode = [
    { text: '<script>', color: 'text-gray-500' },
    { text: '(function(w,d,s,o){', color: 'text-purple-400' },
    { text: '  w[o]=w[o]||{q:[],on:function(e,c){', color: 'text-blue-400' },
    { text: '    this.q.push([e,c])', color: 'text-blue-300' },
    { text: '  },boot:function(c){this.c=c}};', color: 'text-blue-400' },
    { text: '  w[o].boot({', color: 'text-yellow-400' },
    { text: `    id: '${selectedBotId}',`, color: 'text-emerald-400' },
    { text: `    server: '${API_URL}'`, color: 'text-emerald-400' },
    { text: '  });', color: 'text-yellow-400' },
    { text: '  var j=d.createElement(s);', color: 'text-gray-400' },
    { text: '  j.async=1;', color: 'text-gray-400' },
    { text: `  j.src='${API_URL}/static/widget.js';`, color: 'text-orange-400' },
    { text: "  j.charset='UTF-8';", color: 'text-gray-400' },
    { text: '  d.head.appendChild(j)', color: 'text-gray-400' },
    { text: "})(window,document,'script','AiChat');", color: 'text-purple-400' },
    { text: '</script>', color: 'text-gray-500' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      addToast('Cod copiat in clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Integration"
        subtitle="Instaleaza widget-ul pe site-ul tau"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Embed Code */}
          <div className="bg-white dark:bg-dark-light rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Embed Code</h3>
                <p className="text-xs text-gray-400 mt-0.5">Adauga inainte de <code className="text-[11px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">&lt;/body&gt;</code> in HTML-ul site-ului.</p>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={copied ? 'M5 13l4 4L19 7' : 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'} />
                </svg>
                {copied ? 'Copiat!' : 'Copiaza codul'}
              </button>
            </div>

            <div className="p-4">
              {/* Tab switcher */}
              <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-dark rounded-lg mb-3 w-fit">
                {[
                  { id: 'snippet', label: 'Snippet' },
                  { id: 'minified', label: 'Minificat' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-dark-light text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div className="bg-[#0d1117] rounded-xl overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                  <span className="ml-3 text-[11px] text-gray-500 font-mono">index.html</span>
                </div>

                <div className="p-4 overflow-x-auto">
                  {activeTab === 'snippet' ? (
                    <pre className="text-[13px] font-mono leading-[1.7]">
                      <code>
                        {displayCode.map((line, i) => (
                          <div key={i} className="flex hover:bg-white/[0.03] -mx-4 px-4">
                            <span className="text-[#484f58] select-none w-7 text-right mr-5 flex-shrink-0 text-xs leading-[1.85]">{i + 1}</span>
                            <span className={line.color}>{line.text}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  ) : (
                    <pre className="text-[12px] font-mono leading-relaxed text-gray-300 whitespace-pre-wrap break-all select-all">
                      {embedCode}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Domain Licensing */}
          <div className="bg-white dark:bg-dark-light rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Domenii Autorizate</h3>
                <p className="text-xs text-gray-400 mt-0.5">Widget-ul va functiona doar pe domeniile configurate mai jos.</p>
              </div>
              {domainsDirty && (
                <button
                  onClick={saveDomains}
                  disabled={savingDomains}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingDomains && (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Salveaza modificarile
                </button>
              )}
            </div>

            <div className="p-5">
              {/* Warning: no domains */}
              {!loadingDomains && domains.length === 0 && (
                <div className="mb-4 flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Niciun domeniu configurat</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/60 mt-0.5">Widget-ul nu va aparea pe niciun site pana nu adaugi cel putin un domeniu.</p>
                  </div>
                </div>
              )}

              {/* Add domain input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                  placeholder="example.com sau *.example.com"
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  onClick={addDomain}
                  className="px-4 py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  Adauga
                </button>
              </div>

              {/* Domain list */}
              {loadingDomains ? (
                <div className="mt-4 space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-11 bg-gray-100 dark:bg-gray-700/30 rounded-lg animate-pulse" />)}
                </div>
              ) : domains.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {domains.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-gray-50 dark:bg-dark/50 border border-gray-100 dark:border-gray-700/40 group transition-colors hover:border-gray-200 dark:hover:border-gray-600">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold flex-shrink-0 ${
                          d.startsWith('*.')
                            ? 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                            : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {d.startsWith('*.') ? '*' : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          )}
                        </span>
                        <span className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate">{d}</span>
                      </div>
                      <button
                        onClick={() => removeDomain(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 dark:text-gray-600 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Accepted formats - inline hint */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/40">
                <p className="text-[11px] text-gray-400 mb-2.5 font-medium uppercase tracking-wider">Formate acceptate</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    { pattern: 'example.com', desc: 'Domeniu exact' },
                    { pattern: '*.example.com', desc: 'Toate subdomeniile' },
                    { pattern: 'localhost', desc: 'Testare locala' },
                    { pattern: '192.168.1.100', desc: 'Adresa IP' },
                  ].map((ex, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{ex.pattern}</code>
                      <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                      <span className="text-[11px] text-gray-400">{ex.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-6">

          {/* Installation Steps */}
          <div className="bg-white dark:bg-dark-light rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Instalare</h3>
            </div>
            <div className="p-5 space-y-5">
              {[
                {
                  num: '1',
                  title: 'Adauga domeniile',
                  desc: 'Configureaza site-urile pe care widget-ul are voie sa ruleze.',
                  done: !loadingDomains && domains.length > 0,
                },
                {
                  num: '2',
                  title: 'Copiaza codul',
                  desc: 'Lipeste snippet-ul inainte de </body> in paginile site-ului.',
                },
                {
                  num: '3',
                  title: 'Testeaza',
                  desc: 'Deschide site-ul si verifica ca bubble-ul apare in colt.',
                },
              ].map((step) => (
                <div key={step.num} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    step.done
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.done ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white dark:bg-dark-light rounded-xl border border-gray-200 dark:border-gray-700/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Configurare</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/40">
              {[
                { label: 'Bot ID', value: selectedBotId },
                { label: 'Server', value: API_URL },
                { label: 'API', value: 'window.AiChat' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
