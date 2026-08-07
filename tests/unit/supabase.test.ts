import { describe, it, expect } from 'vitest';
import { supabase, getSupabaseClient } from '../../lib/supabaseClient';

describe('Supabase Client Initializer', () => {
  it('should export a valid Supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.storage.from).toBe('function');
  });

  it('should return the singleton client instance from getSupabaseClient()', () => {
    const client = getSupabaseClient();
    expect(client).toBe(supabase);
  });
});
