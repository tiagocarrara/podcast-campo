'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Radio, Headphones, Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Share2, Download, Heart, MessageSquare,
  Plus, Send, Clock, TrendingUp, Lightbulb, ChevronRight,
  Calendar, Users, BarChart3, ArrowLeft, X, Check, Copy
} from 'lucide-react';
import { mockSyntheses, mockMissions } from '@/data/mock';
import { Synthesis } from '@/types';

type ViewMode = 'home' | 'playlist' | 'suggest' | 'details';

export default function ClientePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [currentPodcast, setCurrentPodcast] = useState<Synthesis | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestions, setSuggestions] = useState([
    { id: '1', text: 'Qual a percepção dos consumidores sobre sustentabilidade?', votes: 12, voted: false },
    { id: '2', text: 'Como está a presença da marca X nas gôndolas?', votes: 8, voted: true },
    { id: '3', text: 'Quais novos produtos da concorrência chamam atenção?', votes: 15, voted: false },
  ]);

  const publishedSyntheses = mockSyntheses.filter(s => s.status === 'publicado');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.5;
        });
      }, 500);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  const handlePlayPodcast = (synthesis: Synthesis) => {
    if (currentPodcast?.id === synthesis.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPodcast(synthesis);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const handleVoteSuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === id 
        ? { ...s, votes: s.voted ? s.votes - 1 : s.votes + 1, voted: !s.voted }
        : s
    ));
  };

  const handleSubmitSuggestion = () => {
    if (newSuggestion.trim()) {
      setSuggestions(prev => [
        { id: Date.now().toString(), text: newSuggestion, votes: 1, voted: true },
        ...prev
      ]);
      setNewSuggestion('');
    }
  };

  const formatTime = (percent: number) => {
    // Assuming 2 min total duration
    const totalSeconds = 120;
    const currentSeconds = Math.floor((percent / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {viewMode !== 'home' ? (
              <button 
                onClick={() => setViewMode('home')}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-white">Campo Insights</h1>
                  <p className="text-xs text-slate-400">Central do Cliente</p>
                </div>
              </Link>
            )}
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setViewMode('suggest')}
                className="btn-secondary flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Sugerir Tema
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/80 backdrop-blur-sm animate-fade-in">
          <div className="card max-w-md mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Compartilhar</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 mb-6">
              Compartilhe este insight com sua equipe
            </p>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-700/50 border border-slate-600 mb-6">
              <input 
                type="text" 
                value="https://campo.app/insights/1"
                readOnly
                className="flex-1 bg-transparent text-slate-200 text-sm outline-none"
              />
              <button className="p-2 rounded-lg bg-campo-500/20 text-campo-400 hover:bg-campo-500/30 transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {['WhatsApp', 'Email', 'Teams', 'Slack'].map((platform) => (
                <button 
                  key={platform}
                  className="p-4 rounded-xl bg-slate-700/50 border border-slate-600 hover:bg-slate-700 transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center mx-auto mb-2">
                    <Share2 className="w-5 h-5 text-slate-300" />
                  </div>
                  <span className="text-xs text-slate-300">{platform}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Home View */}
        {viewMode === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Section */}
            <div className="card bg-gradient-to-br from-accent-cyan/20 via-blue-900/30 to-accent-violet/20 border-accent-cyan/30">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <p className="text-accent-cyan text-sm font-medium mb-2">Último Episódio</p>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                    {publishedSyntheses[0]?.missionTitle || 'Carregando...'}
                  </h2>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    {publishedSyntheses[0]?.summary.slice(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => publishedSyntheses[0] && handlePlayPodcast(publishedSyntheses[0])}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Play className="w-5 h-5" fill="white" />
                      Ouvir Agora
                    </button>
                    <button className="btn-secondary flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Infográfico
                    </button>
                  </div>
                </div>
                <div className="relative w-48 h-48 flex-shrink-0 hidden md:block">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-cyan to-blue-600 opacity-20 blur-xl" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-accent-cyan/30 to-blue-600/30 border border-slate-600 flex items-center justify-center">
                    <Headphones className="w-20 h-20 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Headphones, label: 'Episódios', value: publishedSyntheses.length },
                { icon: Users, label: 'Promotores Ativos', value: '48' },
                { icon: TrendingUp, label: 'Lojas Cobertas', value: '320' },
                { icon: MessageSquare, label: 'Relatos este mês', value: '156' },
              ].map((stat, index) => (
                <div key={index} className="card text-center">
                  <stat.icon className="w-6 h-6 text-accent-cyan mx-auto mb-3" />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Playlist Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  <Radio className="w-6 h-6 text-campo-400" />
                  Biblioteca de Insights
                </h3>
                <button 
                  onClick={() => setViewMode('playlist')}
                  className="text-sm text-campo-400 hover:text-campo-300 flex items-center gap-1"
                >
                  Ver todos
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publishedSyntheses.map((synthesis, index) => (
                  <div 
                    key={synthesis.id}
                    className={`
                      card flex gap-4 cursor-pointer group
                      ${currentPodcast?.id === synthesis.id ? 'ring-2 ring-campo-500 bg-white/10' : ''}
                    `}
                    onClick={() => handlePlayPodcast(synthesis)}
                  >
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                      ${currentPodcast?.id === synthesis.id && isPlaying
                        ? 'bg-gradient-to-br from-campo-500 to-campo-600 animate-pulse'
                        : 'bg-gradient-to-br from-campo-500/20 to-campo-600/20 group-hover:from-campo-500/30 group-hover:to-campo-600/30'
                      }
                    `}>
                      {currentPodcast?.id === synthesis.id && isPlaying ? (
                        <Pause className="w-7 h-7 text-white" fill="white" />
                      ) : (
                        <Play className="w-7 h-7 text-campo-400 ml-1 group-hover:text-campo-300" fill="currentColor" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 mb-1">Episódio {publishedSyntheses.length - index}</p>
                      <h4 className="font-medium text-white mb-1 truncate">{synthesis.missionTitle}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          2 min
                        </span>
                        <span>{synthesis.totalRecordings} relatos</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(true);
                        }}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Topics */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-accent-amber" />
                  Temas Sugeridos
                </h3>
                <button 
                  onClick={() => setViewMode('suggest')}
                  className="text-sm text-accent-amber hover:text-accent-amber/80 flex items-center gap-1"
                >
                  Sugerir tema
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <div key={suggestion.id} className="card flex items-center gap-4">
                    <button
                      onClick={() => handleVoteSuggestion(suggestion.id)}
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                        ${suggestion.voted 
                          ? 'bg-campo-500/20 border border-campo-500/30' 
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                        }
                      `}
                    >
                      <TrendingUp className={`w-5 h-5 ${suggestion.voted ? 'text-campo-400' : 'text-slate-300'}`} />
                    </button>
                    <div className="flex-1">
                      <p className="text-white">{suggestion.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{suggestion.votes} votos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggest View */}
        {viewMode === 'suggest' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-8 h-8 text-accent-amber" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Sugira um Tema</h2>
              <p className="text-slate-300">
                Que insights do campo você gostaria de receber? Sugira um tema e vote nas sugestões de outros clientes.
              </p>
            </div>

            {/* New Suggestion Input */}
            <div className="card">
              <label className="text-sm text-slate-400 mb-2 block">Sua sugestão</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ex: Como os consumidores percebem nossa marca?"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitSuggestion()}
                />
                <button 
                  onClick={handleSubmitSuggestion}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </div>

            {/* Existing Suggestions */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Sugestões da Comunidade</h3>
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="card flex items-center gap-4">
                    <button
                      onClick={() => handleVoteSuggestion(suggestion.id)}
                      className={`
                        flex flex-col items-center justify-center w-16 h-16 rounded-xl flex-shrink-0 transition-all
                        ${suggestion.voted 
                          ? 'bg-campo-500/20 border border-campo-500/30' 
                          : 'bg-slate-700 border border-slate-600 hover:bg-slate-600'
                        }
                      `}
                    >
                      <TrendingUp className={`w-5 h-5 mb-1 ${suggestion.voted ? 'text-campo-400' : 'text-slate-300'}`} />
                      <span className={`text-sm font-bold ${suggestion.voted ? 'text-campo-400' : 'text-slate-200'}`}>
                        {suggestion.votes}
                      </span>
                    </button>
                    <div className="flex-1">
                      <p className="text-white">{suggestion.text}</p>
                    </div>
                    {suggestion.voted && (
                      <Check className="w-5 h-5 text-campo-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Playlist View */}
        {viewMode === 'playlist' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Biblioteca Completa</h2>
              <p className="text-slate-300">Todos os insights do campo em um só lugar</p>
            </div>

            <div className="space-y-4">
              {publishedSyntheses.map((synthesis, index) => (
                <div 
                  key={synthesis.id}
                  className={`
                    card cursor-pointer transition-all
                    ${currentPodcast?.id === synthesis.id ? 'ring-2 ring-campo-500 bg-white/10' : 'hover:bg-white/10'}
                  `}
                  onClick={() => handlePlayPodcast(synthesis)}
                >
                  <div className="flex items-start gap-6">
                    <div className={`
                      w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                      ${currentPodcast?.id === synthesis.id && isPlaying
                        ? 'bg-gradient-to-br from-campo-500 to-campo-600'
                        : 'bg-gradient-to-br from-campo-500/20 to-campo-600/20'
                      }
                    `}>
                      {currentPodcast?.id === synthesis.id && isPlaying ? (
                        <Pause className="w-8 h-8 text-white" fill="white" />
                      ) : (
                        <Play className="w-8 h-8 text-campo-400 ml-1" fill="currentColor" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded bg-campo-500/20 text-campo-400 text-xs">
                          Ep. {publishedSyntheses.length - index}
                        </span>
                        <span className="text-xs text-white/40">
                          {synthesis.publishedAt && new Date(synthesis.publishedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2">{synthesis.missionTitle}</h3>
                      <p className="text-sm text-slate-300 mb-4 line-clamp-2">{synthesis.summary}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          2 min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {synthesis.totalRecordings} relatos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowShareModal(true);
                        }}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Key Insights Preview */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Principais Insights:</p>
                    <div className="flex flex-wrap gap-2">
                      {synthesis.keyInsights.slice(0, 3).map((insight, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-slate-700/50 text-xs text-slate-300">
                          {insight.length > 50 ? insight.slice(0, 50) + '...' : insight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audio Player Bar */}
      {currentPodcast && (
        <div className="fixed bottom-0 left-0 right-0 glass-dark border-t border-slate-700 z-50">
          <div className="max-w-6xl mx-auto px-6">
            {/* Progress Bar */}
            <div className="h-1 -mt-px">
              <div className="h-full bg-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-campo-500 to-campo-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6 py-4">
              {/* Track Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-campo-500/30 to-campo-600/30 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-6 h-6 text-campo-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{currentPodcast.missionTitle}</p>
                  <p className="text-sm text-slate-400">{currentPodcast.totalRecordings} relatos consolidados</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-campo-500/30"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  )}
                </button>
                <button className="p-2 text-slate-400 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Time & Volume */}
              <div className="flex items-center gap-4 flex-1 justify-end">
                <span className="text-sm text-slate-400 tabular-nums">
                  {formatTime(progress)} / 2:00
                </span>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

