import { useState, useCallback } from 'react'
import ChatInterface from './components/ChatInterface.jsx'
import Sidebar from './components/Sidebar.jsx'
import UploadModal from './components/UploadModal.jsx'

const STORAGE_KEY = 'sap-rag-conversations'
const LANG_KEY = 'sap-rag-language'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function loadConversations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveConversations(convs) {
  try {
    const light = convs.map(c => ({
      ...c,
      messages: c.messages.slice(-50),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(light))
  } catch {}
}

function newConversation(lang) {
  return {
    id: generateId(),
    title: lang === 'en' ? 'New conversation' : 'Nouvelle conversation',
    messages: [],
    createdAt: Date.now(),
  }
}

export default function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANG_KEY) || 'fr')
  const [conversations, setConversations] = useState(() => {
    const stored = loadConversations()
    return stored.length > 0 ? stored : []
  })
  const [activeId, setActiveId] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const activeConversation = conversations.find(c => c.id === activeId) || null

  const sidebarConversations = conversations.map(c => ({
    id: c.id,
    title: c.title,
    messageCount: c.messages.length,
  }))

  const updateAndSave = useCallback((newConvs) => {
    setConversations(newConvs)
    saveConversations(newConvs)
  }, [])

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang)
    localStorage.setItem(LANG_KEY, lang)
  }, [])

  const handleNew = useCallback(() => {
    const conv = newConversation(language)
    const newConvs = [conv, ...conversations]
    updateAndSave(newConvs)
    setActiveId(conv.id)
  }, [conversations, language, updateAndSave])

  const handleSelect = useCallback((id) => {
    setActiveId(id)
  }, [])

  const handleDelete = useCallback((id) => {
    const newConvs = conversations.filter(c => c.id !== id)
    updateAndSave(newConvs)
    if (activeId === id) {
      setActiveId(newConvs[0]?.id || null)
    }
  }, [conversations, activeId, updateAndSave])

  const handleAddMessage = useCallback((message) => {
    setConversations(prev => {
      const convs = prev.map(c => {
        if (c.id !== activeId) return c
        const isFirst = c.messages.length === 0 && message.role === 'user'
        return {
          ...c,
          title: isFirst
            ? message.content.slice(0, 50) + (message.content.length > 50 ? '…' : '')
            : c.title,
          messages: [...c.messages, message],
        }
      })
      saveConversations(convs)
      return convs
    })
  }, [activeId])

  const handleUpdateMessage = useCallback((messageId, updates) => {
    setConversations(prev => {
      const convs = prev.map(c => {
        if (c.id !== activeId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        }
      })
      saveConversations(convs)
      return convs
    })
  }, [activeId])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        conversations={sidebarConversations}
        activeId={activeId}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ChatInterface
          conversation={activeConversation}
          language={language}
          onAddMessage={(msg) => {
            if (!activeId) {
              const conv = newConversation(language)
              const newConvs = [conv, ...conversations]
              updateAndSave(newConvs)
              setActiveId(conv.id)
              setTimeout(() => {
                setConversations(prev => {
                  const convs = prev.map(c => {
                    if (c.id !== conv.id) return c
                    return {
                      ...c,
                      title: msg.role === 'user'
                        ? msg.content.slice(0, 50) + (msg.content.length > 50 ? '…' : '')
                        : c.title,
                      messages: [...c.messages, msg],
                    }
                  })
                  saveConversations(convs)
                  return convs
                })
              }, 0)
            } else {
              handleAddMessage(msg)
            }
          }}
          onUpdateMessage={handleUpdateMessage}
          onOpenUpload={() => setShowUpload(true)}
        />
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          language={language}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}
