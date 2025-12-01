'use client';

import { Target, Clock, Users, ChevronRight, MessageSquare } from 'lucide-react';
import { Mission } from '@/types';

interface MissionCardProps {
  mission: Mission;
  isSelected?: boolean;
  onClick?: () => void;
}

const categoryColors = {
  concorrencia: { bg: 'bg-accent-coral/20', text: 'text-accent-coral', border: 'border-accent-coral/30' },
  vendas: { bg: 'bg-campo-500/20', text: 'text-campo-400', border: 'border-campo-500/30' },
  execucao: { bg: 'bg-accent-violet/20', text: 'text-accent-violet', border: 'border-accent-violet/30' },
  consumidor: { bg: 'bg-accent-cyan/20', text: 'text-accent-cyan', border: 'border-accent-cyan/30' },
  livre: { bg: 'bg-accent-amber/20', text: 'text-accent-amber', border: 'border-accent-amber/30' },
};

const categoryLabels = {
  concorrencia: 'Concorrência',
  vendas: 'Vendas',
  execucao: 'Execução',
  consumidor: 'Consumidor',
  livre: 'Relato Livre',
};

export function MissionCard({ mission, isSelected, onClick }: MissionCardProps) {
  const colors = categoryColors[mission.category];
  const progress = (mission.totalResponses / mission.targetResponses) * 100;
  
  const daysRemaining = Math.ceil(
    (new Date(mission.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl p-5 bg-midnight-800/90 border border-midnight-700 transition-all duration-300
        ${isSelected 
          ? 'ring-2 ring-campo-500 bg-midnight-700' 
          : 'hover:bg-midnight-700/80 hover:border-midnight-600'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
          {categoryLabels[mission.category]}
        </span>
        {mission.status === 'ativa' && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {daysRemaining > 0 ? `${daysRemaining} dias` : 'Último dia'}
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {mission.title}
      </h3>
      
      <p className="text-sm text-slate-300 mb-4 line-clamp-2">
        {mission.description}
      </p>

      {mission.question && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-midnight-900/80 border border-midnight-700 mb-4">
          <MessageSquare className="w-4 h-4 text-campo-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-200 line-clamp-2">
            {mission.question}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Progresso</span>
          <span className="text-white font-medium">
            {mission.totalResponses}/{mission.targetResponses} relatos
          </span>
        </div>
        <div className="h-2 bg-midnight-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-campo-500 to-campo-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-midnight-700">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Users className="w-4 h-4" />
          <span>{mission.totalResponses} participações</span>
        </div>
        <ChevronRight className={`w-5 h-5 transition-all ${isSelected ? 'text-campo-400 translate-x-1' : 'text-slate-500'}`} />
      </div>
    </button>
  );
}

