import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import {
  Almendra,
  Cinzel,
  Cormorant_Garamond,
  EB_Garamond,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  UnifrakturMaguntia,
} from 'next/font/google'
import './globals.css'

const cardBanner = Almendra({ subsets: ['latin'], weight: '700', variable: '--font-card-banner' })
const cardTitle = Cinzel({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-card-title' })
const cardBody = EB_Garamond({ subsets: ['latin'], weight: ['400', '500'], style: ['normal', 'italic'], variable: '--font-card-body' })

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
})

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
})

const blackletter = UnifrakturMaguntia({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-unifraktur',
})

export const metadata: Metadata = {
  title: 'DEADLY VOTE — Record System · DEVO',
  description: 'Sistema oficial de registro de participantes e jogos do DEADLY VOTE. Vigie o seu pulso e jogue para ganhar horas.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'DEVO',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#090b0f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${blackletter.variable} ${sans.variable} ${mono.variable} ${cardBanner.variable} ${cardTitle.variable} ${cardBody.variable}`}>
      <head>
        {/* O navegador dispara beforeinstallprompt antes do React hidratar; guardamos o evento para o botão de instalar. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__devoInstallEvent=e;window.dispatchEvent(new Event('devo:installable'))});",
          }}
        />
      </head>
      <body className="font-serif antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
