'use client'
import { useState } from 'react'

const SEVERITY_COLORS = {
  critical: '#ff3b3b',
  high:     '#ff7b00',
  medium:   '#f5c518',
  low:      '#4ade80',
  info:     '#60a5fa',
}

function SeverityBadge({ level }) {
  const color = SEVERITY_COLORS[level] || '#60a5fa'
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: '4px', padding: '2px 8px', fontSize: '10px',
      fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{level || 'info'}</span>
  )
}

export default function NewsCard({ article, index }) {
  const [expanded, setExpanded] = useState(false)
  const borderColor = SEVERITY_COLORS[article.severity] || '#1e3a5f'

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: expanded ? '#0f1a2e' : '#0a1120',
        border: `1px solid ${expanded ? '#1e3a5f' : '#111c30'}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '8px', padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: 'fadeSlideIn 0.4s ease both',
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <SeverityBadge level={article.severity} />
            <span style={{ color: '#4a6080', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>{article.category}</span>
            <span style={{ color: '#2a3a50', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>{article.date}</span>
          </div>
          <h3 style={{ color: '#c8d8f0', fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            {article.title}
          </h3>
        </div>
        <span style={{
          color: '#2a4060', fontSize: '18px', flexShrink: 0, marginTop: '2px',
          transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>▾</span>
      </div>

      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #111c30', paddingTop: '16px' }}>
          <div style={{ background: '#060e1c', borderRadius: '6px', padding: '14px 16px', marginBottom: '14px' }}>
            <div style={{ color: '#3a7bd5', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>⚡ TL;DR</div>
            <p style={{ color: '#8bafd4', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{article.tldr}</p>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#2a4060', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginBottom: '8px', textTransform: 'uppercase' }}>Full Summary</div>
            <p style={{ color: '#5a7a9a', fontSize: '12px', lineHeight: 1.8, margin: 0 }}>{article.summary}</p>
          </div>
          {article.source && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: '#2a4060', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>Source:</span>
              <span style={{ color: '#3a5a80', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>{article.source}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
