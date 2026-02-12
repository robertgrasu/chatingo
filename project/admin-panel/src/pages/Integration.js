import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Integration() {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const embedCode = `<script>
  window.chatbotConfig = {
    botId: 'bot_123',
    apiUrl: '${API_URL}'
  };
</script>
<script src="${API_URL}/static/widget.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      addToast('Codul a fost copiat in clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const steps = [
    {
      num: '1',
      title: 'Copiaza codul',
      desc: 'Copiaza snippet-ul de mai jos.',
      icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    },
    {
      num: '2',
      title: 'Adauga in HTML',
      desc: 'Lipeste codul inainte de </body>.',
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    },
    {
      num: '3',
      title: 'Gata!',
      desc: 'Widget-ul va aparea pe site.',
      icon: 'M5 13l4 4L19 7',
    },
  ];

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Integration"
        subtitle="Adauga chatbot-ul pe orice site web in 3 pasi simpli."
        breadcrumbs={[{ label: 'Integration' }]}
      />

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/20 flex-shrink-0">
              {step.num}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{step.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Code Block */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Embed Code</h3>
                <p className="text-xs text-gray-400">HTML snippet</p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                copied
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiat!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-950 rounded-xl p-5 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed">
              <code className="text-gray-300">
                {embedCode.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span className="text-gray-600 select-none w-6 text-right mr-4 flex-shrink-0">{i + 1}</span>
                    <span>
                      {line.replace(/<script>/g, '<script>').replace(/<\/script>/g, '</script>')}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Configuration */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Configurare</h4>
            </div>
            <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span>Bot ID</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">bot_123</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
                <span>API URL</span>
                <span className="font-mono text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[160px]">{API_URL}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Widget</span>
                <span className="font-mono text-gray-700 dark:text-gray-300">widget.js</span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Cerinte</h4>
            </div>
            <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Site web cu acces la HTML
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Backend-ul trebuie sa fie accesibil
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Browser modern (Chrome, Firefox, Safari, Edge)
              </li>
            </ul>
          </div>

          {/* Help */}
          <div className="bg-primary/5 dark:bg-primary/5 rounded-xl border-2 border-primary/10 dark:border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-primary-800 dark:text-primary-300 text-sm">Sfat</h4>
            </div>
            <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
              Personalizeaza aspectul widget-ului din pagina <strong>Settings</strong> inainte de integrare. Culorile, textul si pozitia se pot modifica oricand.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
