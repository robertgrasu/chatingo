import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';

function Section({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, disabled, helper }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {helper && <p className="text-[11px] text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

export default function AccountSettings() {
  const { addToast } = useToast();
  const { dark } = useTheme();
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Profile from auth context (backend), not localStorage
  const profile = {
    name: user?.username || 'Admin',
    email: user?.email || '',
    role: user?.role || 'admin',
    avatar: null,
  };

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [notifications, setNotifications] = useState({ email: true, browser: false, newConversation: true, feedback: true });

  const [saving, setSaving] = useState(false);

  const saveProfile = () => {
    addToast('Profilul se gestioneaza prin backend.', 'info');
  };

  const savePassword = async () => {
    if (!passwords.current) {
      addToast('Introdu parola curenta.', 'error');
      return;
    }
    if (passwords.newPass.length < 6) {
      addToast('Parola noua trebuie sa aiba minim 6 caractere.', 'error');
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      addToast('Parolele nu coincid.', 'error');
      return;
    }
    setSaving(true);
    try {
      await changePassword(passwords.current, passwords.newPass);
      addToast('Parola schimbata! Te rugam sa te autentifici din nou.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      addToast(err.response?.data?.detail || 'Eroare la schimbarea parolei.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = () => {
    addToast('Preferintele de notificari au fost salvate!', 'success');
  };

  const handleAvatarUpload = (e) => {
    // Avatar upload is a cosmetic feature - no localStorage storage
    addToast('Avatar upload disponibil in versiunea urmatoare.', 'info');
  };

  const removeAvatar = () => {};

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Setari Cont"
        subtitle="Gestioneaza profilul si preferintele tale."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-br from-primary via-primary-600 to-indigo-700 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <path d="M0,50 C100,20 200,80 400,40 L400,100 L0,100Z" fill="white" opacity="0.1" />
                  <path d="M0,70 C150,40 250,90 400,60 L400,100 L0,100Z" fill="white" opacity="0.1" />
                </svg>
              </div>
            </div>

            {/* Avatar + Info */}
            <div className="px-5 pb-5 -mt-10 relative">
              <div className="relative inline-block">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-4 border-white dark:border-dark-light bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shadow-lg"
                >
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-dark-light border-2 border-gray-100 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>

              {profile.avatar && (
                <button onClick={removeAvatar} className="ml-3 text-xs text-red-500 hover:text-red-600 transition-colors">
                  Sterge poza
                </button>
              )}

              <div className="mt-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activitate</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ultima autentificare</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Acum</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status cont</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Activ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-purple-50 dark:bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cont creat</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Feb 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info */}
          <Section
            title="Informatii Profil"
            subtitle="Actualizeaza datele tale personale"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Nume Complet"
                value={profile.name}
                onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
                placeholder="Numele tau"
              />
              <InputField
                label="Email"
                type="email"
                value={profile.email}
                onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
                placeholder="email@exemplu.com"
              />
              <InputField
                label="Rol"
                value={profile.role}
                onChange={(v) => setProfile((p) => ({ ...p, role: v }))}
                disabled
                helper="Rolul poate fi schimbat doar de un super-admin."
              />
              <InputField
                label="Limba"
                value="Romana"
                onChange={() => {}}
                disabled
                helper="Mai multe limbi vor fi disponibile in curand."
              />
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Salveaza Profil
              </button>
            </div>
          </Section>

          {/* Security */}
          <Section
            title="Securitate"
            subtitle="Schimba-ti parola de acces"
            icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Parola Curenta"
                type="password"
                value={passwords.current}
                onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
                placeholder="••••••••"
              />
              <InputField
                label="Parola Noua"
                type="password"
                value={passwords.newPass}
                onChange={(v) => setPasswords((p) => ({ ...p, newPass: v }))}
                placeholder="••••••••"
              />
              <InputField
                label="Confirma Parola"
                type="password"
                value={passwords.confirm}
                onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                placeholder="••••••••"
              />
            </div>
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Parola trebuie sa aiba minim 6 caractere. Dupa schimbare, vei fi deconectat de pe toate dispozitivele.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={savePassword}
                disabled={saving}
                className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Schimba Parola
              </button>
            </div>
          </Section>

          {/* Notifications */}
          <Section
            title="Notificari"
            subtitle="Alege ce notificari doresti sa primesti"
            icon="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          >
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Notificari Email', desc: 'Primeste rezumate prin email' },
                { key: 'browser', label: 'Notificari Browser', desc: 'Notificari push in browser' },
                { key: 'newConversation', label: 'Conversatie Noua', desc: 'Cand un vizitator initiaza o conversatie' },
                { key: 'feedback', label: 'Feedback Primit', desc: 'Cand un vizitator lasa o recenzie' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      notifications[item.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        notifications[item.key] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={saveNotifications}
                className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                Salveaza Notificari
              </button>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
