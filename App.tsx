import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Target, Trophy, Plus, CheckCircle2, Zap, X, GripVertical, Gift, PlusCircle, Briefcase, Play, Pause, RotateCcw, Coffee, Timer, ChevronRight, Pencil, Trash2, Lightbulb, AlertCircle, Calendar, History, Clock, Sun, Moon, ArrowLeft, MessageSquare, Save, Star, BatteryLow, BatteryMedium, BatteryFull, Link2, ExternalLink, FileText, Settings, CalendarCheck, Check, Archive, Download, Upload, LogIn, UserPlus, CreditCard, Crown, LogOut, CheckCircle, MoreHorizontal, Settings2, Maximize2, Minimize2, Flame, AlertTriangle, Receipt
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
  VIEW_PREFERENCE: 'guiflow_view_pref'
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

// Fixed: Moving helper components to the top to avoid "used before declaration" errors
const NavItem = ({ active, onClick, icon, label, isDark }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all ${active ? (isDark ? 'text-indigo-300 bg-indigo-950/40 shadow-inner' : 'text-indigo-600 bg-indigo-50 shadow-sm') : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
    {icon} <span className="text-sm uppercase font-black tracking-tight">{label}</span>
  </button>
);

const Modal = ({ title, onClose, children, isDark }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 overflow-y-auto">
    <div className={`relative w-full max-w-lg rounded-[3.5rem] p-12 my-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <button onClick={onClose} className="absolute right-10 top-10 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X size={28} /></button>
      <h3 className="text-3xl font-black mb-10 tracking-tighter leading-tight text-slate-700 dark:text-slate-300">{title}</h3>
      {children}
    </div>
  </div>
);

const AuthScreen = ({ theme, onGuestAccess }: { theme: string, onGuestAccess: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Conta criada! Verifique seu e-mail.");
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-[400px] overflow-hidden rounded-[3.5rem] shadow-2xl border transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
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
  const [view, setView] = useState<'global' | 'local' | 'rewards' | 'history'>('global');
  const [isCompactMode, setIsCompactMode] = useState(() => localStorage.getItem(STORAGE_KEYS.VIEW_PREFERENCE) === 'compact');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Pomodoro Settings & State
  const [timerSettings, setTimerSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMER_SETTINGS);
    return saved ? JSON.parse(saved) : { focus: 25, short: 5, long: 15 };
  });
  
  const [pomodoroTime, setPomodoroTime] = useState(timerSettings.focus * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [pomodoroCycles, setPomodoroCycles] = useState(0);
  
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
  }, [tasks, completedTasks, rewards, redeemedHistory, stats, timerSettings, isCompactMode]);

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
              // Timer Finished
              new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {});
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
              
              if (pomodoroMode === 'focus') {
                 // Finished a Focus Session -> Auto Start Break
                 const nextCycle = pomodoroCycles + 1;
                 setPomodoroCycles(nextCycle);
                 
                 // Every 4th cycle is a long break
                 const nextMode = nextCycle % 4 === 0 ? 'long' : 'short';
                 setPomodoroMode(nextMode);
                 
                 // Immediately return the new time for the next mode and keep running
                 return timerSettings[nextMode] * 60;
              } else {
                 // Finished a Break -> Stop and Reset to Focus
                 setIsTimerRunning(false);
                 setPomodoroMode('focus');
                 return timerSettings.focus * 60;
              }
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
    localStorage.removeItem(STORAGE_KEYS.GUEST_SESSION);
  };

  const enterGuestMode = () => {
    const guestSession = { user: { email: 'convidado@guitask.app', id: 'guest-id' }, isGuest: true };
    setSession(guestSession);
    localStorage.setItem(STORAGE_KEYS.GUEST_SESSION, JSON.stringify(guestSession));
  };

  const handleCreateMacro = () => {
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
    if (!newSubTask.title.trim() || !activeTaskId) return;
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
    return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}min`;
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="text-indigo-600 animate-bounce" size={48} /></div>;
  if (!session) return <AuthScreen theme={theme} onGuestAccess={enterGuestMode} />;

  return (
    <div className={`min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`fixed bottom-0 left-0 w-full h-20 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-around z-50 md:top-0 md:left-0 md:w-64 md:h-full md:flex-col md:justify-start md:p-6 md:border-r shadow-2xl`}>
        <div className="hidden md:flex flex-col items-start gap-10 mb-10 w-full">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg mt-1"><Zap size={22} fill="currentColor" /></div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black tracking-tighter leading-none">GUITASK</h1>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Clareza para mentes inquietas.</p>
            </div>
          </div>
          <div className="w-full space-y-2">
            <NavItem active={view === 'global'} onClick={() => setView('global')} icon={<LayoutDashboard size={20} />} label="Geral" isDark={isDark} />
            <NavItem active={view === 'local'} onClick={() => setView('local')} icon={<Target size={20} />} label="Foco" isDark={isDark} />
            <NavItem active={view === 'history'} onClick={() => setView('history')} icon={<History size={20} />} label="Histórico" isDark={isDark} />
            <NavItem active={view === 'rewards'} onClick={() => setView('rewards')} icon={<Trophy size={20} />} label="Prêmios" isDark={isDark} />
          </div>
          <div className="w-full mt-auto space-y-4">
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isDark ? 'bg-indigo-950/20 border-indigo-900/50' : 'bg-indigo-50 border-indigo-100'}`}>
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
        </div>
        <div className="flex md:hidden items-center justify-around w-full h-full px-4 relative">
           <button onClick={() => setView('global')} className={`p-2 rounded-xl ${view === 'global' ? 'text-indigo-600' : 'text-slate-500'}`}><LayoutDashboard size={24} /></button>
           <button onClick={() => setView('local')} className={`p-2 rounded-xl ${view === 'local' ? 'text-indigo-600' : 'text-slate-500'}`}><Target size={24} /></button>
           <button onClick={() => setActiveModal('macro')} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -translate-y-4 border-4 border-white dark:border-slate-900"><Plus size={28} /></button>
           <div className="relative group">
              <button onClick={() => setView('rewards')} className={`p-2 rounded-xl ${view === 'rewards' ? 'text-indigo-600' : 'text-slate-500'}`}><Trophy size={24} /></button>
              <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-full border border-white">
                {stats.points}
              </div>
           </div>
           <button onClick={handleLogout} className="p-2 rounded-xl text-rose-600"><LogOut size={24} /></button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-10 w-full max-w-[1400px] mx-auto pt-10">
        {view === 'global' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Estratégia Global</h2>
                <p className="text-sm font-bold text-slate-500 italic">Visualize o destino, não apenas os passos.</p>
              </div>
              <button onClick={() => setActiveModal('macro')} className="hidden md:flex bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all items-center gap-2">
                <Plus size={20} /> Novo Objetivo
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => {
                 const taskProgress = task.subTasks.length > 0 ? Math.round((task.subTasks.filter(s => s.status === 'done').length / task.subTasks.length) * 100) : 0;
                 const deadlineInfo = getFormattedDeadline(task.dueDate);
                 return (
                  <div key={task.id} onClick={() => { setActiveTaskId(task.id); setView('local'); }} className={`p-8 rounded-[3.5rem] border-2 transition-all cursor-pointer shadow-sm group flex flex-col justify-between h-80 hover:translate-y-[-4px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
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

        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
              <h2 className="text-4xl font-black tracking-tight">Histórico de Conquistas</h2>
              <p className="text-sm font-bold text-slate-500 italic">Cada objetivo concluído é um degrau para o topo.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTasks.map(task => (
                <div key={task.id} className={`p-8 rounded-[3.5rem] border-2 shadow-sm flex flex-col justify-between h-80 opacity-90 transition-all hover:opacity-100 grayscale hover:grayscale-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
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
                     <p className="text-xs font-black text-slate-600 dark:text-slate-300">{task.completedAt ? new Date(task.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Data não registrada'}</p>
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

        {view === 'local' && activeTask && (
          <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
             <div className="flex items-center justify-between">
                <button onClick={() => setView('global')} className="text-xs font-black uppercase text-indigo-600 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"><ArrowLeft size={14} /> Voltar para Visão Global</button>
                <div className="flex items-center gap-3">
                   {progress === 100 && activeTask.subTasks.length > 0 && (
                      <button 
                        onClick={completeMacroTask}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all bg-[#0f172a] text-white hover:bg-slate-800 shadow-md animate-in fade-in slide-in-from-right-2"
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
               <div className={`${isCompactMode ? 'lg:col-span-2' : ''} p-10 rounded-[3.5rem] shadow-xl border relative overflow-hidden transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
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
               <div className={`${isCompactMode ? 'lg:col-span-1' : ''} p-10 rounded-[3.5rem] shadow-xl border overflow-hidden transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
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
                        <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`${isCompactMode ? 'w-16 h-16' : 'w-24 h-24'} rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all ${isTimerRunning ? 'bg-rose-500' : 'bg-indigo-600'}`}>
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
                   <button onClick={() => setActiveModal('subtask')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase shadow-lg hover:scale-105 transition-all">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="col-span-full p-12 rounded-[4rem] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl mb-6">
                <div className="z-10 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <h3 className="text-5xl font-black">Loja de Foco</h3>
                      <button onClick={() => setActiveModal('createReward')} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"><Plus size={24} /></button>
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
        </Modal>
      )}

      {activeModal === 'subtask' && (
        <Modal title="Adicionar atividade" onClose={() => setActiveModal(null)} isDark={isDark}>
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
                 <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Comentários / Notas</label>
                 <textarea value={newSubTask.notes} onChange={e => setNewSubTask({...newSubTask, notes: e.target.value})} placeholder="O que eu não posso esquecer?" rows={2} className={`w-full p-5 border-2 rounded-3xl font-bold text-base outline-none focus:border-indigo-600 transition-all resize-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Prazo</label>
                   <input 
                      type="date" 
                      value={newSubTask.dueDate} 
                      onChange={e => setNewSubTask({ ...newSubTask, dueDate: e.target.value })} 
                      className={`w-full p-4 border-2 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                   />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Link relacionado</label>
                   <input value={newSubTask.link} onChange={e => setNewSubTask({...newSubTask, link: e.target.value})} placeholder="URL aqui..." className={`w-full p-4 border-2 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>
              </div>
              <button onClick={handleAddSubTask} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Adicionar ao Plano</button>
           </div>
        </Modal>
      )}

      {activeModal === 'links' && activeTask && (
        <Modal title="Links e Referências" onClose={() => setActiveModal(null)} isDark={isDark}>
           <div className="space-y-6">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">Mantenha tudo o que você precisa a um clique de distância.</p>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                 {activeTask.links?.map(l => (
                    <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-indigo-600 transition-all group">
                       <span className="font-bold text-sm text-slate-700 dark:text-slate-200 group-hover:text-indigo-600">{l.title}</span>
                       <ExternalLink size={16} className="text-indigo-600" />
                    </a>
                 ))}
                 {(!activeTask.links || activeTask.links.length === 0) && (
                    <div className="text-center py-10 text-slate-400 italic font-medium">Nenhum link salvo ainda.</div>
                 )}
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                 <input placeholder="Título do link" className={`w-full p-4 border-2 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} id="new-link-title" />
                 <input placeholder="https://..." className={`w-full p-4 border-2 rounded-2xl font-bold text-xs outline-none focus:border-indigo-600 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} id="new-link-url" />
                 <button onClick={() => {
                    const titleElement = document.getElementById('new-link-title') as HTMLInputElement;
                    const urlElement = document.getElementById('new-link-url') as HTMLInputElement;
                    const title = titleElement.value;
                    const url = urlElement.value;
                    if (title && url) {
                       setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, links: [...(t.links || []), { id: Date.now().toString(), title, url }] } : t));
                       titleElement.value = '';
                       urlElement.value = '';
                    }
                 }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-colors">Adicionar Link</button>
              </div>
           </div>
        </Modal>
      )}
    </div>
  );
};

export default App;