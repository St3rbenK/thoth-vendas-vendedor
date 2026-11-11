import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let hadController = Boolean(navigator.serviceWorker.controller)
    let refreshing = false

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) {
        hadController = true
        return
      }
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        const checkForUpdate = () => {
          if (navigator.onLine) {
            registration.update().catch(() => {
              // Ignora falhas transitórias de rede ao verificar atualização do SW
            })
          }
        }

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdate()
          }
        })
        window.addEventListener('online', checkForUpdate)
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
