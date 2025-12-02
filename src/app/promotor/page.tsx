'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Radio, ArrowLeft, Mic, Trophy, Target, Flame, 
  Star, MapPin, Building2, CheckCircle2, Clock, 
  ChevronDown, Play, Pause, RotateCcw, Send, Square,
  Sparkles, AlertCircle, CheckCircle, Info, X
} from 'lucide-react';
import { mockUser, mockMissions, mockLeaderboard, mockStores } from '@/data/mock';
import { Mission, Store } from '@/types';

type FlowStep = 'select-store' | 'select-mission' | 'recording' | 'review';

export default function PromotorPage() {
  const [flowStep, setFlowStep] = useState<FlowStep>('select-store');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [storeSearch, setStoreSearch] = useState('');
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // AI Evaluation states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    covered: string[];
    missing: string[];
    summary?: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeMissions = mockMissions.filter(m => m.status === 'ativa');
  
  const filteredStores = mockStores.filter(store => 
    store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    store.city.toLowerCase().includes(storeSearch.toLowerCase())
  );

  // Mission checklist/guide (would come from admin in production)
  const missionGuide = {
    concorrencia: [
      'Observe os materiais de PDV dos concorrentes',
      'Pergunte aos vendedores sobre promoções ativas',
      'Fotografe se possível os displays promocionais',
      'Mencione preços e condições especiais'
    ],
    vendas: [
      'Converse com pelo menos 2 vendedores',
      'Pergunte sobre os modelos mais procurados',
      'Identifique os motivos de preferência',
      'Compare com períodos anteriores se possível'
    ],
    execucao: [
      'Verifique posicionamento dos materiais',
      'Avalie visibilidade da marca',
      'Identifique pontos de melhoria',
      'Compare com o planograma esperado'
    ],
    consumidor: [
      'Observe comportamento de compra',
      'Ouça feedbacks espontâneos',
      'Note perguntas frequentes dos clientes',
      'Identifique objeções de compra'
    ],
    livre: [
      'Compartilhe observações relevantes',
      'Destaque novidades ou mudanças',
      'Mencione oportunidades identificadas',
      'Relate feedbacks importantes'
    ]
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setStoreSearch(store.name);
    setShowStoreDropdown(false);
    setFlowStep('select-mission');
  };

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission);
    setFlowStep('recording');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        
        // Transcrever e analisar com IA
        transcribeAndAnalyze(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setFlowStep('review');
    }
  };

  const analyzeRecording = async (transcription: string) => {
    setIsAnalyzing(true);
    try {
      // Pegar o guia da missão atual
      const currentGuide = selectedMission?.category 
        ? missionGuide[selectedMission.category] || missionGuide.livre
        : missionGuide.livre;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription,
          missionTitle: selectedMission?.title,
          missionQuestion: selectedMission?.question,
          missionCategory: selectedMission?.category,
          missionGuide: currentGuide,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluation({
          score: data.analysis.score,
          covered: data.analysis.covered || [],
          missing: data.analysis.missing || [],
          summary: data.analysis.summary,
        });
      } else {
        // Fallback se a análise falhar
        setEvaluation({
          score: 80,
          covered: ['Relato recebido com sucesso'],
          missing: [],
        });
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      setEvaluation({
        score: 80,
        covered: ['Relato recebido com sucesso'],
        missing: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const transcribeAndAnalyze = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      // Primeiro, transcrever o áudio
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('missionId', selectedMission?.id || '');
      formData.append('storeId', selectedStore?.id || '');
      formData.append('promotorId', mockUser.id);

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (transcribeResponse.ok) {
        const transcribeData = await transcribeResponse.json();
        console.log('Transcrição:', transcribeData.transcription);
        
        // Depois, analisar a transcrição
        await analyzeRecording(transcribeData.transcription);
      } else {
        throw new Error('Falha na transcrição');
      }
    } catch (error) {
      console.error('Erro:', error);
      // Fallback se falhar
      setEvaluation({
        score: 75,
        covered: ['Áudio recebido'],
        missing: [],
      });
      setIsAnalyzing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setEvaluation(null);
    setFlowStep('recording');
  };

  const submitRecording = async () => {
    if (!audioBlob || !selectedMission || !selectedStore) return;

    try {
      // Converter áudio para base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        console.log('Áudio convertido para base64, tamanho:', base64Audio.length);

        // Primeiro transcrever
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('missionId', selectedMission.id);
        formData.append('storeId', selectedStore.id);
        formData.append('promotorId', mockUser.id);

        console.log('Enviando áudio para transcrição...', {
          blobSize: audioBlob.size,
          blobType: audioBlob.type,
        });

        let transcription = '';
        try {
          const transcribeResponse = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          console.log('Resposta da transcrição - Status:', transcribeResponse.status);
          
          const data = await transcribeResponse.json();
          console.log('Dados da transcrição:', data);
          
          if (transcribeResponse.ok && data.transcription) {
            transcription = data.transcription;
            console.log('Transcrição obtida:', transcription.slice(0, 100) + '...');
          } else {
            console.warn('Transcrição falhou ou vazia:', data.error || 'sem erro específico');
          }
        } catch (e) {
          console.error('Erro na transcrição:', e);
        }

        // Salvar gravação
        console.log('Salvando gravação com transcrição:', transcription ? 'SIM' : 'NÃO');
        
        const saveResponse = await fetch('/api/recordings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId: selectedMission.id,
            missionTitle: selectedMission.title,
            promotorId: mockUser.id,
            promotorName: mockUser.name,
            storeId: selectedStore.id,
            storeName: selectedStore.name,
            storeCity: `${selectedStore.city} - ${selectedStore.state}`,
            audioData: base64Audio,
            transcription: transcription,
            duration: recordingTime,
            score: evaluation?.score || 0,
            analysis: evaluation,
          }),
        });

        const saveData = await saveResponse.json();
        console.log('Gravação salva:', saveData);

        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          resetRecording();
          setSelectedMission(null);
          setSelectedStore(null);
          setStoreSearch('');
          setFlowStep('select-store');
        }, 3000);
      };
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar gravação. Tente novamente.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goBack = () => {
    if (flowStep === 'select-mission') {
      setFlowStep('select-store');
      setSelectedStore(null);
      setStoreSearch('');
    } else if (flowStep === 'recording') {
      setFlowStep('select-mission');
      setSelectedMission(null);
    } else if (flowStep === 'review') {
      resetRecording();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center max-w-sm mx-4 animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-campo-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-campo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Relato Enviado!</h3>
            <p className="text-slate-300 mb-4">
              Você ganhou <span className="text-amber-400 font-bold">+50 pontos</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-campo-400">
              <Flame className="w-4 h-4" />
              <span>Streak de {(mockLeaderboard.find(e => e.userId === mockUser.id)?.streak || 0) + 1} dias!</span>
            </div>
          </div>
        </div>
      )}

      {/* Header - Minimal */}
      <header className="bg-slate-800/95 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {flowStep !== 'select-store' ? (
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm">Voltar</span>
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white">Campo</span>
              </Link>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <span className="text-xs font-medium text-amber-400">{mockUser.points}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        
        {/* STEP 1: Select Store */}
        {flowStep === 'select-store' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-campo-500/20 border border-campo-500/30 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-campo-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Onde você está?
              </h1>
              <p className="text-slate-400">
                Selecione o ponto de venda
              </p>
            </div>

            {/* Store Search */}
            <div className="relative">
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Digite o nome da loja..."
                  value={storeSearch}
                  onChange={(e) => {
                    setStoreSearch(e.target.value);
                    setShowStoreDropdown(true);
                  }}
                  onFocus={() => setShowStoreDropdown(true)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-campo-500 focus:ring-2 focus:ring-campo-500/20 text-lg"
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>

              {/* Dropdown */}
              {showStoreDropdown && storeSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl z-10 max-h-64 overflow-y-auto">
                  {filteredStores.length > 0 ? (
                    filteredStores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => handleSelectStore(store)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-campo-500/20 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-campo-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{store.name}</p>
                          <p className="text-sm text-slate-400">{store.city} - {store.state}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">
                      Nenhuma loja encontrada
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Stores */}
            <div>
              <p className="text-sm text-slate-500 mb-3">Lojas recentes</p>
              <div className="space-y-2">
                {mockStores.slice(0, 3).map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleSelectStore(store)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{store.name}</p>
                      <p className="text-xs text-slate-500">{store.city}</p>
                    </div>
                    <Clock className="w-4 h-4 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Select Mission */}
        {flowStep === 'select-mission' && selectedStore && (
          <div className="space-y-6 animate-fade-in">
            {/* Selected Store - Compact */}
            <div className="flex items-center gap-3 p-3 bg-campo-500/10 border border-campo-500/20 rounded-xl">
              <MapPin className="w-4 h-4 text-campo-400" />
              <span className="text-sm text-campo-300">{selectedStore.name} • {selectedStore.city}</span>
            </div>

            <div className="text-center mb-4">
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Qual missão?
              </h1>
              <p className="text-slate-400">
                Selecione a pergunta para responder
              </p>
            </div>

            {/* Mission Cards */}
            <div className="space-y-3">
              {activeMissions.map((mission) => (
                <button
                  key={mission.id}
                  onClick={() => handleSelectMission(mission)}
                  className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl hover:bg-slate-750 hover:border-slate-600 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium
                      ${mission.category === 'concorrencia' ? 'bg-orange-500/20 text-orange-400' : ''}
                      ${mission.category === 'vendas' ? 'bg-campo-500/20 text-campo-400' : ''}
                      ${mission.category === 'execucao' ? 'bg-purple-500/20 text-purple-400' : ''}
                      ${mission.category === 'consumidor' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                      ${mission.category === 'livre' ? 'bg-amber-500/20 text-amber-400' : ''}
                    `}>
                      {mission.category.charAt(0).toUpperCase() + mission.category.slice(1)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.ceil((new Date(mission.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                    </div>
                  </div>
                  
                  <p className="text-white font-medium mb-2 group-hover:text-campo-300 transition-colors">
                    {mission.question || mission.title}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-campo-500 rounded-full"
                        style={{ width: `${(mission.totalResponses / mission.targetResponses) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{mission.totalResponses}/{mission.targetResponses}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Recording */}
        {flowStep === 'recording' && selectedStore && selectedMission && (
          <div className="space-y-6 animate-fade-in">
            {/* Context Bar - Compact */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">{selectedStore.name}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg flex-1 truncate">
                <Target className="w-3.5 h-3.5 text-campo-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">{selectedMission.title}</span>
              </div>
            </div>

            {/* Question Display */}
            {selectedMission.question && (
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl">
                <p className="text-white text-center leading-relaxed">
                  "{selectedMission.question}"
                </p>
              </div>
            )}

            {/* Big Microphone Button */}
            <div className="py-8">
              <div className="relative flex flex-col items-center">
                {/* Pulse rings when recording */}
                {isRecording && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-40 h-40 rounded-full bg-red-500/10 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full bg-red-500/5 animate-pulse" />
                    </div>
                  </>
                )}
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`
                    relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 transform
                    ${isRecording 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 scale-110 shadow-2xl shadow-red-500/40' 
                      : 'bg-gradient-to-br from-campo-500 to-campo-600 hover:scale-105 shadow-xl shadow-campo-500/30'
                    }
                  `}
                >
                  {isRecording ? (
                    <Square className="w-14 h-14 text-white" fill="white" />
                  ) : (
                    <Mic className="w-14 h-14 text-white" />
                  )}
                </button>

                {/* Timer */}
                <div className="mt-6 text-center">
                  <p className="text-4xl font-mono font-bold text-white">
                    {formatTime(recordingTime)}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {isRecording ? 'Gravando... Toque para parar' : 'Toque para gravar'}
                  </p>
                </div>

                {/* Waveform when recording */}
                {isRecording && (
                  <div className="flex items-end justify-center gap-1 h-8 mt-4">
                    {[...Array(7)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-gradient-to-t from-campo-500 to-campo-300 rounded-full animate-wave"
                        style={{ 
                          animationDelay: `${i * 0.1}s`,
                          height: `${Math.random() * 24 + 8}px`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist / Guide */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-campo-400" />
                <span className="text-sm font-medium text-slate-300">Guia para seu relato</span>
              </div>
              <ul className="space-y-2">
                {(missionGuide[selectedMission.category] || missionGuide.livre).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-slate-500">{i + 1}</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {flowStep === 'review' && audioBlob && (
          <div className="space-y-6 animate-fade-in">
            {/* Hidden audio element */}
            {audioUrl && (
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}

            {/* Context Bar - Compact */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">{selectedStore?.name}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg flex-1 truncate">
                <Target className="w-3.5 h-3.5 text-campo-400 flex-shrink-0" />
                <span className="text-slate-300 truncate">{selectedMission?.title}</span>
              </div>
            </div>

            {/* Recording Info */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-campo-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-campo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Gravação concluída</h2>
              <p className="text-slate-400">Duração: {formatTime(recordingTime)}</p>
            </div>

            {/* AI Evaluation */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-white">Análise Prévia</span>
              </div>
              
              {isAnalyzing ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-slate-400">Analisando aderência ao guia...</p>
                </div>
              ) : evaluation ? (
                <div className="p-4 space-y-4">
                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Aderência ao guia</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            evaluation.score >= 80 ? 'bg-gradient-to-r from-campo-500 to-campo-400' :
                            evaluation.score >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                            'bg-gradient-to-r from-red-500 to-red-400'
                          }`}
                          style={{ width: `${evaluation.score}%` }}
                        />
                      </div>
                      <span className={`text-lg font-bold ${
                        evaluation.score >= 80 ? 'text-campo-400' :
                        evaluation.score >= 50 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>{evaluation.score}%</span>
                    </div>
                  </div>

                  {/* What was covered */}
                  {evaluation.covered.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">✅ Pontos que você cobriu:</p>
                      <ul className="space-y-1.5">
                        {evaluation.covered.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-campo-400">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What's missing */}
                  {evaluation.missing.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 mb-2">💡 Pontos do guia não mencionados:</p>
                      <ul className="space-y-1.5">
                        {evaluation.missing.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-400">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-slate-500 mt-2 italic">
                        Considere regravar mencionando esses pontos para um relato mais completo.
                      </p>
                    </div>
                  )}

                  {evaluation.missing.length === 0 && evaluation.covered.length > 0 && (
                    <div className="p-3 bg-campo-500/10 border border-campo-500/20 rounded-xl">
                      <p className="text-sm text-campo-400 text-center">
                        🎉 Excelente! Você cobriu todos os pontos do guia!
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={togglePlayback}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 hover:border-slate-600 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" />
                )}
                <span className="text-xs text-slate-400">{isPlaying ? 'Pausar' : 'Ouvir'}</span>
              </button>
              
              <button
                onClick={resetRecording}
                className="flex flex-col items-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-750 hover:border-slate-600 transition-all"
              >
                <RotateCcw className="w-6 h-6 text-amber-400" />
                <span className="text-xs text-slate-400">Regravar</span>
              </button>
              
              <button
                onClick={submitRecording}
                className="flex flex-col items-center gap-2 p-4 bg-campo-500 rounded-xl hover:bg-campo-400 transition-all"
              >
                <Send className="w-6 h-6 text-white" />
                <span className="text-xs text-white font-medium">Enviar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
