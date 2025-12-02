'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Send, Trash2, RotateCcw } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // Verificar se a API existe
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta gravação de áudio. Tente usar Chrome ou Firefox.');
        return;
      }

      // Verificar permissão atual
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        console.log('Status da permissão do microfone:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          alert('Permissão do microfone foi negada. Por favor, vá nas configurações do navegador e permita o acesso ao microfone para este site.');
          return;
        }
      } catch (permError) {
        // Alguns navegadores não suportam permissions.query para microfone
        console.log('Não foi possível verificar permissão:', permError);
      }

      console.log('Solicitando acesso ao microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Microfone acessado com sucesso!');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error: unknown) {
      console.error('Erro ao acessar microfone:', error);
      
      const err = error as Error & { name?: string };
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Permissão negada. Clique no ícone de cadeado na barra de endereço e permita o acesso ao microfone.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert('O microfone está sendo usado por outro aplicativo. Feche outros programas e tente novamente.');
      } else if (err.name === 'OverconstrainedError') {
        alert('Não foi possível usar o microfone com as configurações solicitadas.');
      } else {
        alert(`Erro ao acessar microfone: ${err.message || 'Erro desconhecido'}. Verifique as permissões do navegador.`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
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
      updatePlaybackProgress();
    }
  };

  const updatePlaybackProgress = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlaybackProgress(progress);
      
      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updatePlaybackProgress);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime);
      resetRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Main Recording Button */}
      <div className="relative mb-8">
        {/* Pulse rings when recording */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-accent-coral/20 animate-ping" />
            <div className="absolute -inset-4 rounded-full bg-accent-coral/10 animate-pulse" />
            <div className="absolute -inset-8 rounded-full bg-accent-coral/5 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        
        {/* Main button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || !!audioBlob}
          className={`
            relative w-32 h-32 rounded-full flex items-center justify-center
            transition-all duration-500 transform
            ${isRecording 
              ? 'bg-gradient-to-br from-accent-coral to-red-600 scale-110 shadow-2xl shadow-accent-coral/50' 
              : audioBlob
                ? 'bg-gradient-to-br from-campo-500 to-campo-600 shadow-xl shadow-campo-500/30'
                : 'bg-gradient-to-br from-campo-500 to-campo-600 hover:scale-105 shadow-xl shadow-campo-500/30 hover:shadow-campo-500/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isRecording ? (
            <Square className="w-12 h-12 text-white" fill="white" />
          ) : audioBlob ? (
            <Play className="w-12 h-12 text-white ml-2" fill="white" />
          ) : (
            <Mic className="w-12 h-12 text-white" />
          )}
        </button>
      </div>

      {/* Recording/Playback Time */}
      <div className="text-center mb-6">
        <p className="text-4xl font-mono font-bold text-white mb-2">
          {formatTime(recordingTime)}
        </p>
        <p className="text-sm text-white/50">
          {isRecording 
            ? 'Gravando...' 
            : audioBlob 
              ? 'Gravação concluída' 
              : 'Toque para gravar'
          }
        </p>
      </div>

      {/* Waveform Visualization */}
      {isRecording && (
        <div className="flex items-end justify-center gap-1 h-12 mb-8">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="wave-bar" />
          ))}
        </div>
      )}

      {/* Playback Progress Bar */}
      {audioBlob && !isRecording && (
        <div className="w-full max-w-xs mb-6">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-campo-500 to-campo-400 rounded-full transition-all duration-100"
              style={{ width: `${playbackProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {audioBlob && !isRecording && (
        <div className="flex items-center gap-4 animate-fade-in">
          <button
            onClick={resetRecording}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Regravar</span>
          </button>
          
          <button
            onClick={togglePlayback}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Ouvir</span>
              </>
            )}
          </button>
          
          <button
            onClick={submitRecording}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-campo-500 to-campo-600 text-white font-medium hover:from-campo-400 hover:to-campo-500 shadow-lg shadow-campo-500/30 hover:shadow-campo-500/50 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !audioBlob && (
        <div className="text-center text-white/40 text-sm mt-4 max-w-xs">
          <p>Fale sobre sua experiência na loja de forma natural e detalhada.</p>
        </div>
      )}
    </div>
  );
}

