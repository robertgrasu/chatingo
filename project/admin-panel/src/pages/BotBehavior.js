import React, { useEffect, useState } from 'react';
import { getWidgetConfig, updateWidgetConfig, isDemoError } from '../api';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';

const DEFAULT_PROMPT = `Ești un asistent virtual prietenos și util. Răspunde la întrebări bazându-te pe contextul furnizat.
Dacă întrebarea e un salut sau conversație generală, răspunde natural și prietenos.
Dacă nu găsești informația în context, spune politicos că nu ai informații despre asta.
Formatează răspunsurile clar - folosește liste și paragrafe scurte pentru lizibilitate.
Răspunde în limba în care ți se pune întrebarea.

Context din knowledge base:
{context}`;

const STYLES = [
  { key: 'concise', label: 'Concis', desc: 'Scurt, 2-3 propozitii', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'balanced', label: 'Echilibrat', desc: 'Mix optim', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { key: 'detailed', label: 'Detaliat', desc: 'Cu explicatii', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const LANGUAGES = [
  { key: 'auto', label: 'Auto (detecteaza limba intrebarii)' },
  { key: 'ro', label: 'Romana' },
  { key: 'en', label: 'Engleza' },
  { key: 'fr', label: 'Franceza' },
  { key: 'de', label: 'Germana' },
  { key: 'es', label: 'Spaniola' },
  { key: 'it', label: 'Italiana' },
  { key: 'pt', label: 'Portugheza' },
  { key: 'nl', label: 'Olandeza' },
  { key: 'pl', label: 'Polona' },
  { key: 'hu', label: 'Maghiara' },
  { key: 'tr', label: 'Turca' },
  { key: 'ru', label: 'Rusa' },
  { key: 'uk', label: 'Ucraineana' },
  { key: 'ja', label: 'Japoneza' },
  { key: 'zh', label: 'Chineza' },
  { key: 'ko', label: 'Coreeana' },
  { key: 'ar', label: 'Araba' },
];

const TOKEN_PRESETS = [
  { label: 'Scurt', value: 150 },
  { label: 'Mediu', value: 500 },
  { label: 'Lung', value: 1500 },
  { label: 'Max', value: 4000 },
];

// Pagina cu comportamentul AI al botului: prompt, stil de raspuns, temperatura, limita de tokeni, numarul de documente folosite si limba
export default function BotBehavior() {
  // Botul selectat si mesajele temporare
  const { selectedBotId } = useBot();
  const { addToast } = useToast();
  // Starea paginii: incarcare si salvare
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Setarile editabile ale comportamentului AI
  const [systemPrompt, setSystemPrompt] = useState('');
  const [responseStyle, setResponseStyle] = useState('balanced');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [contextDocs, setContextDocs] = useState(3);
  const [language, setLanguage] = useState('auto');

  // La schimbarea botului se incarca setarile lui din configuratie
  useEffect(() => {
    setLoading(true);
    getWidgetConfig(selectedBotId)
      .then((res) => {
        const d = res.data;
        setSystemPrompt(d.system_prompt || DEFAULT_PROMPT);
        setResponseStyle(d.response_style || 'balanced');
        setTemperature(d.temperature ?? 0.7);
        setMaxTokens(d.max_tokens ?? 500);
        setContextDocs(d.context_docs_count ?? 3);
        setLanguage(d.language || 'auto');
      })
      .catch(() => addToast('Eroare la incarcarea configurarii.', 'error'))
      .finally(() => setLoading(false));
  }, [selectedBotId]);

  // Salveaza setarile de comportament ale botului selectat
  const save = async () => {
    setSaving(true);
    try {
      await updateWidgetConfig(
        {
          // Promptul implicit nu se salveaza, ca serverul sa foloseasca varianta lui
          system_prompt: systemPrompt === DEFAULT_PROMPT ? '' : systemPrompt,
          response_style: responseStyle,
          temperature,
          max_tokens: maxTokens,
          context_docs_count: contextDocs,
          language,
        },
        selectedBotId
      );
      addToast('Configurarea a fost salvata!', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast('Eroare la salvare.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Eticheta si culoarea afisate langa temperatura, dupa valoarea ei
  const tempLabel = temperature <= 0.3 ? 'Foarte precis' : temperature <= 0.6 ? 'Precis' : temperature <= 1.0 ? 'Echilibrat' : temperature <= 1.5 ? 'Creativ' : 'Foarte creativ';
  const tempBadge = temperature <= 0.5 ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : temperature <= 1.0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';

  // Cat timp se incarca setarile apar placeholder-e
  if (loading) {
    return (
      <div className="animate-page-enter">
        <div className="mb-4"><h1 className="text-xl font-bold text-gray-900 dark:text-white">Comportament Bot</h1></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-enter">
      {/* Antet */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Comportament Bot</h1>
          <p className="text-xs text-gray-400 mt-0.5">Personalizeaza cum raspunde botul</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {/* Indicator de incarcare pe butonul de salvare */}
          {saving && (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saving ? 'Se salveaza...' : 'Salveaza'}
        </button>
      </div>

      <div className="space-y-3">
        {/* ── Promptul de sistem ── */}
        <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Instructiuni Sistem</h3>
            <button
              onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
              className="text-[11px] text-gray-400 hover:text-primary transition-colors font-medium"
            >
              Reseteaza
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary/40 transition-colors resize-y font-mono leading-relaxed min-h-[220px]"
          />
          <p className="text-[10px] text-gray-400 mt-1.5">
            Foloseste <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-primary text-[10px]">{'{context}'}</code> unde vrei contextul din Knowledge Base.
          </p>
        </div>

        {/* ── Grila cu 2 coloane: stil si limba ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Stil */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5">Stil Raspunsuri</h3>
            <div className="flex gap-2">
              {/* Cate o optiune pentru fiecare stil de raspuns */}
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setResponseStyle(s.key)}
                  className={`flex-1 p-2.5 rounded-lg border-2 text-center transition-all ${
                    responseStyle === s.key
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <svg className={`w-4 h-4 mx-auto mb-1 ${responseStyle === s.key ? 'text-primary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                  <p className={`text-xs font-semibold ${responseStyle === s.key ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Limba */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2.5">Limba Raspunsurilor</h3>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-dark text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/40 transition-colors cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              {/* Cate o optiune pentru fiecare limba */}
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {language === 'auto' ? 'Botul va raspunde in limba in care primeste intrebarea.' : `Botul va raspunde intotdeauna in ${LANGUAGES.find(l => l.key === language)?.label || language}.`}
            </p>
          </div>
        </div>

        {/* ── Grila cu 3 coloane: temperatura, limita de tokeni si documente de context ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Temperatura */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Creativitate</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{temperature.toFixed(1)}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tempBadge}`}>{tempLabel}</span>
            </div>
            <input
              type="range" min="0" max="2" step="0.1" value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-gradient-to-r from-blue-200 via-emerald-200 to-amber-200 dark:from-blue-500/30 dark:via-emerald-500/30 dark:to-amber-500/30"
            />
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[9px] text-gray-400">Precis</span>
              <span className="text-[9px] text-gray-400">Creativ</span>
            </div>
          </div>

          {/* Limita de tokeni */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Limita Raspuns</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{maxTokens}</span>
              <span className="text-[10px] text-gray-400">tokeni</span>
            </div>
            <div className="flex gap-1 mb-2">
              {/* Valori predefinite pentru limita de tokeni */}
              {TOKEN_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setMaxTokens(p.value)}
                  className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
                    maxTokens === p.value ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="range" min="50" max="4000" step="50" value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-gray-200 dark:bg-gray-700"
            />
          </div>

          {/* Documente de context */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Fragmente context</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{contextDocs}</span>
              <span className="text-[10px] text-gray-400">fragmente</span>
            </div>
            <input
              type="range" min="1" max="10" step="1" value={contextDocs}
              onChange={(e) => setContextDocs(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-gray-200 dark:bg-gray-700 mt-4"
            />
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[9px] text-gray-400">1 - Rapid</span>
              <span className="text-[9px] text-gray-400">10 - Complet</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">Cate fragmente din Knowledge Base sunt cautate pentru fiecare intrebare.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
