import { Inter, Fira_Code } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeColorSync } from '@/components/theme-color-sync'
import { THEME_COLOR } from '@/lib/site'
import './globals.css'

const themeColorScript = `(function(){try{var s=localStorage.getItem('theme')||'system';var d=s==='system'?matchMedia('(prefers-color-scheme: dark)').matches:s==='dark';var m=document.createElement('meta');m.setAttribute('name','theme-color');m.setAttribute('content',d?'${THEME_COLOR.dark}':'${THEME_COLOR.light}');document.head.appendChild(m);}catch(e){}})();`

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})
const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeColorScript }} />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColorSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
