import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  supabase.from('audit_logs').select('*').limit(5).then(res => {
    console.log(JSON.stringify(res.data, null, 2));
  }).catch(err => console.error(err));
} else {
  console.log('No supabase config found');
}
