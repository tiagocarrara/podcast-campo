import { NextRequest, NextResponse } from 'next/server';
import { addRecording, getRecordings, getRecordingsByMission, updateRecordingStatus, StoredRecording } from '@/lib/store';

// GET - Listar gravações
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const missionId = searchParams.get('missionId');

  try {
    let result;
    if (missionId) {
      result = await getRecordingsByMission(missionId);
    } else {
      result = await getRecordings();
    }

    return NextResponse.json({
      success: true,
      recordings: result,
      total: result.length,
    });
  } catch (error) {
    console.error('Erro ao buscar gravações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar gravações' },
      { status: 500 }
    );
  }
}

// POST - Adicionar nova gravação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const recording: StoredRecording = {
      id: `rec_${Date.now()}`,
      missionId: body.missionId,
      missionTitle: body.missionTitle,
      promotorId: body.promotorId,
      promotorName: body.promotorName,
      storeId: body.storeId,
      storeName: body.storeName,
      storeCity: body.storeCity,
      audioData: body.audioData,
      transcription: body.transcription || '',
      duration: body.duration || 0,
      score: body.score || 0,
      status: 'transcrito',
      createdAt: new Date().toISOString(),
      analysis: body.analysis,
    };

    const saved = await addRecording(recording);

    if (!saved) {
      return NextResponse.json(
        { error: 'Erro ao salvar gravação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recording: saved,
      message: 'Gravação salva com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao salvar gravação:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar gravação' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar gravação (status, transcrição, etc)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, transcription } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Se tiver status, atualizar status
    if (status) {
      await updateRecordingStatus(id, status);
    }

    // Se tiver transcrição, atualizar transcrição
    if (transcription !== undefined) {
      const { updateRecordingTranscription } = await import('@/lib/store');
      await updateRecordingTranscription(id, transcription);
    }

    return NextResponse.json({
      success: true,
      message: 'Gravação atualizada!',
    });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar' },
      { status: 500 }
    );
  }
}
