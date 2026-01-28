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

  useEffect(() => {
    if (!session?.user?.id || !SUPABASE_IS_CONFIGURED) return;

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

  const handleStripeCheckout = () => {
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
    <div className={`min-h-screen pb-24 md:pb-0 md:pl-64 flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <nav className={`fixed bottom-0 left-0 w-full h-20 ${isDark ? 'bg-slate-900' : 'bg-white'} border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex items-center justify-around z-50 md:top-0 md:left-0 md:w-64 md:h-full md:flex-col md:justify-start md:p-6 md:border-r shadow-2xl`}>
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
        {/* Mobile Nav Icons (Visual Only for reference) */}
        <div className="flex md:hidden items-center justify-around w-full h-full px-4">
           <button onClick={() => setView('global')} className={`p-2 rounded-xl ${view === 'global' ? 'text-indigo-600' : 'text-slate-400'}`}><LayoutDashboard size={24} /></button>
           <button onClick={() => setView('local')} className={`p-2 rounded-xl ${view === 'local' ? 'text-indigo-600' : 'text-slate-400'}`}><Target size={24} /></button>
           <button onClick={() => setActiveModal('macro')} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -translate-y-4 border-4 border-white dark:border-slate-900"><Plus size={28} /></button>
           <button onClick={() => setView('rewards')} className={`p-2 rounded-xl ${view === 'rewards' ? 'text-indigo-600' : 'text-slate-400'}`}><Trophy size={24} /></button>
           <button onClick={() => setActiveModal('upgrade')} className={`p-2 rounded-xl ${isPro ? 'text-amber-500' : 'text-slate-400'}`}><Crown size={24} /></button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-10 w-full max-w-[1200px] mx-auto pt-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black">{view === 'global' ? 'Visão Geral' : view === 'local' ? 'Foco Local' : 'Recompensas'}</h2>
            <p className="text-sm font-medium opacity-50 italic">Foco total no agora.</p>
          </div>
          {view === 'global' && (
            <button onClick={() => setActiveModal('macro')} className="hidden md:flex bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all items-center gap-2">
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
            {tasks.filter(t => !t.completed).length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40 text-center">
                 <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={32} /></div>
                 <p className="font-bold">Nada pendente.<br/>Que tal um novo objetivo?</p>
              </div>
            )}
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

        {view === 'rewards' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="col-span-full p-8 rounded-[3rem] bg-indigo-600 text-white flex items-center justify-between overflow-hidden relative shadow-2xl">
                <div>
                   <h3 className="text-3xl font-black">Loja de Foco</h3>
                   <p className="text-indigo-100 font-bold opacity-80">Gaste seus pontos com sabedoria.</p>
                </div>
                <div className="text-right z-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Seu Saldo</p>
                   <p className="text-5xl font-black flex items-center gap-2 justify-end">{stats.points} <Star size={32} fill="currentColor" /></p>
                </div>
                <Zap className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 rotate-12" />
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
              <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="O que vamos conquistar?" className={`w-full p-4 border rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
              <button onClick={handleCreateMacro} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Começar Estratégia</button>
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert("Erro no Google Login: " + err.message);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-[400px] overflow-hidden rounded-[3rem] shadow-2xl border transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        
        {/* Header Section */}
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl mb-4 group hover:rotate-12 transition-transform duration-300">
            <Zap size={32} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">GUITASK</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Neurodivergent Focus</p>
          {!SUPABASE_IS_CONFIGURED && (
             <div className="mt-4 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase">Modo Demonstração</p>
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="px-8 pb-10 space-y-6">
          
          {/* Social Auth */}
          <button 
            onClick={handleGoogleLogin}
            className={`w-full py-4 flex items-center justify-center gap-3 rounded-2xl border-2 font-black text-sm transition-all hover:scale-[1.02] active:scale-95 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'}`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Entrar com Google
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black"><span className={`px-4 text-slate-400 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>Ou use seu e-mail</span></div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setMode('signup')} 
              className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">E-mail</label>
              <input 
                type="email" 
                placeholder="exemplo@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className={`w-full p-4 rounded-2xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className={`w-full p-4 rounded-2xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{mode === 'login' ? 'Acessar Guitask' : 'Começar Gratuitamente'}</span>
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
              Esqueceu sua senha? <button className="text-indigo-500 hover:underline">Recuperar</button>
            </p>
          )}
        </div>
      </div>
      
      <p className="mt-8 text-[11px] font-medium text-slate-400 text-center max-w-[300px] leading-relaxed">
        Ao continuar, você concorda com nossos <span className="text-slate-500 font-bold underline cursor-pointer">Termos de Uso</span> e <span className="text-slate-500 font-bold underline cursor-pointer">Privacidade</span>.
      </p>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isDark }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all ${active ? (isDark ? 'text-indigo-400 bg-indigo-950/30' : 'text-indigo-600 bg-indigo-50') : 'text-slate-400 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm uppercase font-black tracking-tight">{label}</span>
  </button>
);

const Modal = ({ title, onClose, children, isDark }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300">
    <div className={`relative w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <button onClick={onClose} className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X size={24} /></button>
      <h3 className="text-2xl font-black mb-8 tracking-tighter">{title}</h3>
      {children}
    </div>
  </div>
);

export default App;