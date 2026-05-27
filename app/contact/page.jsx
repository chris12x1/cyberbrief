'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const email = 'cyberbrief@proton.me'

  function copyEmail() {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', padding: '40px 20px' }}>
      <div style={{
        maxWidth: '600px', margin: '0 auto',
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
        }}>Contact</h1>

        <p style={{
          color: '#8bafd4', fontSize: '14px',
          lineHeight: 1.7, marginBottom: '30px',
        }}>
          Found a bug? Have feedback? Want to suggest a feature? Drop a line.
          Replies usually within 24 hours.
        </p>

        <div style={{
          background: '#0a1120',
          border: '1px solid #1e3a5f',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px',
        }}>
          <div style={{
            color: '#3a7bd5', fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: '10px',
          }}>📧 Email</div>
          <div style={{
            color: '#c8d8f0', fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: '14px',
          }}>{email}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a href={`mailto:${email}`} style={{
              background: '#3a7bd5', border: 'none', color: '#fff',
              borderRadius: '6px', padding: '8px 16px', fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: 'none', display: 'inline-block', fontWeight: 700,
            }}>Open Mail</a>
            <button onClick={copyEmail} style={{
              background: 'transparent', border: '1px solid #1e3a5f',
              color: '#3a7bd5', borderRadius: '6px', padding: '8px 16px',
              fontSize: '12px', fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}>{copied ? '✓ Copied!' : 'Copy Email'}</button>
          </div>
        </div>

        <div style={{
          background: '#0a1120',
          border: '1px solid #111c30',
          borderRadius: '8px',
          padding: '20px',
          color: '#5a7a9a', fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.7,
        }}>
          <div style={{ color: '#7ab3f0', marginBottom: '8px', fontWeight: 700 }}>What to include:</div>
          • Bug reports: what happened + steps to reproduce<br />
          • Feature requests: what problem you're trying to solve<br />
          • Billing issues: include your account email<br />
          • Security disclosures: use subject line "SECURITY"
        </div>
      </div>
    </div>
  )
}
