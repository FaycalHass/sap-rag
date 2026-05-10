const MODULE_COLORS = {
  FI:     { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  CO:     { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  MM:     { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  SD:     { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' },
  PP:     { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
  HR:     { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  ABAP:   { bg: '#F0FDF4', text: '#065F46', border: '#A7F3D0' },
  BASIS:  { bg: '#F5F3FF', text: '#4C1D95', border: '#DDD6FE' },
  S4HANA: { bg: '#E0F2FE', text: '#075985', border: '#BAE6FD' },
  BTP:    { bg: '#FDF4FF', text: '#701A75', border: '#F0ABFC' },
}

const DEFAULT_COLOR = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }

export default function ModuleTag({ module, size = 'sm' }) {
  if (!module) return null

  const colors = MODULE_COLORS[module] || DEFAULT_COLOR
  const padding = size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'sm' ? '11px' : '13px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.04em',
        borderRadius: '20px',
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}
    >
      {module}
    </span>
  )
}
