import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SourceCard from './SourceCard.jsx'

function LoadingDots() {
  return (
    <div className="loading-dots" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
      <span /><span /><span />
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isLoading = message.status === 'loading'

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '8px',
        marginBottom: '20px',
      }}
    >
      {/* Role label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--gray-500)',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {!isUser && (
          <>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--sap-blue) 0%, var(--sap-blue-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              🤖
            </div>
            <span>Expert SAP</span>
          </>
        )}
        {isUser && (
          <>
            <span>Vous</span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--gray-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              👤
            </div>
          </>
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '80%',
          padding: '14px 18px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          background: isUser
            ? 'linear-gradient(135deg, var(--sap-blue) 0%, var(--sap-blue-mid) 100%)'
            : 'var(--white)',
          color: isUser ? 'var(--white)' : 'var(--gray-800)',
          boxShadow: 'var(--shadow-sm)',
          border: isUser ? 'none' : '1px solid var(--gray-200)',
          lineHeight: '1.65',
          fontSize: '15px',
        }}
      >
        {isLoading ? (
          <LoadingDots />
        ) : isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content || ''}
            </ReactMarkdown>
            {message.status === 'streaming' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1em',
                  background: 'var(--sap-blue)',
                  marginLeft: '2px',
                  animation: 'pulse 1s infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {message.status === 'error' && (
        <div
          style={{
            maxWidth: '80%',
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 'var(--border-radius-sm)',
            color: '#DC2626',
            fontSize: '13px',
          }}
        >
          ⚠️ {message.error || 'Une erreur est survenue.'}
        </div>
      )}

      {/* Sources */}
      {!isUser && message.sources && message.sources.length > 0 && message.status === 'done' && (
        <div style={{ maxWidth: '80%', width: '100%' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--gray-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '6px',
            }}
          >
            Sources utilisées
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {message.sources.map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
