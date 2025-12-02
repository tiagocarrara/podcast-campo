import { NextRequest, NextResponse } from 'next/server';
import { mockMissions } from '@/data/mock';

// API para gerenciamento de missões

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let missions = [...mockMissions];

  // Filtrar por status
  if (status && status !== 'todos') {
    missions = missions.filter(m => m.status === status);
  }

  // Filtrar por categoria
  if (category && category !== 'todas') {
    missions = missions.filter(m => m.category === category);
  }

  return NextResponse.json({
    success: true,
    missions,
    total: missions.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, question, category, startDate, endDate, targetResponses } = body;

    // Validações
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, description, category' },
        { status: 400 }
      );
    }

    const validCategories = ['concorrencia', 'vendas', 'execucao', 'consumidor', 'livre'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Categoria inválida. Use: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Criar nova missão (em produção, salvar no banco)
    const newMission = {
      id: `mission_${Date.now()}`,
      title,
      description,
      question: question || '',
      category,
      status: 'rascunho' as const,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalResponses: 0,
      targetResponses: targetResponses || 30,
      createdBy: 'admin',
    };

    return NextResponse.json({
      success: true,
      mission: newMission,
      message: 'Missão criada com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao criar missão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar missão' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da missão não fornecido' },
        { status: 400 }
      );
    }

    // Em produção, atualizar no banco de dados
    const mission = mockMissions.find(m => m.id === id);
    if (!mission) {
      return NextResponse.json(
        { error: 'Missão não encontrada' },
        { status: 404 }
      );
    }

    const updatedMission = { ...mission, ...updates };

    return NextResponse.json({
      success: true,
      mission: updatedMission,
      message: 'Missão atualizada com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao atualizar missão:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar missão' },
      { status: 500 }
    );
  }
}


