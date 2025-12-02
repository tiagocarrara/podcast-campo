'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Radio, LayoutDashboard, Target, FileAudio, Sparkles, Settings,
  Search, Play, Pause, Check, X, CheckSquare, Square,
  Clock, Users, TrendingUp, Volume2, Send, Loader2,
  ChevronRight, ChevronDown, Mic, Headphones
} from 'lucide-react';

interface Recording {
  id: string;
  missionId: string;
  missionTitle: string;
  promotorId: string;
  promotorName: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  audioUrl?: string;
  transcription: string;
  duration: number;
  score: number;
  status: 'pendente' | 'transcrito' | 'aprovado' | 'rejeitado';
  createdAt: string;
}

interface Episode {
  id: string;
  missionId: string;
  missionTitle: string;
  title: string;
  summary: string;
  script: string;
  audioUrl?: string;
  recordingIds: string[];
  totalRecordings: number;
  keyInsights: string[];
  status: 'gerando' | 'revisao' | 'publicado';
  createdAt: string;
  publishedAt?: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  question: string;
  status: 'ativa' | 'encerrada' | 'rascunho';
  recordings: Recording[];
}

type TabView = 'dashboard' | 'missions' | 'episodes';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabView>('missions');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isNarrating, setIsNarrating] = useState<string | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Agrupar gravações por missão
  const missions: Mission[] = recordings.reduce((acc: Mission[], recording) => {
    const existingMission = acc.find(m => m.id === recording.missionId);
    if (existingMission) {
      existingMission.recordings.push(recording);
    } else {
      acc.push({
        id: recording.missionId,
        title: recording.missionTitle,
        description: '',
        question: '',
        status: 'ativa',
        recordings: [recording],
      });
    }
    return acc;
  }, []);

  useEffect(() => {
    fetchRecordings();
    fetchEpisodes();
  }, []);

  const fetchRecordings = async () => {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      if (data.success) {
        setRecordings(data.recordings);
      }
    } catch (error) {
      console.error('Erro ao carregar gravações:', error);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch('/api/episodes');
      const data = await res.json();
      if (data.success) {
        setEpisodes(data.episodes);
      }
    } catch (error) {
      console.error('Erro ao carregar episódios:', error);
    }
  };

  const stats = {
    totalRecordings: recordings.length,
    pendingRecordings: recordings.filter(r => r.status === 'pendente' || r.status === 'transcrito').length,
    approvedRecordings: recordings.filter(r => r.status === 'aprovado').length,
    totalMissions: missions.length,
    totalEpisodes: episodes.length,
    publishedEpisodes: episodes.filter(e => e.status === 'publicado').length,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = {
    pendente: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pendente' },
    transcrito: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Transcrito' },
    aprovado: { bg: 'bg-campo-500/20', text: 'text-campo-400', label: 'Aprovado' },
    rejeitado: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejeitado' },
  };

  const playAudio = (recording: Recording) => {
    if (playingId === recording.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      const audioSrc = recording.audioUrl;
      if (audioRef.current && audioSrc) {
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(err => console.error('Erro ao tocar áudio:', err));
        setPlayingId(recording.id);
      }
    }
  };

  const updateRecordingStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/recordings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchRecordings();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const toggleRecordingSelection = (id: string) => {
    const newSelected = new Set(selectedRecordings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecordings(newSelected);
  };

  const selectAllFromMission = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;
    
    const missionRecordingIds = mission.recordings
      .filter(r => r.status !== 'rejeitado')
      .map(r => r.id);
    
    const allSelected = missionRecordingIds.every(id => selectedRecordings.has(id));
    
    const newSelected = new Set(selectedRecordings);
    if (allSelected) {
      missionRecordingIds.forEach(id => newSelected.delete(id));
    } else {
      missionRecordingIds.forEach(id => newSelected.add(id));
    }
    setSelectedRecordings(newSelected);
  };

  const generateEpisode = async (missionId: string, missionTitle: string) => {
    const selectedFromMission = recordings.filter(
      r => r.missionId === missionId && selectedRecordings.has(r.id)
    );

    if (selectedFromMission.length === 0) {
      alert('Selecione pelo menos uma gravação para gerar o episódio.');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatus('Transcrevendo áudios...');

    try {
      // 1. Transcrever áudios que não têm transcrição
      const recordingsToTranscribe = selectedFromMission.filter(r => !r.transcription);
      
      for (let i = 0; i < recordingsToTranscribe.length; i++) {
        const recording = recordingsToTranscribe[i];
        setGeneratingStatus(`Transcrevendo áudio ${i + 1}/${recordingsToTranscribe.length}...`);
        
        if (recording.audioUrl) {
          try {
            // Baixar o áudio e enviar para transcrição
            const audioResponse = await fetch(recording.audioUrl);
            const audioBlob = await audioResponse.blob();
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');
            formData.append('missionId', recording.missionId);
            formData.append('recordingId', recording.id);
            
            const transcribeRes = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            
            if (transcribeRes.ok) {
              const transcribeData = await transcribeRes.json();
              // Atualizar transcrição no banco
              await fetch('/api/recordings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  id: recording.id, 
                  transcription: transcribeData.transcription,
                  status: 'transcrito'
                }),
              });
            }
          } catch (e) {
            console.error('Erro ao transcrever:', e);
          }
        }
      }

      // Recarregar gravações para pegar as transcrições
      await fetchRecordings();

      // 2. Gerar episódio com GPT
      setGeneratingStatus('Gerando episódio com IA...');
      
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          missionTitle,
          recordingIds: Array.from(selectedRecordings).filter(
            id => recordings.find(r => r.id === id)?.missionId === missionId
          ),
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchEpisodes();
        setSelectedRecordings(new Set());
        setActiveTab('episodes');
        alert('Episódio gerado com sucesso!');
      } else {
        alert(data.error || 'Erro ao gerar episódio');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar episódio');
    } finally {
      setIsGenerating(false);
      setGeneratingStatus('');
    }
  };

  const narrateEpisode = async (episodeId: string) => {
    setIsNarrating(episodeId);
    try {
      const res = await fetch('/api/episodes/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      const data = await res.json();
      if (data.success) {
        fetchEpisodes();
        alert('Narração gerada com sucesso!');
      } else {
        alert(data.error || 'Erro ao gerar narração');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar narração');
    } finally {
      setIsNarrating(null);
    }
  };

  const publishEpisode = async (episodeId: string) => {
    try {
      await fetch('/api/episodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: episodeId, status: 'publicado' }),
      });
      fetchEpisodes();
      alert('Episódio publicado! Agora está visível na área do cliente.');
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getSelectedCountForMission = (missionId: string) => {
    return recordings.filter(
      r => r.missionId === missionId && selectedRecordings.has(r.id)
    ).length;
  };

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
        className="hidden" 
      />

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-white/10 flex flex-col backdrop-blur-xl">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">Campo</h1>
              <p className="text-xs text-white/50">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'missions', icon: Target, label: 'Missões', badge: stats.totalMissions },
            { id: 'episodes', icon: Sparkles, label: 'Episódios', badge: stats.totalEpisodes },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabView)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all
                ${activeTab === item.id 
                  ? 'bg-campo-500/20 text-campo-400 border border-campo-500/30' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-white/10 text-white/70 text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Stats Summary */}
        <div className="p-4 border-t border-white/10">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-white/50">
              <span>Gravações</span>
              <span className="text-white">{stats.totalRecordings}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Pendentes</span>
              <span className="text-amber-400">{stats.pendingRecordings}</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Publicados</span>
              <span className="text-campo-400">{stats.publishedEpisodes}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'missions' && 'Missões & Gravações'}
                {activeTab === 'episodes' && 'Episódios de Podcast'}
              </h2>
              <p className="text-sm text-white/50">
                {activeTab === 'missions' && `${stats.totalMissions} missões com ${stats.totalRecordings} gravações`}
                {activeTab === 'episodes' && `${stats.totalEpisodes} episódios, ${stats.publishedEpisodes} publicados`}
              </p>
            </div>
            
            {selectedRecordings.size > 0 && activeTab === 'missions' && (
              <div className="flex items-center gap-4 bg-campo-500/20 border border-campo-500/30 rounded-xl px-4 py-2">
                <span className="text-campo-400 font-medium">
                  {selectedRecordings.size} áudio(s) selecionado(s)
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: 'Total de Gravações', value: stats.totalRecordings, icon: Mic, color: 'text-campo-400', bg: 'bg-campo-500/20' },
                  { label: 'Aguardando Revisão', value: stats.pendingRecordings, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                  { label: 'Aprovadas', value: stats.approvedRecordings, icon: Check, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                  { label: 'Episódios Publicados', value: stats.publishedEpisodes, icon: Headphones, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                ].map((stat, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => setActiveTab('missions')}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-all group"
                >
                  <Target className="w-8 h-8 text-campo-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Revisar Gravações</h3>
                  <p className="text-white/50 text-sm">Aprovar ou rejeitar gravações dos promotores e gerar episódios</p>
                  <ChevronRight className="w-5 h-5 text-white/30 mt-4 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={() => setActiveTab('episodes')}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-all group"
                >
                  <Sparkles className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Episódios</h3>
                  <p className="text-white/50 text-sm">Revisar, narrar e publicar episódios de podcast</p>
                  <ChevronRight className="w-5 h-5 text-white/30 mt-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Missions View */}
          {activeTab === 'missions' && (
            <div className="space-y-6 animate-fade-in">
              {missions.length === 0 ? (
                <div className="text-center py-16 text-white/50">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma gravação ainda</p>
                  <p className="text-sm">As gravações dos promotores aparecerão aqui agrupadas por missão</p>
                </div>
              ) : (
                missions.map((mission) => {
                  const isExpanded = expandedMission === mission.id;
                  const selectedCount = getSelectedCountForMission(mission.id);
                  const allSelected = mission.recordings
                    .filter(r => r.status !== 'rejeitado')
                    .every(r => selectedRecordings.has(r.id));
                  
                  return (
                    <div key={mission.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                      {/* Mission Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-white/5 transition-all"
                        onClick={() => setExpandedMission(isExpanded ? null : mission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-campo-500/20 flex items-center justify-center">
                              <Target className="w-6 h-6 text-campo-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{mission.title}</h3>
                              <p className="text-sm text-white/50">
                                {mission.recordings.length} gravações • 
                                {mission.recordings.filter(r => r.status === 'aprovado').length} aprovadas
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {selectedCount > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateEpisode(mission.id, mission.title);
                                }}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-400 hover:to-purple-500 transition-all disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm">{generatingStatus || 'Gerando...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Gerar Episódio ({selectedCount})</span>
                                  </>
                                )}
                              </button>
                            )}
                            
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-white/50" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-white/50" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Recordings List */}
                      {isExpanded && (
                        <div className="border-t border-white/10">
                          {/* Select All */}
                          <div className="px-6 py-3 bg-white/5 flex items-center justify-between">
                            <button
                              onClick={() => selectAllFromMission(mission.id)}
                              className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
                            >
                              {allSelected ? (
                                <CheckSquare className="w-4 h-4 text-campo-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                              Selecionar todas
                            </button>
                            <span className="text-xs text-white/40">
                              Clique para selecionar gravações e gerar episódio
                            </span>
                          </div>

                          {/* Recording Items */}
                          <div className="divide-y divide-white/5">
                            {mission.recordings.map((recording) => (
                              <div 
                                key={recording.id}
                                className={`p-4 flex items-center gap-4 hover:bg-white/5 transition-all ${
                                  selectedRecordings.has(recording.id) ? 'bg-campo-500/10' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={() => toggleRecordingSelection(recording.id)}
                                  className="flex-shrink-0"
                                  disabled={recording.status === 'rejeitado'}
                                >
                                  {selectedRecordings.has(recording.id) ? (
                                    <CheckSquare className="w-5 h-5 text-campo-400" />
                                  ) : (
                                    <Square className={`w-5 h-5 ${recording.status === 'rejeitado' ? 'text-white/20' : 'text-white/40 hover:text-white/60'}`} />
                                  )}
                                </button>

                                {/* Play Button */}
                                <button 
                                  onClick={() => playAudio(recording)}
                                  disabled={!recording.audioUrl}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                    recording.audioUrl
                                      ? 'bg-campo-500/20 hover:bg-campo-500/30'
                                      : 'bg-white/10 cursor-not-allowed'
                                  }`}
                                >
                                  {playingId === recording.id ? (
                                    <Pause className="w-4 h-4 text-campo-400" />
                                  ) : (
                                    <Play className={`w-4 h-4 ${recording.audioUrl ? 'text-campo-400' : 'text-white/30'} ml-0.5`} />
                                  )}
                                </button>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">{recording.promotorName}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[recording.status].bg} ${statusColors[recording.status].text}`}>
                                      {statusColors[recording.status].label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-white/50">{recording.storeName} • {recording.storeCity}</p>
                                  {recording.transcription ? (
                                    <p className="text-sm text-white/70 mt-2 line-clamp-2">{recording.transcription}</p>
                                  ) : (
                                    <p className="text-sm text-white/30 italic mt-2">Sem transcrição</p>
                                  )}
                                </div>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-white/40 flex-shrink-0">
                                  <span>{formatDuration(recording.duration)}</span>
                                  <span>{formatDate(recording.createdAt)}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {recording.status !== 'aprovado' && recording.status !== 'rejeitado' && (
                                    <>
                                      <button 
                                        onClick={() => updateRecordingStatus(recording.id, 'aprovado')}
                                        className="p-2 rounded-lg bg-campo-500/20 text-campo-400 hover:bg-campo-500/30 transition-colors"
                                        title="Aprovar"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => updateRecordingStatus(recording.id, 'rejeitado')}
                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                        title="Rejeitar"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Episodes View */}
          {activeTab === 'episodes' && (
            <div className="space-y-6 animate-fade-in">
              {episodes.length === 0 ? (
                <div className="text-center py-16 text-white/50">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum episódio ainda</p>
                  <p className="text-sm">Selecione gravações em uma missão e clique em "Gerar Episódio"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {episodes.map((episode) => (
                    <div key={episode.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              episode.status === 'publicado' 
                                ? 'bg-campo-500/20 text-campo-400' 
                                : episode.status === 'gerando'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-cyan-500/20 text-cyan-400'
                            }`}>
                              {episode.status === 'publicado' ? '✓ Publicado' : episode.status === 'gerando' ? 'Gerando' : 'Em Revisão'}
                            </span>
                            <span className="text-xs text-white/40">{episode.totalRecordings} relatos</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{episode.title}</h3>
                          <p className="text-sm text-white/50">{episode.missionTitle}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!episode.audioUrl && episode.status !== 'gerando' && (
                            <button 
                              onClick={() => narrateEpisode(episode.id)}
                              disabled={isNarrating === episode.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                            >
                              {isNarrating === episode.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                              {isNarrating === episode.id ? 'Gerando...' : 'Gerar Narração'}
                            </button>
                          )}
                          {episode.status === 'revisao' && episode.audioUrl && (
                            <button 
                              onClick={() => publishEpisode(episode.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-campo-500 text-white hover:bg-campo-400 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Publicar
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-white/70 mb-4 leading-relaxed">
                        {episode.summary}
                      </p>

                      {/* Key Insights */}
                      {episode.keyInsights && episode.keyInsights.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Principais Insights</p>
                          <div className="flex flex-wrap gap-2">
                            {episode.keyInsights.map((insight, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 text-sm text-white/70 border border-white/10">
                                {insight}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Script */}
                      <details className="mb-4">
                        <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70">
                          Ver script completo
                        </summary>
                        <div className="mt-3 p-4 bg-slate-900/50 rounded-xl border border-white/10">
                          <p className="text-sm text-white/70 whitespace-pre-wrap">{episode.script}</p>
                        </div>
                      </details>

                      {/* Audio Player */}
                      {episode.audioUrl && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm text-white/50 mb-2">Áudio do Podcast:</p>
                          <audio 
                            controls 
                            src={episode.audioUrl}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-white/20 rounded-2xl p-8 text-center max-w-sm">
            <Loader2 className="w-12 h-12 animate-spin text-campo-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Gerando Episódio</p>
            <p className="text-white/60 text-sm">{generatingStatus}</p>
          </div>
        </div>
      )}
    </main>
  );
}
