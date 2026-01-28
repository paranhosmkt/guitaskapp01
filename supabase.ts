import { createClient } from '@supabase/supabase-js';

/**
 * Detector de configuração válida do Supabase.
 * Verifica se as variáveis de ambiente foram preenchidas e não são os placeholders.
 */
const isConfigured = 
  (process.env as any).SUPABASE_URL && 
  (process.env as any).SUPABASE_ANON_KEY && 
  !(process.env as any).SUPABASE_URL.includes('seu-projeto') &&
  !(process.env as any).SUPABASE_URL.includes('placeholder');

const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = (process.env as any).SUPABASE_ANON_KEY || 'placeholder';

/**
 * Se o Supabase não estiver configurado, exportamos um mock seguro.
 * Isso evita que o aplicativo quebre com erros de rede ao tentar acessar uma URL inválida.
 */
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        getSession: async () => {
          // Pequeno delay para simular rede
          await new Promise(r => setTimeout(r, 500));
          return { data: { session: null }, error: null };
        },
        onAuthStateChange: () => ({ 
          data: { subscription: { unsubscribe: () => {} } } 
        }),
        signInWithPassword: async ({ email }: any) => {
          console.warn("Supabase não configurado. Usando modo de demonstração.");
          // Simula login de demo
          return { 
            data: { user: { email, id: 'demo-user' }, session: { user: { email, id: 'demo-user' } } }, 
            error: null 
          };
        },
        signUp: async () => ({ error: new Error("O cadastro requer um projeto Supabase configurado.") }),
        signOut: async () => {},
      }
    } as any;

export const SUPABASE_IS_CONFIGURED = isConfigured;