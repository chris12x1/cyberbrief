'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Success() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => router.push('/'), 4000)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#060d1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>🎉</div>
      <h1 style={{ color: '#4ade80', fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800 }}>
        Welcome to Pro!
      </h1>
      <p style={{ color: '#3a7bd5', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
        Your subscription is active. Redirecting you back...
      </p>
      <div style={{
        width: '200px', height: '2px', background: '#111c30', borderRadius: '2px', overflow: 'hidden', marginTop: '8px'
      }}>
        <div style={{
          height: '100%', background: '#4ade80', borderRadius: '2px',
          animation: 'progress 4s linear forwards',
        }} />
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=JetBrains+Mono&display=swap');
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  )
}
