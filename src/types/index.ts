export interface User {
  id: string;
  name: string;
  email: string;
  role: 'promotor' | 'admin' | 'cliente';
  avatar?: string;
  points?: number;
  level?: number;
  badges?: Badge[];
  totalRecordings?: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  question?: string;
  category: 'concorrencia' | 'vendas' | 'execucao' | 'consumidor' | 'livre';
  status: 'ativa' | 'encerrada' | 'rascunho';
  startDate: string;
  endDate: string;
  totalResponses: number;
  targetResponses: number;
  createdBy: string;
}

export interface Recording {
  id: string;
  missionId: string;
  promotorId: string;
  promotorName: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  audioUrl: string;
  duration: number; // in seconds
  transcription?: string;
  status: 'pendente' | 'transcrito' | 'aprovado' | 'rejeitado';
  createdAt: string;
  points: number;
}

export interface Synthesis {
  id: string;
  missionId: string;
  missionTitle: string;
  summary: string;
  audioUrl?: string;
  infographicUrl?: string;
  totalRecordings: number;
  keyInsights: string[];
  status: 'gerando' | 'revisao' | 'publicado';
  createdAt: string;
  publishedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: string;
}

export interface Store {
  id: string;
  name: string;
  city: string;
  state: string;
  network: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  points: number;
  recordings: number;
  streak: number;
}


