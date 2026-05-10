import ModuleTag from './ModuleTag.jsx'

export default function SourceCard({ source }) {
  const isInternal = source.type === 'internal'

  const handleClick = () => {
    if (source.url) window.open(source.url, '_blank', 'noopener')
  }

  return (
    <div
      onClick={source.url ? handleClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '10px 14px',
        background: 'var(--white)',
        border: '1px solid var(--gray-200)',
        borderRadius: 'var(--border-radius-sm)',
        cursor: source.url ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        fontSize: '13px',
        lineHeight: '1.4',
      }}
      onMouseEnter={e => {
        if (source.url) {
          e.currentTarget.style.borderColor = 'var(--sap-blue)'
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--sap-blue-light)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--gray-200)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>
        {isInternal ? '📄' : '🌐'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontWeight: 500,
              color: 'var(--gray-800)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            }}
            title={source.title}
          >
            {source.title}
          </span>
          {source.module && <ModuleTag module={source.module} />}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '3px', color: 'var(--gray-400)', fontSize: '12px' }}>
          {isInternal && source.page && (
            <span>p. {source.page}</span>
          )}
          {isInternal && source.section && (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}
              title={source.section}
            >
              {source.section}
            </span>
          )}
          {source.score && (
            <span style={{ marginLeft: 'auto', color: 'var(--sap-blue)', fontWeight: 500 }}>
              {Math.round(source.score * 100)}%
            </span>
          )}
          {!isInternal && source.url && (
            <span style={{ color: 'var(--sap-blue)' }}>↗ Ouvrir</span>
          )}
        </div>
      </div>
    </div>
  )
}
