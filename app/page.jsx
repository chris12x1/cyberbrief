'use client'
import { useState, useEffect } from 'react'
import NewsCard from './components/NewsCard'

const CATEGORIES = ['All', 'Vulnerabilities', 'Data Breaches', 'Malware', 'Nation-State', 'Zero-Day']

function LoadingCard({ index }) {
  return (
    <div style={{
      background: '#0a1120', border: '1px solid #111c30', borderLeft: '3px solid #1a2a3a',
      borderRadius: '8px', padding: '18px 20px',
      animation: 'pulse 1.5s ease-in-out infinite',
      animationDelay: `${index * 0.15}s`,
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        <div style={{ width: '60px', height: '18px', background: '#111c30', borderRadius: '4px' }} />
        <div style={{ width: '80px', height: '18px', background: '#0d1628', borderRadius: '4px' }} />
      </div>
      <div style={{ width: '90%', height: '14px', background: '#111c30', borderRadius: '4px', marginBottom: '6px' }} />
      <div style={{ width: '70%', height: '14px', background: '#0d1628', borderRadius: '4px' }} />
    </div>
  )
}

export default function Home() {
  const [articles, setArticles]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [activeCategory, setActive]     = useState('All')
  const [lastFetched, setLastFetched]   = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError]               = useState(null)

  async function fetchNews() {
    setLoading(true)
    setError(null)
    setArticles([])
    try {
      const res  = await fetch('/api/news', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setArticles(data.articles)
      setLastFetched(new Date())
      // 30s cooldown after each fetch to avoid rate limits
      setCooldown(30)
      const timer = setInterval(() => {
        setCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const filtered = activeCategory === 'All'
    ? articles
    : articles.filter(a => a.category === activeCategory)

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? articles.length : articles.filter(a => a.category === cat).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(#0d1628 1px, transparent 1px), linear-gradient(90deg, #0d1628 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.4,
      }} />
      {/* Scanline */}
      <div style={{
        position: 'fixed', left: 0, right: 0, height: '80px', zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(transparent, rgba(58,123,213,0.03), transparent)',
        animation: 'scanline 8s linear infinite',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3a7bd5', boxShadow: '0 0 8px #3a7bd5', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live Intelligence Feed</span>
          </div>
          <h1 style={{ color: '#c8d8f0', fontSize: 'clamp(28px,5vw,42px)', fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
            CYBER<span style={{ color: '#3a7bd5' }}>BRIEF</span>
          </h1>
          <p style={{ color: '#2a4060', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>
            AI-curated threat intelligence · Updated {lastFetched ? lastFetched.toLocaleTimeString() : '—'}
          </p>
        </div>

        {/* Category filters + refresh */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActive(cat)} style={{
              background: activeCategory === cat ? '#1a2e50' : 'transparent',
              border: `1px solid ${activeCategory === cat ? '#3a7bd5' : '#111c30'}`,
              color: activeCategory === cat ? '#7ab3f0' : '#2a4060',
              borderRadius: '6px', padding: '5px 12px', fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {cat}
              {counts[cat] > 0 && (
                <span style={{ background: activeCategory === cat ? '#3a7bd5' : '#111c30', color: activeCategory === cat ? '#fff' : '#2a4060', borderRadius: '10px', padding: '0 5px', fontSize: '9px', fontWeight: 700 }}>
                  {counts[cat]}
                </span>
              )}
            </button>
          ))}
          <button onClick={fetchNews} disabled={loading || cooldown > 0} style={{
            marginLeft: 'auto', background: (loading || cooldown > 0) ? '#0a1120' : '#0f1e35',
            border: '1px solid #1e3a5f', color: (loading || cooldown > 0) ? '#1a3050' : '#3a7bd5',
            borderRadius: '6px', padding: '5px 14px', fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace", cursor: (loading || cooldown > 0) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Fetching...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ color: '#ff6060', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>⚠ Error</div>
            <div style={{ color: '#804040', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{error}</div>
          </div>
        )}

        {/* Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <LoadingCard key={i} index={i} />)
            : filtered.length === 0 && !error
              ? <div style={{ color: '#2a4060', textAlign: 'center', padding: '40px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>No articles in this category.</div>
              : filtered.map((article, i) => <NewsCard key={i} article={article} index={i} />)
          }
        </div>

        {!loading && articles.length > 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center', color: '#1a2a3a', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
            CYBERBRIEF · POWERED BY CLAUDE AI · {articles.length} ARTICLES LOADED
          </div>
        )}
      </div>
    </div>
  )
}
