const agentHttpBaseUrl = import.meta.env.VITE_AGENT_HTTP_URL || '/agent-api'

export async function cleanupTranscript(payload) {
  const response = await fetch(`${agentHttpBaseUrl}/api/agent/cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      detail = errorBody?.detail ? ` ${errorBody.detail}` : ''
    } catch {
      detail = ''
    }
    throw new Error(`Cleanup request failed: ${response.status}${detail}`)
  }

  return response.json()
}

export async function parseTranscript(payload) {
  const response = await fetch(`${agentHttpBaseUrl}/api/agent/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    let detail = ''
    try {
      const errorBody = await response.json()
      detail = errorBody?.detail ? ` ${errorBody.detail}` : ''
    } catch {
      detail = ''
    }
    throw new Error(`Parse request failed: ${response.status}${detail}`)
  }

  return response.json()
}
