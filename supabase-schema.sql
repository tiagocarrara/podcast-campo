-- =============================================
-- PODCAST CAMPO - Schema do Supabase
-- =============================================
-- Execute este SQL no SQL Editor do Supabase

-- Tabela de Gravações
CREATE TABLE recordings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mission_id TEXT NOT NULL,
  mission_title TEXT NOT NULL,
  promotor_id TEXT NOT NULL,
  promotor_name TEXT NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_city TEXT NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  duration INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'transcrito' CHECK (status IN ('pendente', 'transcrito', 'aprovado', 'rejeitado')),
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Episódios
CREATE TABLE episodes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mission_id TEXT NOT NULL,
  mission_title TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  script TEXT,
  audio_url TEXT,
  recording_ids TEXT[] DEFAULT '{}',
  total_recordings INTEGER DEFAULT 0,
  key_insights TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'gerando' CHECK (status IN ('gerando', 'revisao', 'publicado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX idx_recordings_mission ON recordings(mission_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_created ON recordings(created_at DESC);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_created ON episodes(created_at DESC);

-- Habilitar RLS (Row Level Security) - opcional para desenvolvimento
-- ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (para desenvolvimento)
-- Em produção, configure políticas mais restritivas
CREATE POLICY "Allow all on recordings" ON recordings FOR ALL USING (true);
CREATE POLICY "Allow all on episodes" ON episodes FOR ALL USING (true);

-- Storage bucket para áudios (executar na seção Storage do Supabase)
-- Criar bucket chamado 'audios' com acesso público

