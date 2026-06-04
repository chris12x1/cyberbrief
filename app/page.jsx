'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import NewsCard from './components/NewsCard'

const CATEGORIES = ['All', 'Vulnerabilities', 'Data Breaches', 'Malware', 'Nation-State', 'Zero-Day']

const SAMPLE_ARTICLES = [
  {
    title: "Critical SQL Injection Flaw in Drupal Core Under Mass Exploitation",
    tldr: "A critical SQL injection vulnerability (CVSS 9.8) in Drupal sites running PostgreSQL is being actively exploited just 48 hours after patch release.",
    summary: "A highly severe SQL injection vulnerability in Drupal core is currently facing mass exploitation. The flaw allows unauthenticated attackers to inject arbitrary SQL commands, potentially leading to data disclosure, privilege escalation, and remote code execution. CISA has added this to its Known Exploited Vulnerabilities catalog, urging immediate patching.",
    severity: "critical", category: "Vulnerabilities", source: "The Hacker News", date: "Sample",
  },
  {
    title: "Major Health System Discloses Breach Impacting 1.8 Million Patients",
    tldr: "Healthcare provider confirmed a data breach exposing sensitive patient and employee data including medical records and biometric information, through a third-party vendor.",
    summary: "Attackers gained unauthorized access to systems over a multi-month period, exfiltrating personal information, medical records, insurance details, Social Security numbers, and biometric data. The incident stemmed from a compromise at an unnamed third-party vendor with access to internal systems — fitting a growing pattern of supply-chain compromises in healthcare.",
    severity: "high", category: "Data Breaches", source: "SecurityAffairs", date: "Sample",
  },
  {
    title: "New Fileless Malware Spreads via ClickFix Social Engineering",
    tldr: "A new fileless malware loader uses ClickFix social engineering to trick users into executing PowerShell commands, then steals credentials and keystrokes.",
    summary: "The malware loader is spreading through a social-engineering tactic called ClickFix. Once active, it decrypts its payload in memory and injects it into legitimate Windows processes. It deploys a credential stealer and a malicious browser extension to capture saved passwords and keystrokes. The malware further propagates by dropping shortcut files onto USB drives.",
    severity: "high", category: "Malware", source: "SOC Prime", date: "Sample",
  },
  {
    title: "Verizon DBIR: Vulnerability Exploitation Now Top Breach Vector",
    tldr: "Latest Verizon Data Breach Investigations Report shows software vulnerability exploitation has surpassed stolen credentials as the leading cause of corporate breaches.",
    summary: "Vulnerability exploitation now accounts for 31% of confirmed data breaches — the first time in nearly two decades it has exceeded stolen credentials (which dropped to 13%). The report highlights that AI is increasingly used by attackers to exploit flaws faster than companies can patch them, and ransomware was present in nearly half of all breaches.",
    severity: "info", category: "Vulnerabilities", source: "TechRadar", date: "Sample",
  },
  {
    title: "Ransomware Groups Pivot from Encryption to Pure Data Extortion",
    tldr: "Ransomware operators are increasingly skipping encryption entirely, opting for pure data theft and public-leak threats due to declining ransom payment rates.",
    summary: "A notable shift in the threat landscape sees ransomware groups moving away from traditional data encryption. Instead, they focus on pure extortion — stealing sensitive data and threatening its public release if ransom isn't paid. This change is driven by the economics of cybercrime: encryption is more detectable and less profitable. The new pressure point is reputational damage and regulatory exposure rather than operational disruption.",
    severity: "high", category: "Malware", source: "SecurityAffairs", date: "Sample",
  },
]

function formatCooldown(minutes) {
  if (minutes <= 0) return 'a moment'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) { const m = minutes % 60; return m ? `${hours}h ${m}m` : `${hours}h` }
  const days = Math.floor(hours / 24); const h = hours % 24
  return h ? `${days}d ${h}h` : `${days}d`
}

function LoadingCard({ index }) {
  return (
    <div style={{
      background: '#0a1120', border: '1px solid #111c30', borderLeft: '3px solid #1a2a3a',
      borderRadius: '8px', padding: '18px 20px',
      animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${index * 0.15}s`,
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

function AuthBar({ isSignedIn, isPro, onUpgrade, upgrading, onManage, managing }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: '#060d1aee', backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #111c30', padding: '10px 24px',
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
              <button onClick={onManage} disabled={managing} title="Manage your subscription" style={{
                color: '#4ade80', fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                border: '1px solid #4ade8044', borderRadius: '6px',
                padding: '4px 10px', background: '#4ade8011',
                cursor: managing ? 'wait' : 'pointer',
              }}>{managing ? 'Opening...' : '● PRO ⚙'}</button>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        )}
      </div>
    </div>
  )
}

function PreviewBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f1e35, #1a2e50)',
      border: '1px solid #3a7bd5', borderRadius: '8px', padding: '20px 24px', marginBottom: '20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px',
    }}>
      <div>
        <div style={{ color: '#7ab3f0', fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '4px' }}>
          👀 You're viewing sample threats
        </div>
        <div style={{ color: '#5a7a9a', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
          Sign up free to load real, live cybersecurity intelligence from the last 48 hours.
        </div>
      </div>
      <SignUpButton mode="modal">
        <button style={{
          background: '#3a7bd5', border: 'none', color: '#fff',
          borderRadius: '6px', padding: '10px 22px', fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', fontWeight: 700,
        }}>🔓 Sign Up Free</button>
      </SignUpButton>
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
        <div style={{ color: '#3a5a80', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>Refresh the feed on demand (every 4 hours) · Weekly email digest (coming soon) · Custom categories (coming soon)</div>
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

function CooldownPanel({ minutes, isPro }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      border: '1px dashed #1e3a5f', borderRadius: '12px',
    }}>
      <div style={{ fontSize: '34px', marginBottom: '12px' }}>🕓</div>
      <div style={{ color: '#c8d8f0', fontSize: '18px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '8px' }}>
        You're all caught up
      </div>
      <div style={{ color: '#5a7a9a', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 }}>
        Your next live refresh is ready in {formatCooldown(minutes)}.<br />
        {isPro
          ? 'Pro refreshes every 4 hours — the news rarely changes faster than that.'
          : 'Free accounts get 1 refresh per week. Upgrade to Pro for a refresh every 4 hours.'}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid #111c30', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <a href="/about" style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>About</a>
        <a href="/contact" style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>Contact</a>
        <a href="https://github.com/chris12x1/cyberbrief" target="_blank" rel="noopener noreferrer" style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textDecoration: 'none' }}>GitHub</a>
      </div>
      <div style={{ color: '#2a4060', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '12px', lineHeight: 1.7 }}>
        ⚠ CyberBrief uses AI to summarize cybersecurity news.<br />
        Always verify critical information against primary sources before taking action.<br />
        Not affiliated with any vendor or news organization.
      </div>
      <div style={{ color: '#1a2a3a', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
        © {new Date().getFullYear()} CYBERBRIEF · POWERED BY GEMINI AI
      </div>
    </div>
  )
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const [isPro, setIsPro] = useState(false)
  const [articles, setArticles] = useState(SAMPLE_ARTICLES)
  const [isShowingSamples, setIsShowingSamples] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActive] = useState('All')
  const [lastFetched, setLastFetched] = useState(null)
  const [error, setError] = useState(null)
  const [upgrading, setUpgrading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [cooldownMinutes, setCooldownMinutes] = useState(0)

  async function checkRefreshStatus() {
    try {
      const res = await fetch('/api/refresh-status')
      const data = await res.json()
      setCooldownMinutes(data.cooldownMinutes || 0)
      return data
    } catch {
      return { allowed: true, cooldownMinutes: 0 }
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
      setIsShowingSamples(false)
      setLastFetched(new Date())
      checkRefreshStatus()
    } catch (err) {
      setError(err.message)
      checkRefreshStatus()
    } finally {
      setLoading(false)
    }
  }

  // Single source of truth: decide what to show once auth has resolved
  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false

    async function init() {
      const status = await checkRefreshStatus()
      if (cancelled) return

      if (isSignedIn) {
        let proStatus = false
        try {
          const d = await (await fetch('/api/user-status')).json()
          proStatus = d.isPro || false
          if (!cancelled) setIsPro(proStatus)
        } catch { /* ignore */ }
        if (cancelled) return

        // Pro reads their own news; Free reads the shared snapshot
        let served = false
        try {
          const res = await fetch('/api/news')
          const data = await res.json()
          if (!cancelled && Array.isArray(data.articles) && data.articles.length) {
            setArticles(data.articles)
            setIsShowingSamples(false)
            if (data.fetchedAt) setLastFetched(new Date(data.fetchedAt))
            served = true
          }
        } catch { /* ignore */ }
        if (cancelled) return

        if (!served) {
          // Pro with no personal news yet → auto-fetch their own (if cooldown allows).
          // Free with an empty shared cache → show samples until a Pro seeds it.
          if (proStatus && status.allowed) fetchNews()
          else setIsShowingSamples(true)
        }
      } else {
        // Logged out → always samples
        setIsPro(false)
        setArticles(SAMPLE_ARTICLES)
        setIsShowingSamples(true)
      }
    }

    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  // Tick the cooldown down each minute
  useEffect(() => {
    if (cooldownMinutes <= 0) return
    const interval = setInterval(() => setCooldownMinutes(prev => Math.max(0, prev - 1)), 60000)
    return () => clearInterval(interval)
  }, [cooldownMinutes])

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

  async function handleManageSubscription() {
    setManaging(true)
    try {
      const res = await fetch('/api/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error)
    } catch (err) {
      alert('Could not open subscription management: ' + err.message)
      setManaging(false)
    }
  }

  // ---- Derived display flags ----
  const showSamplesForAnon = !isSignedIn && isShowingSamples
  const showCooldownPanel = isSignedIn && isPro && isShowingSamples && !loading
  const showRealNews = !isShowingSamples
  const refreshDisabled = loading || cooldownMinutes > 0

  const filtered = activeCategory === 'All' ? articles : articles.filter(a => a.category === activeCategory)
  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'All' ? articles.length : articles.filter(a => a.category === cat).length
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: '#060d1a', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(#0d1628 1px, transparent 1px), linear-gradient(90deg, #0d1628 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
      <div style={{ position: 'fixed', left: 0, right: 0, height: '80px', zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(transparent, rgba(58,123,213,0.03), transparent)', animation: 'scanline 8s linear infinite' }} />

      <AuthBar isSignedIn={isSignedIn} isPro={isPro} onUpgrade={handleUpgrade} upgrading={upgrading} onManage={handleManageSubscription} managing={managing} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', padding: '80px 20px 40px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3a7bd5', boxShadow: '0 0 8px #3a7bd5', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ color: '#3a7bd5', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              {showSamplesForAnon ? 'Sample Preview' : 'Live Intelligence Feed'}
            </span>
          </div>
          <h1 style={{ color: '#c8d8f0', fontSize: 'clamp(28px,5vw,42px)', fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
            CYBER<span style={{ color: '#3a7bd5' }}>BRIEF</span>
          </h1>
          <p style={{ color: '#2a4060', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>
            AI-curated threat intelligence{showRealNews && lastFetched ? ` · Updated ${lastFetched.toLocaleTimeString()}` : ''}
          </p>
        </div>

        {showSamplesForAnon && <PreviewBanner />}
        {isSignedIn && !isPro && showRealNews && <UpgradeBanner onUpgrade={handleUpgrade} upgrading={upgrading} />}

        {/* Filters + refresh — only when showing real news */}
        {showRealNews && (
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
            {isPro ? (
              <button onClick={fetchNews} disabled={refreshDisabled} style={{
                marginLeft: 'auto', background: refreshDisabled ? '#0a1120' : '#0f1e35',
                border: '1px solid #1e3a5f', color: refreshDisabled ? '#1a3050' : '#3a7bd5',
                borderRadius: '6px', padding: '5px 14px', fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace", cursor: refreshDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
                {loading ? 'Fetching...' : cooldownMinutes > 0 ? `Wait ${formatCooldown(cooldownMinutes)}` : 'Refresh'}
              </button>
            ) : (
              <button onClick={handleUpgrade} disabled={upgrading} title="Upgrade to Pro to refresh on demand" style={{
                marginLeft: 'auto', background: 'transparent',
                border: '1px solid #1e3a5f', color: '#3a7bd5',
                borderRadius: '6px', padding: '5px 14px', fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace", cursor: upgrading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                🔒 Refresh (Pro)
              </button>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0a0a', border: '1px solid #3a1515', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ color: '#ff6060', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '4px' }}>⚠ {error.includes('cooldown') || error.includes('refresh') ? 'Hold up' : 'Error'}</div>
            <div style={{ color: '#804040', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{error}</div>
          </div>
        )}

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <LoadingCard key={i} index={i} />)
            : showCooldownPanel
              ? <CooldownPanel minutes={cooldownMinutes} isPro={isPro} />
              : filtered.map((article, i) => <NewsCard key={i} article={article} index={i} />)
          }
        </div>

        <Footer />
      </div>
    </div>
  )
}
