import React, { useEffect, useState } from 'react';
import { getWidgetConfig, updateWidgetConfig, isDemoError } from '../api';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';

// Pagina cu raspunsurile rapide ale widget-ului: lista simpla sau pe categorii cu intrebari
export default function QuickReplies() {
  const [mode, setMode] = useState('simple'); // simple sau categories
  // Raspunsurile rapide pentru modul simplu si categoriile pentru modul cu categorii
  const [replies, setReplies] = useState([]);
  const [categories, setCategories] = useState([]);
  // Starea paginii: incarcare, salvare, configuratia botului si daca functia este activa
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [enabled, setEnabled] = useState(true);
  // Categoria deschisa in editor si categoria deschisa in previzualizare
  const [expandedCat, setExpandedCat] = useState(null);
  const [previewCat, setPreviewCat] = useState(null);
  const { addToast } = useToast();
  const { selectedBotId } = useBot();

  // La schimbarea botului se incarca raspunsurile rapide; formatul JSON arata modul: lista de texte sau lista de categorii
  useEffect(() => {
    getWidgetConfig(selectedBotId).then((res) => {
      setConfig(res.data);
      setEnabled(res.data.enable_quick_replies !== false);
      try {
        const parsed = JSON.parse(res.data.quick_replies || '[]');
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          setMode('simple');
          setReplies(parsed);
          setCategories([]);
        } else if (parsed.length > 0 && parsed[0].category) {
          setMode('categories');
          setCategories(parsed.map((c) => ({ name: c.category || '', questions: c.questions || [] })));
          setReplies([]);
        } else {
          setMode('simple');
          setReplies([]);
          setCategories([]);
        }
      } catch {
        setReplies([]);
        setCategories([]);
      }
    }).finally(() => setLoading(false));
  }, [selectedBotId]);

  // In modul cu categorii prima categorie se deschide automat
  useEffect(() => {
    if (mode === 'categories' && categories.length > 0 && expandedCat === null) {
      setExpandedCat(0);
    }
  }, [categories.length, mode]);

  // Salveaza raspunsurile rapide ca JSON in configuratia botului
  const handleSave = async () => {
    setSaving(true);
    try {
      // Se salveaza doar elementele care nu sunt goale, in formatul modului ales
      let data;
      if (mode === 'simple') {
        const cleaned = replies.filter((r) => r.trim());
        data = JSON.stringify(cleaned);
        setReplies(cleaned);
      } else {
        const cleaned = categories
          .filter((c) => c.name.trim())
          .map((c) => ({ category: c.name.trim(), questions: c.questions.filter((q) => q.trim()) }));
        data = JSON.stringify(cleaned);
        setCategories(cleaned.map((c) => ({ name: c.category, questions: c.questions })));
      }
      await updateWidgetConfig({ quick_replies: data }, selectedBotId);
      addToast('Raspunsurile rapide au fost salvate!', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast('Eroare la salvare.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Schimba intre modul simplu si cel cu categorii
  const switchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setPreviewCat(null);
    if (newMode === 'simple' && replies.length === 0) setReplies([]);
    if (newMode === 'categories' && categories.length === 0) setCategories([]);
  };

  // Functii pentru modul simplu
  // Adauga un raspuns rapid (maxim 8)
  const addReply = () => { if (replies.length < 8) setReplies([...replies, '']); };
  // Modifica textul unui raspuns rapid
  const updateReply = (i, v) => { const u = [...replies]; u[i] = v; setReplies(u); };
  // Sterge un raspuns rapid
  const removeReply = (i) => setReplies(replies.filter((_, idx) => idx !== i));
  // Muta un raspuns rapid in sus sau in jos
  const moveReply = (i, dir) => {
    const n = i + dir;
    if (n < 0 || n >= replies.length) return;
    const u = [...replies];
    [u[i], u[n]] = [u[n], u[i]];
    setReplies(u);
  };

  // Functii pentru modul cu categorii
  // Adauga o categorie noua de intrebari
  const addCategory = () => {
    // Se pot crea cel mult 6 categorii
    if (categories.length >= 6) return;
    const n = [...categories, { name: '', questions: [''] }];
    setCategories(n);
    setExpandedCat(n.length - 1);
  };
  // Sterge o categorie
  const removeCategory = (idx) => {
    setCategories(categories.filter((_, i) => i !== idx));
    if (expandedCat === idx) setExpandedCat(null);
    else if (expandedCat > idx) setExpandedCat(expandedCat - 1);
  };
  // Redenumeste o categorie
  const updateCategoryName = (idx, name) => {
    const u = [...categories]; u[idx] = { ...u[idx], name }; setCategories(u);
  };
  // Adauga o intrebare intr-o categorie
  const addQuestion = (ci) => {
    // O categorie poate avea cel mult 8 intrebari
    if (categories[ci].questions.length >= 8) return;
    const u = [...categories]; u[ci] = { ...u[ci], questions: [...u[ci].questions, ''] }; setCategories(u);
  };
  // Modifica textul unei intrebari
  const updateQuestion = (ci, qi, v) => {
    const u = [...categories]; const q = [...u[ci].questions]; q[qi] = v; u[ci] = { ...u[ci], questions: q }; setCategories(u);
  };
  // Sterge o intrebare dintr-o categorie
  const removeQuestion = (ci, qi) => {
    const u = [...categories]; u[ci] = { ...u[ci], questions: u[ci].questions.filter((_, i) => i !== qi) }; setCategories(u);
  };
  // Muta o categorie in sus sau in jos
  const moveCategory = (idx, dir) => {
    const n = idx + dir;
    if (n < 0 || n >= categories.length) return;
    const u = [...categories];
    [u[idx], u[n]] = [u[n], u[idx]];
    setCategories(u);
    setExpandedCat(n);
  };

  // Activeaza sau dezactiveaza raspunsurile rapide din widget
  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await updateWidgetConfig({ enable_quick_replies: next }, selectedBotId);
      addToast(next ? 'Raspunsuri rapide activate' : 'Raspunsuri rapide dezactivate', 'success');
    } catch (err) {
      if (isDemoError(err)) { setEnabled(!next); return; }
      setEnabled(!next);
      addToast('Eroare la salvare.', 'error');
    }
  };

  // Culoarea principala a botului, folosita in previzualizare
  const primaryColor = config?.primary_color || '#6366f1';

  // Stilul butoanelor din previzualizare, preluat din culoarea botului
  const pillStyle = (clr) => ({
    borderColor: clr, color: clr,
  });
  // La trecerea mouse-ului butonul se umple cu culoarea botului
  const onHover = (e, clr) => { e.currentTarget.style.background = clr; e.currentTarget.style.color = '#fff'; };
  const onLeave = (e, clr) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = clr; };

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Raspunsuri Rapide"
        subtitle="Configureaza intrebarile frecvente afisate in widget."
        action={
          <div className="flex items-center gap-3">
            <button onClick={handleToggle} className="group inline-flex items-center gap-2.5 cursor-pointer select-none" title={enabled ? 'Dezactiveaza raspunsurile rapide' : 'Activeaza raspunsurile rapide'}>
              <span className={`text-xs font-medium transition-colors ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {enabled ? 'Activ' : 'Inactiv'}
              </span>
              <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${enabled ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
              </span>
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <button onClick={handleSave} disabled={saving || !enabled}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium text-sm transition-colors">
              {/* Indicator de incarcare pe butonul de salvare */}
              {saving ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Se salveaza...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Salveaza</>
              )}
            </button>
          </div>
        }
      />

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!enabled ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        <div className="lg:col-span-2 space-y-4">
          {/* Card informativ */}
          <div className="bg-primary/5 border-2 border-primary/10 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Cum functioneaza?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode === 'simple'
                  ? 'Intrebarile apar ca butoane sub mesajul de bun venit. Cand utilizatorul apasa pe una, textul se trimite automat ca mesaj.'
                  : 'Categoriile apar ca butoane. Utilizatorul apasa pe o categorie si i se afiseaza intrebarile din ea. La click pe o intrebare, textul se trimite automat.'}
              </p>
            </div>
          </div>

          {/* Comutatorul dintre moduri */}
          <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl p-3 flex gap-2">
            <button
              onClick={() => switchMode('simple')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'simple' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Simplu
            </button>
            <button
              onClick={() => switchMode('categories')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${mode === 'categories' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Cu categorii
            </button>
          </div>

          {/* Editorul pentru modul simplu */}
          {mode === 'simple' && (
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Intrebari configurate</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{replies.length}/8 intrebari</p>
                </div>
                {replies.length < 8 && (
                  <button onClick={addReply} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Adauga
                  </button>
                )}
              </div>

              {/* Cat timp se incarca apar placeholder-e, apoi lista de raspunsuri */}
              {loading ? (
                <div className="p-5 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}</div>
              ) : replies.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nicio intrebare configurata</p>
                  <p className="text-xs text-gray-400 mt-1">Adauga intrebari frecvente pentru widget</p>
                  <button onClick={addReply} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Adauga prima intrebare
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Fiecare raspuns rapid, cu butoane de mutare si stergere */}
                  {replies.map((reply, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">{i + 1}</span>
                      <input type="text" value={reply} onChange={(e) => updateReply(i, e.target.value)} placeholder="Scrie intrebarea..."
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary outline-none transition-colors text-gray-900 dark:text-white" maxLength={50} />
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveReply(i, -1)} disabled={i === 0} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button onClick={() => moveReply(i, 1)} disabled={i === replies.length - 1} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <button onClick={() => removeReply(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {replies.length > 0 && replies.length < 8 && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={addReply} className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors">+ Adauga intrebare</button>
                </div>
              )}
            </div>
          )}

          {/* Editorul pentru modul cu categorii */}
          {mode === 'categories' && (
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Categorii configurate</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{categories.length}/6 categorii &middot; {categories.reduce((s, c) => s + c.questions.filter((q) => q.trim()).length, 0)} intrebari</p>
                </div>
                {categories.length < 6 && (
                  <button onClick={addCategory} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Adauga categorie
                  </button>
                )}
              </div>

              {loading ? (
                <div className="p-5 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nicio categorie configurata</p>
                  <p className="text-xs text-gray-400 mt-1">Adauga categorii cu intrebari frecvente</p>
                  <button onClick={addCategory} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Adauga prima categorie
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {/* Fiecare categorie, cu intrebarile ei */}
                  {categories.map((cat, catIdx) => (
                    <div key={catIdx}>
                      <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
                        onClick={() => setExpandedCat(expandedCat === catIdx ? null : catIdx)}>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expandedCat === catIdx ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <input type="text" value={cat.name} onChange={(e) => updateCategoryName(catIdx, e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Nume categorie..."
                          className="flex-1 px-3 py-1.5 rounded-lg border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 focus:border-primary bg-transparent text-sm font-medium outline-none transition-colors text-gray-900 dark:text-white" maxLength={30} />
                        <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md flex-shrink-0">{cat.questions.filter((q) => q.trim()).length} intrebari</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); moveCategory(catIdx, -1); }} disabled={catIdx === 0} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors" title="Muta sus">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); moveCategory(catIdx, 1); }} disabled={catIdx === categories.length - 1} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors" title="Muta jos">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeCategory(catIdx); }} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition-colors" title="Sterge">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      {expandedCat === catIdx && (
                        <div className="px-5 pb-4 pt-1 ml-7 border-l-2 border-gray-100 dark:border-gray-700 space-y-2">
                          {cat.questions.map((q, qIdx) => (
                            <div key={qIdx} className="flex items-center gap-2 group/q">
                              <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-400 flex-shrink-0">{qIdx + 1}</span>
                              <input type="text" value={q} onChange={(e) => updateQuestion(catIdx, qIdx, e.target.value)} placeholder="Scrie intrebarea..."
                                className="flex-1 px-3 py-1.5 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:border-primary outline-none transition-colors text-gray-900 dark:text-white" maxLength={60} />
                              <button onClick={() => removeQuestion(catIdx, qIdx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover/q:opacity-100">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                          {cat.questions.length < 8 && (
                            <button onClick={() => addQuestion(catIdx)} className="w-full py-2 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 text-xs text-gray-400 hover:border-primary hover:text-primary transition-colors">+ Adauga intrebare</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {categories.length > 0 && categories.length < 6 && (
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={addCategory} className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors">+ Adauga categorie</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dreapta: previzualizarea */}
        <div>
          <div className="sticky top-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </h3>
            <div className="bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-900 text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: primaryColor }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold">{config?.bot_name || 'AI Assistant'}</p>
                  <p className="text-[10px] text-white/50">{config?.bot_subtitle || 'AI Agent'}</p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-dark min-h-[220px]">
                <div className="flex items-start gap-2 mb-3">
                  <div className="max-w-[85%] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3 py-2">
                    <p className="text-xs text-gray-700 dark:text-gray-300">{config?.welcome_message || 'Buna! Cu ce te pot ajuta?'}</p>
                  </div>
                </div>

                {/* Previzualizare pentru modul simplu */}
                {mode === 'simple' && replies.filter((r) => r.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {/* Previzualizarea modului simplu */}
                    {replies.filter((r) => r.trim()).map((r, i) => (
                      <span key={i} className="text-[11px] px-3 py-1.5 rounded-full border-[1.5px] font-medium cursor-default transition-colors"
                        style={pillStyle(primaryColor)} onMouseEnter={(e) => onHover(e, primaryColor)} onMouseLeave={(e) => onLeave(e, primaryColor)}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Previzualizare pentru modul cu categorii */}
                {mode === 'categories' && categories.filter((c) => c.name.trim()).length > 0 && (
                  <div className="mt-3">
                    {/* Previzualizarea arata categoriile, iar dupa alegere intrebarile categoriei */}
                    {previewCat === null ? (
                      <div className="flex flex-wrap gap-1.5">
                        {categories.filter((c) => c.name.trim()).map((c, i) => (
                          <button key={i} onClick={() => setPreviewCat(i)}
                            className="text-[11px] px-3 py-1.5 rounded-full border-[1.5px] font-medium transition-colors"
                            style={pillStyle(primaryColor)} onMouseEnter={(e) => onHover(e, primaryColor)} onMouseLeave={(e) => onLeave(e, primaryColor)}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <button onClick={() => setPreviewCat(null)} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mb-2 transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          Inapoi la categorii
                        </button>
                        <div className="flex flex-wrap gap-1.5">
                          {categories.filter((c) => c.name.trim())[previewCat]?.questions.filter((q) => q.trim()).map((q, i) => (
                            <span key={i} className="text-[11px] px-3 py-1.5 rounded-full border-[1.5px] font-medium cursor-default transition-colors"
                              style={pillStyle(primaryColor)} onMouseEnter={(e) => onHover(e, primaryColor)} onMouseLeave={(e) => onLeave(e, primaryColor)}>
                              {q}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400">
                  {config?.placeholder_text || 'Mesaj...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
