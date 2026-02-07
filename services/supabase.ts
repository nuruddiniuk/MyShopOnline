
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzjxouztlknwfguycjff.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6anhvdXp0bGtud2ZndXljamZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDA5OTEsImV4cCI6MjA4NjAxNjk5MX0.fmzcV40L92EzoG_lTPY3vUquSyTHpIebK6ye7UE815I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
