import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Target, Trophy, Plus, CheckCircle2, Zap, X, GripVertical, Gift, PlusCircle, Briefcase, Play, Pause, RotateCcw, Coffee, Timer, ChevronRight, Pencil, Trash2, Lightbulb, AlertCircle, Calendar, History, Clock, Sun, Moon, ArrowLeft, MessageSquare, Save, Star, BatteryLow, BatteryMedium, BatteryFull, Link2, ExternalLink, FileText, Settings, CalendarCheck, Check, Archive, Download, Upload, LogIn, UserPlus, CreditCard, Crown, LogOut, CheckCircle, MoreHorizontal, Settings2, Maximize2, Minimize2, Flame, AlertTriangle, Receipt, Copy, User, Smile, Heart, Glasses, BarChart2, Medal, Lock, PanelLeftClose, PanelLeftOpen, BellRing, Sparkles, Brain, Rocket, Map, ListChecks, Hourglass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, SUPABASE_IS_CONFIGURED } from './supabase';
import { Task, UserStats, Reward, SubTask, TaskStatus, ProjectLink, MonthlyGoal, Urgency, RedeemedReward } from './types';

const STORAGE_KEYS = {
  TASKS: 'guiflow_tasks_v3',
  COMPLETED_TASKS: 'guiflow_completed_tasks_v3',
  REWARDS: 'guiflow_rewards_v3',
  REDEEMED_HISTORY: 'guiflow_redeemed_history_v3',
  STATS: 'guiflow_stats_v3',
  THEME: 'guiflow_theme_v3',
  MONTHLY_GOALS: 'guiflow_monthly_goals_v3',
  GUEST_SESSION: 'guiflow_guest_session',
  TIMER_SETTINGS: 'guiflow_timer_settings',
  VIEW_PREFERENCE: 'guiflow_view_pref',
  SIDEBAR_COLLAPSED: 'guiflow_sidebar_collapsed',
  TUTORIAL_COMPLETED: 'guiflow_tutorial_completed_v2' // Bumped version to force new tutorial
};

const STRIPE_LINK = 'https://buy.stripe.com/8x214o14E0FB8TF5NNcEw00';

const URGENCY_CONFIG: Record<Urgency, { label: string, color: string, bg: string, icon: any }> = {
  critical: { label: 'Urgente', color: 'text-rose-600', bg: 'bg-rose-100', icon: Flame },
  high: { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle },
  medium: { label: 'Média', color: 'text-blue-600', bg: 'bg-blue-100', icon: BatteryMedium },
  low: { label: 'Baixa', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: Coffee }
};

const URGENCY_POINTS: Record<Urgency, number> = {
  low: 15,
  medium: 30,
  high: 50,
  critical: 100
};

// --- MENTOR MESSAGES SYSTEM ---
const MENTOR_MESSAGES: Record<string, { success: string[], break: string[], delayed: string[] }> = {
  king: { // Líder (Gabi)
    success: ["Excelente execução. O império cresce.", "Mais uma conquista estratégica.", "Liderança é fazer acontecer. Parabéns."],
    break: ["Pausa estratégica necessária. Recarregar.", "Um bom rei sabe quando descansar.", "O trono aguarda seu retorno. Descanse agora."],
    delayed: ["O plano atrasou. Reajuste a estratégia imediatamente.", "Atrasos acontecem, mas a persistência define o rei.", "Não ignore o prazo. Retome o controle."]
  },
  coffee: { // Hype (Babu)
    success: ["BOOOOA! DESTRUIU! 🔥", "ISSO AÍ! NINGUÉM TE SEGURA!", "TÁ VOANDO! PRÓXIMA!"],
    break: ["Hora do recreio! Vai pular, correr, beber água!", "PARA TUDO! Pausa pra recarregar a bateria!", "Respira fundo e volta com tudo depois!"],
    delayed: ["Eita! Atrasou? Bora acelerar isso aí!", "Não deixa a peteca cair! Foco total agora!", "Vamos recuperar esse tempo! Velocidade máxima!"]
  },
  cool: { // Zen (Ari)
    success: ["Um passo de cada vez. A harmonia foi mantida.", "Fluindo como água. Muito bom.", "Sem esforço, apenas foco. Parabéns."],
    break: ["O silêncio é a resposta. Respire.", "Desconecte para reconectar.", "Olhe pela janela. O mundo pode esperar."],
    delayed: ["Sem culpa. O tempo é relativo. Apenas recomece.", "Não se estresse com o atraso. Flua de volta para a tarefa.", "Respire fundo. Tudo vai ser feito no tempo certo."]
  },
  smart: { // Nerd (Mino)
    success: ["Eficiência notável. Dopamina liberada.", "Tarefa processada com sucesso. Ótimo trabalho.", "Análise concluída: produtividade em alta."],
    break: ["Níveis de neurotransmissores baixos. Reabastecimento necessário.", "Sobrecarga cognitiva iminente. Iniciar protocolo de descanso.", "O cérebro precisa consolidar os dados. Durma ou descanse."],
    delayed: ["Cronograma desviado. Recalculando rota de eficiência.", "A probabilidade de sucesso aumenta se você focar agora.", "Alerta de prazo. Vamos otimizar esse tempo."]
  },
  love: { // Amigo (Liu)
    success: ["Que orgulho de você! ❤️", "Viu como você consegue? Você é incrível!", "Comemore cada vitória, meu anjo!"],
    break: ["Cuide de você um pouquinho. Descansa.", "Você merece uma pausa quentinha no coração.", "Seja gentil consigo mesmo. Pare um pouco."],
    delayed: ["Tudo bem atrasar, não se culpe. Vamos tentar de novo?", "Está difícil? Eu estou aqui com você. Vamos juntos.", "Um dia de cada vez. Não desista por causa de um prazo."]
  },
  hippie: { // Criativo (Iza)
    success: ["A energia fluiu perfeitamente. Gratidão.", "Você manifestou essa conquista! ✨", "Sinta a vibração de dever cumprido."],
    break: ["Vá ver o céu. Deixe a mente vagar.", "Conecte-se com o universo lá fora.", "Deixe as ideias decantarem no silêncio."],
    delayed: ["O tempo é uma ilusão humana. Apenas flua.", "Se o fluxo travou, mude a perspectiva.", "Não force. Respire e volte com amor."]
  }
};

// --- TUTORIAL CONTENT ---
const TUTORIAL_STEPS = [
  {
    view: 'global',
    highlightId: null,
    title: "Boas-vindas!",
    text: "Olá! Eu serei seu mentor. Minha missão é ajudar sua mente incrível a conquistar o mundo, sem se perder no caos. Vamos fazer um tour rápido?"
  },
  {
    view: 'global',
    highlightId: 'btn-create-macro',
    title: "1. O Começo (Macro)",
    text: "Tudo começa aqui. Clique neste botão para definir um Objetivo Grande. Não se preocupe com os detalhes agora, foque apenas no destino final."
  },
  {
    view: 'local',
    highlightId: 'objective-header',
    title: "2. Visão Local",
    text: "Ao entrar em um objetivo, você vê o contexto e referências. Aqui é onde a ansiedade diminui, pois você sabe exatamente 'por que' está fazendo isso."
  },
  {
    view: 'local',
    highlightId: 'btn-add-subtask',
    title: "3. Quebre em Micro-passos",
    text: "A mágica contra a procrastinação: quebre o objetivo em tarefas ridicularmente pequenas aqui. O cérebro adora coisas fáceis!"
  },
  {
    view: 'local',
    highlightId: 'container-timer',
    title: "4. Timer & Foco",
    text: "Use o Pomodoro integrado. Eu estarei aqui te fazendo companhia enquanto o tempo roda. Foco total, uma coisa de cada vez."
  },
  {
    view: 'ranking',
    highlightId: 'container-ranking',
    title: "5. Ranking Semanal",
    text: "Ganhe XP por cada tarefa concluída e suba no ranking. Uma competição saudável para manter sua dopamina lá em cima!"
  },
  {
    view: 'rewards',
    highlightId: 'btn-create-reward',
    title: "6. Recompensas",
    text: "Defina prêmios reais para você mesmo (um café, um episódio de série). Troque seus pontos aqui. Seu esforço merece celebração real!"
  }
];

// Capybara Avatar Component (Same as before)
const CapybaraAvatar = ({ mood, className = "w-full h-full" }: { mood: string, className?: string }) => {
  const skin = "#D4A373"; // Capy brown
  const snout = "#A98467"; // Darker brown
  const stroke = "#5D4037"; // Outline

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="35" r="8" fill={skin} stroke={stroke} strokeWidth="2"/>
      <circle cx="75" cy="35" r="8" fill={skin} stroke={stroke} strokeWidth="2"/>
      <rect x="20" y="30" width="60" height="55" rx="20" fill={skin} stroke={stroke} strokeWidth="2"/>
      <rect x="35" y="58" width="30" height="20" rx="8" fill={snout} fillOpacity="0.6" />
      <path d="M44 65Q45 63 46 65" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M54 65Q55 63 56 65" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      <path d="M48 70Q50 73 52 70" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>
      {mood !== 'cool' && (
        <>
          <circle cx="35" cy="48" r="4" fill="#333" />
          <circle cx="65" cy="48" r="4" fill="#333" />
          <circle cx="37" cy="46" r="1.5" fill="white" />
          <circle cx="67" cy="46" r="1.5" fill="white" />
        </>
      )}
      {mood === 'king' && <path d="M30 28L25 5L40 20L50 2L60 20L75 5L70 28H30Z" fill="#FFC107" stroke="#FF6F00" strokeWidth="2" strokeLinejoin="round"/>}
      {mood === 'coffee' && <g transform="translate(60, 65) scale(0.8)"><path d="M0 0H20V15C20 20.5228 15.5228 25 10 25C4.47715 25 0 20.5228 0 15V0Z" fill="#3E2723" stroke="white" strokeWidth="2"/><path d="M20 5H25C27.7614 5 30 7.23858 30 10C30 12.7614 27.7614 15 25 15H20" stroke="white" strokeWidth="2" fill="none"/><path d="M5 -10Q10 -15 5 -20" stroke="#DDD" strokeWidth="2" strokeLinecap="round" opacity="0.6"/><path d="M15 -8Q20 -13 15 -18" stroke="#DDD" strokeWidth="2" strokeLinecap="round" opacity="0.6"/></g>}
      {mood === 'cool' && <g><rect x="25" y="42" width="22" height="12" rx="3" fill="#111" /><rect x="53" y="42" width="22" height="12" rx="3" fill="#111" /><line x1="47" y1="48" x2="53" y2="48" stroke="#111" strokeWidth="2" /><line x1="28" y1="44" x2="35" y2="52" stroke="white" strokeWidth="1" opacity="0.3"/><line x1="56" y1="44" x2="63" y2="52" stroke="white" strokeWidth="1" opacity="0.3"/></g>}
      {mood === 'love' && <g transform="translate(75, 55) rotate(10)"><path d="M10 5C10 0 5 0 2.5 2.5C0 0 -5 0 -5 5C-5 10 2.5 14 2.5 14C2.5 14 10 10 10 5Z" fill="#E91E63" stroke="#880E4F" strokeWidth="1"/></g>}
      {mood === 'smart' && <g><circle cx="35" cy="48" r="11" stroke="#333" strokeWidth="2" fill="white" fillOpacity="0.2"/><circle cx="65" cy="48" r="11" stroke="#333" strokeWidth="2" fill="white" fillOpacity="0.2"/><path d="M46 48H54" stroke="#333" strokeWidth="2"/></g>}
      {mood === 'hippie' && <g><path d="M20 32H80V38H20V32Z" fill="#F06292" stroke="#D81B60" strokeWidth="1"/><circle cx="50" cy="35" r="2" fill="#FFEB3B" /><circle cx="35" cy="48" r="9" stroke="#FFD54F" strokeWidth="2" fill="#E91E63" fillOpacity="0.2"/><circle cx="65" cy="48" r="9" stroke="#FFD54F" strokeWidth="2" fill="#E91E63" fillOpacity="0.2"/><path d="M44 48H56" stroke="#FFD54F" strokeWidth="2"/></g>}
    </svg>
  );
};

const CAPY_OPTIONS = [
  { id: 'king', label: 'Líder', bg: 'bg-amber-100', mood: 'king' },
  { id: 'coffee', label: 'Focado', bg: 'bg-emerald-100', mood: 'coffee' },
  { id: 'cool', label: 'Relax', bg: 'bg-blue-100', mood: 'cool' },
  { id: 'smart', label: 'Intelectual', bg: 'bg-indigo-100', mood: 'smart' },
  { id: 'love', label: 'Amável', bg: 'bg-rose-100', mood: 'love' },
  { id: 'hippie', label: 'Hippie', bg: 'bg-lime-100', mood: 'hippie' },
];

// Mock Data for Leaderboard
const MOCK_USERS = [
  { id: 'u1', name: 'Ana P.', avatar: 'coffee', bg: 'bg-emerald-100', points: 0, time: 0 },
  { id: 'u2', name: 'Carlos M.', avatar: 'cool', bg: 'bg-blue-100', points: 0, time: 0 },
  { id: 'u3', name: 'Beatriz L.', avatar: 'smart', bg: 'bg-indigo-100', points: 0, time: 0 },
  { id: 'u4', name: 'João S.', avatar: 'king', bg: 'bg-amber-100', points: 0, time: 0 },
  { id: 'u5', name: 'Fernanda R.', avatar: 'love', bg: 'bg-rose-100', points: 0, time: 0 },
  { id: 'u6', name: 'Lucas T.', avatar: 'cool', bg: 'bg-blue-100', points: 0, time: 0 },
  { id: 'u7', name: 'Mariana C.', avatar: 'smart', bg: 'bg-indigo-100', points: 0, time: 0 },
];

const NavItem = ({ active, onClick, icon, label, isDark, collapsed }: any) => (
  <button 
    onClick={onClick} 
    title={collapsed ? label : undefined}
    className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-4 px-5'} w-full py-4 rounded-2xl transition-all ${active ? (isDark ? 'text-indigo-300 bg-indigo-950/40 shadow-inner' : 'text-indigo-600 bg-indigo-50 shadow-sm') : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
  >
    <div className="min-w-[20px] flex justify-center">{icon}</div> 
    {!collapsed && <span className="text-sm uppercase font-black tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">{label}</span>}
  </button>
);

// --- MENTOR NOTIFICATION COMPONENT ---
const MentorNotification = ({ show, message, avatarConfig, onClose }: any) => {
  if (!show || !avatarConfig) return null;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-10 md:right-10 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 flex flex-col items-end pointer-events-none">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-t-3xl rounded-bl-3xl rounded-br-sm shadow-2xl border-2 border-indigo-100 dark:border-slate-700 max-w-[280px] md:max-w-sm mb-4 relative pointer-events-auto">
         <button onClick={onClose} className="absolute -top-2 -left-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-full text-slate-500 hover:text-rose-500 hover:scale-110 transition-all"><X size={14} /></button>
         <p className="text-sm font-black text-slate-700 dark:text-slate-200 leading-relaxed">
            "{message}"
         </p>
         <div className="absolute -bottom-2 right-0 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-r-2 border-b-2 border-indigo-100 dark:border-slate-700"></div>
      </div>
      <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl ${avatarConfig.bg} border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center p-2 relative pointer-events-auto hover:scale-110 transition-transform cursor-pointer`} onClick={onClose}>
         <CapybaraAvatar mood={avatarConfig.mood} />
      </div>
    </div>
  );
};

// --- TUTORIAL OVERLAY COMPONENT ---
const TutorialOverlay = ({ step, avatarConfig, onNext, onSkip }: any) => {
  if (step === -1 || !avatarConfig) return null;
  const currentStep = TUTORIAL_STEPS[step];
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!currentStep.highlightId) {
      setTargetRect(null);
      return;
    }
    const updateRect = () => {
      const el = document.getElementById(currentStep.highlightId as string);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
           const rect = el.getBoundingClientRect();
           setTargetRect(rect);
        }, 400);
      } else {
        setTargetRect(null);
      }
    };
    
    const timer = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timer);
    }
  }, [step, currentStep]);

  // Determine if bubble should be at Top or Bottom to avoid covering the element
  // If target is in the bottom 40% of the screen, show bubble at TOP. Otherwise show at BOTTOM.
  const showBubbleAtTop = targetRect ? (targetRect.top > windowHeight * 0.6) : false;
  
  const spotlightStyle: React.CSSProperties = targetRect ? {
     position: 'fixed',
     top: targetRect.top - 10,
     left: targetRect.left - 10,
     width: targetRect.width + 20,
     height: targetRect.height + 20,
     boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85)',
     borderRadius: '1.5rem',
     zIndex: 200,
     transition: 'all 0.5s ease-in-out',
     pointerEvents: 'none',
     border: '2px solid rgba(255, 255, 255, 0.2)'
  } : {};

  return (
    <>
       {/* SPOTLIGHT or BACKDROP */}
       {targetRect ? (
          <div style={spotlightStyle} className="animate-in fade-in duration-500" />
       ) : (
          <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-500" />
       )}

       {/* CONTENT LAYER */}
       {/* Uses fixed positioning relative to viewport edges to ensure it's always visible on mobile */}
       <div 
          className="fixed z-[201] flex flex-col items-center pointer-events-auto transition-all duration-500 ease-in-out"
          style={targetRect ? {
             left: '50%',
             transform: 'translateX(-50%)',
             width: 'calc(100% - 32px)',
             maxWidth: '400px',
             top: showBubbleAtTop ? '40px' : 'auto',
             bottom: showBubbleAtTop ? 'auto' : '40px'
          } : {
             top: '50%',
             left: '50%',
             transform: 'translate(-50%, -50%)',
             width: 'calc(100% - 32px)',
             maxWidth: '400px',
          }}
       >
          <div className={`w-28 h-28 rounded-[2rem] ${avatarConfig.bg} border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center p-3 mb-4 animate-bounce z-10`}>
             <CapybaraAvatar mood={avatarConfig.mood} />
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border-4 border-indigo-100 dark:border-slate-800 w-full text-center relative animate-in zoom-in-95 duration-300">
             {/* Arrow direction based on position */}
             {targetRect && (
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 rotate-45 border-l-4 border-t-4 border-indigo-100 dark:border-slate-800 ${showBubbleAtTop ? '-bottom-3.5 border-l-0 border-t-0 border-r-4 border-b-4' : '-top-3.5'}`}
                />
             )}
             
             <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-3">{currentStep.title}</h3>
             <p className="text-base font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                {currentStep.text}
             </p>
             
             <div className="flex gap-3">
                <button onClick={onSkip} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 font-black uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                   Pular
                </button>
                <button onClick={onNext} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2">
                   {step === TUTORIAL_STEPS.length - 1 ? 'Começar!' : 'Próximo'} <ChevronRight size={16} />
                </button>
             </div>
          </div>
       </div>
    </>
  );
};

const Modal = ({ title, onClose, children, isDark }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 overflow-y-auto">
    <div className={`relative w-full max-w-lg rounded-[3.5rem] p-12 my-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <button onClick={onClose} className="absolute right-10 top-10 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X size={28} /></button>
      <h3 className={`text-3xl font-black mb-10 tracking-tighter leading-tight ${isDark ? 'text-white' : 'text-black'}`}>{title}</h3>
      {children}
    </div>
  </div>
);

const LandingPage = ({ onStart, onLogin, isDark }: { onStart: () => void, onLogin: () => void, isDark: boolean }) => {
  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} transition-all`}>
      {/* Nav */}
      <nav className={`p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-top-4 duration-700 sticky top-0 z-50 ${isDark ? 'bg-slate-950/80' : 'bg-white/90'} backdrop-blur-md border-b ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
               <Zap size={24} fill="currentColor" />
            </div>
            <h1 className={`text-3xl font-black tracking-tighter leading-none hidden md:block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              GUITASK<span className="text-indigo-600">.</span>
            </h1>
         </div>
         <div className="flex gap-4">
            <button onClick={onLogin} className="text-sm font-black uppercase text-slate-600 hover:text-indigo-600 transition-colors">Entrar</button>
            <button onClick={onStart} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 active:scale-95 transition-all">Criar Conta</button>
         </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center py-16 md:py-24 px-6 max-w-7xl mx-auto gap-12 animate-in zoom-in-95 duration-1000">
         <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8 z-10">
            <h1 className={`text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] ${isDark ? 'text-white' : 'text-slate-900'}`}>
               Clareza para mentes <span className="text-indigo-600">inquietas.</span>
            </h1>
            <p className={`text-lg md:text-xl font-medium max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
               Você encontrou a melhor ferramenta para te ajudar a ter mais clareza e foco. A união entre IA, Pomodoro e uma interface limpa é o que ajuda você a organizar a bagunça da mente. Comece a testar agora, de graça.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center md:justify-start pt-4">
               <button onClick={onStart} className={`px-8 py-5 rounded-[2rem] font-black text-lg shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-white text-slate-900' : 'bg-indigo-600 text-white'}`}>
                  Começar Agora Grátis <ChevronRight size={20} />
               </button>
            </div>
         </div>
         
         {/* Gabi Image */}
         <div className="flex-1 flex justify-center items-center relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[80px] rounded-full" />
             <img 
               src="https://i.ibb.co/HfvZ2k8q/1.png" 
               alt="Gabi" 
               className="relative z-10 w-[280px] md:w-[480px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 hover:rotate-2" 
             />
         </div>
      </section>

      {/* Features Grid */}
      <section className={`px-6 py-24 border-y ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`p-8 rounded-[3rem] border transition-all group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target size={32} />
               </div>
               <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Visão Dupla</h3>
               <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Separe o "O que fazer" (Macro) do "Como fazer" (Micro). Evite a paralisia da análise.</p>
            </div>
            <div className={`p-8 rounded-[3rem] border transition-all group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Trophy size={32} />
               </div>
               <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Gamificação</h3>
               <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Ganhe XP por cada tarefa. Troque pontos por recompensas reais que você define.</p>
            </div>
            <div className={`p-8 rounded-[3rem] border transition-all group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Crown size={32} />
               </div>
               <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ranking Semanal</h3>
               <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Competição saudável que motiva. Suba no pódio e mostre sua consistência.</p>
            </div>
            <div className={`p-8 rounded-[3rem] border transition-all group ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain size={32} />
               </div>
               <h3 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Foco Adaptativo</h3>
               <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pomodoro integrado com avatares de capivara que evoluem com você.</p>
            </div>
         </div>
      </section>

      {/* HOW IT WORKS / METHODOLOGY */}
      <section className={`px-6 py-24 ${isDark ? 'bg-slate-950' : 'bg-white'} relative overflow-hidden`}>
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-12 relative z-10">
               <div className="space-y-4">
                  <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest">Metodologia</span>
                  <h2 className={`text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                     Transforme o caos mental em <span className="text-indigo-600">conquistas reais.</span>
                  </h2>
                  <p className={`text-lg font-medium leading-relaxed max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                     O Guitask não é apenas uma lista de tarefas. É um sistema desenhado para contornar as armadilhas do cérebro TDAH, como a paralisia de análise e a cegueira temporal.
                  </p>
               </div>

               <div className="space-y-8">
                  <div className="flex gap-6 group">
                     <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                           <Map size={24} />
                        </div>
                        <div className={`w-1 h-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} my-2`}></div>
                     </div>
                     <div className="pb-8">
                        <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Defina o Macro</h3>
                        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tire a ideia da cabeça. Defina o objetivo final (o destino) sem se preocupar com os detalhes agora. Alivie a carga mental.</p>
                     </div>
                  </div>

                  <div className="flex gap-6 group">
                     <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                           <ListChecks size={24} />
                        </div>
                        <div className={`w-1 h-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} my-2`}></div>
                     </div>
                     <div className="pb-8">
                        <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Quebre no Micro</h3>
                        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>O Guitask te força a focar em uma coisa de cada vez. Transforme montanhas assustadoras em passos ridicularmente fáceis.</p>
                     </div>
                  </div>

                  <div className="flex gap-6 group">
                     <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                           <Hourglass size={24} />
                        </div>
                        <div className={`w-1 h-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} my-2`}></div>
                     </div>
                     <div className="pb-8">
                        <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Foco Cronometrado</h3>
                        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Use o Pomodoro integrado. Seu mentor capivara te acompanha, criando um "body doubling" virtual para manter você nos trilhos.</p>
                     </div>
                  </div>

                  <div className="flex gap-6 group">
                     <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg z-10 group-hover:scale-110 transition-transform">
                           <Gift size={24} />
                        </div>
                     </div>
                     <div>
                        <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Recompensa Imediata</h3>
                        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Seu cérebro precisa de dopamina agora, não depois. Ganhe XP, suba no ranking e troque pontos por prêmios que você mesmo define.</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className={`flex-1 p-8 rounded-[3rem] border-2 relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-white shadow-xl'}`}>
               <div className="absolute top-0 right-0 p-8 opacity-20">
                  <Sparkles size={120} className="text-indigo-600" />
               </div>
               <h3 className="text-2xl font-black mb-8 uppercase tracking-widest text-indigo-600">Benefícios Comprovados</h3>
               <div className="space-y-6">
                  {[
                     { title: "Fim da Paralisia", desc: "A visão micro elimina o medo de começar tarefas grandes." },
                     { title: "Dopamina Saudável", desc: "Gamificação transforma tarefas chatas em fontes de satisfação." },
                     { title: "Consistência", desc: "O sistema de Ranking e Streak te mantém voltando todo dia." },
                     { title: "Menos Ansiedade", desc: "Saber exatamente o próximo passo acalma a mente hiperativa." }
                  ].map((item, i) => (
                     <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02] ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-white/80 shadow-sm'}`}>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                           <Check size={16} strokeWidth={3} />
                        </div>
                        <div>
                           <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                           <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.desc}</p>
                        </div>
                     </div>
                  ))}
               </div>
               <button onClick={onStart} className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Rocket size={18} /> Começar a Jornada
               </button>
            </div>
         </div>
      </section>

      {/* MENTORS / CAPYBARAS SECTION */}
      <section className={`px-6 py-24 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
               <h2 className={`text-4xl md:text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>Conheça seus Mentores</h2>
               <p className={`text-lg font-medium max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cada mente neurodivergente funciona em um ritmo diferente. Escolha o avatar que representa o seu momento atual.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* 1. King */}
               <div className="p-8 rounded-[2.5rem] bg-amber-50 border border-amber-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="king" />
                  </div>
                  <span className="text-xs font-black text-amber-600/60 uppercase tracking-[0.2em] mb-2">Gabi</span>
                  <h3 className="text-2xl font-black text-amber-900 uppercase mb-2">O Líder</h3>
                  <p className="text-amber-800/80 font-bold leading-tight">Para quando você precisa assumir o controle total, definir a estratégia e planejar o império.</p>
               </div>

               {/* 2. Coffee (Agora é o Babu) */}
               <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="coffee" />
                  </div>
                  <span className="text-xs font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-2">Babu</span>
                  <h3 className="text-2xl font-black text-emerald-900 uppercase mb-2">O Hype</h3>
                  <p className="text-emerald-800/80 font-bold leading-tight">Energia pura. Ideal para aqueles dias de hiperfoco onde a lista de tarefas desaparece em minutos.</p>
               </div>

               {/* 3. Cool (Agora é a Ari) */}
               <div className="p-8 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="cool" />
                  </div>
                  <span className="text-xs font-black text-blue-600/60 uppercase tracking-[0.2em] mb-2">Ari</span>
                  <h3 className="text-2xl font-black text-blue-900 uppercase mb-2">O Zen</h3>
                  <p className="text-blue-800/80 font-bold leading-tight">Sem pânico. Te ajuda a respirar fundo e evitar o burnout quando a ansiedade tenta assumir.</p>
               </div>

               {/* 4. Smart */}
               <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="smart" />
                  </div>
                  <span className="text-xs font-black text-indigo-600/60 uppercase tracking-[0.2em] mb-2">Mino</span>
                  <h3 className="text-2xl font-black text-indigo-900 uppercase mb-2">O Nerd</h3>
                  <p className="text-indigo-800/80 font-bold leading-tight">Análise e profundidade. O companheiro perfeito para sessões de estudo intenso e tarefas complexas.</p>
               </div>

               {/* 5. Love */}
               <div className="p-8 rounded-[2.5rem] bg-rose-50 border border-rose-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="love" />
                  </div>
                  <span className="text-xs font-black text-rose-600/60 uppercase tracking-[0.2em] mb-2">Liu</span>
                  <h3 className="text-2xl font-black text-rose-900 uppercase mb-2">O Amigo</h3>
                  <p className="text-rose-800/80 font-bold leading-tight">Autocompaixão radical. Porque nem todo dia a gente está 100%, e tudo bem falhar às vezes.</p>
               </div>

               {/* 6. Hippie */}
               <div className="p-8 rounded-[2.5rem] bg-lime-50 border border-lime-100 flex flex-col items-center text-center transition-transform hover:scale-105 duration-300">
                  <div className="w-32 h-32 mb-6">
                     <CapybaraAvatar mood="hippie" />
                  </div>
                  <span className="text-xs font-black text-lime-600/60 uppercase tracking-[0.2em] mb-2">Iza</span>
                  <h3 className="text-2xl font-black text-lime-900 uppercase mb-2">O Criativo</h3>
                  <p className="text-lime-800/80 font-bold leading-tight">Deixe fluir. Perfeito para brainstorming, dias sem regras e momentos de pura inspiração.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className={`p-10 text-center text-xs font-bold uppercase tracking-widest border-t ${isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-white border-slate-100 text-slate-400'}`}>
         <p>© {new Date().getFullYear()} Guitask. Clareza para mentes inquietas.</p>
      </footer>
    </div>
  );
};

const AuthScreen = ({ theme, onGuestAccess }: { theme: string, onGuestAccess: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('king');
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name.trim()) throw new Error("Por favor, digite seu nome.");
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: name,
              avatar_url: selectedAvatar
            }
          }
        });
        if (error) throw error;
        alert("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <div className={`w-full max-w-[450px] overflow-hidden rounded-[3.5rem] shadow-2xl border transition-all duration-500 animate-in fade-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="p-10 pb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-6 group hover:rotate-12 transition-transform duration-300">
            <Zap size={40} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter leading-none mb-1 text-indigo-600">GUITASK</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Clareza para mentes inquietas.</p>
        </div>
        <div className="px-10 pb-12 space-y-6">
          <div className="flex p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-indigo-600'}`}>Entrar</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-indigo-600'}`}>Cadastre-se</button>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Nome de usuário</label>
                    <input type="text" placeholder="Como quer ser chamado?" value={name} onChange={e => setName(e.target.value)} required className={`w-full p-5 rounded-3xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Escolha sua Capivara</label>
                    <div className="flex justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-x-auto">
                      {CAPY_OPTIONS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.id)}
                          className={`min-w-[50px] h-[50px] p-1.5 rounded-2xl flex items-center justify-center transition-all border-2 ${selectedAvatar === av.id ? `${av.bg} border-indigo-600 shadow-md scale-110` : 'bg-white dark:bg-slate-700 border-transparent hover:bg-slate-100'}`}
                          title={av.label}
                        >
                           <CapybaraAvatar mood={av.mood} />
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-4">E-mail</label>
              <input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full p-5 rounded-3xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Senha</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full p-5 rounded-3xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 mt-2 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
              {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === 'login' ? 'Acessar' : 'Criar Conta')}
            </button>
          </form>
          <button onClick={onGuestAccess} className={`w-full py-4 rounded-2xl border-2 font-black text-xs uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
             Modo de Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION);
    return saved ? JSON.parse(saved) : null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'));
  const [completedTasks, setCompletedTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS) || '[]'));
  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Pausa para Café', cost: 50, icon: 'coffee' },
      { id: '2', title: 'Episódio de Série', cost: 150, icon: 'play' }
    ];
  });
  const [redeemedHistory, setRedeemedHistory] = useState<RedeemedReward[]>(() => 
    JSON.parse(localStorage.getItem(STORAGE_KEYS.REDEEMED_HISTORY) || '[]')
  );
  const [stats, setStats] = useState<UserStats>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{"points":0,"tasksCompleted":0,"streak":1}'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light');
  const [view, setView] = useState<'global' | 'local' | 'rewards' | 'history' | 'ranking'>('global');
  const [isCompactMode, setIsCompactMode] = useState(() => localStorage.getItem(STORAGE_KEYS.VIEW_PREFERENCE) === 'compact');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [rankingTab, setRankingTab] = useState<'points' | 'time'>('points');
  
  // Mentor State
  const [mentorNotification, setMentorNotification] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number>(-1);

  // Pomodoro Settings & State
  const [timerSettings, setTimerSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
    return saved ? JSON.parse(saved) : { focus: 25, short: 5, long: 15 };
  });
  
  const [pomodoroTime, setPomodoroTime] = useState(timerSettings.focus * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [pomodoroCycles, setPomodoroCycles] = useState(0);
  const [timerFinishedData, setTimerFinishedData] = useState<{ previousMode: string, nextMode: string } | null>(null);

  // Delta Time management
  const timerRef = useRef<number | null>(null);
  const lastTickTimestamp = useRef<number>(Date.now());
  const accumulatedFocusSeconds = useRef<number>(0);

  // Task/Reward creation states
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskContext, setNewTaskContext] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [newSubTask, setNewSubTask] = useState<{title: string, notes: string, link: string, dueDate: string, urgency: Urgency}>({ title: '', notes: '', link: '', dueDate: '', urgency: 'medium' });
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardCost, setNewRewardCost] = useState(50);

  const isDark = theme === 'dark';

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
    localStorage.setItem(STORAGE_KEYS.REDEEMED_HISTORY, JSON.stringify(redeemedHistory));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    localStorage.setItem(STORAGE_KEYS.TIMER_SETTINGS, JSON.stringify(timerSettings));
    localStorage.setItem(STORAGE_KEYS.VIEW_PREFERENCE, isCompactMode ? 'compact' : 'expanded');
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(isSidebarCollapsed));
  }, [tasks, completedTasks, rewards, redeemedHistory, stats, timerSettings, isCompactMode, isSidebarCollapsed]);

  // Helper to get user avatar info
  const userAvatar = useMemo(() => {
     if (!session?.user?.user_metadata) return null;
     const { avatar_url, full_name } = session.user.user_metadata;
     const avatarConfig = CAPY_OPTIONS.find(a => a.id === avatar_url) || CAPY_OPTIONS[0];
     return { config: avatarConfig, name: full_name?.split(' ')[0] || 'Usuário' };
  }, [session]);

  // Tutorial Logic
  useEffect(() => {
     if (session && !localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED)) {
        setTutorialStep(0);
     }
  }, [session]);

  useEffect(() => {
     if (tutorialStep >= 0 && tutorialStep < TUTORIAL_STEPS.length) {
        const stepConfig = TUTORIAL_STEPS[tutorialStep];
        // Switch view based on step
        if (stepConfig.view !== view) {
           // Special handling for local view if no tasks exist
           if (stepConfig.view === 'local' && tasks.length === 0) {
              const demoTask: Task = {
                 id: 'tutorial-task',
                 title: 'Objetivo de Exemplo',
                 description: 'Este é um objetivo criado temporariamente para você ver como funciona a visão de foco.',
                 priority: 'medium',
                 status: 'todo',
                 dueDate: new Date().toISOString().split('T')[0],
                 estimatedTime: 60,
                 category: 'Tutorial',
                 completed: false,
                 subTasks: [],
                 rewardPoints: 100,
                 totalTimeSpent: 0
              };
              setTasks([demoTask]);
              setActiveTaskId(demoTask.id);
           } else if (stepConfig.view === 'local' && tasks.length > 0 && !activeTaskId) {
              setActiveTaskId(tasks[0].id);
           }
           setView(stepConfig.view as any);
        }
     }
  }, [tutorialStep, tasks, activeTaskId]); // Intentionally not adding 'view' to avoid loop if view change triggers something

  const handleTutorialNext = () => {
     if (tutorialStep < TUTORIAL_STEPS.length - 1) {
        setTutorialStep(prev => prev + 1);
     } else {
        // Finish
        setTutorialStep(-1);
        localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        // Clean up tutorial task if it exists
        if (tasks.find(t => t.id === 'tutorial-task')) {
           setTasks(prev => prev.filter(t => t.id !== 'tutorial-task'));
           setActiveTaskId(null);
           setView('global');
        }
     }
  };

  const handleTutorialSkip = () => {
     setTutorialStep(-1);
     localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
     // Clean up
     if (tasks.find(t => t.id === 'tutorial-task')) {
        setTasks(prev => prev.filter(t => t.id !== 'tutorial-task'));
        setActiveTaskId(null);
        setView('global');
     }
  };

  // TRIGGER MENTOR MESSAGE
  const triggerMentor = (scenario: 'success' | 'break' | 'delayed') => {
     if (!userAvatar) return;
     const moodId = userAvatar.config.mood;
     const messages = MENTOR_MESSAGES[moodId] || MENTOR_MESSAGES['king'];
     const scenarioMessages = messages[scenario];
     const randomMsg = scenarioMessages[Math.floor(Math.random() * scenarioMessages.length)];
     
     setMentorNotification({ show: true, message: randomMsg });
     
     // Auto hide after 6 seconds
     setTimeout(() => {
        setMentorNotification(prev => ({ ...prev, show: false }));
     }, 6000);
  };

  // Check for delayed tasks when switching to local view
  useEffect(() => {
     if (view === 'local' && activeTaskId) {
        const currentTask = tasks.find(t => t.id === activeTaskId);
        if (currentTask) {
           const hasOverdue = currentTask.subTasks.some(st => {
              if (st.status === 'done' || !st.dueDate) return false;
              const due = new Date(st.dueDate);
              const today = new Date();
              today.setHours(0,0,0,0);
              return due < today;
           });
           
           if (hasOverdue) {
              // Slight delay to not overwhelm on render
              setTimeout(() => triggerMentor('delayed'), 1000);
           }
        }
     }
  }, [view, activeTaskId, tasks]);

  // Helper to play alarm sound
  const playAlarm = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log("Audio play failed (user interaction needed)", e));
    // Play again for emphasis
    setTimeout(() => {
       const audio2 = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
       audio2.play().catch(() => {});
    }, 800);
  };

  // Helper to send browser notification
  const notifyUser = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // Toggle Timer with Permission Request
  const toggleTimer = () => {
    if (!isTimerRunning) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setIsTimerRunning(!isTimerRunning);
  };

  // Document Title Flasher
  useEffect(() => {
    if (isTimerRunning) {
      document.title = `${formatTime(pomodoroTime)} - Guitask`;
    } else if (activeModal === 'timerFinished') {
      const interval = setInterval(() => {
        document.title = document.title === '🔔 TEMPO ESGOTADO!' ? 'Guitask' : '🔔 TEMPO ESGOTADO!';
      }, 1000);
      return () => {
        clearInterval(interval);
        document.title = 'Guitask';
      };
    } else {
      document.title = 'Guitask';
    }
  }, [isTimerRunning, pomodoroTime, activeModal]);

  // Delta Time Pomodoro Logic
  useEffect(() => {
    if (isTimerRunning) {
      lastTickTimestamp.current = Date.now();
      
      const tick = () => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickTimestamp.current) / 1000);
        
        if (delta >= 1) {
          setPomodoroTime(prev => {
            const nextTime = Math.max(0, prev - delta);
            
            // Sync time to task if in focus mode
            if (pomodoroMode === 'focus' && activeTaskId) {
              accumulatedFocusSeconds.current += delta;
              if (accumulatedFocusSeconds.current >= 60) {
                const minutesToApply = Math.floor(accumulatedFocusSeconds.current / 60);
                setTasks(currentTasks => currentTasks.map(t => 
                  t.id === activeTaskId ? { ...t, totalTimeSpent: (t.totalTimeSpent || 0) + minutesToApply } : t
                ));
                accumulatedFocusSeconds.current %= 60;
              }
            }
            
            if (nextTime === 0 && prev > 0) {
              // Timer Finished Logic
              playAlarm();
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              setIsTimerRunning(false); // Stop the timer immediately
              
              let nextModeStr = '';
              let nextModeType: 'focus' | 'short' | 'long' = 'focus';
              
              if (pomodoroMode === 'focus') {
                 const nextCycle = pomodoroCycles + 1;
                 setPomodoroCycles(nextCycle);
                 const isLongBreak = nextCycle % 4 === 0;
                 nextModeType = isLongBreak ? 'long' : 'short';
                 nextModeStr = isLongBreak ? 'Descanso Longo' : 'Pausa Curta';
                 notifyUser("Foco Concluído!", `Hora de uma ${nextModeStr}.`);
                 
                 // Trigger Mentor for Break
                 triggerMentor('break');
              } else {
                 nextModeType = 'focus';
                 nextModeStr = 'Foco';
                 notifyUser("Pausa Finalizada!", "Hora de voltar ao Foco.");
              }

              // Update state for the next mode but don't start running yet
              setPomodoroMode(nextModeType);
              setPomodoroTime(timerSettings[nextModeType] * 60);
              
              setTimerFinishedData({ 
                 previousMode: pomodoroMode === 'focus' ? 'Foco' : 'Pausa', 
                 nextMode: nextModeStr 
              });
              setActiveModal('timerFinished');
              
              return 0;
            }
            return nextTime;
          });
          lastTickTimestamp.current = now;
        }
        timerRef.current = requestAnimationFrame(tick);
      };
      
      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [isTimerRunning, pomodoroMode, activeTaskId, pomodoroCycles, timerSettings]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
          localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
          // Check Pro Status
          const { data } = await supabase.from('profiles').select('is_pro').eq('id', currentSession.user.id).single();
          if (data) setIsPro(data.is_pro);
        }
      } catch (err) { console.error("Auth init error:", err); }
      finally { setAuthLoading(false); }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      if (newSession) {
        setSession(newSession);
        localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsPro(false);
    setShowLanding(true); // Reset landing page visibility on logout
    localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
  };

  const enterGuestMode = () => {
    const guestSession = { 
      user: { 
        email: 'convidado@guitask.app', 
        id: 'guest-id',
        user_metadata: {
          full_name: 'Visitante',
          avatar_url: 'king'
        } 
      }, 
      isGuest: true 
    };
    setSession(guestSession);
    localStorage.setItem(STORAGE_KEYS.GUEST_SESSION, JSON.stringify(guestSession));
    
    // Always show tutorial in demo mode by resetting the completion flag
    localStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
    setTutorialStep(0);
  };

  const handleCreateMacro = () => {
    if (!isPro && tasks.length >= 1) return; // Prevent creation via function if limit reached

    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskContext,
      priority: 'medium',
      status: 'todo',
      dueDate: newTaskDeadline,
      estimatedTime: 30,
      category: 'Estratégia',
      completed: false,
      subTasks: [],
      rewardPoints: 100,
      totalTimeSpent: 0,
      links: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(""); 
    setNewTaskContext("");
    setNewTaskDeadline(new Date().toISOString().split('T')[0]);
    setActiveModal(null);
    setActiveTaskId(newTask.id);
    setView('local');
    setPomodoroMode('focus');
    setPomodoroTime(timerSettings.focus * 60);
    setPomodoroCycles(0);
  };

  const handleCreateReward = () => {
    if (!newRewardTitle.trim()) return;
    const reward: Reward = {
      id: Date.now().toString(),
      title: newRewardTitle,
      cost: newRewardCost,
      icon: 'gift'
    };
    setRewards([...rewards, reward]);
    setNewRewardTitle("");
    setNewRewardCost(50);
    setActiveModal(null);
  };

  const handleAddSubTask = () => {
    if (!activeTaskId) return;
    const currentTask = tasks.find(t => t.id === activeTaskId);
    if (!isPro && currentTask && currentTask.subTasks.length >= 1) return; // Prevent creation via function

    if (!newSubTask.title.trim()) return;
    const sub: SubTask = {
      id: Date.now().toString(),
      title: newSubTask.title,
      notes: newSubTask.notes,
      link: newSubTask.link,
      dueDate: newSubTask.dueDate,
      urgency: newSubTask.urgency,
      completed: false,
      status: 'todo',
      rewardPoints: URGENCY_POINTS[newSubTask.urgency || 'medium']
    };
    setTasks(tasks.map(t => t.id === activeTaskId ? { ...t, subTasks: [...t.subTasks, sub] } : t));
    setNewSubTask({ title: '', notes: '', link: '', dueDate: '', urgency: 'medium' });
    setActiveModal(null);
  };

  const updateSubTaskStatus = (subId: string, newStatus: TaskStatus) => {
    if (!activeTaskId) return;
    setTasks(prev => prev.map(t => {
      if (t.id === activeTaskId) {
        const updatedSubs = t.subTasks.map(s => {
          if (s.id === subId) {
             const wasCompleted = s.status === 'done';
             const isNowCompleted = newStatus === 'done';
             if (!wasCompleted && isNowCompleted) {
                setStats(p => ({ ...p, points: p.points + s.rewardPoints }));
                confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
                
                // Trigger Mentor for Success
                triggerMentor('success');
             }
             return { ...s, status: newStatus, completed: isNowCompleted };
          }
          return s;
        });
        return { ...t, subTasks: updatedSubs };
      }
      return t;
    }));
  };

  const completeMacroTask = () => {
    if (!activeTaskId) return;
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;
    setCompletedTasks([...completedTasks, { ...task, completed: true, completedAt: new Date().toISOString() }]);
    setTasks(tasks.filter(t => t.id !== activeTaskId));
    setStats(prev => ({ ...prev, points: prev.points + task.rewardPoints, tasksCompleted: prev.tasksCompleted + 1 }));
    confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 }, scalar: 1.2, gravity: 0.8 });
    setActiveTaskId(null);
    setView('history');
  };

  const recoverTask = (taskId: string) => {
    const task = completedTasks.find(t => t.id === taskId);
    if (!task) return;

    // Remove from completed
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    
    // Add back to tasks with status todo and remove completed flag
    setTasks(prev => [...prev, { ...task, completed: false, status: 'todo', completedAt: undefined }]);
    
    // Decrease completed count but keep XP points (optional choice, keeps users happy)
    setStats(prev => ({ ...prev, tasksCompleted: Math.max(0, prev.tasksCompleted - 1) }));
    
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#6366f1'] });
  };

  const duplicateTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (!isPro && tasks.length >= 1) {
        alert("Versão gratuita permite apenas 1 objetivo ativo por vez. Atualize para PRO!");
        return;
    }

    const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        title: `${task.title} (Cópia)`,
        // Regenerate IDs for subtasks to ensure uniqueness
        subTasks: task.subTasks.map(st => ({ ...st, id: Date.now().toString() + Math.random().toString() }))
    };
    setTasks([newTask, ...tasks]); // Add to top
    confetti({ particleCount: 30, spread: 40, origin: { x: 0.5, y: 0.5 } });
  };

  const deleteTask = (e: React.MouseEvent, taskId: string) => {
      e.stopPropagation();
      if (window.confirm("Tem certeza que deseja excluir este objetivo permanentemente?")) {
          setTasks(tasks.filter(t => t.id !== taskId));
      }
  };

  const deleteSubTask = (e: React.MouseEvent, subId: string) => {
      e.stopPropagation();
      if (!activeTaskId) return;
      if (window.confirm("Tem certeza que deseja remover esta atividade?")) {
          setTasks(prev => prev.map(t => {
              if (t.id === activeTaskId) {
                  return { ...t, subTasks: t.subTasks.filter(s => s.id !== subId) };
              }
              return t;
          }));
      }
  };

  const duplicateSubTask = (e: React.MouseEvent, sub: SubTask) => {
      e.stopPropagation();
      if (!activeTaskId) return;
      const currentTask = tasks.find(t => t.id === activeTaskId);
      if (!isPro && currentTask && currentTask.subTasks.length >= 1) {
          alert("Versão gratuita permite apenas 1 atividade em foco por vez. Atualize para PRO!");
          return;
      }

      const newSub: SubTask = {
          ...sub,
          id: Date.now().toString() + Math.random().toString(),
          title: `${sub.title} (Cópia)`
      };
      setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
              return { ...t, subTasks: [...t.subTasks, newSub] };
          }
          return t;
      }));
      confetti({ particleCount: 20, spread: 30, origin: { x: 0.5, y: 0.5 }, colors: ['#a855f7'] });
  };

  const redeemReward = (reward: Reward) => {
    if (stats.points >= reward.cost) {
      setStats(prev => ({ ...prev, points: prev.points - reward.cost }));
      
      const redemption: RedeemedReward = {
        id: Date.now().toString(),
        title: reward.title,
        cost: reward.cost,
        icon: reward.icon,
        redeemedAt: new Date().toISOString()
      };
      setRedeemedHistory([redemption, ...redeemedHistory]);
      
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.3 } });
      alert(`Recompensa "${reward.title}" resgatada! Aproveite.`);
    } else {
      alert("Pontos insuficientes!");
    }
  };

  const sortSubTasks = (tasks: SubTask[]) => {
    const weights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => {
       const wA = weights[a.urgency || 'medium'] || 0;
       const wB = weights[b.urgency || 'medium'] || 0;
       return wB - wA;
    });
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  const progress = useMemo(() => {
    if (!activeTask || activeTask.subTasks.length === 0) return 0;
    const completed = activeTask.subTasks.filter(s => s.status === 'done').length;
    return Math.round((completed / activeTask.subTasks.length) * 100);
  }, [activeTask]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (totalMinutes: number = 0) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}`;
  };

  const changeMode = (mode: 'focus' | 'short' | 'long') => {
    setIsTimerRunning(false);
    setPomodoroMode(mode);
    setPomodoroTime(timerSettings[mode] * 60);
    accumulatedFocusSeconds.current = 0;
  };

  const getFormattedDeadline = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      // Parse YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      const deadlineDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const formatted = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
      const isOverdue = deadlineDate < today;
      
      return { 
        text: formatted, 
        color: isOverdue ? 'text-rose-500' : 'text-emerald-500' 
      };
    } catch (e) {
      return null;
    }
  };
  
  // ... (Leaderboard Logic) ...
  // Ranking Calculation
  const leaderboardData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate User's Weekly Stats
    // 1. Points: Sum rewards of macro tasks completed in the last 7 days + active work
    // For simplicity in this demo, we'll use completedTasks list filter
    let weeklyPoints = 0;
    let weeklyTime = 0;

    // From Completed Tasks (History)
    completedTasks.forEach(t => {
       if (t.completedAt && new Date(t.completedAt) > oneWeekAgo) {
          weeklyPoints += t.rewardPoints;
          weeklyTime += (t.totalTimeSpent || 0);
       }
    });

    // From Active Tasks (Approximation: active tasks' totalTimeSpent counts towards this week for demo purposes)
    tasks.forEach(t => {
       weeklyTime += (t.totalTimeSpent || 0);
       // We don't add points from active tasks as they are not "completed" yet to award points in this model, 
       // but strictly speaking, subtasks award XP immediately. 
       // Let's iterate subtasks to be precise if we wanted, but sticking to macro points for consistency with the prompt logic usually implies "score".
       // However, we do award points on subtask completion.
       t.subTasks.forEach(s => {
          if(s.status === 'done') {
             // If we had a timestamp for subtask completion, we'd filter. 
             // We'll assume for this weekly view that active task subtask completions are recent.
             weeklyPoints += s.rewardPoints;
          }
       });
    });

    const currentUser = {
       id: 'me',
       name: userAvatar ? userAvatar.name : 'Você',
       avatar: userAvatar ? userAvatar.config.mood : 'king',
       bg: userAvatar ? userAvatar.config.bg : 'bg-indigo-100',
       points: weeklyPoints,
       time: weeklyTime,
       isMe: true,
       isPro: isPro // Add status to ranking
    };

    // Generate Randomized Stats for Mock Users based on current user performance to keep it competitive
    const basePoints = Math.max(100, weeklyPoints);
    const baseTime = Math.max(60, weeklyTime);

    const rankedUsers = MOCK_USERS.map(u => ({
       ...u,
       points: Math.floor(Math.random() * (basePoints * 1.5)) + 50,
       time: Math.floor(Math.random() * (baseTime * 1.5)) + 30,
       isPro: Math.random() > 0.6 // Randomly assign pro status to mock users
    }));

    // Add current user
    const allUsers = [...rankedUsers, currentUser];

    // Sort function depends on active tab, will handle in render or return both sorted lists
    return {
       byPoints: [...allUsers].sort((a, b) => b.points - a.points),
       byTime: [...allUsers].sort((a, b) => b.time - a.time)
    };
  }, [tasks, completedTasks, userAvatar, isPro]);

  const currentLeaderboard = rankingTab === 'points' ? leaderboardData.byPoints : leaderboardData.byTime;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="text-indigo-600 animate-bounce" size={48} /></div>;
  
  if (!session) {
     if (showLanding) {
        return <LandingPage onStart={() => setShowLanding(false)} onLogin={() => setShowLanding(false)} isDark={isDark} />;
     }
     return <AuthScreen theme={theme} onGuestAccess={enterGuestMode} />;
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-0 ${isSidebarCollapsed ? 'md:pl-24' : 'md:pl-64'} flex flex-col transition-all duration-300 ease-in-out ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Mentor Notification Component */}
      <MentorNotification 
         show={mentorNotification.show} 
         message={mentorNotification.message} 
         avatarConfig={userAvatar?.config} 
         onClose={() => setMentorNotification({ ...mentorNotification, show: false })}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay 
         step={tutorialStep}
         avatarConfig={userAvatar?.config}
         onNext={handleTutorialNext}
         onSkip={handleTutorialSkip}
      />

      {/* Nav */}
      <nav className={`fixed bottom-0 left-0 w-full h-20 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-around z-50 md:top-0 md:left-0 md:h-full md:flex-col md:justify-start md:p-6 md:border-r shadow-2xl transition-all duration-300 ease-in-out md:w-${isSidebarCollapsed ? '24' : '64'}`}>
        {/* ... Nav Content ... */}
        {/* Sidebar Toggle (Desktop Only) */}
        <button 
           onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
           className={`hidden md:flex absolute -right-3 top-12 bg-indigo-600 text-white p-1 rounded-full shadow-lg border-2 ${isDark ? 'border-slate-900' : 'border-slate-50'} z-50 hover:scale-110 transition-transform`}
        >
           {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        <div className="hidden md:flex flex-col items-start gap-8 mb-10 w-full h-full">
          {/* TOP: Fixed Logo */}
          <div className={`flex items-center gap-3 px-2 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
               <Zap size={22} fill="currentColor" />
            </div>
            {!isSidebarCollapsed && (
               <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <h1 className="text-3xl font-black tracking-tighter leading-none text-[#4b47df]">GUITASK</h1>
                  <p className="text-[10px] font-bold text-slate-400">Clareza para mentes inquietas.</p>
               </div>
            )}
          </div>

          {/* MIDDLE: Nav Items */}
          <div className="w-full space-y-2 flex-1">
            <NavItem collapsed={isSidebarCollapsed} active={view === 'global'} onClick={() => setView('global')} icon={<LayoutDashboard size={20} />} label="Geral" isDark={isDark} />
            <NavItem collapsed={isSidebarCollapsed} active={view === 'local'} onClick={() => setView('local')} icon={<Target size={20} />} label="Foco" isDark={isDark} />
            <NavItem collapsed={isSidebarCollapsed} active={view === 'ranking'} onClick={() => setView('ranking')} icon={<Crown size={20} />} label="Ranking" isDark={isDark} />
            <NavItem collapsed={isSidebarCollapsed} active={view === 'history'} onClick={() => setView('history')} icon={<History size={20} />} label="Histórico" isDark={isDark} />
            <NavItem collapsed={isSidebarCollapsed} active={view === 'rewards'} onClick={() => setView('rewards')} icon={<Trophy size={20} />} label="Prêmios" isDark={isDark} />
          </div>

          {/* BOTTOM: User Info + Points + Logout */}
          <div className="w-full space-y-4">
            {userAvatar && (
               <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'} ${isSidebarCollapsed ? 'justify-center border-transparent bg-transparent' : ''}`}>
                  <div className={`w-10 h-10 ${userAvatar.config.bg} rounded-xl flex items-center justify-center text-white shadow-sm overflow-hidden p-1 min-w-[2.5rem]`}>
                     <CapybaraAvatar mood={userAvatar.config.mood} />
                  </div>
                  {!isSidebarCollapsed && (
                     <div className="overflow-hidden flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-0.5">Olá,</p>
                        <div className="flex items-center gap-2">
                           <p className={`text-sm font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{userAvatar.name}</p>
                           {isPro && (
                              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm tracking-wider">PRO</span>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            )}
            
            {!isSidebarCollapsed ? (
               <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all mb-4 ${isDark ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50 border-indigo-100'}`}>
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                           <Star size={16} fill="currentColor" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-600">Meus Pontos</span>
                     </div>
                     <span className="text-lg font-black tracking-tighter text-indigo-700 dark:text-indigo-400">{stats.points}</span>
                  </div>
                  <button onClick={handleLogout} className="w-full p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors">
                     <LogOut size={16} /> Sair
                  </button>
               </div>
            ) : (
               <div className="flex flex-col gap-4 w-full animate-in fade-in duration-300">
                  <div className="flex justify-center" title={`Pontos: ${stats.points}`}>
                     <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm relative group cursor-help">
                        <Star size={18} fill="currentColor" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-amber-900 shadow-sm">{stats.points > 99 ? '99+' : stats.points}</span>
                     </div>
                  </div>
                  <button onClick={handleLogout} className="w-full p-3 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex justify-center" title="Sair">
                     <LogOut size={20} />
                  </button>
               </div>
            )}
          </div>
        </div>
        <div className="flex md:hidden items-center justify-around w-full h-full px-4 relative">
           <button onClick={() => setView('global')} className={`p-2 rounded-xl ${view === 'global' ? 'text-indigo-600' : 'text-slate-500'}`}><LayoutDashboard size={24} /></button>
           <button onClick={() => setView('local')} className={`p-2 rounded-xl ${view === 'local' ? 'text-indigo-600' : 'text-slate-500'}`}><Target size={24} /></button>
           <button onClick={() => setActiveModal('macro')} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -translate-y-4 border-4 border-white dark:border-slate-900"><Plus size={28} /></button>
           <div className="relative group">
              <button onClick={() => setView('ranking')} className={`p-2 rounded-xl ${view === 'ranking' ? 'text-indigo-600' : 'text-slate-500'}`}><Crown size={24} /></button>
              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full border border-white">
                {stats.points}
              </div>
           </div>
           <button onClick={handleLogout} className="p-2 rounded-xl text-rose-600"><LogOut size={24} /></button>
        </div>
      </nav>

      {/* Main Content (truncated as previous logic) */}
      <main className="flex-1 p-4 md:p-10 w-full max-w-[1400px] mx-auto pt-10">
        {view === 'global' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Estratégia Global</h2>
                <p className="text-sm font-bold text-slate-500 italic">Visualize o destino, não apenas os passos.</p>
              </div>
              <button id="btn-create-macro" onClick={() => setActiveModal('macro')} className="hidden md:flex bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all items-center gap-2">
                <Plus size={20} /> Novo objetivo/projeto
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => {
                 const taskProgress = task.subTasks.length > 0 ? Math.round((task.subTasks.filter(s => s.status === 'done').length / task.subTasks.length) * 100) : 0;
                 const deadlineInfo = getFormattedDeadline(task.dueDate);
                 return (
                  <div key={task.id} onClick={() => { setActiveTaskId(task.id); setView('local'); }} className={`p-8 rounded-[3.5rem] border-2 transition-all cursor-pointer shadow-sm group relative flex flex-col justify-between h-80 hover:translate-y-[-4px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                    <div>
                      <div className="absolute top-6 right-6 flex gap-2">
                         <button onClick={(e) => duplicateTask(e, task)} className="p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-600 transition-all" title="Duplicar">
                            <Copy size={16} />
                         </button>
                         <button onClick={(e) => deleteTask(e, task.id)} className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/50 text-slate-400 hover:text-rose-500 transition-all" title="Excluir">
                            <Trash2 size={16} />
                         </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-4 pr-16">
                        <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                           <Clock size={12} /> {formatTotalTime(task.totalTimeSpent)}
                        </span>
                        {deadlineInfo && (
                          <span className={`text-[10px] font-black px-3 py-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} ${deadlineInfo.color} rounded-full uppercase flex items-center gap-1.5 shadow-sm`}>
                             <Calendar size={12} /> Prazo: {deadlineInfo.text}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                      <p className="text-sm font-bold text-slate-500 line-clamp-2 mt-2 leading-relaxed">{task.description}</p>
                    </div>
                    <div className="mt-auto space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                          <span>Progresso</span>
                          <span>{taskProgress}%</span>
                       </div>
                       <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-700 ease-out" style={{ width: `${taskProgress}%` }} />
                       </div>
                    </div>
                  </div>
                 );
              })}
              {tasks.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300"><LayoutDashboard size={40} /></div>
                   <h3 className="text-xl font-black mb-2">Tudo limpo no horizonte.</h3>
                   <p className="text-sm font-bold text-slate-500">Qual o próximo grande objetivo?</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ... Rest of existing views (history, ranking, local, rewards) ... */}
        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
              <h2 className="text-4xl font-black tracking-tight">Histórico de Conquistas</h2>
              <p className="text-sm font-bold text-slate-500 italic">Cada objetivo concluído é um degrau para o topo.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTasks.map(task => (
                <div key={task.id} className={`p-8 rounded-[3.5rem] border-2 shadow-sm flex flex-col justify-between h-80 opacity-90 transition-all hover:opacity-100 hover:shadow-lg ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-[10px] font-black px-3 py-1 bg-emerald-600 text-white rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                         <CheckCircle size={12} /> Concluído
                      </span>
                      <span className="text-[10px] font-black px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase flex items-center gap-1.5">
                         <Clock size={12} /> {formatTotalTime(task.totalTimeSpent)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black leading-tight text-slate-800 dark:text-slate-200">{task.title}</h3>
                    <p className="text-sm font-bold text-slate-500 line-clamp-3 mt-2 leading-relaxed">{task.description}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                     <p className="text-[10px] font-black uppercase text-slate-400">Finalizado em:</p>
                     <p className="text-xs font-black text-slate-600 dark:text-slate-300 mb-3">{task.completedAt ? new Date(task.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não registrada'}</p>
                     <button 
                        onClick={(e) => { e.stopPropagation(); recoverTask(task.id); }}
                        className="w-full py-2 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold uppercase text-[10px] hover:bg-indigo-50 hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
                     >
                        <RotateCcw size={14} /> Recuperar Objetivo
                     </button>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300"><History size={40} /></div>
                   <h3 className="text-xl font-black mb-2">Seu histórico está em branco.</h3>
                   <p className="text-sm font-bold text-slate-500">Conclua seu primeiro objetivo para eternizá-lo aqui!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'ranking' && (
          <div id="container-ranking" className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">
            <header className="mb-10 flex flex-col items-center text-center">
              <h2 className="text-4xl font-black tracking-tight mb-2 text-[#4b47df]">Ranking Semanal</h2>
              <p className="text-sm font-bold text-slate-500 italic mb-6">Veja como você está se saindo em relação à comunidade!</p>
              
              <div className="flex p-1.5 rounded-2xl border border-slate-100 bg-white shadow-sm">
                 <button 
                   onClick={() => setRankingTab('points')} 
                   className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-2 ${rankingTab === 'points' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                 >
                    <Star size={14} /> Maior Pontuação
                 </button>
                 <button 
                   onClick={() => setRankingTab('time')} 
                   className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-2 ${rankingTab === 'time' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                 >
                    <Clock size={14} /> Mais Tempo Focado
                 </button>
              </div>
            </header>

            <div className="space-y-6">
              {/* Podium */}
              <div className="flex items-end justify-center gap-4 mb-12 min-h-[220px]">
                 {currentLeaderboard[1] && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                       <div className="mb-2 relative">
                          <div className={`w-16 h-16 rounded-2xl ${currentLeaderboard[1].bg} flex items-center justify-center border-4 border-slate-300 bg-white shadow-xl overflow-hidden`}>
                             <CapybaraAvatar mood={currentLeaderboard[1].avatar} />
                          </div>
                          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-300 text-slate-600 font-black flex items-center justify-center border-2 border-white shadow-sm">2</div>
                       </div>
                       <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs font-black text-slate-500">{currentLeaderboard[1].name}</p>
                          {(currentLeaderboard[1] as any).isPro && <span className="bg-amber-400 text-white text-[8px] font-black px-1 rounded">PRO</span>}
                       </div>
                       <div className="py-2 px-4 bg-white border border-slate-200 rounded-xl font-black text-slate-900 text-sm shadow-sm">
                          {rankingTab === 'points' ? currentLeaderboard[1].points : formatTotalTime(currentLeaderboard[1].time)}
                       </div>
                       <div className="w-20 h-24 bg-slate-200 rounded-t-2xl mt-2 border-t-4 border-slate-300" />
                    </div>
                 )}

                 {currentLeaderboard[0] && (
                    <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-8 duration-700">
                       <Crown size={32} className="text-amber-400 mb-2 animate-bounce" fill="currentColor" />
                       <div className="mb-2 relative">
                          <div className={`w-24 h-24 rounded-3xl ${currentLeaderboard[0].bg} flex items-center justify-center border-4 border-amber-400 bg-white shadow-2xl overflow-hidden scale-110 shadow-amber-200/50`}>
                             <CapybaraAvatar mood={currentLeaderboard[0].avatar} />
                          </div>
                          <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-amber-400 text-amber-900 font-black flex items-center justify-center border-4 border-white shadow-sm text-lg">1</div>
                       </div>
                       <div className="flex items-center gap-1 mb-1">
                          <p className="text-sm font-black text-slate-900">{currentLeaderboard[0].name}</p>
                          {(currentLeaderboard[0] as any).isPro && <span className="bg-amber-400 text-white text-[8px] font-black px-1 rounded">PRO</span>}
                       </div>
                       <div className="py-2 px-6 bg-indigo-600 text-white rounded-xl font-black text-base shadow-lg mb-2">
                          {rankingTab === 'points' ? currentLeaderboard[0].points : formatTotalTime(currentLeaderboard[0].time)}
                       </div>
                       <div className="w-24 h-32 bg-amber-300 rounded-t-3xl border-t-4 border-amber-400 shadow-[0_0_40px_-10px_rgba(251,191,36,0.6)]" />
                    </div>
                 )}

                 {currentLeaderboard[2] && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                       <div className="mb-2 relative">
                          <div className={`w-16 h-16 rounded-2xl ${currentLeaderboard[2].bg} flex items-center justify-center border-4 border-amber-700/30 bg-white shadow-xl overflow-hidden`}>
                             <CapybaraAvatar mood={currentLeaderboard[2].avatar} />
                          </div>
                          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-700/30 text-amber-900 font-black flex items-center justify-center border-2 border-white shadow-sm">3</div>
                       </div>
                       <div className="flex items-center gap-1 mb-1">
                          <p className="text-xs font-black text-slate-500">{currentLeaderboard[2].name}</p>
                          {(currentLeaderboard[2] as any).isPro && <span className="bg-amber-400 text-white text-[8px] font-black px-1 rounded">PRO</span>}
                       </div>
                       <div className="py-2 px-4 bg-white border border-slate-200 rounded-xl font-black text-slate-900 text-sm shadow-sm">
                          {rankingTab === 'points' ? currentLeaderboard[2].points : formatTotalTime(currentLeaderboard[2].time)}
                       </div>
                       <div className="w-20 h-16 bg-amber-100 rounded-t-2xl mt-2 border-t-4 border-amber-200" />
                    </div>
                 )}
              </div>

              {/* List */}
              <div className="space-y-3">
                 {currentLeaderboard.slice(3).map((user, index) => (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all bg-white hover:bg-slate-50 shadow-sm hover:shadow-md ${user.isMe ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'}`}
                    >
                       <div className="w-8 font-black text-slate-400 text-center">#{index + 4}</div>
                       <div className={`w-12 h-12 rounded-xl ${user.bg} flex items-center justify-center p-1`}>
                          <CapybaraAvatar mood={user.avatar} />
                       </div>
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${user.isMe ? 'text-indigo-700' : 'text-slate-900'}`}>
                               {user.name} {user.isMe && '(Você)'}
                            </p>
                            {(user as any).isPro && (
                               <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm tracking-wider">PRO</span>
                            )}
                          </div>
                       </div>
                       <div className="font-black text-slate-900">
                          {rankingTab === 'points' ? user.points : formatTotalTime(user.time)}
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {view === 'local' && activeTask && (
          <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
             <div className="flex items-center justify-between">
                <button onClick={() => setView('global')} className="text-xs font-black uppercase text-indigo-600 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"><ArrowLeft size={14} /> Voltar para Visão Global</button>
                <div className="flex items-center gap-3">
                   {progress === 100 && activeTask.subTasks.length > 0 && (
                      <button 
                        onClick={completeMacroTask}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all bg-emerald-500 text-white hover:bg-emerald-600 shadow-md animate-in fade-in slide-in-from-right-2"
                      >
                        <CheckCircle size={14} /> Objetivo Concluído
                      </button>
                   )}
                   <button 
                      onClick={() => setIsCompactMode(!isCompactMode)} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-white text-slate-500 hover:text-indigo-600 shadow-sm'}`}
                   >
                      {isCompactMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                      {isCompactMode ? 'Maximizar' : 'Minimizar'}
                   </button>
                </div>
             </div>
             
             <div className={`grid grid-cols-1 ${isCompactMode ? 'lg:grid-cols-3' : ''} gap-6`}>
               {/* Objective Header Window */}
               <div id="objective-header" className={`${isCompactMode ? 'lg:col-span-2' : ''} p-10 rounded-[3.5rem] shadow-xl border relative overflow-hidden transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="relative z-10 flex flex-col gap-6">
                     <div className="flex items-center">
                        <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                           <Clock size={12} /> {formatTotalTime(activeTask.totalTimeSpent)}
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <Target size={isCompactMode ? 24 : 32} className="text-indigo-600" />
                           <h2 className={`${isCompactMode ? 'text-2xl' : 'text-4xl'} font-black tracking-tight dark:text-white transition-all`} style={{ color: isDark ? undefined : '#0f172a' }}>{activeTask.title}</h2>
                        </div>
                        <p className={`${isCompactMode ? 'text-base' : 'text-lg'} font-bold leading-relaxed max-w-2xl dark:text-slate-300 transition-all`} style={{ color: isDark ? undefined : '#334155' }}>
                           {activeTask.description || 'Sem contexto definido.'}
                        </p>
                     </div>

                     {!isCompactMode && (
                        <div className="pt-4 border-t border-slate-100/40 dark:border-slate-800/50 flex flex-wrap items-center gap-3 animate-in fade-in duration-500">
                           <p className="text-[10px] font-black uppercase text-slate-500 mr-2">Referências:</p>
                           {activeTask.links?.map(l => (
                              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700 hover:border-indigo-600 transition-all text-xs font-bold text-slate-700 dark:text-slate-200">
                                 <Link2 size={12} className="text-indigo-600" /> {l.title}
                              </a>
                           ))}
                           <button onClick={() => setActiveModal('links')} className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition-colors p-2 font-black">
                              <PlusCircle size={14} /> Gerenciar Links
                           </button>
                        </div>
                     )}
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
               </div>

               {/* Pomodoro Timer Window */}
               <div id="container-timer" className={`${isCompactMode ? 'lg:col-span-1' : ''} p-10 rounded-[3.5rem] shadow-xl border overflow-hidden transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex flex-col items-center gap-8">
                     <div className="w-full flex justify-center items-center px-4 relative">
                        <div className={`flex ${isCompactMode ? 'gap-2' : 'gap-4'}`}>
                           <button onClick={() => changeMode('focus')} className={`${isCompactMode ? 'px-3 text-[8px]' : 'px-6 text-[10px]'} py-2 rounded-2xl font-black uppercase transition-all ${pomodoroMode === 'focus' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 font-bold hover:text-indigo-600'}`}>Foco</button>
                           <button onClick={() => changeMode('short')} className={`${isCompactMode ? 'px-3 text-[8px]' : 'px-6 text-[10px]'} py-2 rounded-2xl font-black uppercase transition-all ${pomodoroMode === 'short' ? 'bg-[#ff6e30] text-white shadow-md' : 'text-slate-600 font-bold hover:text-[#ff6e30]'}`}>Pausa</button>
                           <button onClick={() => changeMode('long')} className={`${isCompactMode ? 'px-3 text-[8px]' : 'px-6 text-[10px]'} py-2 rounded-2xl font-black uppercase transition-all ${pomodoroMode === 'long' ? 'bg-[#ff3131] text-white shadow-md' : 'text-slate-600 font-bold hover:text-[#ff3131]'}`}>Descanso</button>
                        </div>
                        <button onClick={() => setActiveModal('timerSettings')} className="absolute right-0 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-all">
                           <Settings2 size={isCompactMode ? 16 : 20} />
                        </button>
                     </div>
                     
                     <div className="relative flex flex-col items-center">
                        <div 
                          className={`${isCompactMode ? 'text-6xl' : 'text-9xl'} font-black tracking-tighter tabular-nums select-none transition-all duration-500 ${!isTimerRunning && (isDark ? 'text-slate-700' : 'text-slate-300')}`} 
                          style={{ 
                            color: isTimerRunning ? (pomodoroMode === 'focus' ? '#5246e5' : pomodoroMode === 'short' ? '#ff6e30' : '#f31321') : undefined 
                          }}
                        >
                          {formatTime(pomodoroTime)}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Ciclo #{pomodoroCycles + 1}</span>
                     </div>

                     <div className="flex items-center gap-6">
                        <button onClick={toggleTimer} className={`${isCompactMode ? 'w-16 h-16' : 'w-24 h-24'} rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all ${isTimerRunning ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                           {isTimerRunning ? <Pause size={isCompactMode ? 24 : 40} fill="currentColor" /> : <Play size={isCompactMode ? 24 : 40} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={() => { setIsTimerRunning(false); setPomodoroTime(timerSettings[pomodoroMode] * 60); accumulatedFocusSeconds.current = 0; setPomodoroCycles(0); }} className={`${isCompactMode ? 'w-12 h-12 rounded-2xl' : 'w-16 h-16 rounded-3xl'} bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700`}>
                           <RotateCcw size={isCompactMode ? 20 : 28} />
                        </button>
                     </div>
                  </div>
               </div>
             </div>

             {/* Kanban Micro-Tasks Window */}
             <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                   <h3 className="text-2xl font-black tracking-tight">Atividades</h3>
                   <button id="btn-add-subtask" onClick={() => setActiveModal('subtask')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 transition-all">
                      <PlusCircle size={18} /> Adicionar atividade
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                   {['todo', 'doing', 'done'].map((status) => (
                      <div 
                        key={status} 
                        onDragOver={(e) => { e.preventDefault(); setDragOverColumn(status); }}
                        onDragLeave={() => setDragOverColumn(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          const subId = e.dataTransfer.getData('subId');
                          if (subId) updateSubTaskStatus(subId, status as TaskStatus);
                          setDragOverColumn(null);
                        }}
                        className={`p-6 rounded-[3rem] min-h-[400px] border-2 transition-all duration-300 ${dragOverColumn === status ? 'border-indigo-400 bg-indigo-50/20' : 'border-dashed border-slate-300'} ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-100/50'}`}
                      >
                         <div className="flex items-center justify-between mb-6 px-4">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                               {status === 'todo' ? 'A Fazer' : status === 'doing' ? 'Em Andamento' : 'Concluído'}
                            </h4>
                            <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm text-slate-700">
                               {activeTask.subTasks.filter(s => s.status === status).length}
                            </span>
                         </div>

                         <div className="space-y-4">
                            {sortSubTasks(activeTask.subTasks.filter(s => s.status === status)).map(sub => {
                               const deadlineInfo = getFormattedDeadline(sub.dueDate || "");
                               const urgencyInfo = URGENCY_CONFIG[sub.urgency || 'medium'];
                               return (
                               <div 
                                 key={sub.id} 
                                 draggable
                                 onDragStart={(e) => {
                                   e.dataTransfer.setData('subId', sub.id);
                                   e.dataTransfer.effectAllowed = 'move';
                                 }}
                                 className={`p-6 rounded-[2rem] border-2 shadow-sm group transition-all animate-in fade-in slide-in-from-top-2 cursor-grab active:cursor-grabbing hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-600' : 'bg-white border-white hover:border-indigo-100'}`}
                               >
                                  <div className="flex items-start justify-between mb-3">
                                     <div className="flex items-start gap-2">
                                        <GripVertical size={16} className="text-slate-300 mt-1 cursor-grab" />
                                        <div>
                                          <h5 className="font-black text-lg leading-tight dark:text-white" style={{ color: isDark ? undefined : '#0f172a' }}>{sub.title}</h5>
                                          
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => duplicateSubTask(e, sub)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Duplicar">
                                           <Copy size={12} />
                                        </button>
                                        <button onClick={(e) => deleteSubTask(e, sub.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" title="Excluir">
                                           <Trash2 size={12} />
                                        </button>
                                     </div>
                                  </div>
                                  
                                  {sub.notes && <p className="text-xs font-bold mb-3 line-clamp-3 leading-relaxed ml-6" style={{ color: '#a6a6a6' }}>{sub.notes}</p>}
                                  
                                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 ml-6">
                                     {/* Urgency Badge */}
                                     <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-md ${urgencyInfo.bg} ${urgencyInfo.color}`}>
                                        <urgencyInfo.icon size={10} /> {urgencyInfo.label}
                                     </div>

                                     {/* XP Badge */}
                                     <div className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-md bg-yellow-100 text-yellow-700">
                                        <Star size={10} /> +{sub.rewardPoints} XP
                                     </div>

                                     {deadlineInfo && (
                                        <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-0 py-1 rounded-md ${deadlineInfo.color}`}>
                                           <Clock size={10} /> {deadlineInfo.text}
                                        </div>
                                     )}
                                     {sub.link && (
                                        <a href={sub.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 py-1 hover:underline">
                                           <ExternalLink size={10} /> Links relacionados
                                        </a>
                                     )}
                                  </div>
                               </div>
                            )})}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {view === 'rewards' && (
          <div id="container-rewards" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="col-span-full p-12 rounded-[4rem] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl mb-6">
                <div className="z-10 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <h3 className="text-5xl font-black">Loja de Foco</h3>
                      <button id="btn-create-reward" onClick={() => setActiveModal('createReward')} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><Plus size={24} /></button>
                   </div>
                   <p className="text-xl text-indigo-100 font-bold opacity-90">Você trabalhou duro. Hora de se presentear.</p>
                </div>
                <div className="text-center md:text-right z-10 mt-8 md:mt-0">
                   <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Seu Saldo Disponível</p>
                   <p className="text-7xl font-black flex items-center gap-4 justify-center md:justify-end">{stats.points} <Star size={50} fill="currentColor" /></p>
                </div>
                <Zap className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 rotate-12" />
             </div>
             
             {rewards.map(reward => (
               <div key={reward.id} className={`p-8 rounded-[3.5rem] border-2 flex items-center gap-6 group hover:border-indigo-600 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${reward.icon === 'coffee' ? 'bg-amber-100 text-amber-700' : reward.icon === 'play' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {reward.icon === 'coffee' ? <Coffee size={36} /> : reward.icon === 'play' ? <Play size={36} /> : <Gift size={36} />}
                  </div>
                  <div className="flex-1">
                     <h4 className="text-xl font-black transition-colors" style={{ color: isDark ? undefined : '#0f172a' }}>{reward.title}</h4>
                     <p className="text-sm font-bold text-slate-500">{reward.cost} pontos necessários.</p>
                  </div>
                  <div className="text-right">
                     <button 
                        onClick={() => redeemReward(reward)}
                        className={`px-6 py-3 rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all ${stats.points >= reward.cost ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                     >
                       {reward.cost} pts
                     </button>
                  </div>
               </div>
             ))}

             {rewards.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
                   <Trophy size={48} className="mb-4 text-slate-300" />
                   <p className="font-bold">Nenhum prêmio cadastrado.</p>
                </div>
             )}

             {/* Historic Section */}
             <div className="col-span-full mt-10">
                <div className="flex items-center gap-3 mb-6 px-4">
                   <Receipt size={24} className="text-slate-400" />
                   <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">Histórico de Resgates</h3>
                </div>
                
                <div className="space-y-4">
                  {redeemedHistory.length > 0 ? (
                    redeemedHistory.map(item => (
                       <div key={item.id} className={`p-6 rounded-3xl border flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center grayscale ${item.icon === 'coffee' ? 'bg-amber-100 text-amber-700' : item.icon === 'play' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.icon === 'coffee' ? <Coffee size={20} /> : item.icon === 'play' ? <Play size={20} /> : <Gift size={20} />}
                             </div>
                             <div>
                                <h4 className="font-black text-lg text-slate-500 dark:text-slate-400">{item.title}</h4>
                                <p className="text-[10px] font-bold uppercase text-slate-400">
                                   Resgatado em {new Date(item.redeemedAt).toLocaleDateString('pt-BR')} às {new Date(item.redeemedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                             </div>
                          </div>
                          <div className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-black text-xs">
                             -{item.cost} pts
                          </div>
                       </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-slate-400 italic font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                       Você ainda não resgatou nenhum prêmio.
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'timerFinished' && timerFinishedData && (
         <Modal title="Ciclo Completo!" onClose={() => {}} isDark={isDark}>
            <div className="flex flex-col items-center justify-center text-center space-y-6">
               <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                  <BellRing size={48} />
               </div>
               <div>
                  <h4 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Tempo Esgotado!</h4>
                  <p className="text-lg font-bold text-slate-500">
                     O ciclo de <span className="text-indigo-600">{timerFinishedData.previousMode}</span> terminou.
                  </p>
               </div>
               <div className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border-2 border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-black uppercase text-slate-400 mb-2">Próxima Etapa</p>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6">{timerFinishedData.nextMode}</p>
                  <button 
                     onClick={() => {
                        setActiveModal(null);
                        setIsTimerRunning(true);
                     }}
                     className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     <Play size={20} fill="currentColor" /> Iniciar {timerFinishedData.nextMode}
                  </button>
               </div>
            </div>
         </Modal>
      )}

      {activeModal === 'createReward' && (
        <Modal title="Novo Prêmio" onClose={() => setActiveModal(null)} isDark={isDark}>
           <div className="space-y-6">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Nome do Prêmio</label>
                 <input autoFocus value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)} placeholder="Ex: Comer uma pizza" className={`w-full p-5 border-2 rounded-3xl font-bold text-lg outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Custo em Pontos</label>
                 <input type="number" value={newRewardCost} onChange={e => setNewRewardCost(Math.max(1, parseInt(e.target.value) || 0))} className={`w-full p-5 border-2 rounded-3xl font-bold text-lg outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
              </div>
              <button onClick={handleCreateReward} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Salvar Prêmio</button>
           </div>
        </Modal>
      )}

      {activeModal === 'timerSettings' && (
        <Modal title="Ajustar Tempos" onClose={() => setActiveModal(null)} isDark={isDark}>
           <div className="space-y-6">
              {[
                { key: 'focus', label: 'Tempo de Foco (min)', color: 'bg-indigo-600' },
                { key: 'short', label: 'Pausa Curta (min)', color: 'bg-[#ff6e30]' },
                { key: 'long', label: 'Descanso (min)', color: 'bg-[#ff3131]' }
              ].map(setting => (
                <div key={setting.key} className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">{setting.label}</label>
                   <div className="flex items-center gap-4">
                      <input 
                         type="number" 
                         value={timerSettings[setting.key as keyof typeof timerSettings]} 
                         onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setTimerSettings({...timerSettings, [setting.key]: val});
                            if (pomodoroMode === setting.key && !isTimerRunning) {
                               setPomodoroTime(val * 60);
                            }
                         }}
                         className={`flex-1 p-4 border-2 rounded-2xl font-black text-lg outline-none focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                      />
                      <div className={`w-4 h-12 rounded-full ${setting.color}`} />
                   </div>
                </div>
              ))}
              <button onClick={() => setActiveModal(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">Salvar Configurações</button>
           </div>
        </Modal>
      )}

      {activeModal === 'macro' && (
        <Modal title="Defina seu objetivo" onClose={() => setActiveModal(null)} isDark={isDark}>
           {!isPro && tasks.length >= 1 ? (
             <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-4">
                   <Lock size={40} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">Limite Gratuito Atingido</h4>
                   <p className="text-sm font-bold text-slate-500">Usuários gratuitos podem gerenciar apenas 1 objetivo macro por vez.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">O que o plano PRO desbloqueia:</p>
                   <ul className="text-left space-y-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <li className="flex items-center gap-2"><CheckCircle size={14} /> Objetivos Ilimitados</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} /> Sub-tarefas Ilimitadas</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} /> Tag exclusiva PRO no ranking</li>
                   </ul>
                </div>
                <a 
                   href={STRIPE_LINK} 
                   target="_blank" 
                   rel="noreferrer"
                   className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] transition-transform"
                >
                   Tornar-se PRO agora
                </a>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Título do objetivo</label>
                   <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Ex: Lançar meu projeto novo" className={`w-full p-5 border-2 rounded-3xl font-bold text-lg outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Contexto rápido</label>
                   <textarea value={newTaskContext} onChange={e => setNewTaskContext(e.target.value)} placeholder="O que torna isso importante?" rows={3} className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Prazo final</label>
                   <input type="date" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
                <button onClick={handleCreateMacro} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Criar</button>
             </div>
           )}
        </Modal>
      )}

      {activeModal === 'subtask' && (
        <Modal title="Adicionar atividade" onClose={() => setActiveModal(null)} isDark={isDark}>
           {(!isPro && activeTask && activeTask.subTasks.length >= 1) ? (
             <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-4">
                   <Lock size={40} />
                </div>
                <div>
                   <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 mb-2">Foco Máximo Atingido</h4>
                   <p className="text-sm font-bold text-slate-500">Para manter o foco, o plano gratuito permite apenas 1 atividade simultânea por objetivo.</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                   <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">Libere seu potencial com o PRO:</p>
                   <ul className="text-left space-y-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <li className="flex items-center gap-2"><CheckCircle size={14} /> Adicione quantas tarefas precisar</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} /> Gerencie múltiplos projetos</li>
                   </ul>
                </div>
                <a 
                   href={STRIPE_LINK} 
                   target="_blank" 
                   rel="noreferrer"
                   className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black text-base shadow-xl hover:scale-[1.02] transition-transform"
                >
                   Desbloquear Tudo
                </a>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Título da atividade</label>
                   <input autoFocus value={newSubTask.title} onChange={e => setNewSubTask({...newSubTask, title: e.target.value})} placeholder="Ex: Pesquisar referências" className={`w-full p-5 border-2 rounded-3xl font-bold text-lg outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Nível de Urgência</label>
                   <div className="flex gap-2">
                      {Object.entries(URGENCY_CONFIG).reverse().map(([key, config]) => {
                         const isSelected = newSubTask.urgency === key;
                         const Icon = config.icon;
                         return (
                            <button
                               key={key}
                               onClick={() => setNewSubTask({ ...newSubTask, urgency: key as Urgency })}
                               className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${isSelected ? `border-current ${config.color} ${config.bg}` : `border-transparent ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}`}
                            >
                               <Icon size={20} />
                               <span className="text-[10px] font-black uppercase">{config.label}</span>
                            </button>
                         )
                      })}
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Notas</label>
                   <textarea value={newSubTask.notes} onChange={e => setNewSubTask({...newSubTask, notes: e.target.value})} placeholder="Detalhes ou observações" rows={2} className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Prazo (Opcional)</label>
                   <input type="date" value={newSubTask.dueDate} onChange={e => setNewSubTask({...newSubTask, dueDate: e.target.value})} className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Link (Opcional)</label>
                   <input type="url" value={newSubTask.link} onChange={e => setNewSubTask({...newSubTask, link: e.target.value})} placeholder="https://" className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>

                <button onClick={handleAddSubTask} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Salvar Atividade</button>
             </div>
           )}
        </Modal>
      )}

      {activeModal === 'links' && (
         <Modal title="Gerenciar Links" onClose={() => setActiveModal(null)} isDark={isDark}>
             <div className="py-12 text-center text-slate-500 font-bold">
                Funcionalidade em breve.
             </div>
         </Modal>
      )}
    </div>
  );
};

export default App;