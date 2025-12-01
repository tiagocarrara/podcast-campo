# 🎙️ Podcast Campo

**Plataforma de insights qualitativos para Trade Marketing**

Transforme a voz dos seus promotores de campo em inteligência acionável através de áudio, IA e sínteses poderosas.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)

---

## 📋 Visão Geral

O Podcast Campo é uma plataforma que permite coletar insights qualitativos dos promotores de campo através de gravações de áudio. Esses relatos são transcritos, analisados por IA e consolidados em sínteses (podcasts) de fácil consumo.

### Fluxo da Plataforma

```
Promotor grava relato → Áudio é transcrito → IA analisa múltiplos relatos
    → Síntese é gerada → Podcast é criado → Cliente consome insights
```

---

## 🚀 Funcionalidades

### 👤 Área do Promotor
- ✅ Gravação de áudio intuitiva
- ✅ Sistema de missões com perguntas direcionadas
- ✅ Seleção de loja atual
- ✅ Gamificação com pontos e badges
- ✅ Ranking/Leaderboard
- ✅ Histórico de contribuições
- ✅ Streak de dias consecutivos

### 🛠️ Dashboard Admin
- ✅ Gestão de missões (criar, editar, encerrar)
- ✅ Visualização de gravações
- ✅ Player de áudio integrado
- ✅ Revisão de transcrições
- ✅ Aprovação/rejeição de relatos
- ✅ Geração de sínteses com IA
- ✅ Métricas e estatísticas

### 📱 Área do Cliente
- ✅ Biblioteca de podcasts/sínteses
- ✅ Player de áudio completo
- ✅ Download de infográficos
- ✅ Sugestão de novos temas
- ✅ Votação em sugestões
- ✅ Compartilhamento de conteúdo

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Next.js 14** | Framework React com App Router |
| **TypeScript** | Tipagem estática |
| **Tailwind CSS** | Estilização |
| **Framer Motion** | Animações |
| **Lucide React** | Ícones |
| **Web Audio API** | Gravação de áudio |

### Integrações Sugeridas

| Serviço | Função |
|---------|--------|
| **OpenAI Whisper** | Transcrição de áudio |
| **OpenAI GPT-4** | Análise e síntese de textos |
| **ElevenLabs** | Geração de áudio (TTS) |
| **Google NotebookLM** | Repositório de conhecimento |
| **Supabase/Firebase** | Banco de dados e auth |
| **AWS S3/Cloudinary** | Storage de arquivos |

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/podcast-campo.git
cd podcast-campo
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas chaves de API
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:3000
```

---

## 📁 Estrutura do Projeto

```
podcast-campo/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Página inicial
│   │   ├── layout.tsx         # Layout principal
│   │   ├── globals.css        # Estilos globais
│   │   ├── promotor/
│   │   │   └── page.tsx       # Área do promotor
│   │   ├── admin/
│   │   │   └── page.tsx       # Dashboard admin
│   │   ├── cliente/
│   │   │   └── page.tsx       # Área do cliente
│   │   └── api/
│   │       ├── transcribe/    # API de transcrição
│   │       ├── synthesize/    # API de síntese
│   │       ├── missions/      # API de missões
│   │       └── leaderboard/   # API de gamificação
│   ├── components/
│   │   ├── AudioRecorder.tsx  # Componente de gravação
│   │   └── MissionCard.tsx    # Card de missão
│   ├── data/
│   │   └── mock.ts            # Dados de exemplo
│   └── types/
│       └── index.ts           # Definições de tipos
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🔌 APIs

### POST /api/transcribe
Envia áudio para transcrição.

```typescript
// Request (FormData)
{
  audio: File,
  missionId: string,
  storeId: string,
  promotorId: string
}

// Response
{
  success: true,
  recording: {
    id: string,
    transcription: string,
    status: 'pendente' | 'transcrito',
    ...
  }
}
```

### POST /api/synthesize
Gera síntese a partir de múltiplas transcrições.

```typescript
// Request
{
  missionId: string,
  transcriptions: string[]
}

// Response
{
  success: true,
  synthesis: {
    id: string,
    summary: string,
    keyInsights: string[],
    status: 'gerando' | 'revisao' | 'publicado'
  }
}
```

### GET /api/missions
Lista missões com filtros opcionais.

```typescript
// Query params
?status=ativa&category=vendas

// Response
{
  success: true,
  missions: Mission[],
  total: number
}
```

### GET /api/leaderboard
Retorna ranking de promotores.

```typescript
// Query params
?limit=10&period=week

// Response
{
  success: true,
  leaderboard: LeaderboardEntry[]
}
```

---

## 🎮 Sistema de Gamificação

### Pontuação

| Ação | Pontos |
|------|--------|
| Enviar relato | +50 |
| Streak 7 dias | +100 |
| Streak 30 dias | +500 |
| Bônus qualidade | +25 |
| Primeira missão | +100 |
| Top 3 do mês | +200 |

### Badges

- 🎙️ **Primeiro Relato** - Enviou o primeiro relato
- 🔥 **Streak de 7 dias** - 7 dias consecutivos relatando
- ⭐ **Top Contribuidor** - Entre os 10 maiores contribuidores
- 🏆 **Mil Pontos** - Alcançou 1000 pontos
- 📢 **50 Relatos** - Enviou 50 relatos

---

## 🎨 Customização

### Cores
As cores principais podem ser ajustadas em `tailwind.config.js`:

```javascript
colors: {
  campo: { ... },    // Verde principal
  midnight: { ... }, // Tons escuros
  accent: {
    coral: '#ff6b6b',
    amber: '#fbbf24',
    cyan: '#22d3ee',
    violet: '#a78bfa',
  }
}
```

### Fontes
O projeto usa as fontes:
- **Clash Display** - Títulos
- **Satoshi** - Corpo de texto

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras opções
- Netlify
- Railway
- AWS Amplify
- Docker

---

## 📄 Licença

Este projeto é privado e de uso exclusivo.

---

## 🤝 Contato

Desenvolvido para **[Nome da Agência]**

Para suporte ou dúvidas, entre em contato através de [email@exemplo.com]

