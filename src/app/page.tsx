'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mic, BarChart3, Headphones, ChevronRight, Radio, Sparkles, Users, TrendingUp, Loader2 } from 'lucide-react';
import { getStats } from '@/lib/store';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRecordings: 0,
    pendingTranscriptions: 0,
    publishedEpisodes: 0,
    totalEpisodes: 0,
    approvedRecordings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const profiles = [
    {
      id: 'promotor',
      title: 'Promotor',
      subtitle: 'Área do Campo',
      description: 'Grave seus relatos, acompanhe suas missões e suba no ranking.',
      icon: Mic,
      href: '/promotor',
      gradient: 'from-campo-500 to-campo-600',
      shadowColor: 'shadow-campo-500/30',
      borderGlow: 'hover:shadow-campo-500/20',
      stats: { label: 'Relatos Enviados', value: loading ? '...' : String(stats.totalRecordings) },
    },
    {
      id: 'admin',
      title: 'Administrador',
      subtitle: 'Gestão & Análise',
      description: 'Gerencie missões, revise transcrições e gere sínteses.',
      icon: BarChart3,
      href: '/admin',
      gradient: 'from-accent-violet to-purple-600',
      shadowColor: 'shadow-accent-violet/30',
      borderGlow: 'hover:shadow-accent-violet/20',
      stats: { label: 'Pendentes', value: loading ? '...' : String(stats.pendingTranscriptions) },
    },
    {
      id: 'cliente',
      title: 'Cliente',
      subtitle: 'Central de Insights',
      description: 'Ouça os podcasts, sugira temas e compartilhe com sua equipe.',
      icon: Headphones,
      href: '/cliente',
      gradient: 'from-accent-cyan to-blue-600',
      shadowColor: 'shadow-accent-cyan/30',
      borderGlow: 'hover:shadow-accent-cyan/20',
      stats: { label: 'Podcasts', value: loading ? '...' : String(stats.publishedEpisodes) },
    },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-campo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-violet/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-accent-cyan/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center shadow-lg shadow-campo-500/30">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Podcast Campo</h1>
              <p className="text-sm text-campo-300">Insights do Campo</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-campo-400" />
            <span className="text-sm text-white/80">Powered by AI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-campo-500/10 border border-campo-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-campo-400 animate-pulse"></span>
            <span className="text-sm text-campo-200 font-medium">Plataforma de Trade Marketing Qualitativo</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            A voz do{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-campo-400 to-campo-300">Campo</span>
            <br />
            em cada decisão
          </h2>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Transforme os insights dos seus promotores em inteligência acionável 
            através de áudio, IA e sínteses poderosas.
          </p>
        </div>

        {/* Profile Cards */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {profiles.map((profile, index) => (
            <Link
              key={profile.id}
              href={profile.href}
              className="group relative"
              onMouseEnter={() => setHoveredCard(profile.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`
                h-full flex flex-col p-6 rounded-3xl transition-all duration-500
                bg-white/5 backdrop-blur-sm border border-white/10
                hover:bg-white/10 hover:border-white/20
                ${hoveredCard === profile.id ? 'scale-[1.02] shadow-2xl ' + profile.borderGlow : ''}
                animate-slide-up
              `}>
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-2xl bg-gradient-to-br ${profile.gradient} 
                  flex items-center justify-center mb-6 transition-all duration-500
                  ${hoveredCard === profile.id ? 'scale-110 shadow-lg ' + profile.shadowColor : ''}
                `}>
                  <profile.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1 font-medium">
                    {profile.subtitle}
                  </p>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {profile.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {profile.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-white/40">{profile.stats.label}</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white/50" />
                      ) : (
                        profile.stats.value
                      )}
                    </p>
                  </div>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 bg-white/10
                    ${hoveredCard === profile.id ? 'bg-white/20 translate-x-1' : ''}
                  `}>
                    <ChevronRight className="w-5 h-5 text-white/70" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {[
            { icon: Mic, label: 'Relatos', value: loading ? '...' : String(stats.totalRecordings) },
            { icon: Users, label: 'Aprovados', value: loading ? '...' : String(stats.approvedRecordings) },
            { icon: TrendingUp, label: 'Episódios', value: loading ? '...' : String(stats.totalEpisodes) },
            { icon: Sparkles, label: 'Publicados', value: loading ? '...' : String(stats.publishedEpisodes) },
          ].map((stat, index) => (
            <div key={index} className="rounded-2xl p-4 text-center bg-white/5 border border-white/10 backdrop-blur-sm">
              <stat.icon className="w-5 h-5 text-campo-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/50" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© 2024 Podcast Campo. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white/70 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white/70 transition-colors">Termos</a>
            <a href="#" className="hover:text-white/70 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
