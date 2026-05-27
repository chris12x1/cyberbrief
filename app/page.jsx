'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
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

function AuthBar({ isSignedIn, isPro, onUpgrade, upgrading }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#060d1aee', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #111c30',
      padding: '10px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ color: '#3a7bd5', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
        🔐 CYBERBRIEF
      </span>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button style={{
                background: 'transparent', border: '1px solid #1e3a5f',
                color: '#3a7bd5', borderRadius: '6px', padding: '5px 14px',
                fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              }}>Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button style={{
                background: '#1a2e50', border: '1px solid #3a7bd5',
                color: '#7ab3f0', borderRadius: '6px', padding: '5px 14px',
                fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
              }}>Sign Up Free</button>
            </SignUpButton>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!isPro && (
              <button onClick={onUpgrade} disabled={upgrading} style={{
                background: upgrading ? '#0a1120' : '#3a7bd5',
                border: 'none', color: '#fff', borderRadius: '6px', padding: '5px 14px',
                fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                cursor: upgrading ? 'not-allowed' : 'pointer', fontWeight: 700,
              }}>
                {upgrading ? 'Redirecting...' : '⚡ Get Pro — $7/mo'}
              </button>
            )}
            {isPro && (
              <span style={{
                color: '#4ade80', fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                border: '1px solid #4ade8044', borderRadius: '6px',
                padding: '4px 10px', background: '#4ade8011',
              }}>● PRO</span>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </div>
  )
}

function HeroSection({ onSignUp, onFetch, loading }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      border: '1px solid #111c30', borderRadius: '12px',
      background: 'linear-gradient(135deg, #0a1120, #0f1a2e)',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
      <h2 style={{
        color: '#c8d8f0', fontSize: 'clamp(20px,3vw,28px)',
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        marginBottom: '10px', letterSpacing: '-0.01em',
      }}>
        AI-curated cybersecurity intelligence
      </h2>
      <p style={{
        color: '#5a7a9a', fontSize: '13px',
        fontFamily: "'DM Sans', sans-serif",
        marginBottom: '24px', maxWidth: '480px', margin: '0 auto 24px',
        lineHeight: 1.6,
      }}>
        The 8 most important cybersecurity stories from the last 48 hours — summarized, severity-rated, and verified against primary sources.
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={onFetch} disabled={loading} style={{
          background: loading ? '#1a2e50' : '#3a7bd5', border: 'none', color: '#fff',
          borderRadius: '6px', padding: '12px 24px', fontSize: '13px',
          fontFamily: "'JetBrains Mono', monospace", cursor: loading ? 'wait' : 'pointer', fontWeight: 700,
        }}>
          {loading ? '⏳ Fetching...' : '⚡ Load Latest Threats'}
        </button>
        <SignUpButton mode="modal">
          <button style={{
            background: 'transparent', border: '1px solid #1e3a5f',
            color: '#3a7bd5', borderRadius: '6px', padding: '12px 24px',
            fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
          }}>Sign Up Free</button>
        </SignUpButton>
      </div>
      <p style={{
        color: '#2a4060', fontSize: '10px', marginTop: '20px',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Free: 1 refresh/week · Pro $7/mo: 1 refresh every 4 hours
      </p>
    </div>
  )
}

function UpgradeBanner({ onUpgrade, upgrading }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f1e35, #1a2e50)',
      border: '1px solid #3a7bd5', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
    }}>
      <div>
        <div style={{ color: '#7ab3f0', fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '4px' }}>⚡ Upgrade to Pro</div>
        <div style={{ color: '#3a5a80', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>1 refresh every 4 hours · Weekly email digest (coming soon) · Custom categories (coming soon)</div>
      </div>
      <button onClick={onUpgrade} disabled={upgrading} style={{
        background: upgrading ? '#1a2e50' : '#3a7bd5', border: 'none', color: '#fff',
        borderRadius: '6px', padding: '8px 18px', fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace", cursor: upgrading ? 'not-allowed' : 'pointer', fontWeight: 700,
      }}>
        {upgrading ? 'Redirecting...' : 'Get Pro — $7/mo'}
      </button>
    </div>
  )
}

function Footer() {
  return (
    <div style={{
      marginTop: '60px', paddingTop: '30px',
      borderTop: '1px solid #111c30',
      textAlign: 'center',
    }}>
      <div style={{
        color: '#2a4060', fontSize: '11px',
        fontFamily: "'JetBrains Mono', monospace",
        marginBottom: '12px', lineHeight: 1.7,
      }}>
        ⚠ CyberBrief uses AI to summarize cybersecurity news.<br />
        Always verify critical information against primary sources before taking action.<br />
        Not affiliated with any vendor or news organization.
      </div>
      <div style={{
        color: '#1a2a3a', fontSize: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.05em',
      }}>
        © {new Date().getFullYear()} CYBERBRIEF · POWERED BY GEMINI AI
      </div>
    </div>
  )
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const [isPro, setIsPro] = useState(false)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActive] = useState('All')
  const [lastFetched, setLastFetched] = useState(null)
  const [error, setError] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false)

  // Restore cached articles from previous visit
  useEffect(() => {
    const cached = localStorage.getItem('cyberbrief_cached_news')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.articles && parsed.timestamp) {
          setArticles(parsed.articles)
          setLastFetched(new Date(parsed.timestamp))
          setHasFetchedOnce(true)
        }
      } catch (e) { /* ignore */ }
    }
  }, [])

  // Check Pro status when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/user-status')
        .then(r => r.json())
        .then(data => setIsPro(data.isPro || false))
        .catch(() => setIsPro(false))
    } else {
      setIsPro(false)
    }
  }, [isSignedIn])

  async function handleUpgrade() {
    if (!isSignedIn) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error)
    } catch (err) {
      alert('Could not start checkout: ' + err.message)
      setUpgrading(false)
    }
  }

  async function fetchNews() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/news', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setArticles(data.articles)
      const now = new Date()
      setLastFetched(now)
      setHasFetchedOnce(true)
      // Cache for future visits
      localStorage.setItem('cyberbrief_cached_news', JSON.stringify({
        articles: data.articles,
        timestamp: now.toISOString(),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory)
  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? articles.length : articles.filter(a => a.category === cat).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#0d1628 1px, transparent 1px), linear-gradient(90deg, #0d1628 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
      <div style={{ position: 'fixed', left: 0, right: 0, height: '80px', zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(transparent, rgba(58,123,213,0.03), transparent)', animation: 'scanline 8s linear infinite' }} />

      <AuthBar isSignedIn={isSignedIn} isPro={isPro} onUpgrade={handleUpgrade} upgrading={upgrading} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '80px 20px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3a7bd5', boxShadow: '0 0 8px #3a7bd5', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', textTransform: 'uppercase' }}>Live Intelligence Feed</span>
          </div>
          <h1 style={{ color: '#c8d8f0', fontSize: 'clamp(28px,5vw,42px)', fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
            CYBER<span style={{ color: '#3a7bd5' }}>BRIEF</span>
          </h1>
          <p style={{ color: '#2a4060', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>
            AI-curated threat intelligence{lastFetched ? ` · Updated ${lastFetched.toLocaleTimeString()}` : ''}
          </p>
        </div>

        {/* Hero — shown when no articles have been fetched yet */}
        {!hasFetchedOnce && !loading && articles.length === 0 && (
          <HeroSection onFetch={fetchNews} loading={loading} />
        )}

        {/* Upgrade banner for signed-in free users */}
        {isSignedIn && !isPro && articles.length > 0 && <UpgradeBanner onUpgrade={handleUpgrade} upgrading={upgrading} />}

        {/* Controls — only after we have articles or are loading */}
        {(articles.length > 0 || loading) && (
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
                  <span style={{ background: activeCategory === cat ? '#3a7bd5' : '#111c30', color: activeCategory === cat ? '#fff' : '#2a4060', borderRadius: '10px', padding: '0 5px', fontSize: '9px', fontWeight: 700 }}>{counts[cat]}</span>
                )}
              </button>
            ))}
            <button onClick={fetchNews} disabled={loading} style={{
              marginLeft: 'auto', background: loading ? '#0a1120' : '#0f1e35',
              border: '1px solid #1e3a5f', color: loading ? '#1a3050' : '#3a7bd5',
              borderRadius: '6px', padding: '5px 14px', fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace", cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
              {loading ? 'Fetching...' : 'Refresh'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ color: '#ff6060', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>⚠ {error.includes('refresh') || error.includes('cooldown') ? 'Hold up' : 'Error'}</div>
            <div style={{ color: '#804040', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <LoadingCard key={i} index={i} />)
            : filtered.map((article, i) => <NewsCard key={i} article={article} index={i} />)
          }
        </div>

        <Footer />
      </div>
    </div>
  )
}
