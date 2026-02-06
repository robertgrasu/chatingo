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
    { num: '1', title: 'Copiaza codul', desc: 'Copiaza snippet-ul de mai jos.' },
    { num: '2', title: 'Adauga in HTML', desc: 'Lipeste codul inainte de </body>.' },
    { num: '3', title: 'Gata!', desc: 'Widget-ul va aparea pe site.' },
  ];

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Integration"
        subtitle="Adauga chatbot-ul pe orice site web in 3 pasi simpli."
        breadcrumbs={[{ label: 'Integration' }]}
      />

      {/* Steps */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex-shrink-0">
              {step.num}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{step.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Code Block */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 max-w-3xl">
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
    </div>
  );
}
