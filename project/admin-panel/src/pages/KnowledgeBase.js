import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  createCategory,
  createTextDocument,
  deleteCategory,
  deleteDocument,
  getAllDocuments,
  getCategories,
  getDocument,
  getDocuments,
  updateCategory,
  updateDocument,
  uploadDocument,
} from '../api';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import { TableRowSkeleton } from '../components/Skeleton';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';
import { formatDate } from '../utils';

const statusConfig = {
  ready: { label: 'Ready', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  processing: { label: 'Processing', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  error: { label: 'Error', color: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

export default function KnowledgeBase() {
  const { addToast } = useToast();
  const { selectedBotId } = useBot();
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Inline rename
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Add content tabs
  const [addTab, setAddTab] = useState('upload');
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCatId, setUploadCatId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Text create state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textCatId, setTextCatId] = useState('');
  const [creating, setCreating] = useState(false);

  // Document editor modal
  const [editDoc, setEditDoc] = useState(null);
  const [editFilename, setEditFilename] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCatId, setEditCatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  // Error
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    const res = await getCategories(selectedBotId);
    setCategories(res.data);
  }, [selectedBotId]);

  const loadDocuments = useCallback(async (catId) => {
    setLoadingDocs(true);
    try {
      if (catId === 'all') {
        const res = await getAllDocuments();
        setDocuments(res.data);
      } else {
        const res = await getDocuments(catId);
        setDocuments(res.data);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadDocuments(selectedCat); }, [selectedCat, loadDocuments]);

  const refresh = () => {
    loadCategories();
    loadDocuments(selectedCat);
  };

  // --- Category handlers ---
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await createCategory(newCatName.trim());
    setNewCatName('');
    loadCategories();
    addToast('Categorie creata cu succes!', 'success');
  };

  const handleRenameCategory = async (id) => {
    if (!editingCatName.trim()) { setEditingCatId(null); return; }
    await updateCategory(id, editingCatName.trim());
    setEditingCatId(null);
    loadCategories();
    addToast('Categorie redenumita.', 'success');
  };

  const handleDeleteCategory = (id) => {
    setConfirmModal({
      open: true,
      title: 'Sterge categoria',
      message: 'Sigur vrei sa stergi aceasta categorie si toate documentele asociate? Aceasta actiune nu poate fi anulata.',
      onConfirm: async () => {
        await deleteCategory(id);
        if (selectedCat === id) setSelectedCat('all');
        refresh();
        addToast('Categorie stearsa.', 'success');
      },
    });
  };

  // --- Upload handler ---
  const handleFileSelect = (f) => {
    if (f && !f.name.endsWith('.txt')) {
      setError('Doar fisiere .txt sunt acceptate.');
      return;
    }
    setUploadFile(f);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadCatId) { setError('Selecteaza o categorie si un fisier.'); return; }
    setUploading(true);
    setError('');
    try {
      await uploadDocument(uploadFile, uploadCatId);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowAddPanel(false);
      refresh();
      addToast('Document uploadat cu succes!', 'success');
    } catch {
      addToast('Eroare la upload. Incearca din nou.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // --- Text create handler ---
  const handleCreateText = async (e) => {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim() || !textCatId) {
      setError('Completeaza toate campurile.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await createTextDocument(textTitle.trim(), textContent.trim(), textCatId);
      setTextTitle('');
      setTextContent('');
      setShowAddPanel(false);
      refresh();
      addToast('Document creat cu succes!', 'success');
    } catch {
      addToast('Eroare la creare. Incearca din nou.', 'error');
    } finally {
      setCreating(false);
    }
  };

  // --- Document handlers ---
  const handleOpenDocument = async (docId) => {
    setLoadingDoc(true);
    try {
      const res = await getDocument(docId);
      const doc = res.data;
      setEditDoc(doc);
      setEditFilename(doc.filename);
      setEditContent(doc.content || '');
      setEditCatId(doc.category_id);
    } catch {
      addToast('Nu s-a putut incarca documentul.', 'error');
    } finally {
      setLoadingDoc(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!editDoc) return;
    setSaving(true);
    try {
      const data = {};
      if (editFilename !== editDoc.filename) data.filename = editFilename;
      if (editContent !== (editDoc.content || '')) data.content = editContent;
      if (editCatId !== editDoc.category_id) data.category_id = editCatId;

      if (Object.keys(data).length > 0) {
        await updateDocument(editDoc.id, data);
      }
      setEditDoc(null);
      refresh();
      addToast('Document salvat cu succes!', 'success');
    } catch {
      addToast('Eroare la salvare.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = (id) => {
    setConfirmModal({
      open: true,
      title: 'Sterge documentul',
      message: 'Sigur vrei sa stergi acest document? Aceasta actiune nu poate fi anulata.',
      onConfirm: async () => {
        await deleteDocument(id);
        if (editDoc?.id === id) setEditDoc(null);
        refresh();
        addToast('Document sters.', 'success');
      },
    });
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : '';
  };

  const totalDocs = categories.reduce((sum, c) => sum + c.document_count, 0);

  const filteredDocs = searchQuery
    ? documents.filter((d) => d.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    : documents;

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all';

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Knowledge Base"
        subtitle="Gestioneaza categoriile si documentele pentru chatbot."
        breadcrumbs={[{ label: 'Knowledge Base' }]}
        action={
          <button
            onClick={() => { setShowAddPanel(!showAddPanel); setError(''); }}
            className="bg-gradient-to-r from-primary to-primary-600 text-white px-5 py-2.5 rounded-xl hover:from-primary-600 hover:to-primary-700 text-sm font-medium shadow-lg shadow-primary/20 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adauga continut
          </button>
        }
      />

      {/* Add Content Panel */}
      {showAddPanel && (
        <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-6 mb-6 shadow-sm animate-scale-in">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setAddTab('upload'); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                addTab === 'upload' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload fisier
              </span>
            </button>
            <button
              onClick={() => { setAddTab('text'); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                addTab === 'text' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Scrie text
              </span>
            </button>
          </div>

          {/* Upload Tab */}
          {addTab === 'upload' && (
            <form onSubmit={handleUpload}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Categorie</label>
                  <select value={uploadCatId} onChange={(e) => setUploadCatId(e.target.value)} className={inputClass}>
                    <option value="">Selecteaza categorie...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fisier</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl px-3.5 py-2 cursor-pointer transition-all flex items-center gap-2 ${
                      dragOver ? 'border-indigo-400 bg-primary/10 dark:bg-primary/10'
                        : uploadFile ? 'border-emerald-300 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input ref={fileInputRef} type="file" accept=".txt" onChange={(e) => handleFileSelect(e.target.files[0])} className="hidden" />
                    {uploadFile ? (
                      <span className="text-sm text-emerald-700 dark:text-emerald-400 truncate">{uploadFile.name}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Click sau drag & drop (.txt)</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading || !uploadFile || !uploadCatId}
                className="bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-2.5 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-primary/20 transition-all"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Se incarca...
                  </span>
                ) : 'Upload'}
              </button>
            </form>
          )}

          {/* Text Tab */}
          {addTab === 'text' && (
            <form onSubmit={handleCreateText}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Titlu document</label>
                  <input type="text" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="ex: Informatii produse" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Categorie</label>
                  <select value={textCatId} onChange={(e) => setTextCatId(e.target.value)} className={inputClass}>
                    <option value="">Selecteaza categorie...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Continut</label>
                <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Scrie sau lipeste textul aici..." rows={6} className={`${inputClass} resize-y`} />
              </div>
              <button
                type="submit"
                disabled={creating || !textTitle.trim() || !textContent.trim() || !textCatId}
                className="bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-2.5 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-primary/20 transition-all"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Se proceseaza...
                  </span>
                ) : 'Salveaza'}
              </button>
            </form>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-4 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Categories */}
        <div className="col-span-3">
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5 sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Categorii</h3>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{categories.length}</span>
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Categorie noua..."
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all min-w-0"
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="bg-gradient-to-r from-primary to-primary-600 text-white w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 transition-all shadow-lg shadow-primary/20 flex-shrink-0"
              >
                +
              </button>
            </form>

            <ul className="space-y-1">
              <li
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
                  selectedCat === 'all'
                    ? 'bg-primary/10 dark:bg-primary/10 text-primary shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setSelectedCat('all')}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="font-medium">Toate documentele</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md">{totalDocs}</span>
              </li>

              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-all duration-200 group ${
                    selectedCat === cat.id
                      ? 'bg-primary/10 dark:bg-primary/10 text-primary shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedCat(cat.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingCatId(cat.id);
                    setEditingCatName(cat.name);
                  }}
                >
                  {editingCatId === cat.id ? (
                    <input
                      autoFocus
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onBlur={() => handleRenameCategory(cat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCategory(cat.id);
                        if (e.key === 'Escape') setEditingCatId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 border border-primary dark:border-primary rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedCat === cat.id ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <span className="font-medium truncate">{cat.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md flex-shrink-0">{cat.document_count}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCatId(cat.id);
                        setEditingCatName(cat.name);
                      }}
                      className="text-gray-400 hover:text-primary transition-all p-1"
                      title="Redenumeste"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="text-gray-400 hover:text-red-500 transition-all p-1"
                      title="Sterge"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}

              {categories.length === 0 && (
                <li className="text-center py-8">
                  <svg className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-gray-400 text-sm">Nicio categorie.</p>
                  <p className="text-gray-300 dark:text-gray-500 text-xs mt-1">Creeaza prima categorie.</p>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main - Documents Table */}
        <div className="col-span-9">
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedCat === 'all' ? 'Toate documentele' : getCategoryName(selectedCat)}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{filteredDocs.length} documente</p>
              </div>
              {/* Search */}
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cauta documente..."
                  className="pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all w-56"
                />
              </div>
            </div>

            {loadingDocs ? (
              <div>
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 dark:bg-gray-700/30 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <div className="col-span-4">Document</div>
                  <div className="col-span-2">Categorie</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-center">Chunks</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-1 text-right">Actiuni</div>
                </div>
                <TableRowSkeleton />
                <TableRowSkeleton />
                <TableRowSkeleton />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-200 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-400 text-sm">{searchQuery ? 'Niciun rezultat gasit.' : 'Niciun document.'}</p>
                <p className="text-gray-300 dark:text-gray-500 text-xs mt-1">
                  {searchQuery ? 'Incearca un alt termen de cautare.' : 'Apasa "Adauga continut" pentru a incepe.'}
                </p>
              </div>
            ) : (
              <div>
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 dark:bg-gray-700/30 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <div className="col-span-4">Document</div>
                  <div className="col-span-2">Categorie</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1 text-center">Chunks</div>
                  <div className="col-span-2">Data</div>
                  <div className="col-span-1 text-right">Actiuni</div>
                </div>

                {/* Rows */}
                {filteredDocs.map((doc) => {
                  const status = statusConfig[doc.status] || statusConfig.error;
                  return (
                    <div
                      key={doc.id}
                      className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer items-center group"
                      onClick={() => handleOpenDocument(doc.id)}
                    >
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-primary/10 dark:bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.filename}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{getCategoryName(doc.category_id)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{doc.chunk_count || 0}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-400">{formatDate(doc.created_at)}</span>
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenDocument(doc.id); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-all p-1.5 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/10"
                          title="Editeaza"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Sterge"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Editor Modal */}
      {(editDoc || loadingDoc) && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => !saving && setEditDoc(null)}>
          <div
            className="bg-white dark:bg-dark-light rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-in border-2 border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDoc && !editDoc ? (
              <div className="flex items-center justify-center py-20">
                <svg className="animate-spin w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : editDoc && (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Editeaza document</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {(() => {
                          const s = statusConfig[editDoc.status] || statusConfig.error;
                          return (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {s.label}
                            </span>
                          );
                        })()}
                        <span className="text-xs text-gray-400">{editDoc.chunk_count} chunks</span>
                        <span className="text-xs text-gray-400">{formatDate(editDoc.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditDoc(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Titlu / Nume fisier</label>
                      <input type="text" value={editFilename} onChange={(e) => setEditFilename(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Categorie</label>
                      <select value={editCatId} onChange={(e) => setEditCatId(e.target.value)} className={inputClass}>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Continut</label>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={16} className={`${inputClass} resize-y font-mono leading-relaxed`} />
                  </div>
                  {editContent !== (editDoc.content || '') && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-500/10 px-3 py-2 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Continutul a fost modificat. La salvare, documentul va fi reprocesat (embedding-uri noi).
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
                  <button
                    onClick={() => handleDeleteDocument(editDoc.id)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Sterge document
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditDoc(null)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    >
                      Anuleaza
                    </button>
                    <button
                      onClick={handleSaveDocument}
                      disabled={saving}
                      className="bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-2.5 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 text-sm font-medium shadow-lg shadow-primary/20 transition-all"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Se salveaza...
                        </span>
                      ) : 'Salveaza'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
