import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Target, Trophy, Plus, CheckCircle2, Zap, X, GripVertical, Gift, PlusCircle, Briefcase, Play, Pause, RotateCcw, Coffee, Timer, ChevronRight, Pencil, Trash2, Lightbulb, AlertCircle, Calendar, History, Clock, Sun, Moon, ArrowLeft, MessageSquare, Save, Star, BatteryLow, BatteryMedium, BatteryFull, Link2, ExternalLink, FileText, Settings, CalendarCheck, Check, Archive, Download, Upload, LogIn, UserPlus, CreditCard, Crown, LogOut, CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, SUPABASE_IS_CONFIGURED } from './supabase';
import { Task, UserStats, Reward, SubTask, TaskStatus, ProjectLink, MonthlyGoal } from './types';

const STORAGE_KEYS = {
  TASKS: 'guiflow_tasks_v3',
  COMPLETED_TASKS: 'guiflow_completed_tasks_v3',
  REWARDS: 'guiflow_rewards_v3',
  STATS: 'guiflow_stats_v3',
  THEME: 'guiflow_theme_v3',
  MONTHLY_GOALS: 'guiflow_monthly_goals_v3'
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
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  // Persistência local
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(completedTasks));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }, [tasks, completedTasks, stats]);

  useEffect(() => {
    if (!session?.user?.id || !SUPABASE_IS_CONFIGURED) return;

    const checkProStatus = async () => {
      const { data } = await supabase.from('profiles').select('is_pro').eq('id', session.user.id).single();
      if (data?.is_pro) setIsPro(true);
    };

    checkProStatus();

    const profileSubscription = supabase
      .channel(`profile_${session.user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload: any) => {
        if (payload.new.is_pro) {
          setIsPro(true);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }).subscribe();

    return () => { supabase.removeChannel(profileSubscription); };
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
      rewardPoints: 100,
      links: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle(""); setActiveModal(null);
    setActiveTaskId(newTask.id);
    setView('local');
  };

  const handleAddSubTask = () => {
    if (!newSubTaskTitle.trim() || !activeTaskId) return;
    const sub: SubTask = {
      id: Date.now().toString(),
      title: newSubTaskTitle,
      completed: false,
      status: 'todo',
      rewardPoints: 10
    };
    setTasks(tasks.map(t => t.id === activeTaskId ? { ...t, subTasks: [...t.subTasks, sub] } : t));
    setNewSubTaskTitle("");
  };

  const toggleSubTask = (subId: string) => {
    if (!activeTaskId) return;
    
    let subWasCompleted = false;

    const updatedTasks = tasks.map(t => {
      if (t.id === activeTaskId) {
        const updatedSubs = t.subTasks.map(s => {
          if (s.id === subId) {
            subWasCompleted = !s.completed;
            return { ...s, completed: !s.completed };
          }
          return s;
        });
        return { ...t, subTasks: updatedSubs };
      }
      return t;
    });

    setTasks(updatedTasks);

    if (subWasCompleted) {
      setStats(prev => ({ ...prev, points: prev.points + 10 }));
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#a855f7']
      });
    }
  };

  const completeMacroTask = () => {
    if (!activeTaskId) return;
    const task = tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    setCompletedTasks([...completedTasks, { ...task, completed: true, completedAt: new Date().toISOString() }]);
    setTasks(tasks.filter(t => t.id !== activeTaskId));
    setStats(prev => ({ ...prev, points: prev.points + task.rewardPoints, tasksCompleted: prev.tasksCompleted + 1 }));
    
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.5 },
      scalar: 1.2,
      gravity: 0.8
    });

    setActiveTaskId(null);
    setView('global');
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;
  const isDark = theme === 'dark';

  const progress = useMemo(() => {
    if (!activeTask || activeTask.subTasks.length === 0) return 0;
    const completed = activeTask.subTasks.filter(s => s.completed).length;
    return Math.round((completed / activeTask.subTasks.length) * 100);
  }, [activeTask]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Zap className="text-indigo-600 animate-bounce" size={48} /></div>;
  if (!session) return <AuthScreen theme={theme} />;

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
        <div className="flex md:hidden items-center justify-around w-full h-full px-4">
           <button onClick={() => setView('global')} className={`p-2 rounded-xl ${view === 'global' ? 'text-indigo-600' : 'text-slate-400'}`}><LayoutDashboard size={24} /></button>
           <button onClick={() => setView('local')} className={`p-2 rounded-xl ${view === 'local' ? 'text-indigo-600' : 'text-slate-400'}`}><Target size={24} /></button>
           <button onClick={() => setActiveModal('macro')} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -translate-y-4 border-4 border-white dark:border-slate-900"><Plus size={28} /></button>
           <button onClick={() => setView('rewards')} className={`p-2 rounded-xl ${view === 'rewards' ? 'text-indigo-600' : 'text-slate-400'}`}><Trophy size={24} /></button>
           <button onClick={handleLogout} className="p-2 rounded-xl text-rose-400"><LogOut size={24} /></button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-10 w-full max-w-[1200px] mx-auto pt-10">
        {view === 'global' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Estratégia Global</h2>
                <p className="text-sm font-medium opacity-50 italic">Visualize o destino, não apenas os passos.</p>
              </div>
              <button onClick={() => setActiveModal('macro')} className="hidden md:flex bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-105 transition-all items-center gap-2">
                <Plus size={20} /> Novo Objetivo
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(task => {
                 const taskProgress = task.subTasks.length > 0 ? Math.round((task.subTasks.filter(s => s.completed).length / task.subTasks.length) * 100) : 0;
                 return (
                  <div key={task.id} onClick={() => { setActiveTaskId(task.id); setView('local'); }} className={`p-8 rounded-[3.5rem] border-2 transition-all cursor-pointer shadow-sm group flex flex-col justify-between h-80 hover:translate-y-[-4px] ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50 hover:border-indigo-100'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[10px] font-black px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full uppercase">{task.category}</span>
                        {taskProgress === 100 && <Star size={14} className="text-amber-500" fill="currentColor" />}
                      </div>
                      <h3 className="text-2xl font-black leading-tight group-hover:text-indigo-500 transition-colors">{task.title}</h3>
                    </div>
                    <div className="mt-auto space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase opacity-40">
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
                   <p className="text-sm font-medium opacity-40">Qual o próximo grande objetivo?</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'local' && activeTask && (
          <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
             <button onClick={() => setView('global')} className="text-xs font-black uppercase text-indigo-500 mb-6 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"><ArrowLeft size={14} /> Voltar para Visão Global</button>
             
             <div className={`p-10 rounded-[4rem] shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                <div className="flex items-start justify-between mb-8">
                   <div>
                      <h2 className="text-4xl font-black mb-2 tracking-tight">{activeTask.title}</h2>
                      <p className="text-sm font-medium opacity-50">Quebre em pedaços pequenos para não cansar o cérebro.</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Recompensa</p>
                      <div className="flex items-center gap-1.5 font-black text-2xl text-amber-500">
                         {activeTask.rewardPoints} <Star size={24} fill="currentColor" />
                      </div>
                   </div>
                </div>

                <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center gap-4">
                   <input 
                      value={newSubTaskTitle} 
                      onChange={e => setNewSubTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSubTask()}
                      placeholder="Adicionar micro-passo..." 
                      className={`flex-1 bg-transparent font-bold outline-none text-lg ${isDark ? 'placeholder:text-slate-600' : 'placeholder:text-slate-300'}`} 
                   />
                   <button onClick={handleAddSubTask} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-all"><Plus size={24} /></button>
                </div>

                <div className="space-y-4">
                   {activeTask.subTasks.map(sub => (
                      <div key={sub.id} className={`group p-5 rounded-3xl flex items-center gap-4 border-2 transition-all ${sub.completed ? 'opacity-40 bg-slate-50 border-transparent' : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 hover:border-indigo-200'}`}>
                         <button 
                            onClick={() => toggleSubTask(sub.id)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${sub.completed ? 'bg-emerald-500 text-white scale-90' : 'bg-slate-100 dark:bg-slate-700 text-transparent hover:text-indigo-600 hover:bg-indigo-50'}`}
                         >
                            <Check size={20} />
                         </button>
                         <span className={`flex-1 font-bold text-lg ${sub.completed ? 'line-through' : ''}`}>{sub.title}</span>
                      </div>
                   ))}
                   {activeTask.subTasks.length === 0 && (
                      <div className="py-10 text-center opacity-30 italic font-medium">Nenhum micro-passo ainda. Vamos começar?</div>
                   )}
                </div>

                {progress === 100 && activeTask.subTasks.length > 0 && (
                   <button onClick={completeMacroTask} className="mt-12 w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-[2rem] font-black text-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group">
                      <CheckCircle size={28} /> CONCLUIR OBJETIVO
                   </button>
                )}
             </div>
          </div>
        )}

        {view === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="col-span-full p-12 rounded-[4rem] bg-indigo-600 text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl mb-6">
                <div className="z-10 text-center md:text-left">
                   <h3 className="text-5xl font-black mb-2">Loja de Foco</h3>
                   <p className="text-xl text-indigo-100 font-bold opacity-80">Você trabalhou duro. Hora de se presentear.</p>
                </div>
                <div className="text-center md:text-right z-10 mt-8 md:mt-0">
                   <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Seu Saldo Disponível</p>
                   <p className="text-7xl font-black flex items-center gap-4 justify-center md:justify-end">{stats.points} <Star size={50} fill="currentColor" /></p>
                </div>
                <Zap className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 rotate-12" />
             </div>
             
             <div className={`p-8 rounded-[3.5rem] border-2 flex items-center gap-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center"><Coffee size={36} /></div>
                <div className="flex-1">
                   <h4 className="text-xl font-black">Pausa para Café</h4>
                   <p className="text-sm font-bold opacity-40">15 min de descanso total.</p>
                </div>
                <div className="text-right">
                   <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all">50 pts</button>
                </div>
             </div>

             <div className={`p-8 rounded-[3.5rem] border-2 flex items-center gap-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-50'}`}>
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center"><Play size={36} /></div>
                <div className="flex-1">
                   <h4 className="text-xl font-black">Episódio de Série</h4>
                   <p className="text-sm font-bold opacity-40">Recompensa de alto valor.</p>
                </div>
                <div className="text-right">
                   <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-md active:scale-95 transition-all">150 pts</button>
                </div>
             </div>
          </div>
        )}
      </main>

      {activeModal === 'upgrade' && (
        <Modal title="Seja Guitask Pro" onClose={() => setActiveModal(null)} isDark={isDark}>
          <div className="space-y-6">
            <div className="p-6 bg-indigo-600/10 rounded-[2rem] border-2 border-indigo-600/20 text-center">
               <p className="text-indigo-600 font-black text-3xl">R$ 19,90<span className="text-xs opacity-60">/mês</span></p>
            </div>
            <ul className="space-y-4 text-sm font-bold">
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Check size={14} /></div> Sincronização em Nuvem</li>
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Check size={14} /></div> Histórico Sem Limites</li>
              <li className="flex items-center gap-4"><div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Check size={14} /></div> Modo Foco IA</li>
            </ul>
            <button onClick={() => window.open(STRIPE_LINK, '_blank')} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              <CreditCard size={20} /> Assinar Agora
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'macro' && (
        <Modal title="Qual seu próximo grande objetivo?" onClose={() => setActiveModal(null)} isDark={isDark}>
           <div className="space-y-6">
              <input autoFocus value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateMacro()} placeholder="Ex: Lançar meu projeto novo" className={`w-full p-5 border-2 rounded-[2rem] font-black text-lg outline-none focus:border-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} />
              <button onClick={handleCreateMacro} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Traçar Estratégia</button>
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
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`w-full max-w-[400px] overflow-hidden rounded-[3.5rem] shadow-2xl border transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="p-10 pb-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-6 group hover:rotate-12 transition-transform duration-300">
            <Zap size={40} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter leading-none mb-1">GUITASK</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Hyperfocus OS</p>
        </div>

        <div className="px-10 pb-12 space-y-6">
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
            <button onClick={() => setMode('login')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Entrar</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all duration-300 ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Criar</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">E-mail</label>
              <input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full p-5 rounded-3xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Senha</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full p-5 rounded-3xl border-2 font-bold outline-none transition-all focus:border-indigo-600 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:bg-white'}`} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 mt-2 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
              {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : (mode === 'login' ? 'Acessar Guitask' : 'Começar Gratuitamente')}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-[10px] font-bold text-slate-400 mt-2">
              Problemas com o acesso? <button className="text-indigo-500 hover:underline">Recuperar senha</button>
            </p>
          )}
        </div>
      </div>
      <p className="mt-8 text-[11px] font-medium text-slate-400 text-center max-w-[300px] leading-relaxed">Foco é uma habilidade, não um dom. <br/> Estamos aqui para ajudar.</p>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label, isDark }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl transition-all ${active ? (isDark ? 'text-indigo-400 bg-indigo-950/30 shadow-inner' : 'text-indigo-600 bg-indigo-50 shadow-sm') : 'text-slate-400 hover:bg-slate-100'}`}>
    {icon} <span className="text-sm uppercase font-black tracking-tight">{label}</span>
  </button>
);

const Modal = ({ title, onClose, children, isDark }: any) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
    <div className={`relative w-full max-w-md rounded-[4rem] p-12 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <button onClick={onClose} className="absolute right-10 top-10 text-slate-400 hover:text-slate-600 hover:rotate-90 transition-all"><X size={28} /></button>
      <h3 className="text-3xl font-black mb-10 tracking-tighter leading-tight">{title}</h3>
      {children}
    </div>
  </div>
);

export default App;