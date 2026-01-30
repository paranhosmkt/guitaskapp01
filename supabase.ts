import { createClient } from '@supabase/supabase-js';

/**
 * Tenta capturar as chaves do Supabase de diferentes possíveis nomes de variáveis de ambiente.
 * Isso resolve conflitos de prefixos em diferentes ambientes de deploy (Vercel, Vite, etc).
 */
const getEnv = (key: string): string | undefined => {
  // @ts-ignore - Tentativa de ler do process.env (Node/Vercel)
  const env = typeof process !== 'undefined' ? process.env : {};
  // @ts-ignore - Tentativa de ler do import.meta.env (Vite/ESM)
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

  return (
    env[key] || 
    env[`VITE_${key}`] || 
    env[`NEXT_PUBLIC_${key}`] || 
    metaEnv[key] || 
    metaEnv[`VITE_${key}`] || 
    metaEnv[`NEXT_PUBLIC_${key}`]
  );
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_ANON_KEY');

/**
 * Validação se os valores são reais e não placeholders
 */
const isConfigured = 
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('seu-projeto');

/**
 * Se o Supabase não estiver configurado, exportamos um mock seguro para demonstração.
 */
export const supabase = isConfigured 
  ? createClient(supabaseUrl!, supabaseKey!)
  : {
      auth: {
        getSession: async () => {
          console.warn("Supabase não detectado. Verifique as Variáveis de Ambiente na Vercel.");
          return { data: { session: null }, error: null };
        },
        onAuthStateChange: () => ({ 
          data: { subscription: { unsubscribe: () => {} } } 
        }),
        signInWithPassword: async ({ email }: any) => {
          console.warn("Modo de Demonstração Ativo.");
          return { 
            data: { user: { email, id: 'demo-user' }, session: { user: { email, id: 'demo-user' } } }, 
            error: null 
          };
        },
        signUp: async () => ({ error: new Error("O cadastro requer um projeto Supabase configurado.") }),
        signOut: async () => {},
      }
    } as any;

export const SUPABASE_IS_CONFIGURED = !!isConfigured;
