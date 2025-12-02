import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização lazy do cliente Supabase para evitar erros durante o build
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias'
      );
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

// Exporta um proxy que inicializa o cliente apenas quando usado
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const value = (client as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

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

