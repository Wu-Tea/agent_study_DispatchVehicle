import { afterEach, describe, expect, it, vi } from 'vitest'

describe('asrSocket', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('uses the dev proxy websocket path by default', async () => {
    vi.stubEnv('VITE_AGENT_WS_URL', '')

    const socketInstance = {
      close: vi.fn(),
      send: vi.fn()
    }
    const webSocketMock = vi.fn(() => socketInstance)
    vi.stubGlobal('WebSocket', webSocketMock)

    const { createAsrSocket } = await import('../asrSocket.js')
    const socket = createAsrSocket({})
    const connectPromise = socket.connect()

    expect(webSocketMock).toHaveBeenCalledWith(`ws://${window.location.host}/agent-api/ws/asr`)

    webSocketMock.mock.results[0].value.onopen()
    await connectPromise
  })
})
