'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import NewsCard from './components/NewsCard'

const CATEGORIES = ['All', 'Vulnerabilities', 'Data Breaches', 'Malware', 'Nation-State', 'Zero-Day']
const FREE_REFRESH_INTERVAL_DAYS = 7

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

function AuthBar({ isSignedIn, onUpgrade, upgrading }) {
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
            <button onClick={onUpgrade} disabled={upgrading} style={{
              background: upgrading ? '#0a1120' : '#3a7bd5',
              border: 'none', color: '#fff', borderRadius: '6px', padding: '5px 14px',
              fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
              cursor: upgrading ? 'not-allowed' : 'pointer', fontWeight: 700,
            }}>
              {upgrading ? 'Redirecting...' : '⚡ Get Pro — $7/mo'}
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
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
        <div style={{ color: '#3a5a80', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>Unlimited refreshes · Email digest · Custom categories</div>
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

export default function Home() {
  const { isSignedIn } = useUser()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActive] = useState('All')
  const [lastFetched, setLastFetched] = useState(null)
  const [error, setError] = useState(null)
  const [cooldown, setCooldown] = useState(0)
  const [hasUsedFreeRefresh, setHasUsedFreeRefresh] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      const lastRefresh = localStorage.getItem('cyberbrief_last_refresh')
      if (lastRefresh) {
        const daysSince = (Date.now() - parseInt(lastRefresh)) / (1000 * 60 * 60 * 24)
        if (daysSince < FREE_REFRESH_INTERVAL_DAYS) setHasUsedFreeRefresh(true)
      }
    }
  }, [isSignedIn])

  const canRefresh = isSignedIn || !hasUsedFreeRefresh

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
    if (!canRefresh) return
    setLoading(true)
    setError(null)
    setArticles([])
    if (!isSignedIn) {
      localStorage.setItem('cyberbrief_last_refresh', Date.now().toString())
      setHasUsedFreeRefresh(true)
    }
    try {
      const res = await fetch('/api/news', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setArticles(data.articles)
      setLastFetched(new Date())
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

  useEffect(() => { if (canRefresh) fetchNews() }, [isSignedIn])

  const filtered = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory)
  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? articles.length : articles.filter(a => a.category === cat).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#0d1628 1px, transparent 1px), linear-gradient(90deg, #0d1628 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
      <div style={{ position: 'fixed', left: 0, right: 0, height: '80px', zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(transparent, rgba(58,123,213,0.03), transparent)', animation: 'scanline 8s linear infinite' }} />

      <AuthBar isSignedIn={isSignedIn} onUpgrade={handleUpgrade} upgrading={upgrading} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '80px 20px 40px' }}>
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

        {!isSignedIn && hasUsedFreeRefresh && <UpgradeBanner onUpgrade={handleUpgrade} upgrading={upgrading} />}

        {!isSignedIn && hasUsedFreeRefresh && articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #1e3a5f', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
            <div style={{ color: '#c8d8f0', fontSize: '16px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '8px' }}>Weekly refresh used</div>
            <div style={{ color: '#2a4060', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '20px' }}>
              Sign up free to get another refresh, or go Pro for unlimited access.
            </div>
            <SignUpButton mode="modal">
              <button style={{
                background: '#3a7bd5', border: 'none', color: '#fff',
                borderRadius: '6px', padding: '10px 24px', fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', fontWeight: 700,
              }}>Create Free Account</button>
            </SignUpButton>
          </div>
        )}

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
            {canRefresh && (
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
            )}
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ color: '#ff6060', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>⚠ Error</div>
            <div style={{ color: '#804040', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{error}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <LoadingCard key={i} index={i} />)
            : filtered.map((article, i) => <NewsCard key={i} article={article} index={i} />)
          }
        </div>

        {!loading && articles.length > 0 && (
          <div style={{ marginTop: '32px', textAlign: 'center', color: '#1a2a3a', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
            CYBERBRIEF · POWERED BY GEMINI AI · {articles.length} ARTICLES LOADED
          </div>
        )}
      </div>
    </div>
  )
}
