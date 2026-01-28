import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Target, Trophy, Plus, CheckCircle2, Zap, X, GripVertical, Gift, PlusCircle, Briefcase, Play, Pause, RotateCcw, Coffee, Timer, ChevronRight, Pencil, Trash2, Lightbulb, AlertCircle, Calendar, History, Clock, Sun, Moon, ArrowLeft, MessageSquare, Save, Star, BatteryLow, BatteryMedium, BatteryFull, Link2, ExternalLink, FileText, Settings, CalendarCheck, Check, Archive, Download, Upload, LogIn, UserPlus, CreditCard, Crown, LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, SUPABASE_IS_CONFIGURED } from './supabase';
import { Task, UserStats, Reward, SubTask, TaskStatus, ProjectLink, MonthlyGoal } from './types';

const STORAGE_KEYS = {
  TASKS: 'guiflow_tasks_v2',
  COMPLETED_TASKS: 'guiflow_completed_tasks_v2',
  REWARDS: 'guiflow_rewards_v2',
  STATS: 'guiflow_stats_v2',
  THEME: 'guiflow_theme_v2',
  MONTHLY_GOALS: 'guiflow_monthly_goals_v2'
};

const STRIPE_LINK = 'https://buy.stripe.com/8x214o14E0FB8TF5NNcEw00';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]'));
  const [completedTasks, setCompletedTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS) || '[]'));
  const [rewards, setRewards] = useState<Reward[]>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.REWARDS) || '[]'));
  const [stats, setStats] = useState<UserStats>(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{"points":0,"tasksCompleted":0,"streak":1}'));
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light');
  const [view, setView] = useState<'global' | 'local' | 'rewards' | 'history'>('global');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. Verificação e Real-time do Status Pro ---
  useEffect(() => {
    if (!session?.user?.id || !SUPABASE_IS_CONFIGURED) return;

    // Função para buscar o status inicial
    const checkProStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', session.user.id)
        .single();
      
      if (data?.is_pro) {
        setIsPro(true);
      }
    };

    checkProStatus();

    // Inscrição em tempo real para mudanças no perfil
    const profileSubscription = supabase
      .channel(`profile_${session.user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${session.user.id}`
      }, (payload: any) => {
        if (payload.new.is_pro) {
          setIsPro(true);
          confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
          alert("Acesso PRO Ativado! Aproveite todas as ferramentas.");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [session]);

  // --- Auth Logic ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, newSession: any) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- Handlers ---
  const handleStripeCheckout = () => {
    // Apenas abre o link. O Real-time acima cuidará da ativação assim que o webhook disparar.
    window.open(STRIPE_LINK, '_blank');
    setActiveModal(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsPro(false);
  };

  const handleCreateMacro = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: "",
      priority: 'medium',
      status: 'todo',
      dueDate: new Date().toISOString().split('T')[0],
      estimatedTime: 30,
      category: 'Geral',
      completed: false,
      subTasks: [],
      rewardPoints: 50,
      links: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(""); setActiveModal(null);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="text-indigo-600 animate-bounce" size={48} /></div>;
  if (!session) return <AuthScreen theme={theme} />;

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen pb-20 md:pb-0 md:pl-64 flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <nav className={`fixed bottom-0 left-0 w-full h-16 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-around z-50 md:top-0 md:left-0 md:w-64 md:h-full md:flex-col md:justify-start md:p-6 md:border-r shadow-2xl`}>
        <div className="hidden md:flex flex-col items-start gap-10 mb-10 w-full">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg mt-1"><Zap size={22} fill="currentColor" /></div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black tracking-tighter leading-none">GUITASK</h1>
                {isPro && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-md border border-amber-500 flex items-center gap-1"><Crown size={8} /> Pro</span>}
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Foco e Estratégia</p>
            </div>
          </div>
          <div className="w-full space-y-2">
            <NavItem active={view === 'global'} onClick={() => setView('global')} icon={<LayoutDashboard size={20} />} label="Geral" isDark={isDark} />
            <NavItem active={view === 'local'} onClick={() => setView('local')} icon={<Target size={20} />} label="Foco" isDark={isDark} />
            <NavItem active={view === 'rewards'} onClick={() => setView('rewards')} icon={<Trophy size={20} />} label="Prêmios" isDark={isDark} />
          </div>
          <div className="w-full mt-auto space-y-2">
            {!isPro && (
              <button onClick={() => setActiveModal('upgrade')} className="w-full p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg">
                <Crown size={16} /> Ser Pro
              </button>
            )}
            <button onClick={handleLogout} className="w-full p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 font-black text-xs uppercase flex items-center justify-center gap-2">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 w-full max-w-[1200px] mx-auto pt-16">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black">{view === 'global' ? 'Visão Geral' : view === 'local' ? 'Foco Local' : 'Recompensas'}</h2>
            <p className="text-sm font-medium opacity-50 italic">Logado como: {session.user.email}</p>
          </div>
          {view === 'global' && (
            <button onClick={() => setActiveModal('macro')} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={20} /> Novo Objetivo
            </button>
          )}
        </header>

        {view === 'global' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {tasks.filter(t => !t.completed).map(task => (
              <div key={task.id} onClick={() => { setActiveTaskId(task.id); setView('local'); }} className={`p-8 rounded-[3rem] border-2 transition-all cursor-pointer shadow-sm group flex flex-col justify-between h-72 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 hover:border-indigo-100'}`}>
                <h3 className="text-xl font-black leading-tight group-hover:text-indigo-500">{task.title}</h3>
                <div className="mt-auto">
                   <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: '10%' }} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'local' && activeTask && (
          <div className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border shadow-sm">
             <button onClick={() => setView('global')} className="text-xs font-black uppercase text-indigo-500 mb-2 flex items-center gap-1"><ArrowLeft size={14} /> Voltar</button>
             <h2 className="text-3xl font-black">{activeTask.title}</h2>
             <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">A Fazer</h4>
                   <p className="text-xs opacity-50 italic">Adicione micro-tarefas para começar.</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal === 'upgrade' && (
        <Modal title="Seja Guitask Pro" onClose={() => setActiveModal(null)} isDark={isDark}>
          <div className="space-y-6">
            <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 text-center">
               <p className="text-indigo-600 font-black text-xl">R$ 19,90 / mês</p>
            </div>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={16} /> Backup automático na nuvem</li>
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={16} /> Estratégias de IA ilimitadas</li>
              <li className="flex items-center gap-3"><Check className="text-emerald-500" size={16} /> Histórico de produtividade</li>
            </ul>
            <button onClick={handleStripeCheckout} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
              <CreditCard size={20} /> Assinar via Stripe
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'macro' && (
        <Modal title="Novo Objetivo" onClose={() => setActiveModal(null)} isDark={isDark}>
           <div className="space-y-4">
              <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="O que vamos conquistar?" className={`w-full p-4 border rounded-2xl font-bold outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
              <button onClick={handleCreateMacro} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">Começar Estratégia</button>
           </div>
        </Modal>
      )}
    </div>
  );
};

const AuthScreen = ({ theme }: { theme: string }) => {
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl mb-4"><Zap size={32} fill="currentColor" /></div>
          <h2 className="text-3xl font-black tracking-tighter">GUITASK</h2>
          {!SUPABASE_IS_CONFIGURED && <p className="text-[10px] font-black text-amber-500 uppercase mt-1">Modo Demonstração</p>}
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-8">
          <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Entrar</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>Criar</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full p-4 rounded-2xl border-2 font-bold outline-none focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full p-4 rounded-2xl border-2 font-bold outline-none focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
          <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
            {loading ? '...' : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
      </div>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isDark }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl transition-all ${active ? (isDark ? 'text-indigo-400 bg-indigo-950/30' : 'text-indigo-600 bg-indigo-50') : 'text-slate-400 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm uppercase font-bold tracking-tight">{label}</span>
  </button>
);

const Modal = ({ title, onClose, children, isDark }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
    <div className={`relative w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <button onClick={onClose} className="absolute right-8 top-8 opacity-40 hover:opacity-100"><X size={24} /></button>
      <h3 className="text-2xl font-black mb-8 tracking-tighter">{title}</h3>
      {children}
    </div>
  </div>
);

export default App;