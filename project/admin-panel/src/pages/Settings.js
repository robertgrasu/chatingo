import React, { useEffect, useState, useRef } from 'react';
import { getWidgetConfig, updateWidgetConfig, uploadAvatar, deleteAvatar, isDemoError } from '../api';
import PageHeader from '../components/PageHeader';
import { useToast } from '../ToastContext';
import { useBot } from '../BotContext';

// Spune daca o culoare hex este deschisa, ca textul de pe ea sa fie ales pentru contrast
function isLightColor(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

// Sectiune care se deschide si se inchide, folosita pentru a grupa setarile
function Accordion({ title, subtitle, icon, children, defaultOpen = false }) {
  // Sectiunea este deschisa sau inchisa
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-dark-light rounded-xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
      >
        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '800px' : '0', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-5 pt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// Selector de culoare cu culori predefinite si camp pentru cod hex
function ColorPicker({ value, onChange, presets }) {
  // Culoarea alesa decide daca textul de pe bara este inchis sau deschis
  const light = isLightColor(value);
  // Starea editarii codului hex: modul de editare si textul scris
  const [editHex, setEditHex] = useState(false);
  const [hex, setHex] = useState(value);

  // Configuratia se incarca la pornire si cand se schimba botul
  useEffect(() => { setHex(value); }, [value]);

  // Codul hex se accepta doar in formatul #rrggbb, altfel revine la valoarea veche
  const commitHex = () => {
    const v = hex.startsWith('#') ? hex : `#${hex}`;
    if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
    else setHex(value);
    setEditHex(false);
  };

  return (
    <div className="space-y-3">
      {/* ── Bara principala: culoarea aleasa si controalele ei ── */}
      <div
        className="h-10 rounded-xl flex items-center px-3 gap-2"
        style={{
          background: value,
          transition: 'background 300ms ease',
          border: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        }}
      >
        {/* Iconita creion deschide selectorul de culoare al browserului */}
        <label className="flex-shrink-0 cursor-pointer relative">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            light ? 'bg-black/[0.06] hover:bg-black/[0.12]' : 'bg-white/[0.1] hover:bg-white/[0.2]'
          }`}>
            <svg className={`w-3 h-3 ${light ? 'text-black/40' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </label>

        {/* Codul hex este camp de text in timpul editarii, altfel text pe care se poate da click */}
        {editHex ? (
          <input
            type="text" value={hex}
            onChange={(e) => setHex(e.target.value)}
            onBlur={commitHex}
            onKeyDown={(e) => { if (e.key === 'Enter') commitHex(); if (e.key === 'Escape') { setHex(value); setEditHex(false); } }}
            onFocus={(e) => e.target.select()}
            autoFocus
            className="bg-transparent border-none outline-none w-[72px] text-xs font-mono font-bold uppercase tracking-widest"
            style={{ color: light ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }}
          />
        ) : (
          <span
            onClick={() => setEditHex(true)}
            className="text-xs font-mono font-bold uppercase tracking-widest cursor-text select-none transition-colors"
            style={{ color: light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)' }}
          >
            {value}
          </span>
        )}
      </div>

      {/* ── Mostrele de culoare, cu efect luminos pe cea aleasa ── */}
      <div className="flex flex-wrap gap-1.5">
        {/* Cate o mostra pentru fiecare culoare predefinita */}
        {presets.map((color) => {
          const sel = value?.toLowerCase() === color.toLowerCase();
          const sl = isLightColor(color);
          return (
            <button
              key={color}
              onClick={() => onChange(color)}
              className="w-7 h-7 rounded-full flex-shrink-0 p-0 cursor-pointer"
              style={{
                background: color,
                border: sl && !sel ? '1px solid rgba(0,0,0,0.08)' : '1px solid transparent',
                transform: sel ? 'scale(1.15)' : 'scale(1)',
                boxShadow: sel
                  ? `0 0 0 2px white, 0 0 0 3.5px ${color}, 0 2px 8px ${color}44`
                  : 'none',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Avatar mic folosit in previzualizarile din panou
function MiniAvatar({ size = 18, color, iconSize = 8, avatarUrl, borderStyle }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: borderStyle || 'none',
        }}
      />
    );
  }
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: borderStyle || 'none',
    }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

// Pagina cu setarile de aspect ale widget-ului (culori, avatar, tema, pozitie, functii) si previzualizare live
export default function Settings() {
  const { addToast } = useToast();
  const { selectedBotId } = useBot();
  // Configuratia widget-ului, cu valori implicite pana cand se incarca cea de pe server
  const [config, setConfig] = useState({
    welcome_message: '',
    bot_name: 'AI Assistant',
    bot_subtitle: 'AI Agent',
    primary_color: '#6366f1',
    header_color: '#14161a',
    bubble_color: '#ffffff',
    bubble_icon_color: '#14161a',
    bot_message_color: '#f5f5f5',
    avatar_color: '#6366f1',
    avatar_url: null,
    gradient_end_color: null,
    gradient_angle: 135,
    placeholder_text: 'Mesaj...',
    position: 'bottom-right',
    widget_theme: 'default',
    show_online_status: true,
    show_subtitle: true,
    enable_emoji: true,
    enable_attachments: true,
    enable_voice: false,
    send_button_color: null,
    user_message_color: null,
    bubble_icon: 'chat',
    avatar_size: 42,
  });
  // Starea salvarii si a incarcarii avatarului, plus referinta spre campul de fisier
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  /* ─── Starea previzualizarii interactive ─── */
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState('');
  const [previewTyping, setPreviewTyping] = useState(false);
  const previewMsgsRef = useRef(null);
  // Indexul raspunsului simulat de bot, ca raspunsurile sa se succeada pe rand
  const botResponseIdx = useRef(0);

  // Raspunsurile simulate ale botului in previzualizare
  const botResponses = [
    'Multumesc pentru mesaj! Cu ce te pot ajuta?',
    'Am inteles. Pot sa te ajut cu orice intrebare.',
    'Buna observatie! Hai sa discutam.',
    'Sigur, sunt aici sa te ajut!',
  ];

  useEffect(() => {
    getWidgetConfig(selectedBotId).then((res) => setConfig(res.data));
  }, [selectedBotId]);

  /* Mesajele initiale ale previzualizarii */
  useEffect(() => {
    const welcome = config.welcome_message || 'Buna! Cu ce te pot ajuta?';
    setPreviewMessages([{ role: 'assistant', content: welcome }]);
  }, [config.welcome_message]);

  /* Derulare automata la ultimul mesaj din previzualizare */
  useEffect(() => {
    if (previewMsgsRef.current) {
      previewMsgsRef.current.scrollTop = previewMsgsRef.current.scrollHeight;
    }
  }, [previewMessages, previewTyping]);

  // Deschide previzualizarea chat-ului cu mesajul de bun venit
  const handlePreviewOpen = () => {
    setPreviewOpen(true);
    if (previewMessages.length === 0) {
      setPreviewMessages([{ role: 'assistant', content: config.welcome_message || 'Buna! Cu ce te pot ajuta?' }]);
    }
  };

  // Inchide previzualizarea
  const handlePreviewClose = () => setPreviewOpen(false);

  // In previzualizare raspunsul botului este simulat, fara apel la server
  const handlePreviewSend = () => {
    const text = previewInput.trim();
    // Mesajele goale sau trimise cat botul scrie sunt ignorate
    if (!text || previewTyping) return;
    setPreviewMessages((prev) => [...prev, { role: 'user', content: text }]);
    setPreviewInput('');
    setPreviewTyping(true);
    // Raspunsul simulat apare dupa 1,2 secunde, ca sa para ca botul scrie
    setTimeout(() => {
      const response = botResponses[botResponseIdx.current % botResponses.length];
      botResponseIdx.current++;
      setPreviewMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setPreviewTyping(false);
    }, 1200);
  };

  // Salveaza setarile widget-ului pentru botul selectat
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWidgetConfig(config, selectedBotId);
      addToast('Setarile au fost salvate cu succes!', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast('Eroare la salvarea setarilor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Incarca avatarul botului
  const handleAvatarUpload = async (e) => {
    // Fisierul ales de utilizator
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, selectedBotId);
      // Adresa completa a avatarului, cu serverul in fata
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}${res.data.avatar_url}`;
      setConfig((prev) => ({ ...prev, avatar_url: url }));
      addToast('Avatar incarcat cu succes!', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast('Eroare la incarcarea avatarului.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (avatarFileRef.current) avatarFileRef.current.value = '';
    }
  };

  // Sterge avatarul botului
  const handleAvatarDelete = async () => {
    try {
      await deleteAvatar(selectedBotId);
      setConfig((prev) => ({ ...prev, avatar_url: null }));
      addToast('Avatar sters.', 'success');
    } catch (err) {
      if (isDemoError(err)) return;
      addToast('Eroare la stergerea avatarului.', 'error');
    }
  };

  // Culorile predefinite pentru fiecare sectiune de culoare
  const accentPresets = [
    '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16', '#f59e0b', '#f97316',
    '#ef4444', '#e11d48', '#ec4899', '#d946ef', '#8b5cf6', '#7c3aed', '#06b6d4', '#059669', '#0d9488',
  ];
  const headerPresets = [
    '#14161a', '#1e293b', '#1e1b4b', '#172554', '#022c22', '#3f3f46', '#44403c', '#0c0a09',
    '#18181b', '#1f2937', '#312e81', '#1e3a5f', '#064e3b', '#27272a', '#292524', '#ffffff',
  ];
  const bubblePresets = [
    '#ffffff', '#14161a', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#f5f5f4', '#1f2937', '#0ea5e9', '#14b8a6', '#84cc16', '#ec4899', '#7c3aed', '#f97316',
  ];
  const bubbleIconPresets = [
    '#14161a', '#ffffff', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b',
    '#1f2937', '#f5f5f4', '#0ea5e9', '#14b8a6', '#84cc16', '#ec4899', '#7c3aed', '#f97316',
  ];
  const botMsgPresets = [
    '#f5f5f5', '#e8f4f8', '#f0f0ff', '#fff8e1', '#fce4ec', '#e8f5e9', '#f3e5f5', '#e0f2f1',
    '#f5f5f0', '#e0f7fa', '#ede9fe', '#fef3c7', '#fce7f3', '#d1fae5', '#fae8ff', '#ccfbf1',
  ];
  const avatarPresets = [
    '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#84cc16', '#f59e0b', '#f97316',
    '#ef4444', '#e11d48', '#ec4899', '#d946ef', '#8b5cf6', '#7c3aed', '#06b6d4', '#059669',
  ];
  // Gradientele predefinite, cu culoare de inceput, de sfarsit si unghi
  const gradientPresets = [
    { name: 'Ocean', from: '#0ea5e9', to: '#6366f1', angle: 135 },
    { name: 'Sunset', from: '#f97316', to: '#ef4444', angle: 135 },
    { name: 'Aurora', from: '#6366f1', to: '#ec4899', angle: 135 },
    { name: 'Forest', from: '#10b981', to: '#06b6d4', angle: 135 },
    { name: 'Violet', from: '#8b5cf6', to: '#d946ef', angle: 135 },
    { name: 'Fire', from: '#ef4444', to: '#f59e0b', angle: 45 },
    { name: 'Mint', from: '#14b8a6', to: '#84cc16', angle: 135 },
    { name: 'Night', from: '#1e1b4b', to: '#7c3aed', angle: 135 },
    { name: 'Rose', from: '#ec4899', to: '#f59e0b', angle: 90 },
    { name: 'Arctic', from: '#06b6d4', to: '#3b82f6', angle: 180 },
    { name: 'Lava', from: '#dc2626', to: '#d946ef', angle: 135 },
    { name: 'Lime', from: '#84cc16', to: '#10b981', angle: 45 },
    { name: 'Deep Sea', from: '#0f172a', to: '#1e40af', angle: 135 },
    { name: 'Royal', from: '#1e40af', to: '#8b5cf6', angle: 135 },
    { name: 'Twilight', from: '#312e81', to: '#ec4899', angle: 135 },
    { name: 'Coral', from: '#f97316', to: '#ec4899', angle: 135 },
  ];

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all';

  // Valorile derivate din configuratie, folosite in previzualizari
  const pos = config.position === 'bottom-left' ? 'left' : 'right';
  const welcomeMsg = config.welcome_message || 'Buna! Cu ce te pot ajuta?';
  const botName = config.bot_name || 'AI Assistant';
  const botSub = config.bot_subtitle || 'AI Agent';
  // Culoarea accent: simpla sau gradient, daca exista culoarea de sfarsit
  const grad = config.gradient_end_color
    ? `linear-gradient(${config.gradient_angle ?? 135}deg, ${config.primary_color}, ${config.gradient_end_color})`
    : config.primary_color;
  // grad = culoare accent (solid sau gradient): se aplica pe header, bubble, mesaje
  // Imaginea avatarului, daca exista
  const avatarUrl = config.avatar_url || null;

  // Returneaza iconita SVG a butonului de chat dupa tipul ales
  const renderBubbleIconSvg = (iconType, size = 18, fillColor = '#14161a') => {
    switch (iconType) {
      case 'message':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 5L2 7" />
          </svg>
        );
      case 'support': {
        // Casca de suport - acelasi desen ca in widget/src/components/BubbleIcons.js
        return (
          <svg width={size} height={size} viewBox="256 31 514 514" fill={fillColor} stroke="none">
            <path d="M616.484192,387.457458 C637.145203,395.589355 657.852905,402.617889 677.641663,411.807831 C706.941101,425.414490 724.114075,448.330536 727.764648,480.717224 C728.587158,488.014771 725.465027,494.128967 719.472229,498.426788 C708.698914,506.153046 696.068176,509.584015 683.594788,513.140442 C657.888977,520.469788 631.576416,524.462341 604.946655,526.391113 C551.694153,530.248169 498.372681,529.582703 445.085480,527.889099 C408.080902,526.712952 371.416962,522.175598 335.825470,511.232269 C326.744080,508.440002 317.720856,505.411621 309.546539,500.425232 C302.027100,495.838379 297.523438,489.449005 298.511597,480.206543 C301.976624,447.797852 319.348999,425.177704 348.471100,411.856598 C372.700287,400.773682 397.888855,391.925964 422.802277,382.465515 C425.891357,381.292480 427.630981,382.246552 429.774384,384.287811 C475.286957,427.631531 549.985596,427.711823 595.971436,384.451813 C598.483948,382.088226 600.738708,381.313690 603.974060,382.718170 C607.941040,384.440216 612.065552,385.799408 616.484192,387.457458 Z" />
            <path d="M513.762451,393.478210 C485.014496,393.558716 462.797516,380.619720 444.257141,360.478394 C430.584991,345.625702 420.460449,328.433716 413.129120,309.614502 C412.334167,307.573883 411.637939,305.636566 412.879089,303.420074 C416.547882,296.868347 416.612946,289.885590 415.659882,282.594055 C412.189301,256.041504 408.975739,229.455338 405.666656,202.881668 C405.271820,199.711014 404.625153,196.473251 402.891052,193.876495 C400.240143,189.906860 400.776123,186.258789 402.258606,182.097946 C418.269409,137.160980 450.922180,113.050758 497.312347,106.680489 C528.434448,102.406822 557.288208,109.256462 583.244568,127.087120 C604.247253,141.514893 617.744446,161.459091 624.910278,185.802170 C625.339600,187.260727 625.815430,188.825500 624.937378,190.170563 C619.369263,198.701065 619.707703,208.624237 618.472046,218.107269 C615.700195,239.378891 613.350281,260.705170 610.746216,281.999146 C609.823975,289.540619 609.606934,296.875854 613.247864,303.949585 C615.220276,307.781769 611.148010,316.842529 607.041748,318.152863 C589.448792,323.766815 571.357239,326.140839 552.926941,326.150940 C550.667480,326.152191 548.737000,325.226410 546.934143,323.939331 C542.154297,320.526947 536.860840,319.027740 530.955322,319.265686 C525.630798,319.480316 520.290710,319.271973 514.958435,319.334320 C501.830017,319.487854 491.460785,329.889862 491.043518,343.269806 C490.610962,357.141113 500.155640,368.361481 513.517700,368.899536 C521.140015,369.206451 528.815613,369.880615 536.460388,368.790009 C539.309937,368.383514 542.188538,367.779144 544.394836,366.016418 C548.197021,362.978546 552.411621,362.610718 557.031738,362.557190 C564.455750,362.471161 571.873047,361.801819 579.515076,361.366333 C574.205078,372.597900 542.517395,394.630249 513.762451,393.478210 Z" />
            <path d="M346.693176,182.979950 C353.287811,149.425095 368.330414,120.735664 392.425842,97.086304 C418.590546,71.405991 450.092163,56.483746 486.441559,51.373772 C524.885071,45.969406 561.729187,50.920551 595.843384,69.532654 C643.432373,95.496422 671.828430,135.660660 680.394226,189.436752 C681.179749,194.367996 682.712158,198.018860 687.216309,201.202194 C697.939514,208.780838 702.348022,219.804977 701.485474,232.910629 C700.512390,247.697403 698.397583,262.359924 696.277771,277.001923 C694.136719,291.789825 685.834473,301.900177 671.483887,306.747498 C669.776611,307.324158 668.028809,307.665405 666.759460,309.284668 C651.746704,328.436157 630.976318,337.989044 608.270203,344.390411 C589.200256,349.766663 569.684448,351.471527 549.994812,351.856964 C546.881531,351.917908 544.015625,352.217621 541.916199,354.853607 C541.613647,355.233521 541.156921,355.500885 540.745728,355.782532 C535.834717,359.145691 513.163818,359.470276 508.159454,356.255249 C503.674835,353.374084 500.901367,347.068634 501.864380,341.943512 C503.027618,335.752716 507.701538,330.763275 513.884155,330.154175 C520.668030,329.485809 527.527100,329.526611 534.333435,330.240723 C537.192322,330.540680 540.177124,331.376343 541.905945,333.675140 C544.499207,337.123413 548.002258,337.611298 551.666382,337.457977 C571.499756,336.628082 591.193970,334.781952 610.268555,328.765594 C621.136658,325.337677 631.276550,320.483612 640.899719,314.336334 C645.321411,311.511719 647.032043,307.843689 647.590332,302.974396 C650.923828,273.903931 654.349121,244.844025 657.758789,215.782349 C658.494446,209.512314 658.216492,202.867081 660.281189,197.061737 C664.814697,184.314056 659.811340,173.043335 655.453125,162.120941 C634.467651,109.528069 595.491638,77.991493 539.836182,68.920441 C494.902496,61.596867 452.839111,70.422371 416.370361,99.114319 C388.145569,121.320290 371.268066,150.738892 363.767639,185.691406 C363.525879,186.817978 363.155579,188.126968 363.491364,189.135849 C368.261139,203.466415 368.272339,218.529938 370.264984,233.271683 C373.427521,256.667542 376.040924,280.137268 379.013580,303.559631 C379.401825,306.618500 378.976196,308.272644 375.502655,308.543243 C352.971771,310.298370 332.575867,300.921875 329.517853,274.512756 C327.795959,259.641876 325.202820,244.863907 324.660278,229.872650 C324.268219,219.040192 327.922089,209.268814 336.663513,203.141739 C344.069916,197.950424 346.123077,191.393219 346.693176,182.979950 M340.178284,227.044083 C339.642303,234.716431 341.325409,242.182465 342.299530,249.713242 C342.623383,252.216919 343.684570,254.546143 346.540436,254.149307 C349.230957,253.775467 350.101318,251.404816 349.815125,248.813599 C348.925385,240.758575 348.103210,232.692719 346.986023,224.668488 C346.686981,222.520432 347.438019,219.954346 345.108337,217.968887 C342.139374,219.949020 340.896698,222.871735 340.178284,227.044083 M684.649902,244.218979 C685.199890,238.789719 686.318665,233.397110 685.899780,227.902664 C685.597473,223.937775 684.652832,220.244278 680.305725,217.403610 C678.426392,228.786377 676.958984,239.546127 676.358521,250.420364 C676.254395,252.307388 677.209656,253.678680 679.080200,254.041992 C681.203125,254.454330 682.713379,253.186279 683.345520,251.395248 C684.052979,249.391083 684.220459,247.196320 684.649902,244.218979 Z" />
            <path d="M573.666382,104.326355 C522.186890,81.357742 473.913605,85.954811 428.771545,119.471420 C423.151825,123.643898 417.530640,125.950256 410.753693,122.823051 C405.702698,120.492279 405.414917,118.863808 409.433197,114.930725 C431.338837,93.489418 457.567322,80.263054 487.810974,76.188705 C535.954041,69.702995 579.571533,79.812653 615.792969,114.160110 C621.046509,119.141815 620.610535,121.025566 613.687134,123.446762 C608.311157,125.326813 603.446167,124.092094 599.153015,120.697876 C591.284973,114.477303 583.033936,108.886368 573.666382,104.326355 Z" />
            <path d="M402.042969,260.237366 C403.085358,268.597717 403.870117,276.539307 405.059204,284.419891 C406.820007,296.089386 401.880829,304.649445 392.041626,306.829529 C388.477936,307.619110 386.807983,306.770477 386.379639,302.958893 C384.616180,287.266754 382.691498,271.592621 380.794952,255.915634 C378.619537,237.933441 376.404724,219.956024 374.225586,201.974274 C373.965668,199.829636 374.065033,197.613968 373.576508,195.529999 C372.407837,190.544403 374.801575,189.446198 379.162476,189.664551 C386.618713,190.037918 393.096985,194.994995 394.556305,202.938751 C396.235260,212.078110 397.055206,221.375534 398.239227,230.605484 C399.487091,240.333405 400.724335,250.062668 402.042969,260.237366 Z" />
            <path d="M643.779663,268.558899 C642.434326,280.054901 641.072083,291.106262 640.014893,302.186737 C639.592163,306.617432 637.969727,307.908691 633.573425,306.606689 C625.013550,304.071472 619.806458,297.112213 620.879395,288.225800 C623.945007,262.834259 627.198608,237.465454 630.378601,212.087723 C630.791687,208.790512 630.900024,205.418762 631.681152,202.211029 C633.721069,193.834137 641.352905,188.716873 649.626526,189.678253 C652.390442,189.999435 653.328674,191.164871 652.983826,193.935684 C649.906616,218.660278 646.907349,243.394547 643.779663,268.558899 Z" />
          </svg>
        );
      }
      case 'lightning':
        // Bula ovala organica - inlocuieste fulgerul
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="10.3" rx="9" ry="7.3" />
            <path d="M8 16.3c-.4 2-1.7 3.5-1.7 3.5s2.3-.3 4-1.8" />
          </svg>
        );
      case 'heart':
        // Sclipici AI - un singur path, plus un al doilea mai mic cu aceeasi culoare (doar opacitate
        // diferita), deci merge perfect cu sistemul de o singura culoare configurabila a pachetului.
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="none">
            <path d="M12 2.5c.6 4.3 2 7.1 5.2 8.5-3.2 1.4-4.6 4.2-5.2 8.5-.6-4.3-2-7.1-5.2-8.5 3.2-1.4 4.6-4.2 5.2-8.5z" fill={fillColor} />
            <path d="M18.5 3c.25 1.7.8 2.8 2 3.4-1.2.6-1.75 1.7-2 3.4-.25-1.7-.8-2.8-2-3.4 1.2-.6 1.75-1.7 2-3.4z" fill={fillColor} opacity="0.65" />
          </svg>
        );
      case 'smile':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M8.3 13.3c.95 1.3 2.2 2 3.7 2s2.75-.7 3.7-2" />
            <circle cx="8.7" cy="9.8" r="1" fill={fillColor} stroke="none" />
            <circle cx="15.3" cy="9.8" r="1" fill={fillColor} stroke="none" />
          </svg>
        );
      case 'dots':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3C6.75 3 2.5 6.6 2.5 11s4.25 8 9.5 8c.86 0 1.7-.1 2.47-.28L19 21l-1.1-4.2C19.68 15.3 21.5 13.3 21.5 11c0-4.4-4.25-8-9.5-8z" />
            <circle cx="8.3" cy="11" r="1.05" fill={fillColor} stroke="none" />
            <circle cx="12" cy="11" r="1.05" fill={fillColor} stroke="none" />
            <circle cx="15.7" cy="11" r="1.05" fill={fillColor} stroke="none" />
          </svg>
        );
      case 'send':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2.5L11 13" />
            <path d="M21.5 2.5l-7 19-4-9-9-4 20-6z" />
          </svg>
        );
      case 'question':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={fillColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.5 11.2a8.3 8.3 0 01-11.9 7.5L4 20l1.3-4.6a8.3 8.3 0 1115.2-4.2z" />
            <path d="M9.6 9.3a2.4 2.4 0 014.65.8c0 1.6-2.25 1.8-2.25 3.4" />
            <circle cx="12" cy="16.6" r="0.25" fill={fillColor} stroke="none" />
          </svg>
        );
      case 'bot':
        // Avion de trimis (path oficial Font Awesome Solid "paper-plane")
        return (
          <svg width={size} height={size} viewBox="0 0 512 512" fill={fillColor} stroke="none">
            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-52.1 60.9c-6.1 7.1-15.6 9.9-24.5 7.1S192 484.6 192 475.2V416c0-4 1.5-7.8 4.2-10.7L365.6 219.6c7.3-8 6.9-20.1-.8-27.6s-19.7-8.1-27.9-.9L130.8 328.4l-109.7-44.1c-9.5-3.8-15.8-12.9-16.1-23.1s5.5-19.7 14.8-24.1l460.9-224c11.6-5.6 25-4.4 35.1 2.3z" />
          </svg>
        );
      case 'chat':
      default: {
        // Bula rotunjita cu 3 puncte decupate prin mask (gauri reale, nu culoare ghicita)
        const mid = `settings-chat-mask-${Math.random().toString(36).slice(2, 9)}`;
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="none">
            <defs>
              <mask id={mid}>
                <rect x="3" y="4" width="18" height="13" rx="5" fill="white" />
                <path d="M8 16.5L8 21 13 16.5z" fill="white" />
                <circle cx="8.5" cy="10.5" r="1.15" fill="black" />
                <circle cx="12" cy="10.5" r="1.15" fill="black" />
                <circle cx="15.5" cy="10.5" r="1.15" fill="black" />
              </mask>
            </defs>
            <g fill={fillColor} mask={`url(#${mid})`}>
              <rect x="3" y="4" width="18" height="13" rx="5" />
              <path d="M8 16.5L8 21 13 16.5z" />
            </g>
          </svg>
        );
      }
    }
  };

  // Previzualizarea temei clasice: fereastra de chat si butonul
  const renderClassicPreview = () => (
    <>
      {/* Fereastra de chat este desenata doar cand previzualizarea este deschisa */}
      {previewOpen && (
        <div
          className="absolute bottom-20 shadow-2xl overflow-hidden flex flex-col"
          style={{ width: '280px', borderRadius: '16px', [pos]: '16px', top: '70px' }}
        >
          <div className="text-white px-4 py-3 text-sm font-semibold flex items-center gap-2.5 flex-shrink-0" style={{ background: grad }}>
            <div style={{ position: 'relative' }}>
              <MiniAvatar size={Math.round((config.avatar_size || 42) * 0.67)} color={config.avatar_color} iconSize={Math.round((config.avatar_size || 42) * 0.29)} avatarUrl={avatarUrl} />
              {config.show_online_status !== false && (
                <div style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid transparent' }} />
              )}
            </div>
            <div>
              <div className="font-semibold leading-tight" style={{ fontSize: config.show_subtitle !== false ? '12px' : '14px' }}>{botName}</div>
              {config.show_subtitle !== false && (
                <div className="text-[10px] leading-tight mt-0.5 text-white/50">{botSub}</div>
              )}
            </div>
            <span onClick={handlePreviewClose} className="ml-auto text-xs cursor-pointer hover:opacity-70 text-white/40">&#x2715;</span>
          </div>
          <div ref={previewMsgsRef} className="bg-white flex-1 overflow-y-auto" style={{ padding: '10px 14px' }}>
            {/* Fiecare mesaj din previzualizare */}
            {previewMessages.map((msg, i) =>
              msg.role === 'assistant' ? (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <div className="text-xs p-2.5 rounded-xl rounded-bl-sm inline-block text-gray-700 max-w-[220px]" style={{ backgroundColor: config.bot_message_color || '#f5f5f5' }}>
                    {msg.content}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 ml-0.5">{botName} &middot; Chiar acum</div>
                </div>
              ) : (
                <div key={i} className="flex justify-end" style={{ marginBottom: '8px' }}>
                  <div className="text-xs p-2.5 rounded-xl rounded-br-sm text-white max-w-[180px]" style={{ background: config.user_message_color || grad }}>
                    {msg.content}
                  </div>
                </div>
              )
            )}
            {/* Indicatorul ca botul scrie */}
            {previewTyping && (
              <div style={{ marginBottom: '8px' }}>
                <div className="text-xs p-2.5 rounded-xl rounded-bl-sm inline-flex gap-1 items-center" style={{ backgroundColor: config.bot_message_color || '#f5f5f5' }}>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="bg-white border-t border-gray-100 px-3 py-2 flex-shrink-0">
            <div style={{ marginBottom: '4px' }}>
              <input
                type="text"
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                placeholder={config.placeholder_text || 'Mesaj...'}
                disabled={previewTyping}
                style={{ width: '100%', fontSize: '10px', border: 'none', outline: 'none', background: 'transparent', color: '#374151', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                {config.enable_attachments !== false && (
                  <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                {config.enable_emoji !== false && (
                  <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path fill="currentColor" d="M5.8 7.5a.9.9 0 100-1.8.9.9 0 000 1.8zm4.4 0a.9.9 0 100-1.8.9.9 0 000 1.8z"/>
                      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M10 10c-.44.6-1.17 1-2 1s-1.56-.4-2-1"/>
                    </svg>
                  </div>
                )}
              </div>
              <div onClick={handlePreviewSend} className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" style={{ backgroundColor: config.send_button_color || config.primary_color }}>
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5A.85.85 0 1111.9 7.6L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601A.85.85 0 112.9 6.399z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Butonul de chat apare cand fereastra este inchisa */}
      {!previewOpen && (() => {
        const isCustomBubble = config.bubble_color && config.bubble_color !== '#ffffff';
        const bubbleBg = isCustomBubble ? config.bubble_color : grad;
        const bubbleIcon = isCustomBubble ? (config.bubble_icon_color || '#14161a') : '#ffffff';
        return (
          <div
            onClick={handlePreviewOpen}
            className="absolute bottom-4 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            style={{
              background: bubbleBg,
              [pos]: '16px',
              boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06), 0 2px 32px 0 rgba(0,0,0,0.16)',
            }}
          >
            {renderBubbleIconSvg(config.bubble_icon, 20, bubbleIcon)}
          </div>
        );
      })()}
    </>
  );

  // Previzualizarea temei livechat
  const renderLiveChatPreview = () => (
    <>
      {previewOpen && (
        <div
          className="absolute bottom-20"
          style={{
            width: '280px', [pos]: '16px', top: '70px',
            padding: '8px',
          }}
        >
          {/* Containerul interior, cu aceeasi structura ca widget-ul real */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%',
            borderRadius: '18px',
            background: 'rgb(246, 246, 247)',
            boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Zona de antet, care pluteste peste mesaje */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              zIndex: 3, pointerEvents: 'none',
            }}>
              {/* Simularea estomparii fundalului */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '62px',
                background: 'linear-gradient(to bottom, rgb(246,246,247) 55%, transparent)',
                pointerEvents: 'none',
              }} />

              {/* Randul cu butoanele de sus */}
              <div style={{
                position: 'relative', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 6px 0', pointerEvents: 'auto',
              }}>
                {/* Butonul de meniu */}
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgb(221,221,221)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 28 28" style={{ width: '14px', height: '14px', fill: 'rgb(17,17,17)' }}>
                    <path d="M7,16 C8.1045695,16 9,15.1045695 9,14 C9,12.8954305 8.1045695,12 7,12 C5.8954305,12 5,12.8954305 5,14 C5,15.1045695 5.8954305,16 7,16 Z M14,16 C15.1045695,16 16,15.1045695 16,14 C16,12.8954305 15.1045695,12 14,12 C12.8954305,12 12,12.8954305 12,14 C12,15.1045695 12.8954305,16 14,16 Z M21,16 C22.1045695,16 23,15.1045695 23,14 C23,12.8954305 22.1045695,12 21,12 C19.8954305,12 19,12.8954305 19,14 C19,15.1045695 19.8954305,16 21,16 Z" />
                  </svg>
                </div>
                {/* Butonul de minimizare, cu iconita din widget */}
                <div onClick={handlePreviewClose} style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgb(221,221,221)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}>
                  <svg viewBox="0 0 28 28" style={{ width: '14px', height: '14px', fill: 'rgb(17,17,17)' }}>
                    <path d="M21,18 C21.5522847,18 22,18.4477153 22,19 C22,19.5522847 21.5522847,20 21,20 L7,20 C6.44771525,20 6,19.5522847 6,19 C6,18.4477153 6.44771525,18 7,18 L21,18 Z" fillRule="nonzero" />
                  </svg>
                </div>
              </div>

              {/* Bara agentului, in stil Dynamic Island */}
              <div style={{
                position: 'absolute', top: '7px', left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '5px 10px', borderRadius: '16px',
                  background: 'white',
                  boxShadow: 'rgba(0,0,0,0.08) 0px 0.48px 2.41px -0.38px, rgba(0,0,0,0.25) 0px 4px 20px -0.75px',
                  outline: 'rgb(227,227,227) solid 1px', outlineOffset: '-1px',
                  pointerEvents: 'auto',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <MiniAvatar size={Math.round((config.avatar_size || 42) * 0.48)} color={config.avatar_color} iconSize={Math.round((config.avatar_size || 42) * 0.24)} avatarUrl={avatarUrl} />
                    {config.show_online_status !== false && (
                      <div style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: 'rgb(38, 135, 80)', border: '1.5px solid white',
                      }} />
                    )}
                  </div>
                  <span style={{ fontSize: config.show_subtitle !== false ? '9px' : '10px', fontWeight: 'bold', color: 'rgb(17,17,17)', marginLeft: '6px', whiteSpace: 'nowrap' }}>
                    {botName}
                  </span>
                </div>
              </div>
            </div>

            {/* Zona de mesaje, care trece pe sub antet ca in widget-ul real */}
            <div ref={previewMsgsRef} style={{
              padding: '58px 12px 8px',
              flex: 1, overflowY: 'auto',
            }}>
              {previewMessages.map((msg, i) => {
                const prevMsg = i > 0 ? previewMessages[i - 1] : null;
                const prevIsSameRole = prevMsg && prevMsg.role === msg.role;

                return msg.role === 'assistant' ? (
                  <div key={i} style={{ display: 'flex', marginBottom: '8px' }}>
                    {!prevIsSameRole ? (
                      <div style={{ marginRight: '6px', flexShrink: 0 }}>
                        <MiniAvatar size={16} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                      </div>
                    ) : (
                      <div style={{ minWidth: '22px' }} />
                    )}
                    <div style={{
                      display: 'inline-block', maxWidth: '180px',
                      background: 'white', borderRadius: '8px', padding: '7px 10px',
                      fontSize: '10px', color: 'rgb(17,17,17)',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row-reverse', marginBottom: '8px' }}>
                    <div style={{
                      display: 'inline-block', maxWidth: '170px',
                      background: config.user_message_color || config.primary_color, borderRadius: '8px', padding: '7px 10px',
                      fontSize: '10px', color: 'white',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {previewTyping && (
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ marginRight: '6px', flexShrink: 0 }}>
                    <MiniAvatar size={16} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                  </div>
                  <div>
                    <div style={{
                      display: 'inline-flex', gap: '3px', alignItems: 'center',
                      background: 'white', borderRadius: '8px', padding: '8px 12px',
                      boxShadow: 'rgba(0,0,0,0.15) 0px 0.6px 0.54px -1.33px, rgba(0,0,0,0.13) 0px 2.29px 2.06px -2.67px',
                    }}>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <div style={{ fontSize: '8px', color: 'rgb(112,112,112)', marginTop: '2px' }}>
                      {botName} scrie...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Zona de scris, cu aceeasi structura ca widget-ul real */}
            <div style={{ flexShrink: 0, margin: '0 10px' }}>
              <div style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                height: '32px',
              }}>
                {/* Butonul de atasare */}
                {config.enable_attachments !== false && (
                  <div style={{
                    position: 'absolute', left: '5px', zIndex: 1,
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgb(248,248,248)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'rgb(17,17,17)',
                  }}>
                    <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                      <path d="M23,15 C23.5522847,15 24,15.4477153 24,16 C24,16.5522847 23.5522847,17 23,17 L17,16.99905 L17.00005,23.00005 C17.00005,23.5523347 16.5523347,24.00005 16.00005,24.00005 C15.4477653,24.00005 15.00005,23.5523347 15.00005,23.00005 L15,16.99905 L9,17 C8.44771525,17 8,16.5522847 8,16 C8,15.4477153 8.44771525,15 9,15 L15,14.99905 L15.00005,9.00005 C15.00005,8.44776525 15.4477653,8.00005 16.00005,8.00005 C16.5523347,8.00005 17.00005,8.44776525 17.00005,9.00005 L17,15 L23,15 Z" />
                    </svg>
                  </div>
                )}

                {/* Campul de text in forma de pilula */}
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                  placeholder={config.placeholder_text || 'Mesaj...'}
                  disabled={previewTyping}
                  style={{
                    width: '100%', height: '32px',
                    padding: `0 56px 0 ${config.enable_attachments !== false ? '32px' : '14px'}`,
                    border: '1px solid rgb(227,227,227)',
                    borderRadius: '20px',
                    background: 'rgb(251,251,251)',
                    fontSize: '9px', fontFamily: 'inherit',
                    color: 'rgb(17,17,17)', outline: 'none',
                    boxShadow: 'rgba(0,0,0,0.075) 0px 0.6px 2.05px -1.33px, rgba(0,0,0,0.067) 0px 2.29px 7.78px -2.67px',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Butoanele din dreapta: emoji si trimitere */}
                <div style={{
                  position: 'absolute', right: '5px',
                  display: 'flex', alignItems: 'center', gap: '2px', zIndex: 1,
                }}>
                  {/* Butonul de emoji */}
                  {config.enable_emoji !== false && (
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgb(248,248,248)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: 'rgb(17,17,17)',
                    }}>
                      <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'none' }}>
                        <g stroke="none" strokeWidth="2" fillRule="evenodd" transform="translate(7, 7)">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M0,9 C0,13.97 4.03,18 9,18 C13.97,18 18,13.97 18,9 C18,4.03 13.97,0 9,0 C4.03,0 0,4.03 0,9" />
                          <path stroke="currentColor" strokeLinecap="round" d="M6,7 L6.01,7 M12,7 L12.01,7" />
                          <path d="M6.5,12 C7.16,12.67 8.06,13.05 9,13.05 C9.94,13.05 10.84,12.67 11.5,12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      </svg>
                    </div>
                  )}
                  {/* Butonul de trimitere */}
                  <div onClick={handlePreviewSend} style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: previewInput.trim() ? (config.send_button_color || config.primary_color || 'rgb(17,17,17)') : 'rgb(227,227,227)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 200ms',
                    color: previewInput.trim() ? 'white' : 'rgb(179,179,179)',
                  }}>
                    <svg viewBox="0 0 32 32" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                      <path d="M16.7071068,8.29289322 L22.7071068,14.2928932 C23.0976311,14.6834175 23.0976311,15.3165825 22.7071068,15.7071068 C22.3466228,16.0675907 21.7793918,16.0953203 21.3871006,15.7902954 L21.2928932,15.7071068 L17,11.414 L17,24 C17,24.5128358 16.6139598,24.9355072 16.1166211,24.9932723 L16,25 C15.4871642,25 15.0644928,24.6139598 15.0067277,24.1166211 L15,24 L15,11.414 L10.7071068,15.7071068 C10.3466228,16.0675907 9.77939176,16.0953203 9.38710056,15.7902954 L9.29289322,15.7071068 C8.93240926,15.3466228 8.90467972,14.7793918 9.20970461,14.3871006 L9.29289322,14.2928932 L15.2928932,8.29289322 C15.6533772,7.93240926 16.2206082,7.90467972 16.6128994,8.20970461 L16.7071068,8.29289322 Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsolul cu mentiunea de atribuire */}
            <div style={{
              flexShrink: 0, textAlign: 'center',
              padding: '4px 0 6px', fontSize: '8px', color: 'rgb(87,87,87)',
            }}>
              Powered by <strong style={{ color: 'rgb(17,17,17)' }}>ChatBot</strong>
            </div>
          </div>
        </div>
      )}

      {/* Butonul de chat al temei livechat, la fel ca in widget-ul real */}
      {!previewOpen && (
        <div
          onClick={handlePreviewOpen}
          className="absolute bottom-4 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            width: '40px', height: '40px',
            backgroundColor: config.bubble_color || '#fff',
            [pos]: '16px',
            boxShadow: 'rgba(0,0,0,0.125) 0px 0.362176px 0.941657px -1px, rgba(0,0,0,0.18) 0px 3px 7.8px -2px',
          }}
        >
          {renderBubbleIconSvg(config.bubble_icon, 16, config.bubble_icon_color || '#111')}
        </div>
      )}
    </>
  );

  // Previzualizarea temei modern
  const renderModernPreview = () => (
    <>
      {previewOpen && (
        <div
          className="absolute bottom-20 overflow-hidden flex flex-col"
          style={{
            width: '280px', borderRadius: '16px', [pos]: '16px', top: '70px',
            background: grad,
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* Antetul cu gradient */}
          <div style={{
            background: grad, padding: '12px 12px 14px',
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <MiniAvatar size={Math.round((config.avatar_size || 42) * 0.67)} color={config.avatar_color} iconSize={Math.round((config.avatar_size || 42) * 0.29)} avatarUrl={avatarUrl} borderStyle="1.5px solid rgba(255,255,255,0.25)" />
              {config.show_online_status !== false && (
                <div style={{
                  position: 'absolute', bottom: '0px', right: '0px',
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#22c55e', border: '1.5px solid rgba(255,255,255,0.9)',
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: config.show_subtitle !== false ? '11px' : '13px', lineHeight: '1.3' }}>{botName}</div>
              {config.show_subtitle !== false && (
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '9px', lineHeight: '1.3', marginTop: '1px' }}>{botSub}</div>
              )}
            </div>
            <div onClick={handlePreviewClose} style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>

          {/* Zona de continut alba */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', minHeight: 0, borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
            {/* Zona de mesaje */}
            <div ref={previewMsgsRef} style={{ padding: '10px 12px 8px', background: '#f8f9fb', flex: 1, overflowY: 'auto' }}>
              {previewMessages.map((msg, i) =>
                msg.role === 'assistant' ? (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '6px' }}>
                    <MiniAvatar size={18} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                    <div style={{
                      background: '#ffffff', borderRadius: '12px 12px 12px 3px', padding: '7px 10px',
                      fontSize: '10px', color: '#1f2937', maxWidth: '180px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                    <div style={{
                      background: config.user_message_color || grad, borderRadius: '12px 12px 3px 12px', padding: '7px 10px',
                      fontSize: '10px', color: 'white', maxWidth: '150px',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                )
              )}
              {previewTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', marginBottom: '6px' }}>
                  <MiniAvatar size={18} color={config.avatar_color} iconSize={8} avatarUrl={avatarUrl} />
                  <div style={{
                    background: '#ffffff', borderRadius: '12px 12px 12px 3px', padding: '7px 10px',
                    display: 'flex', gap: '3px', alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>


            {/* Separator */}
            <div style={{ height: '1px', background: '#f0f1f3' }} />

            {/* Randul de scris */}
            <div style={{ padding: '8px 10px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {config.enable_attachments !== false && (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#f0f1f3', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
              )}
              {config.enable_emoji !== false && (
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#f0f1f3', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path fill="currentColor" d="M5.8 7.5a.9.9 0 100-1.8.9.9 0 000 1.8zm4.4 0a.9.9 0 100-1.8.9.9 0 000 1.8z"/>
                    <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M10 10c-.44.6-1.17 1-2 1s-1.56-.4-2-1"/>
                  </svg>
                </div>
              )}
              <div style={{
                flex: 1, height: '26px', borderRadius: '14px',
                border: '1.5px solid #e5e7eb', background: '#f5f5f7',
                display: 'flex', alignItems: 'center', padding: '0 8px',
              }}>
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePreviewSend()}
                  placeholder={config.placeholder_text || 'Mesaj...'}
                  disabled={previewTyping}
                  style={{ width: '100%', fontSize: '9px', border: 'none', outline: 'none', background: 'transparent', color: '#1f2937', fontFamily: 'inherit' }}
                />
              </div>
              <div onClick={handlePreviewSend} style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: previewInput.trim() ? (config.send_button_color || grad) : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, cursor: 'pointer', transition: 'background 200ms',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l7-7 7 7" /><path d="M12 5v14" />
                </svg>
              </div>
            </div>

            {/* Subsol */}
            <div style={{ textAlign: 'center', padding: '2px 0 7px', fontSize: '8px', color: '#b0b4ba' }}>
              Powered by <strong style={{ color: '#8b8f96' }}>ChatBot</strong>
            </div>
          </div>
        </div>
      )}

      {/* Butonul de chat cu gradient al temei modern */}
      {!previewOpen && (
        <div
          onClick={handlePreviewOpen}
          className="absolute bottom-4 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            width: '40px', height: '40px',
            background: grad,
            [pos]: '16px',
            boxShadow: `0 4px 15px ${config.primary_color}66`,
          }}
        >
          {renderBubbleIconSvg(config.bubble_icon, 17, 'white')}
        </div>
      )}
    </>
  );

  // Alege previzualizarea dupa tema configurata
  const renderPreview = () => {
    switch (config.widget_theme) {
      case 'livechat': return renderLiveChatPreview();
      case 'modern': return renderModernPreview();
      default: return renderClassicPreview();
    }
  };

  // Unele sectiuni de culoare apar doar la anumite teme
  const theme = config.widget_theme;
  const showBubbleColors = theme !== 'modern';
  const showBotMsgColor = theme === 'default';

  return (
    <div className="animate-page-enter">
      <PageHeader
        title="Setări Widget"
        subtitle="Personalizeaza aspectul si comportamentul widget-ului."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stanga: sectiunile pliabile */}
        <div className="space-y-3">
          {/* Sectiunea cu tema widget-ului */}
          <Accordion
            title="Tema Widget"
            icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            defaultOpen
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'default', label: 'Edge' },
                { value: 'livechat', label: 'Island' },
                { value: 'modern', label: 'Aurora' },
              ].map((t) => (
                <label
                  key={t.value}
                  className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    config.widget_theme === t.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input type="radio" name="widget_theme" value={t.value} checked={config.widget_theme === t.value} onChange={(e) => setConfig({ ...config, widget_theme: e.target.value })} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.widget_theme === t.value ? 'border-primary' : 'border-gray-300 dark:border-gray-500'}`}>
                    {config.widget_theme === t.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          <Accordion
            title="Identitate Bot"
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nume bot</label>
                <input type="text" value={config.bot_name} onChange={(e) => setConfig({ ...config, bot_name: e.target.value })} className={inputClass} placeholder="AI Assistant" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Subtitlu</label>
                <input type="text" value={config.bot_subtitle} onChange={(e) => setConfig({ ...config, bot_subtitle: e.target.value })} className={inputClass} placeholder="AI Agent" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Mesaj de intampinare</label>
                <textarea value={config.welcome_message} onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Scrie mesajul de bun venit..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Text placeholder</label>
                <input type="text" value={config.placeholder_text} onChange={(e) => setConfig({ ...config, placeholder_text: e.target.value })} className={inputClass} placeholder="Mesaj..." />
              </div>
            </div>
          </Accordion>

          {/* Sectiunea pentru avatar */}
          <Accordion title="Avatar" icon="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z">
            <div className="space-y-5">
              {/* Incarcarea imaginii de avatar */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Imagine avatar / logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-gray-200 dark:border-gray-600" style={{ background: config.avatar_url ? 'transparent' : config.avatar_color }}>
                    {/* Previzualizarea avatarului incarcat, altfel un loc gol */}
                    {config.avatar_url ? (
                      <img src={config.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <button
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-4 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Se incarca...' : 'Incarca imagine'}
                    </button>
                    {config.avatar_url && (
                      <button
                        onClick={handleAvatarDelete}
                        className="px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Sterge imaginea
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">PNG, JPG, GIF, WebP sau SVG. Se foloseste ca avatar in chat.</p>
              </div>
              {/* Culoarea folosita cand nu exista imagine */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare avatar (fallback)</label>
                <ColorPicker
                  value={config.avatar_color}
                  onChange={(c) => setConfig({ ...config, avatar_color: c })}
                  presets={avatarPresets}
                />
              </div>
              {/* Cursorul pentru dimensiunea avatarului */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Dimensiune avatar header</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={24}
                    max={60}
                    step={2}
                    value={config.avatar_size || 42}
                    onChange={(e) => setConfig({ ...config, avatar_size: parseInt(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-10 text-right">{config.avatar_size || 42}px</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Marimea avatarului din header-ul widget-ului (24-60px)</p>
              </div>
            </div>
          </Accordion>

          {/* Sectiunea pentru culoarea accent, simpla sau gradient */}
          <Accordion title="Culoare accent" icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01">
            {/* Comutatorul intre culoare simpla si gradient */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 mb-4">
              <button
                onClick={() => setConfig({ ...config, gradient_end_color: null })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  !config.gradient_end_color
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-400'
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => {
                  if (!config.gradient_end_color) {
                    const p = gradientPresets[0];
                    setConfig({ ...config, primary_color: p.from, gradient_end_color: p.to, gradient_angle: p.angle });
                  }
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  config.gradient_end_color
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-400'
                }`}
              >
                Gradient
              </button>
            </div>

            {/* Culoare simpla sau gradient, dupa cum exista culoarea de sfarsit */}
            {!config.gradient_end_color ? (
              /* ── Modul culoare simpla: bara principala este in ColorPicker ── */
              <ColorPicker
                value={config.primary_color}
                onChange={(c) => setConfig({ ...config, primary_color: c })}
                presets={accentPresets}
              />
            ) : (
              /* ── Modul gradient ── */
              <div className="space-y-4">
                {/* Previzualizarea gradientului */}
                <div
                  className="h-10 rounded-xl relative overflow-hidden"
                  style={{ background: `linear-gradient(${config.gradient_angle ?? 135}deg, ${config.primary_color}, ${config.gradient_end_color})` }}
                />

                {/* Gradiente predefinite */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Preset-uri</label>
                  <div className="grid grid-cols-4 gap-2">
                    {/* Cate o mostra pentru fiecare gradient predefinit */}
                    {gradientPresets.map((p, i) => {
                      const active = config.primary_color === p.from && config.gradient_end_color === p.to;
                      return (
                        <button
                          key={i}
                          onClick={() => setConfig({ ...config, primary_color: p.from, gradient_end_color: p.to, gradient_angle: p.angle })}
                          className={`h-8 rounded-lg relative overflow-hidden transition-all hover:scale-105 ${
                            active ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-gray-800' : 'hover:shadow-md'
                          }`}
                          style={{ background: `linear-gradient(${p.angle}deg, ${p.from}, ${p.to})` }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/80 drop-shadow-sm">
                            {p.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ajustarea culorilor de inceput si de sfarsit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Start</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.primary_color} onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent flex-shrink-0" />
                      <input type="text" value={config.primary_color} onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase tracking-wider" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">End</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.gradient_end_color} onChange={(e) => setConfig({ ...config, gradient_end_color: e.target.value })}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent flex-shrink-0" />
                      <input type="text" value={config.gradient_end_color} onChange={(e) => setConfig({ ...config, gradient_end_color: e.target.value })}
                        className="flex-1 min-w-0 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs font-mono bg-gray-50/50 dark:bg-gray-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase tracking-wider" />
                    </div>
                  </div>
                </div>

                {/* Directia gradientului */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Directie</label>
                  <div className="flex gap-1.5">
                    {[
                      { angle: 0, arrow: '↑' }, { angle: 45, arrow: '↗' }, { angle: 90, arrow: '→' }, { angle: 135, arrow: '↘' },
                      { angle: 180, arrow: '↓' }, { angle: 225, arrow: '↙' }, { angle: 270, arrow: '←' }, { angle: 315, arrow: '↖' },
                    ].map((d) => (
                      <button
                        key={d.angle}
                        onClick={() => setConfig({ ...config, gradient_angle: d.angle })}
                        className={`w-8 h-8 rounded-lg text-sm transition-all ${
                          (config.gradient_angle ?? 135) === d.angle
                            ? 'ring-2 ring-primary bg-primary/10 text-primary font-bold'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {d.arrow}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Accordion>


          {/* Culoarea mesajelor botului apare doar la tema implicita */}
          {showBotMsgColor && (
            <Accordion title="Culoare mesaje bot" icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z">
              <ColorPicker
                value={config.bot_message_color}
                onChange={(c) => setConfig({ ...config, bot_message_color: c })}
                presets={botMsgPresets}
              />
            </Accordion>
          )}

          {/* Sectiunea pentru culorile butonului de trimitere si ale mesajelor vizitatorului */}
          <Accordion title="Culori personalizate" icon="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare buton Send</label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setConfig({ ...config, send_button_color: null })}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      !config.send_button_color
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Automat (culoare primara)
                  </button>
                  {!config.send_button_color && (
                    <button
                      onClick={() => setConfig({ ...config, send_button_color: config.primary_color })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Personalizeaza
                    </button>
                  )}
                </div>
                {config.send_button_color && (
                  <ColorPicker
                    value={config.send_button_color}
                    onChange={(c) => setConfig({ ...config, send_button_color: c })}
                    presets={accentPresets}
                  />
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare mesaje utilizator</label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setConfig({ ...config, user_message_color: null })}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                      !config.user_message_color
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Automat (culoare primara)
                  </button>
                  {!config.user_message_color && (
                    <button
                      onClick={() => setConfig({ ...config, user_message_color: config.primary_color })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      Personalizeaza
                    </button>
                  )}
                </div>
                {config.user_message_color && (
                  <ColorPicker
                    value={config.user_message_color}
                    onChange={(c) => setConfig({ ...config, user_message_color: c })}
                    presets={accentPresets}
                  />
                )}
              </div>
            </div>
          </Accordion>

          {/* Culorile butonului flotant nu se aplica la tema modern */}
          {showBubbleColors && (
            <Accordion title="Buton flotant" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare bubble</label>
                  <ColorPicker
                    value={config.bubble_color}
                    onChange={(c) => setConfig({ ...config, bubble_color: c })}
                    presets={bubblePresets}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Culoare icon</label>
                  <ColorPicker
                    value={config.bubble_icon_color}
                    onChange={(c) => setConfig({ ...config, bubble_icon_color: c })}
                    presets={bubbleIconPresets}
                  />
                </div>
              </div>
            </Accordion>
          )}

          {/* Sectiunea pentru iconita butonului de chat */}
          <Accordion title="Iconita buton" icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
            <div className="grid grid-cols-3 gap-2">
              {[
                // Fiecare thumbnail foloseste exact aceleasi path-uri ca widget/src/components/BubbleIcons.js,
                // ca iconita aleasa aici sa arate identic cu cea din widget-ul real.
                { value: 'chat', label: 'Chat', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none">
                    <defs><mask id="picker-chat-mask"><rect x="3" y="4" width="18" height="13" rx="5" fill="white" /><path d="M8 16.5L8 21 13 16.5z" fill="white" /><circle cx="8.5" cy="10.5" r="1.15" fill="black" /><circle cx="12" cy="10.5" r="1.15" fill="black" /><circle cx="15.5" cy="10.5" r="1.15" fill="black" /></mask></defs>
                    <g fill="currentColor" mask="url(#picker-chat-mask)"><rect x="3" y="4" width="18" height="13" rx="5" /><path d="M8 16.5L8 21 13 16.5z" /></g>
                  </svg>
                )},
                { value: 'message', label: 'Mesaj', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 5L2 7" />
                  </svg>
                )},
                { value: 'support', label: 'Suport', icon: (
                  <svg width="20" height="20" viewBox="256 31 514 514" fill="currentColor" stroke="none">
                    <path d="M616.484192,387.457458 C637.145203,395.589355 657.852905,402.617889 677.641663,411.807831 C706.941101,425.414490 724.114075,448.330536 727.764648,480.717224 C728.587158,488.014771 725.465027,494.128967 719.472229,498.426788 C708.698914,506.153046 696.068176,509.584015 683.594788,513.140442 C657.888977,520.469788 631.576416,524.462341 604.946655,526.391113 C551.694153,530.248169 498.372681,529.582703 445.085480,527.889099 C408.080902,526.712952 371.416962,522.175598 335.825470,511.232269 C326.744080,508.440002 317.720856,505.411621 309.546539,500.425232 C302.027100,495.838379 297.523438,489.449005 298.511597,480.206543 C301.976624,447.797852 319.348999,425.177704 348.471100,411.856598 C372.700287,400.773682 397.888855,391.925964 422.802277,382.465515 C425.891357,381.292480 427.630981,382.246552 429.774384,384.287811 C475.286957,427.631531 549.985596,427.711823 595.971436,384.451813 C598.483948,382.088226 600.738708,381.313690 603.974060,382.718170 C607.941040,384.440216 612.065552,385.799408 616.484192,387.457458 Z" />
                    <path d="M513.762451,393.478210 C485.014496,393.558716 462.797516,380.619720 444.257141,360.478394 C430.584991,345.625702 420.460449,328.433716 413.129120,309.614502 C412.334167,307.573883 411.637939,305.636566 412.879089,303.420074 C416.547882,296.868347 416.612946,289.885590 415.659882,282.594055 C412.189301,256.041504 408.975739,229.455338 405.666656,202.881668 C405.271820,199.711014 404.625153,196.473251 402.891052,193.876495 C400.240143,189.906860 400.776123,186.258789 402.258606,182.097946 C418.269409,137.160980 450.922180,113.050758 497.312347,106.680489 C528.434448,102.406822 557.288208,109.256462 583.244568,127.087120 C604.247253,141.514893 617.744446,161.459091 624.910278,185.802170 C625.339600,187.260727 625.815430,188.825500 624.937378,190.170563 C619.369263,198.701065 619.707703,208.624237 618.472046,218.107269 C615.700195,239.378891 613.350281,260.705170 610.746216,281.999146 C609.823975,289.540619 609.606934,296.875854 613.247864,303.949585 C615.220276,307.781769 611.148010,316.842529 607.041748,318.152863 C589.448792,323.766815 571.357239,326.140839 552.926941,326.150940 C550.667480,326.152191 548.737000,325.226410 546.934143,323.939331 C542.154297,320.526947 536.860840,319.027740 530.955322,319.265686 C525.630798,319.480316 520.290710,319.271973 514.958435,319.334320 C501.830017,319.487854 491.460785,329.889862 491.043518,343.269806 C490.610962,357.141113 500.155640,368.361481 513.517700,368.899536 C521.140015,369.206451 528.815613,369.880615 536.460388,368.790009 C539.309937,368.383514 542.188538,367.779144 544.394836,366.016418 C548.197021,362.978546 552.411621,362.610718 557.031738,362.557190 C564.455750,362.471161 571.873047,361.801819 579.515076,361.366333 C574.205078,372.597900 542.517395,394.630249 513.762451,393.478210 Z" />
                    <path d="M346.693176,182.979950 C353.287811,149.425095 368.330414,120.735664 392.425842,97.086304 C418.590546,71.405991 450.092163,56.483746 486.441559,51.373772 C524.885071,45.969406 561.729187,50.920551 595.843384,69.532654 C643.432373,95.496422 671.828430,135.660660 680.394226,189.436752 C681.179749,194.367996 682.712158,198.018860 687.216309,201.202194 C697.939514,208.780838 702.348022,219.804977 701.485474,232.910629 C700.512390,247.697403 698.397583,262.359924 696.277771,277.001923 C694.136719,291.789825 685.834473,301.900177 671.483887,306.747498 C669.776611,307.324158 668.028809,307.665405 666.759460,309.284668 C651.746704,328.436157 630.976318,337.989044 608.270203,344.390411 C589.200256,349.766663 569.684448,351.471527 549.994812,351.856964 C546.881531,351.917908 544.015625,352.217621 541.916199,354.853607 C541.613647,355.233521 541.156921,355.500885 540.745728,355.782532 C535.834717,359.145691 513.163818,359.470276 508.159454,356.255249 C503.674835,353.374084 500.901367,347.068634 501.864380,341.943512 C503.027618,335.752716 507.701538,330.763275 513.884155,330.154175 C520.668030,329.485809 527.527100,329.526611 534.333435,330.240723 C537.192322,330.540680 540.177124,331.376343 541.905945,333.675140 C544.499207,337.123413 548.002258,337.611298 551.666382,337.457977 C571.499756,336.628082 591.193970,334.781952 610.268555,328.765594 C621.136658,325.337677 631.276550,320.483612 640.899719,314.336334 C645.321411,311.511719 647.032043,307.843689 647.590332,302.974396 C650.923828,273.903931 654.349121,244.844025 657.758789,215.782349 C658.494446,209.512314 658.216492,202.867081 660.281189,197.061737 C664.814697,184.314056 659.811340,173.043335 655.453125,162.120941 C634.467651,109.528069 595.491638,77.991493 539.836182,68.920441 C494.902496,61.596867 452.839111,70.422371 416.370361,99.114319 C388.145569,121.320290 371.268066,150.738892 363.767639,185.691406 C363.525879,186.817978 363.155579,188.126968 363.491364,189.135849 C368.261139,203.466415 368.272339,218.529938 370.264984,233.271683 C373.427521,256.667542 376.040924,280.137268 379.013580,303.559631 C379.401825,306.618500 378.976196,308.272644 375.502655,308.543243 C352.971771,310.298370 332.575867,300.921875 329.517853,274.512756 C327.795959,259.641876 325.202820,244.863907 324.660278,229.872650 C324.268219,219.040192 327.922089,209.268814 336.663513,203.141739 C344.069916,197.950424 346.123077,191.393219 346.693176,182.979950 M340.178284,227.044083 C339.642303,234.716431 341.325409,242.182465 342.299530,249.713242 C342.623383,252.216919 343.684570,254.546143 346.540436,254.149307 C349.230957,253.775467 350.101318,251.404816 349.815125,248.813599 C348.925385,240.758575 348.103210,232.692719 346.986023,224.668488 C346.686981,222.520432 347.438019,219.954346 345.108337,217.968887 C342.139374,219.949020 340.896698,222.871735 340.178284,227.044083 M684.649902,244.218979 C685.199890,238.789719 686.318665,233.397110 685.899780,227.902664 C685.597473,223.937775 684.652832,220.244278 680.305725,217.403610 C678.426392,228.786377 676.958984,239.546127 676.358521,250.420364 C676.254395,252.307388 677.209656,253.678680 679.080200,254.041992 C681.203125,254.454330 682.713379,253.186279 683.345520,251.395248 C684.052979,249.391083 684.220459,247.196320 684.649902,244.218979 Z" />
                    <path d="M573.666382,104.326355 C522.186890,81.357742 473.913605,85.954811 428.771545,119.471420 C423.151825,123.643898 417.530640,125.950256 410.753693,122.823051 C405.702698,120.492279 405.414917,118.863808 409.433197,114.930725 C431.338837,93.489418 457.567322,80.263054 487.810974,76.188705 C535.954041,69.702995 579.571533,79.812653 615.792969,114.160110 C621.046509,119.141815 620.610535,121.025566 613.687134,123.446762 C608.311157,125.326813 603.446167,124.092094 599.153015,120.697876 C591.284973,114.477303 583.033936,108.886368 573.666382,104.326355 Z" />
                    <path d="M402.042969,260.237366 C403.085358,268.597717 403.870117,276.539307 405.059204,284.419891 C406.820007,296.089386 401.880829,304.649445 392.041626,306.829529 C388.477936,307.619110 386.807983,306.770477 386.379639,302.958893 C384.616180,287.266754 382.691498,271.592621 380.794952,255.915634 C378.619537,237.933441 376.404724,219.956024 374.225586,201.974274 C373.965668,199.829636 374.065033,197.613968 373.576508,195.529999 C372.407837,190.544403 374.801575,189.446198 379.162476,189.664551 C386.618713,190.037918 393.096985,194.994995 394.556305,202.938751 C396.235260,212.078110 397.055206,221.375534 398.239227,230.605484 C399.487091,240.333405 400.724335,250.062668 402.042969,260.237366 Z" />
                    <path d="M643.779663,268.558899 C642.434326,280.054901 641.072083,291.106262 640.014893,302.186737 C639.592163,306.617432 637.969727,307.908691 633.573425,306.606689 C625.013550,304.071472 619.806458,297.112213 620.879395,288.225800 C623.945007,262.834259 627.198608,237.465454 630.378601,212.087723 C630.791687,208.790512 630.900024,205.418762 631.681152,202.211029 C633.721069,193.834137 641.352905,188.716873 649.626526,189.678253 C652.390442,189.999435 653.328674,191.164871 652.983826,193.935684 C649.906616,218.660278 646.907349,243.394547 643.779663,268.558899 Z" />
                  </svg>
                )},
                { value: 'bot', label: 'Trimite', icon: (
                  <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" stroke="none">
                    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-52.1 60.9c-6.1 7.1-15.6 9.9-24.5 7.1S192 484.6 192 475.2V416c0-4 1.5-7.8 4.2-10.7L365.6 219.6c7.3-8 6.9-20.1-.8-27.6s-19.7-8.1-27.9-.9L130.8 328.4l-109.7-44.1c-9.5-3.8-15.8-12.9-16.1-23.1s5.5-19.7 14.8-24.1l460.9-224c11.6-5.6 25-4.4 35.1 2.3z" />
                  </svg>
                )},
                { value: 'lightning', label: 'Conversație', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="10.3" rx="9" ry="7.3" />
                    <path d="M8 16.3c-.4 2-1.7 3.5-1.7 3.5s2.3-.3 4-1.8" />
                  </svg>
                )},
                { value: 'heart', label: 'Sclipici AI', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none">
                    <path d="M12 2.5c.6 4.3 2 7.1 5.2 8.5-3.2 1.4-4.6 4.2-5.2 8.5-.6-4.3-2-7.1-5.2-8.5 3.2-1.4 4.6-4.2 5.2-8.5z" fill="currentColor" />
                    <path d="M18.5 3c.25 1.7.8 2.8 2 3.4-1.2.6-1.75 1.7-2 3.4-.25-1.7-.8-2.8-2-3.4 1.2-.6 1.75-1.7 2-3.4z" fill="currentColor" opacity="0.65" />
                  </svg>
                )},
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setConfig({ ...config, bubble_icon: item.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${
                    config.bubble_icon === item.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.selfContained
                      ? ''
                      : config.bubble_icon === item.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-medium ${
                    config.bubble_icon === item.value
                      ? 'text-primary'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>{item.label}</span>
                </button>
              ))}
            </div>
          </Accordion>

          {/* Sectiunea cu functiile widget-ului (emoji, atasari, voce) */}
          <Accordion title="Functionalitati" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
            <div className="space-y-3">
              {[
                { key: 'enable_emoji', label: 'Emoji', desc: 'Afiseaza butonul de emoji si picker-ul' },
                { key: 'enable_attachments', label: 'Atasari imagini', desc: 'Permite trimiterea de imagini' },
                { key: 'enable_voice', label: 'Voice input', desc: 'Permite introducerea vocala' },
                { key: 'show_online_status', label: 'Status online', desc: 'Afiseaza indicatorul verde de online' },
                { key: 'show_subtitle', label: 'Subtitlu bot', desc: 'Afiseaza subtitlul sub numele botului' },
                { key: 'enable_live_chat', label: 'Live Chat', desc: 'Permite vizitatorilor sa ceara un operator uman' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="min-w-0 mr-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={config[item.key] ?? true}
                      onChange={(e) => setConfig({ ...config, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer-checked:bg-primary transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
              ))}
            </div>
          </Accordion>

          {/* Sectiunea pentru pozitia widget-ului pe pagina */}
          <Accordion title="Pozitie widget" icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bottom-right', label: 'Dreapta jos' },
                { value: 'bottom-left', label: 'Stanga jos' },
              ].map((p) => (
                <label
                  key={p.value}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    config.position === p.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input type="radio" name="position" value={p.value} checked={config.position === p.value} onChange={(e) => setConfig({ ...config, position: e.target.value })} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${config.position === p.value ? 'border-primary' : 'border-gray-300 dark:border-gray-500'}`}>
                    {config.position === p.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.label}</span>
                </label>
              ))}
            </div>
          </Accordion>

          {/* Salvare */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-primary to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 font-medium shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {/* In timpul salvarii butonul arata un indicator */}
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Se salveaza...
              </>
            ) : 'Salveaza setarile'}
          </button>
        </div>

        {/* Dreapta: previzualizarea */}
        <div>
          <div className="sticky top-8">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h3>
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-2xl h-[630px] overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Bara de browser simulata */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1 text-xs text-gray-400 ml-2">your-website.com</div>
              </div>

              {/* Zona de continut */}
              <div className="p-6">
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-1/2 mb-3" />
                <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded w-2/3" />
              </div>

              {/* Previzualizarea specifica temei alese */}
              {renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
