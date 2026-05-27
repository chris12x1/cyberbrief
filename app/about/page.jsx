'use client'
import Link from 'next/link'

export default function About() {
  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', padding: '40px 20px' }}>
      <div style={{
        maxWidth: '700px', margin: '0 auto',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <Link href="/" style={{
          color: '#3a7bd5', fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          textDecoration: 'none',
          display: 'inline-block', marginBottom: '30px',
        }}>← Back to feed</Link>

        <h1 style={{
          color: '#c8d8f0', fontSize: '36px',
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          marginBottom: '20px', letterSpacing: '-0.02em',
        }}>
          About CYBER<span style={{ color: '#3a7bd5' }}>BRIEF</span>
        </h1>

        <div style={{ color: '#8bafd4', fontSize: '14px', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '20px' }}>
            CyberBrief is an AI-powered cybersecurity news dashboard that surfaces
            the most important threats from the last 48 hours — summarized,
            severity-rated, and ready to scan in under a minute.
          </p>

          <h2 style={{
            color: '#c8d8f0', fontSize: '20px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            marginTop: '30px', marginBottom: '12px',
          }}>Why it exists</h2>
          <p style={{ marginBottom: '20px' }}>
            Security professionals waste 30+ minutes a day catching up on threat
            intelligence across dozens of feeds. CyberBrief uses AI to do that
            scan in seconds — delivering just the signal, no noise.
          </p>

          <h2 style={{
            color: '#c8d8f0', fontSize: '20px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            marginTop: '30px', marginBottom: '12px',
          }}>How it works</h2>
          <p style={{ marginBottom: '20px' }}>
            Powered by Google Gemini 2.5 Flash with live search grounding,
            CyberBrief searches the open web for the most urgent cybersecurity
            stories every few hours, then summarizes them into TL;DRs you can
            actually read.
          </p>

          <h2 style={{
            color: '#c8d8f0', fontSize: '20px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            marginTop: '30px', marginBottom: '12px',
          }}>Pricing</h2>
          <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#c8d8f0' }}>Free:</strong> 1 refresh per week</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#4ade80' }}>Pro ($7/mo):</strong> 1 refresh every 4 hours, weekly email digest (coming soon), custom categories (coming soon)</li>
          </ul>

          <h2 style={{
            color: '#c8d8f0', fontSize: '20px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            marginTop: '30px', marginBottom: '12px',
          }}>Important disclaimer</h2>
          <p style={{ marginBottom: '20px', color: '#ffaa44' }}>
            CyberBrief uses AI to summarize publicly available news. While we
            use grounded search to minimize hallucination, always verify
            critical information against primary sources before taking action.
            Not affiliated with any vendor or news organization.
          </p>

          <h2 style={{
            color: '#c8d8f0', fontSize: '20px',
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
            marginTop: '30px', marginBottom: '12px',
          }}>The builder</h2>
          <p style={{ marginBottom: '20px' }}>
            Built solo by Christopher Diaz. Cybersecurity enthusiast, builder,
            and engineer. Source code is open-source under MIT license on{' '}
            <a href="https://github.com/chris12x1/cyberbrief" target="_blank" rel="noopener noreferrer" style={{ color: '#3a7bd5' }}>GitHub</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
