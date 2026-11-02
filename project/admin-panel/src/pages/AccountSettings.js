import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';
import { useAuth } from '../AuthContext';
import { updateProfile, isDemoError } from '../api';

// Sectiune cu titlu, subtitlu si iconita, folosita pentru a grupa campurile paginii
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

// Camp de text cu eticheta si text de ajutor, refolosit in formulare
function InputField({ label, value, onChange, type = 'text', placeholder, disabled, helper, autoComplete = 'off' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {helper && <p className="text-[11px] text-gray-400 mt-1">{helper}</p>}
    </div>
  );
}

// Pagina contului propriu: schimbarea numelui, a emailului si a parolei
export default function AccountSettings() {
  // Mesajele temporare, utilizatorul curent si navigarea
  const { addToast } = useToast();
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  // Campurile formularelor de profil si de parola, cu starea salvarii
  const [profileName, setProfileName] = useState(user?.username || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Salveaza numele de utilizator si emailul
  const saveProfile = async () => {
    // Numele de utilizator nu poate fi gol
    if (!profileName.trim()) {
      addToast('Username-ul nu poate fi gol.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({
        username: profileName.trim(),
        email: profileEmail.trim() || null,
      });
      addToast('Profil actualizat!', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast(err.response?.data?.detail || 'Eroare la salvare.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Schimba parola contului curent
  const savePassword = async () => {
    // Contul demo nu poate schimba parola
    if (user?.role === 'demo') {
      addToast('Cont demo - modificările nu sunt permise', 'info');
      return;
    }
    // Parola curenta este obligatorie
    if (!passwords.current) {
      addToast('Introdu parola curenta.', 'error');
      return;
    }
    // Parola noua trebuie sa aiba minim 6 caractere
    if (passwords.newPass.length < 6) {
      addToast('Parola noua trebuie sa aiba minim 6 caractere.', 'error');
      return;
    }
    // Parola noua trebuie scrisa la fel de doua ori
    if (passwords.newPass !== passwords.confirm) {
      addToast('Parolele nu coincid.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(passwords.current, passwords.newPass);
      addToast('Parola schimbata! Te rugam sa te autentifici din nou.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      if (isDemoError(err)) return;
      addToast(err.response?.data?.detail || 'Eroare la schimbarea parolei.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Setari Cont"
        subtitle="Gestioneaza profilul si preferintele tale."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coloana din stanga: cardul de profil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary via-primary-600 to-indigo-700 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <path d="M0,50 C100,20 200,80 400,40 L400,100 L0,100Z" fill="white" opacity="0.1" />
                  <path d="M0,70 C150,40 250,90 400,60 L400,100 L0,100Z" fill="white" opacity="0.1" />
                </svg>
              </div>
            </div>
            <div className="px-5 pb-5 -mt-10 relative">
              <div className="w-20 h-20 rounded-xl border-4 border-white dark:border-dark-light bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user?.username || 'Admin'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'Fara email'}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {user?.role || 'admin'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activitate</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rol</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{user?.role || 'admin'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coloana din dreapta: formularele de setari */}
        <div className="lg:col-span-2 space-y-6">
          <Section
            title="Informatii Profil"
            subtitle="Actualizeaza datele tale personale"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Username"
                value={profileName}
                onChange={setProfileName}
                placeholder="Username-ul tau"
              />
              <InputField
                label="Email"
                type="email"
                value={profileEmail}
                onChange={setProfileEmail}
                placeholder="email@exemplu.com"
              />
              <InputField
                label="Rol"
                value={user?.role || 'admin'}
                onChange={() => {}}
                disabled
                helper="Rolul poate fi schimbat doar din pagina Utilizatori."
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
                disabled={savingProfile}
                className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {/* Indicator de incarcare pe butonul de profil */}
                {savingProfile && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Salveaza Profil
              </button>
            </div>
          </Section>

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
                autoComplete="current-password"
              />
              <InputField
                label="Parola Noua"
                type="password"
                value={passwords.newPass}
                onChange={(v) => setPasswords((p) => ({ ...p, newPass: v }))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <InputField
                label="Confirma Parola"
                type="password"
                value={passwords.confirm}
                onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                placeholder="••••••••"
                autoComplete="new-password"
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
                disabled={savingPassword}
                className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {/* Indicator de incarcare pe butonul de parola */}
                {savingPassword && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Schimba Parola
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
