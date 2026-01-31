
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tifuhqducboyivsajktj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpZnVocWR1Y2JveWl2c2Fqa3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NzQ4NDEsImV4cCI6MjA4NTM1MDg0MX0.x39cSfICH75If5Dc4VBr5Uoc3gnZAy9S9-hA4163kw0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
