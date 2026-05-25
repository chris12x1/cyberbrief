import './globals.css'

export const metadata = {
  title: 'CyberBrief — AI Threat Intelligence',
  description: 'AI-curated cybersecurity news with TL;DR summaries',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
