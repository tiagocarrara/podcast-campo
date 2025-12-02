import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Podcast Campo | Insights do Campo',
  description: 'Plataforma de insights qualitativos para promotores de campo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen mesh-gradient grid-pattern noise-overlay">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}


