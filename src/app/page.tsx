'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mic, BarChart3, Headphones, ChevronRight, Radio, Sparkles, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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
      stats: { label: 'Missões Ativas', value: '3' },
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
      stats: { label: 'Relatos Pendentes', value: '12' },
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
      stats: { label: 'Podcasts Disponíveis', value: '8' },
    },
  ];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-campo-500 to-campo-600 flex items-center justify-center shadow-lg shadow-campo-500/30">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">Podcast Campo</h1>
              <p className="text-sm text-slate-400">Insights do Campo</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full glass">
            <Sparkles className="w-4 h-4 text-campo-400" />
            <span className="text-sm text-slate-300">Powered by AI</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <span className="w-2 h-2 rounded-full bg-campo-400 animate-pulse"></span>
            <span className="text-sm text-slate-300">Plataforma de Trade Marketing Qualitativo</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            A voz do{' '}
            <span className="text-campo-400">Campo</span>
            <br />
            em cada decisão
          </h2>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
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
                card h-full flex flex-col transition-all duration-500
                ${hoveredCard === profile.id ? 'scale-[1.02] bg-white/10' : ''}
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
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                    {profile.subtitle}
                  </p>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {profile.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {profile.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">{profile.stats.label}</p>
                    <p className="text-lg font-bold text-white">{profile.stats.value}</p>
                  </div>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 bg-slate-700
                    ${hoveredCard === profile.id ? 'bg-slate-600 translate-x-1' : ''}
                  `}>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {[
            { icon: Mic, label: 'Relatos', value: '1.2k+' },
            { icon: Users, label: 'Promotores', value: '48' },
            { icon: TrendingUp, label: 'Lojas Cobertas', value: '320' },
            { icon: Sparkles, label: 'Sínteses', value: '24' },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-4 text-center">
              <stat.icon className="w-5 h-5 text-campo-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© 2024 Podcast Campo. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-200 transition-colors">Privacidade</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Termos</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

