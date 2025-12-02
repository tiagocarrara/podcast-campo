import { NextRequest, NextResponse } from 'next/server';
import { mockLeaderboard } from '@/data/mock';

// API para sistema de gamificação e leaderboard

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const period = searchParams.get('period') || 'all'; // all, week, month

  // Em produção, filtrar por período e calcular pontuação
  let leaderboard = [...mockLeaderboard];

  // Limitar resultados
  leaderboard = leaderboard.slice(0, limit);

  return NextResponse.json({
    success: true,
    leaderboard,
    period,
    updatedAt: new Date().toISOString(),
  });
}

// Endpoint para adicionar pontos a um usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, points, reason } = body;

    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: userId, points, reason' },
        { status: 400 }
      );
    }

    // Tipos de pontuação
    const pointReasons = {
      recording: 50,      // Enviar um relato
      streak_7: 100,      // Streak de 7 dias
      streak_30: 500,     // Streak de 30 dias
      quality: 25,        // Bônus por qualidade
      first_mission: 100, // Primeira missão
      top_contributor: 200, // Top 3 do mês
    };

    // Em produção, atualizar no banco de dados
    const userEntry = mockLeaderboard.find(e => e.userId === userId);
    
    if (!userEntry) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const updatedEntry = {
      ...userEntry,
      points: userEntry.points + points,
    };

    // Verificar se desbloqueou badge
    const badges = [];
    if (updatedEntry.points >= 1000 && userEntry.points < 1000) {
      badges.push({ id: 'milestone_1000', name: 'Mil Pontos', icon: '🏆' });
    }
    if (updatedEntry.recordings >= 50 && userEntry.recordings < 50) {
      badges.push({ id: 'recordings_50', name: '50 Relatos', icon: '🎙️' });
    }

    return NextResponse.json({
      success: true,
      user: updatedEntry,
      pointsAdded: points,
      reason,
      newBadges: badges,
      message: `+${points} pontos adicionados!`,
    });
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pontuação' },
      { status: 500 }
    );
  }
}


