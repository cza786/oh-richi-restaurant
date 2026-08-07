import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdkzavejabnxbdedlsvy.supabase.co';
const defaultKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || defaultKey;
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
export default supabase;
