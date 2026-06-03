import { ClerkProvider } from '@clerk/nextjs'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata = {
  title: 'CyberBrief — AI Threat Intelligence',
  description: 'AI-curated cybersecurity news with TL;DR summaries',
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  )
}
