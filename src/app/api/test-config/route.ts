import { NextRequest, NextResponse } from 'next/server';

// GET - Testar configurações das APIs
export async function GET(request: NextRequest) {
  const config = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ NÃO CONFIGURADA',
      urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA',
      apiKeyPreview: process.env.OPENAI_API_KEY 
        ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` 
        : 'não definida',
    },
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'Sim' : 'Não',
  };

  // Testar conexão com OpenAI se a chave estiver configurada
  let openaiTest = { status: 'não testado', error: null as string | null };
  
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      
      if (response.ok) {
        openaiTest.status = '✅ Conexão OK';
      } else {
        const error = await response.json();
        openaiTest.status = '❌ Erro na conexão';
        openaiTest.error = error.error?.message || 'Erro desconhecido';
      }
    } catch (e) {
      openaiTest.status = '❌ Erro ao conectar';
      openaiTest.error = (e as Error).message;
    }
  }

  return NextResponse.json({
    success: true,
    config,
    openaiTest,
    message: 'Verifique se todas as variáveis estão configuradas corretamente.',
    instructions: {
      local: 'Crie um arquivo .env.local com as variáveis',
      vercel: 'Vá em Settings > Environment Variables no dashboard da Vercel',
    },
  });
}

