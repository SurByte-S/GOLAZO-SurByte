import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing environment variables. Falling back to local storage mode.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? (() => {
      console.log('[Supabase] Initializing client with URL:', supabaseUrl.substring(0, 15) + '...');
      return createClient(supabaseUrl, supabaseAnonKey);
    })()
  : new Proxy({} as any, {
      get(_, prop) {
        if (prop === 'from') {
          return () => ({
            select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
            insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            update: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
            delete: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          });
        }
        return () => {
          throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
        };
      }
    });
