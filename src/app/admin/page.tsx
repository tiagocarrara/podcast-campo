'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Radio, LayoutDashboard, Target, FileAudio, Sparkles, Settings,
  Plus, Search, MoreHorizontal, Play, Pause, Check, X,
  Clock, Users, TrendingUp, Eye, Edit2,
  Download, RefreshCw, Volume2, Wand2, Send, Loader2
} from 'lucide-react';
import { mockMissions } from '@/data/mock';

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
  audioData?: string;
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

interface Episode {
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

type TabView = 'dashboard' | 'missions' | 'recordings' | 'episodes' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNarrating, setIsNarrating] = useState<string | null>(null);
  const [selectedMissionForEpisode, setSelectedMissionForEpisode] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carregar dados
  useEffect(() => {
    fetchRecordings();
    fetchEpisodes();
  }, []);

  const fetchRecordings = async () => {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      console.log('Gravações carregadas:', data);
      if (data.success) {
        setRecordings(data.recordings);
      } else {
        console.error('Erro na resposta:', data.error);
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
    pendingTranscriptions: recordings.filter(r => r.status === 'pendente').length,
    activeMissions: mockMissions.filter(m => m.status === 'ativa').length,
    publishedEpisodes: episodes.filter(e => e.status === 'publicado').length,
  };

  const filteredRecordings = recordings.filter(r => {
    const matchesSearch = r.promotorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.storeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      const audioSrc = recording.audioUrl || recording.audioData;
      if (audioRef.current && audioSrc) {
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch(err => console.error('Erro ao tocar áudio:', err));
        setPlayingId(recording.id);
      } else {
        console.warn('Gravação sem áudio disponível');
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

  const generateEpisode = async () => {
    if (!selectedMissionForEpisode) {
      alert('Selecione uma missão');
      return;
    }

    const mission = mockMissions.find(m => m.id === selectedMissionForEpisode);
    if (!mission) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.id,
          missionTitle: mission.title,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchEpisodes();
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
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <main className="min-h-screen flex bg-slate-900">
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingId(null)}
        className="hidden" 
      />

      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white">Campo</h1>
              <p className="text-xs text-slate-400">Admin</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'missions', icon: Target, label: 'Missões' },
            { id: 'recordings', icon: FileAudio, label: 'Gravações' },
            { id: 'episodes', icon: Sparkles, label: 'Episódios' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabView)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all
                ${activeTab === item.id 
                  ? 'bg-campo-500/20 text-campo-400 border border-campo-500/30' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {item.id === 'recordings' && recordings.length > 0 && (
                <span className="ml-auto bg-campo-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {recordings.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Generate Episode Card */}
        <div className="p-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-900/30 border border-purple-500/30">
            <Wand2 className="w-8 h-8 text-purple-400 mb-3" />
            <p className="text-sm text-white font-medium mb-1">Gerar Podcast</p>
            <p className="text-xs text-slate-300 mb-3">Crie um episódio a partir das gravações</p>
            
            <select 
              value={selectedMissionForEpisode}
              onChange={(e) => setSelectedMissionForEpisode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white mb-2"
            >
              <option value="">Selecione a missão</option>
              {mockMissions.filter(m => m.status === 'ativa').map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
            
            <button 
              onClick={generateEpisode}
              disabled={isGenerating || !selectedMissionForEpisode}
              className="w-full btn-primary text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Episódio'
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'missions' && 'Missões'}
                {activeTab === 'recordings' && 'Gravações'}
                {activeTab === 'episodes' && 'Episódios de Podcast'}
                {activeTab === 'settings' && 'Configurações'}
              </h2>
              <p className="text-sm text-slate-400">
                {activeTab === 'recordings' && `${recordings.length} gravações no total`}
                {activeTab === 'episodes' && `${episodes.length} episódios gerados`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={fetchRecordings} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
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
                  { label: 'Total de Gravações', value: stats.totalRecordings, icon: FileAudio, color: 'text-campo-400', bg: 'bg-campo-500/20' },
                  { label: 'Pendentes', value: stats.pendingTranscriptions, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                  { label: 'Missões Ativas', value: stats.activeMissions, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                  { label: 'Episódios Publicados', value: stats.publishedEpisodes, icon: Sparkles, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                ].map((stat, index) => (
                  <div key={index} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Recordings */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Gravações Recentes</h3>
                  <button 
                    onClick={() => setActiveTab('recordings')}
                    className="text-sm text-campo-400 hover:text-campo-300"
                  >
                    Ver todas
                  </button>
                </div>
                {recordings.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma gravação ainda</p>
                    <p className="text-sm">As gravações dos promotores aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recordings.slice(0, 5).map((recording) => (
                      <div 
                        key={recording.id} 
                        className="flex items-center gap-4 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all cursor-pointer"
                        onClick={() => setSelectedRecording(recording)}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); playAudio(recording); }}
                          className="w-10 h-10 rounded-full bg-campo-500/20 flex items-center justify-center hover:bg-campo-500/30"
                        >
                          {playingId === recording.id ? (
                            <Pause className="w-4 h-4 text-campo-400" />
                          ) : (
                            <Play className="w-4 h-4 text-campo-400 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{recording.promotorName}</p>
                          <p className="text-xs text-slate-400">{recording.storeName}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[recording.status].bg} ${statusColors[recording.status].text}`}>
                          {statusColors[recording.status].label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recordings View */}
          {activeTab === 'recordings' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search & Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar por promotor ou loja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-campo-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="todos">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="transcrito">Transcrito</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>

              {/* Recordings List */}
              {filteredRecordings.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <FileAudio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma gravação encontrada</p>
                  <p className="text-sm">As gravações dos promotores aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecordings.map((recording) => (
                    <div 
                      key={recording.id}
                      className={`
                        bg-slate-800 border border-slate-700 rounded-2xl p-5 transition-all
                        ${selectedRecording?.id === recording.id ? 'ring-2 ring-campo-500' : ''}
                      `}
                    >
                      <div className="flex items-start gap-5">
                        {/* Play Button */}
                        <button 
                          onClick={() => playAudio(recording)}
                          disabled={!recording.audioUrl && !recording.audioData}
                          className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
                            recording.audioUrl || recording.audioData
                              ? 'bg-gradient-to-br from-campo-500 to-campo-600 hover:scale-105'
                              : 'bg-slate-700 cursor-not-allowed'
                          }`}
                          title={recording.audioUrl || recording.audioData ? 'Tocar áudio' : 'Áudio não disponível'}
                        >
                          {playingId === recording.id ? (
                            <Pause className="w-6 h-6 text-white" fill="white" />
                          ) : (
                            <Play className={`w-6 h-6 ml-1 ${recording.audioUrl || recording.audioData ? 'text-white' : 'text-slate-500'}`} fill="currentColor" />
                          )}
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-white">{recording.promotorName}</p>
                              <p className="text-sm text-slate-400">{recording.storeName} • {recording.storeCity}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs ${statusColors[recording.status].bg} ${statusColors[recording.status].text}`}>
                              {statusColors[recording.status].label}
                            </span>
                          </div>
                          
                          {recording.transcription ? (
                            <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                              {recording.transcription}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-500 italic mb-3">
                              Transcrição não disponível
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(recording.duration)}
                            </span>
                            <span>{formatDate(recording.createdAt)}</span>
                            {recording.score > 0 && (
                              <span className="text-campo-400">Score: {recording.score}%</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                        </div>
                      </div>

                      {/* Expanded Transcription */}
                      {selectedRecording?.id === recording.id && recording.transcription && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-sm text-slate-400 mb-2">Transcrição completa:</p>
                          <p className="text-slate-200 text-sm leading-relaxed">{recording.transcription}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Episodes View */}
          {activeTab === 'episodes' && (
            <div className="space-y-6 animate-fade-in">
              {episodes.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum episódio ainda</p>
                  <p className="text-sm">Gere um episódio a partir das gravações</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {episodes.map((episode) => (
                    <div key={episode.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
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
                              {episode.status === 'publicado' ? 'Publicado' : episode.status === 'gerando' ? 'Gerando' : 'Em Revisão'}
                            </span>
                            <span className="text-xs text-slate-500">{episode.totalRecordings} relatos</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{episode.title}</h3>
                          <p className="text-sm text-slate-400">{episode.missionTitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!episode.audioUrl && !episode.audioData && episode.status !== 'gerando' && (
                            <button 
                              onClick={() => narrateEpisode(episode.id)}
                              disabled={isNarrating === episode.id}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                            >
                              {isNarrating === episode.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                              {isNarrating === episode.id ? 'Gerando...' : 'Gerar Narração'}
                            </button>
                          )}
                          {episode.status === 'revisao' && (episode.audioUrl || episode.audioData) && (
                            <button 
                              onClick={() => publishEpisode(episode.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-campo-500 text-white hover:bg-campo-400 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Publicar
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                        {episode.summary}
                      </p>

                      {/* Key Insights */}
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Principais Insights</p>
                        <div className="flex flex-wrap gap-2">
                          {episode.keyInsights.map((insight, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-sm text-slate-300 border border-slate-600">
                              {insight}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Script */}
                      <details className="mb-4">
                        <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                          Ver script completo
                        </summary>
                        <div className="mt-3 p-4 bg-slate-900 rounded-xl border border-slate-700">
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">{episode.script}</p>
                        </div>
                      </details>

                      {/* Audio Player */}
                      {(episode.audioUrl || episode.audioData) && (
                        <div className="pt-4 border-t border-slate-700">
                          <p className="text-sm text-slate-400 mb-2">Áudio do Podcast:</p>
                          <audio 
                            controls 
                            src={episode.audioUrl || episode.audioData}
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

          {/* Missions View */}
          {activeTab === 'missions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockMissions.map((mission) => {
                  const missionRecordings = recordings.filter(r => r.missionId === mission.id);
                  const progress = (missionRecordings.length / mission.targetResponses) * 100;
                  
                  return (
                    <div key={mission.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          mission.status === 'ativa' 
                            ? 'bg-campo-500/20 text-campo-400' 
                            : mission.status === 'encerrada'
                              ? 'bg-slate-600 text-slate-300'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {mission.status === 'ativa' ? 'Ativa' : mission.status === 'encerrada' ? 'Encerrada' : 'Rascunho'}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2">{mission.title}</h3>
                      <p className="text-sm text-slate-400 mb-4">{mission.description}</p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Gravações</span>
                          <span className="text-white font-medium">{missionRecordings.length}/{mission.targetResponses}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-campo-500 to-campo-400 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
