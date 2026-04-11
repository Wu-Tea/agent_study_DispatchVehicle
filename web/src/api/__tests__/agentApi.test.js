import { afterEach, describe, expect, it, vi } from 'vitest'

describe('agentApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('uses the dev proxy path by default', async () => {
    vi.stubEnv('VITE_AGENT_HTTP_URL', '')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ respMessage: 'ok', updates: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { parseTranscript } = await import('../agentApi.js')
    await parseTranscript({ transcript: 'test' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/agent-api/api/agent/parse',
      expect.objectContaining({
        method: 'POST'
      })
    )
  })
})
