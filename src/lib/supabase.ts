import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas
export interface Recording {
  id: string;
  mission_id: string;
  mission_title: string;
  promotor_id: string;
  promotor_name: string;
  store_id: string;
  store_name: string;
  store_city: string;
  audio_url: string | null;
  transcription: string | null;
  duration: number;
  score: number;
  status: 'pendente' | 'transcrito' | 'aprovado' | 'rejeitado';
  analysis: {
    score: number;
    covered: string[];
    missing: string[];
    summary?: string;
  } | null;
  created_at: string;
}

export interface Episode {
  id: string;
  mission_id: string;
  mission_title: string;
  title: string;
  summary: string;
  script: string;
  audio_url: string | null;
  recording_ids: string[];
  total_recordings: number;
  key_insights: string[];
  status: 'gerando' | 'revisao' | 'publicado';
  created_at: string;
  published_at: string | null;
}

