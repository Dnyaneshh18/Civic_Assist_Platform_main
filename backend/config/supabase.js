import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_KEY missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

export async function checkSupabase() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.warn('[Supabase] Warning:', error.message);
      return false;
    }
    console.log('Supabase connected ✅');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err.message);
    return false;
  }
}
