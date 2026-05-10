import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ModuleTag from './ModuleTag.jsx'
import { streamChat, getStats } from '../services/api.js'

const SUGGESTED = {
  fr: [
    "Comment créer un bon de commande dans SAP MM ?",
    "Quelle est la procédure de clôture mensuelle en FI ?",
    "Comment configurer un centre de coûts en CO ?",
    "Quelles sont les étapes de la livraison client en SD ?",
    "Comment créer un ordre de fabrication en PP ?",
    "Comment gérer les immobilisations en FI-AA ?",
  ],
  en: [
    "How to create a purchase order in SAP MM?",
    "What is the monthly closing procedure in FI?",
    "How to configure a cost center in CO?",
    "What are the steps for customer delivery in SD?",
    "How to create a production order in PP?",
    "How to manage fixed assets in FI-AA?",
  ],
}

const T = {
  fr: {
    allModules: 'Tous les modules',
    addDocs: 'Ajouter docs (optionnel)',
    heroTitle: 'SAP Expert AI',
    heroDesc: 'Expertise SAP complète sur tous les modules (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP). Posez votre question — pas besoin de documents pour démarrer.',
    docsIndexed: 'Documents indexés',
    chunksIndexed: 'Passages indexés',
    modulesCovered: 'Modules couverts',
    suggestedTitle: 'Questions suggérées',
    placeholder: 'Posez votre question SAP... (Entrée pour envoyer, Maj+Entrée pour saut de ligne)',
    disclaimer: "Réponses générées par IA basées sur l'expertise SAP intégrée. Vérifiez toujours les informations critiques avant action en production.",
    newConversation: 'Nouvelle conversation',
    docCount: (n) => n > 0 ? `${n} doc${n !== 1 ? 's' : ''} indexé${n !== 1 ? 's' : ''}` : 'Connaissance SAP intégrée',
  },
  en: {
    allModules: 'All modules',
    addDocs: 'Add docs (optional)',
    heroTitle: 'SAP Expert AI',
    heroDesc: 'Complete SAP expertise across all modules (FI, CO, MM, SD, PP, HR, ABAP, BASIS, S/4HANA, BTP). Ask your question — no documents needed to start.',
    docsIndexed: 'Indexed documents',
    chunksIndexed: 'Indexed passages',
    modulesCovered: 'Modules covered',
    suggestedTitle: 'Suggested questions',
    placeholder: 'Ask your SAP question... (Enter to send, Shift+Enter for new line)',
    disclaimer: 'AI-generated answers based on built-in SAP expertise. Always verify critical information before production action.',
    newConversation: 'New conversation',
    docCount: (n) => n > 0 ? `${n} doc${n !== 1 ? 's' : ''} indexed` : 'Built-in SAP knowledge',
  },
}

const SAP_MODULES = ['FI', 'CO', 'MM', 'SD', 'PP', 'HR', 'ABAP', 'BASIS', 'S4HANA', 'BTP']

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

export default function ChatInterface({ conversation, language, onAddMessage, onUpdateMessage, onOpenUpload }) {
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [moduleFilter, setModuleFilter] = useState('')
  const [stats, setStats] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const t = T[language] || T.fr
  const messages = conversation?.messages || []
  const isEmpty = messages.length === 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [])

  const handleSubmit = useCallback(async (questionText) => {
    const question = (questionText || input).trim()
    if (!question || isStreaming) return

    setInput('')
    setIsStreaming(true)

    const userMsgId = generateId()
    const assistantMsgId = generateId()

    onAddMessage({ id: userMsgId, role: 'user', content: question, status: 'done' })
    onAddMessage({ id: assistantMsgId, role: 'assistant', content: '', status: 'loading', sources: [] })

    let accumulated = ''

    await streamChat({
      question,
      moduleFilter: moduleFilter || null,
      useWebSearch: true,
      language,
      onDelta: (text) => {
        accumulated += text
        onUpdateMessage(assistantMsgId, { content: accumulated, status: 'streaming' })
      },
      onSources: (sources) => {
        onUpdateMessage(assistantMsgId, { sources })
      },
      onDone: () => {
        onUpdateMessage(assistantMsgId, { status: 'done' })
        setIsStreaming(false)
      },
      onError: (errMsg) => {
        onUpdateMessage(assistantMsgId, { status: 'error', error: errMsg, content: accumulated })
        setIsStreaming(false)
      },
    })
  }, [input, isStreaming, moduleFilter, language, onAddMessage, onUpdateMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const autoResize = (e) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '0 24px',
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'white',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-900)' }}>
            {conversation?.title || t.newConversation}
          </h1>
          {stats && (
            <span style={{ color: 'var(--gray-400)', fontSize: '13px' }}>
              {t.docCount(stats.total_documents)}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid var(--gray-200)',
              fontSize: '13px',
              color: moduleFilter ? 'var(--sap-blue)' : 'var(--gray-500)',
              fontWeight: moduleFilter ? 600 : 400,
              background: moduleFilter ? 'var(--sap-blue-light)' : 'white',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">{t.allModules}</option>
            {SAP_MODULES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button
            onClick={onOpenUpload}
            style={{
              padding: '8px 14px',
              background: 'var(--sap-blue)',
              color: 'white',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📤 {t.addDocs}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isEmpty ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔷</div>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '8px' }}>
                {t.heroTitle}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '15px', maxWidth: '460px' }}>
                {t.heroDesc}
              </p>
            </div>

            {stats && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--sap-blue)' }}>
                    {stats.total_documents}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                    {t.docsIndexed}
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px 20px',
                    background: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--sap-blue)' }}>
                    {stats.total_chunks}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                    {t.chunksIndexed}
                  </div>
                </div>
                {stats.modules_covered.length > 0 && (
                  <div
                    style={{
                      padding: '12px 20px',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4px' }}>
                      {stats.modules_covered.slice(0, 5).map(m => (
                        <ModuleTag key={m} module={m} />
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', textAlign: 'center' }}>
                      {t.modulesCovered}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '640px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-500)', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t.suggestedTitle}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {(SUGGESTED[language] || SUGGESTED.fr).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(q)}
                    disabled={isStreaming}
                    style={{
                      padding: '12px 16px',
                      background: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '12px',
                      textAlign: 'left',
                      fontSize: '13px',
                      color: 'var(--gray-700)',
                      lineHeight: '1.45',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s ease',
                      cursor: isStreaming ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--sap-blue)'
                      e.currentTarget.style.color = 'var(--sap-blue)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--sap-blue-light)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--gray-200)'
                      e.currentTarget.style.color = 'var(--gray-700)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '820px', width: '100%', margin: '0 auto' }}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--gray-200)',
          background: 'white',
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px',
              background: 'var(--gray-50)',
              border: `1.5px solid ${isStreaming ? 'var(--sap-blue)' : 'var(--gray-200)'}`,
              borderRadius: '16px',
              padding: '10px 10px 10px 16px',
              transition: 'border-color 0.15s ease',
              boxShadow: isStreaming ? '0 0 0 3px var(--sap-blue-light)' : 'none',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(e) }}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={isStreaming}
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '15px',
                color: 'var(--gray-800)',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isStreaming}
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: input.trim() && !isStreaming ? 'var(--sap-blue)' : 'var(--gray-200)',
                color: input.trim() && !isStreaming ? 'white' : 'var(--gray-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              }}
            >
              {isStreaming ? (
                <span style={{ fontSize: '12px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              ) : '➤'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--gray-400)', marginTop: '8px' }}>
            {t.disclaimer}
          </p>
        </div>
      </div>
    </div>
  )
}
