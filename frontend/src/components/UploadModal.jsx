import { useState, useRef } from 'react'
import { uploadDocument } from '../services/api.js'

export default function UploadModal({ onClose, onSuccess }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const ACCEPTED = '.pdf,.docx,.doc,.txt,.md,.html,.htm'

  const addFiles = (newFiles) => {
    const arr = Array.from(newFiles).filter(f =>
      /\.(pdf|docx?|txt|md|html?)$/i.test(f.name)
    )
    setFiles(prev => [...prev, ...arr.filter(f => !prev.find(p => p.name === f.name))])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    setResults([])

    const newResults = []
    for (const file of files) {
      try {
        const data = await uploadDocument(file)
        newResults.push({ name: file.name, status: 'success', data })
      } catch (err) {
        newResults.push({ name: file.name, status: 'error', message: err.message })
      }
      setResults([...newResults])
    }

    setUploading(false)
    const succeeded = newResults.filter(r => r.status === 'success')
    if (succeeded.length > 0 && onSuccess) onSuccess()
  }

  const allDone = results.length === files.length && results.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-900)' }}>
              Ajouter des documents SAP
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '2px' }}>
              PDF, DOCX, TXT, MD, HTML acceptés
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--gray-100)',
              color: 'var(--gray-500)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--sap-blue)' : 'var(--gray-300)'}`,
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--sap-blue-light)' : 'var(--gray-50)',
            transition: 'all 0.15s ease',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
          <p style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '14px' }}>
            Déposez vos fichiers ici ou cliquez pour sélectionner
          </p>
          <p style={{ color: 'var(--gray-400)', fontSize: '12px', marginTop: '4px' }}>
            PDF, DOCX, TXT, MD, HTML — max 50 MB par fichier
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            {files.map((file, i) => {
              const result = results.find(r => r.name === file.name)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: result?.status === 'success'
                      ? '#F0FDF4'
                      : result?.status === 'error'
                      ? '#FEF2F2'
                      : 'var(--gray-50)',
                    border: `1px solid ${result?.status === 'success' ? '#BBF7D0' : result?.status === 'error' ? '#FECACA' : 'var(--gray-200)'}`,
                    marginBottom: '6px',
                    fontSize: '13px',
                  }}
                >
                  <span>
                    {result?.status === 'success' ? '✅' : result?.status === 'error' ? '❌' : '📄'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                    {result?.status === 'success' && (
                      <div style={{ color: '#166534', fontSize: '12px' }}>
                        {result.data.chunks_created} chunks
                        {result.data.module_detected && ` — Module: ${result.data.module_detected}`}
                      </div>
                    )}
                    {result?.status === 'error' && (
                      <div style={{ color: '#DC2626', fontSize: '12px' }}>{result.message}</div>
                    )}
                  </div>
                  {!result && (
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, fi) => fi !== i))}
                      style={{ color: 'var(--gray-400)', background: 'transparent', fontSize: '14px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              background: 'var(--gray-100)',
              color: 'var(--gray-700)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {allDone ? 'Fermer' : 'Annuler'}
          </button>
          {!allDone && (
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              style={{
                flex: 2,
                padding: '11px',
                background: files.length === 0 || uploading ? 'var(--gray-300)' : 'var(--sap-blue)',
                color: 'white',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: files.length === 0 || uploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {uploading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Ingestion en cours...
                </>
              ) : (
                `Ingérer ${files.length} fichier${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
