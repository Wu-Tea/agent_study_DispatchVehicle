const LOG_PREFIX = '[voice-agent][ws]'

function getDefaultAgentWsBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.host) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/agent-api`
  }

  return 'ws://127.0.0.1:8010'
}

const agentWsBaseUrl = import.meta.env.VITE_AGENT_WS_URL || getDefaultAgentWsBaseUrl()

export function createAsrSocket({ onPartial, onFinal, onError }) {
  let socket
  let openPromise

  return {
    connect() {
      console.info(`${LOG_PREFIX} connecting`, `${agentWsBaseUrl}/ws/asr`)
      openPromise = new Promise((resolve, reject) => {
        socket = new WebSocket(`${agentWsBaseUrl}/ws/asr`)
        socket.onopen = () => {
          console.info(`${LOG_PREFIX} connected`)
          resolve()
        }
        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data)
          console.info(`${LOG_PREFIX} message`, payload.event, payload.text || '')
          if (payload.event === 'partial_transcript') {
            onPartial?.(payload.text)
          }
          if (payload.event === 'final_transcript') {
            onFinal?.(payload.text)
          }
        }
        socket.onerror = (event) => {
          console.error(`${LOG_PREFIX} error`, event)
          onError?.(event)
          reject(event)
        }
        socket.onclose = (event) => {
          console.info(`${LOG_PREFIX} closed`, event.code, event.reason || '')
        }
      })

      return openPromise
    },
    async sendStart(sampleRate) {
      await openPromise
      console.info(`${LOG_PREFIX} send start`, sampleRate)
      socket.send(JSON.stringify({ event: 'start', sampleRate }))
    },
    async sendAudio(chunk) {
      await openPromise
      console.info(`${LOG_PREFIX} send audio`, chunk?.length || 0)
      socket.send(JSON.stringify({ event: 'audio', chunk }))
    },
    async sendStop() {
      await openPromise
      console.info(`${LOG_PREFIX} send stop`)
      socket.send(JSON.stringify({ event: 'stop' }))
    },
    close() {
      console.info(`${LOG_PREFIX} close requested`)
      socket?.close()
    }
  }
}
