const BASE_URL = '/api'

export async function streamChat({ question, moduleFilter, useWebSearch, language, onDelta, onSources, onDone, onError }) {
  let response
  try {
    response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        module_filter: moduleFilter || null,
        use_web_search: useWebSearch !== false,
        language: language || 'fr',
      }),
    })
  } catch (err) {
    onError('Impossible de contacter le serveur. Vérifiez que le backend est démarré.')
    return
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Erreur inconnue' }))
    onError(detail.detail || `Erreur ${response.status}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n\n')
      buffer = parts.pop() ?? ''

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const data = JSON.parse(raw)
          if (data.type === 'delta' && data.content) {
            onDelta(data.content)
          } else if (data.type === 'sources') {
            onSources(data.sources || [])
          } else if (data.type === 'done') {
            onDone()
          } else if (data.type === 'error') {
            onError(data.message || 'Erreur de génération')
          }
        } catch {
          // Skip malformed SSE events
        }
      }
    }
  } catch (err) {
    onError('La connexion a été interrompue.')
  }
}

export async function uploadDocument(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Erreur upload' }))
    throw new Error(err.detail || `Erreur ${response.status}`)
  }

  return response.json()
}

export async function getDocuments() {
  const response = await fetch(`${BASE_URL}/documents`)
  if (!response.ok) throw new Error('Impossible de charger les documents')
  return response.json()
}

export async function deleteDocument(docId) {
  const response = await fetch(`${BASE_URL}/documents/${docId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Impossible de supprimer le document')
  return response.json()
}

export async function getStats() {
  const response = await fetch(`${BASE_URL}/stats`)
  if (!response.ok) throw new Error('Impossible de charger les stats')
  return response.json()
}
