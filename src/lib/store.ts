import { supabase, Recording, Episode } from './supabase';

// =============================================
// Store usando Supabase
// =============================================

// Tipos exportados para compatibilidade
export interface StoredRecording {
  id: string;
  missionId: string;
  missionTitle: string;
  promotorId: string;
  promotorName: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  audioData?: string;
  audioUrl?: string;
  transcription: string;
  duration: number;
  score: number;
  status: 'pendente' | 'transcrito' | 'aprovado' | 'rejeitado';
  createdAt: string;
  analysis?: {
    score: number;
    covered: string[];
    missing: string[];
    summary?: string;
  };
}

export interface StoredEpisode {
  id: string;
  missionId: string;
  missionTitle: string;
  title: string;
  summary: string;
  script: string;
  audioUrl?: string;
  audioData?: string;
  recordingIds: string[];
  totalRecordings: number;
  keyInsights: string[];
  status: 'gerando' | 'revisao' | 'publicado';
  createdAt: string;
  publishedAt?: string;
}

// Converter do formato do Supabase para o formato da app
function dbToRecording(db: Recording): StoredRecording {
  return {
    id: db.id,
    missionId: db.mission_id,
    missionTitle: db.mission_title,
    promotorId: db.promotor_id,
    promotorName: db.promotor_name,
    storeId: db.store_id,
    storeName: db.store_name,
    storeCity: db.store_city,
    audioUrl: db.audio_url || undefined,
    transcription: db.transcription || '',
    duration: db.duration,
    score: db.score,
    status: db.status,
    createdAt: db.created_at,
    analysis: db.analysis || undefined,
  };
}

function dbToEpisode(db: Episode): StoredEpisode {
  return {
    id: db.id,
    missionId: db.mission_id,
    missionTitle: db.mission_title,
    title: db.title,
    summary: db.summary,
    script: db.script,
    audioUrl: db.audio_url || undefined,
    recordingIds: db.recording_ids,
    totalRecordings: db.total_recordings,
    keyInsights: db.key_insights,
    status: db.status,
    createdAt: db.created_at,
    publishedAt: db.published_at || undefined,
  };
}

// =============================================
// RECORDINGS
// =============================================

export async function addRecording(recording: StoredRecording): Promise<StoredRecording | null> {
  // Upload do áudio para o Storage se tiver audioData (base64)
  let audioUrl = recording.audioUrl;
  
  if (recording.audioData && recording.audioData.startsWith('data:')) {
    try {
      // Extrair o base64
      const base64Data = recording.audioData.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `${recording.id}_${Date.now()}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audios')
        .upload(fileName, buffer, {
          contentType: 'audio/webm',
          upsert: true
        });
      
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('audios')
          .getPublicUrl(fileName);
        audioUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.error('Erro no upload do áudio:', e);
    }
  }

  const { data, error } = await supabase
    .from('recordings')
    .insert({
      id: recording.id,
      mission_id: recording.missionId,
      mission_title: recording.missionTitle,
      promotor_id: recording.promotorId,
      promotor_name: recording.promotorName,
      store_id: recording.storeId,
      store_name: recording.storeName,
      store_city: recording.storeCity,
      audio_url: audioUrl,
      transcription: recording.transcription,
      duration: recording.duration,
      score: recording.score,
      status: recording.status,
      analysis: recording.analysis,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar gravação:', error);
    return null;
  }

  return dbToRecording(data);
}

export async function getRecordings(): Promise<StoredRecording[]> {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar gravações:', error);
    return [];
  }

  return data.map(dbToRecording);
}

export async function getRecordingById(id: string): Promise<StoredRecording | null> {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar gravação:', error);
    return null;
  }

  return dbToRecording(data);
}

export async function getRecordingsByMission(missionId: string): Promise<StoredRecording[]> {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar gravações:', error);
    return [];
  }

  return data.map(dbToRecording);
}

export async function updateRecordingStatus(id: string, status: StoredRecording['status']): Promise<void> {
  const { error } = await supabase
    .from('recordings')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

// =============================================
// EPISODES
// =============================================

export async function addEpisode(episode: StoredEpisode): Promise<StoredEpisode | null> {
  const { data, error } = await supabase
    .from('episodes')
    .insert({
      id: episode.id,
      mission_id: episode.missionId,
      mission_title: episode.missionTitle,
      title: episode.title,
      summary: episode.summary,
      script: episode.script,
      audio_url: episode.audioUrl,
      recording_ids: episode.recordingIds,
      total_recordings: episode.totalRecordings,
      key_insights: episode.keyInsights,
      status: episode.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar episódio:', error);
    return null;
  }

  return dbToEpisode(data);
}

export async function getEpisodes(): Promise<StoredEpisode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar episódios:', error);
    return [];
  }

  return data.map(dbToEpisode);
}

export async function getEpisodeById(id: string): Promise<StoredEpisode | null> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar episódio:', error);
    return null;
  }

  return dbToEpisode(data);
}

export async function updateEpisode(id: string, updates: Partial<StoredEpisode>): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
  if (updates.script !== undefined) dbUpdates.script = updates.script;
  if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;
  if (updates.audioData !== undefined) dbUpdates.audio_url = updates.audioData; // Base64 direto para simplificar
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.publishedAt !== undefined) dbUpdates.published_at = updates.publishedAt;
  if (updates.keyInsights !== undefined) dbUpdates.key_insights = updates.keyInsights;

  const { error } = await supabase
    .from('episodes')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar episódio:', error);
  }
}

// =============================================
// STATS
// =============================================

export async function getStats() {
  const [recordingsRes, episodesRes] = await Promise.all([
    supabase.from('recordings').select('status'),
    supabase.from('episodes').select('status'),
  ]);

  const recordings = recordingsRes.data || [];
  const episodes = episodesRes.data || [];

  return {
    totalRecordings: recordings.length,
    pendingTranscriptions: recordings.filter(r => r.status === 'pendente').length,
    approvedRecordings: recordings.filter(r => r.status === 'aprovado').length,
    totalEpisodes: episodes.length,
    publishedEpisodes: episodes.filter(e => e.status === 'publicado').length,
  };
}
