// Supabase Configuration
const SUPABASE_URL = 'https://sihafdyograqqtsahltb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaGFmZHlvZ3JhcXF0c2FobHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzcxNTEsImV4cCI6MjA3ODM1MzE1MX0.kY1lvX2xYlAEP2TmhKeSYWCseGWq161gLlYfJmMK_58';

// Supabase client oluştur
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase bağlantısı kuruldu');
