import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import PageHeader from '../components/PageHeader';
import { timeAgo } from '../utils';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  // Form state
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', password: '', role: 'admin' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email || '', password: '', role: u.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) { addToast('Username obligatoriu', 'error'); return; }
    if (!editUser && form.password.length < 6) { addToast('Parola minim 6 caractere', 'error'); return; }

    setSaving(true);
    try {
      if (editUser) {
        await updateUser(editUser.id, {
          username: form.username.trim(),
          email: form.email.trim() || null,
          role: form.role,
        });
        addToast('Utilizator actualizat!', 'success');
      } else {
        await createUser({
          username: form.username.trim(),
          email: form.email.trim() || null,
          password: form.password,
          role: form.role,
        });
        addToast('Utilizator creat!', 'success');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Eroare', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active });
      addToast(u.is_active ? 'Cont dezactivat' : 'Cont activat', 'success');
      loadUsers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Eroare', 'error');
    }
  };

  const handleDelete = async (u) => {
    try {
      await deleteUser(u.id);
      addToast('Utilizator sters', 'success');
      loadUsers();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Eroare', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (resetPassword.length < 6) { addToast('Parola minim 6 caractere', 'error'); return; }
    try {
      await resetUserPassword(showResetModal.id, resetPassword);
      addToast('Parola resetata!', 'success');
      setShowResetModal(null);
      setResetPassword('');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Eroare', 'error');
    }
  };

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Utilizatori"
        subtitle="Gestioneaza conturile de administrator"
        action={
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Utilizator Nou
          </button>
        }
      />

      {/* Users Table */}
      <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilizator</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ultima autentificare</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Creat</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Niciun utilizator gasit
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            u.is_active
                              ? 'bg-gradient-to-br from-primary to-indigo-600'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {u.username}
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Tu</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{u.email || 'Fara email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          u.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.is_active ? 'Activ' : 'Dezactivat'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {u.last_login ? timeAgo(u.last_login) : 'Niciodata'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(u.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                            title="Editeaza"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setShowResetModal(u); setResetPassword(''); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                            title="Reseteaza parola"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={`p-1.5 rounded-lg transition-all ${
                                  u.is_active
                                    ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                }`}
                                title={u.is_active ? 'Dezactiveaza' : 'Activeaza'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                                    u.is_active
                                      ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                      : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  } />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Sterge"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {editUser ? 'Editeaza Utilizator' : 'Utilizator Nou'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="admin2"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@exemplu.com"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Parola</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Minim 6 caractere"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                >
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editUser ? 'Salveaza' : 'Creeaza'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowResetModal(null)}>
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Reseteaza parola: {showResetModal.username}
              </h3>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Parola noua</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
              <p className="text-[11px] text-gray-400 mt-2">Utilizatorul va fi deconectat de pe toate dispozitivele.</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Anuleaza
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reseteaza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
