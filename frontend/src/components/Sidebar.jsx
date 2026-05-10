import { useState } from 'react'

const T = {
  fr: {
    newConversation: 'Nouvelle conversation',
    noConversation: 'Aucune conversation',
    reduce: 'Réduire',
    open: 'Ouvrir',
    messages: 'messages',
    message: 'message',
  },
  en: {
    newConversation: 'New conversation',
    noConversation: 'No conversations',
    reduce: 'Collapse',
    open: 'Expand',
    messages: 'messages',
    message: 'message',
  },
}

export default function Sidebar({ conversations, activeId, language, onLanguageChange, onSelect, onNew, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)
  const t = T[language] || T.fr

  if (collapsed) {
    return (
      <div
        style={{
          width: '52px',
          background: 'var(--sap-blue-dark)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '16px',
          flexShrink: 0,
          transition: 'width 0.2s ease',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '16px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={t.open}
        >
          ›
        </button>
        <button
          onClick={onNew}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            borderRadius: '8px',
            padding: '8px',
            fontSize: '16px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={t.newConversation}
        >
          ✏️
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--sap-blue-dark)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'var(--sap-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🔷
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
                SAP Assistant
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                Documentation RAG
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Language toggle */}
            <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
              {['fr', 'en'].map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: language === lang ? 'var(--sap-blue-dark)' : 'rgba(255,255,255,0.5)',
                    background: language === lang ? 'white' : 'transparent',
                    letterSpacing: '0.03em',
                    transition: 'all 0.15s',
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '18px',
                padding: '4px',
                borderRadius: '6px',
              }}
              title={t.reduce}
            >
              ‹
            </button>
          </div>
        </div>

        <button
          onClick={onNew}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--sap-blue)',
            color: 'white',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ✏️ {t.newConversation}
        </button>
      </div>

      {/* Conversations list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {conversations.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', marginTop: '24px' }}>
            {t.noConversation}
          </p>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: conv.id === activeId ? 'rgba(255,255,255,0.12)' : 'transparent',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (conv.id !== activeId) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={e => {
                if (conv.id !== activeId) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>💬</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: conv.id === activeId ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {conv.title || 'Conversation'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                  {conv.messageCount} {conv.messageCount !== 1 ? t.messages : t.message}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '14px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  opacity: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                title="✕"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
