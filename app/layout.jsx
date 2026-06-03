import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
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
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
