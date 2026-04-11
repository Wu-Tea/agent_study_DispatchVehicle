import { describe, expect, it, vi } from 'vitest'

import { useVoiceAgent } from '../useVoiceAgent'

function createSocketHarness() {
  const connect = vi.fn()
  const sendStart = vi.fn()
  const sendAudio = vi.fn()
  const sendStop = vi.fn()
  const close = vi.fn()
  let handlers = null

  return {
    connect,
    sendStart,
    sendAudio,
    sendStop,
    close,
    getHandlers: () => handlers,
    createAsrSocket: ({ onPartial, onFinal, onError }) => {
      handlers = { onPartial, onFinal, onError }
      return {
        connect,
        sendStart,
        sendAudio,
        sendStop,
        close
      }
    }
  }
}

describe('useVoiceAgent', () => {
  it('opens the confirm dialog after cleanup and submit both succeed', async () => {
    const cleanupTranscript = vi.fn().mockResolvedValue({
      rawTranscript: '\u4ece\u5357\u5c71\u51fa\u53d1',
      cleanedTranscript: '\u4ece\u5357\u5c71\u51fa\u53d1\u3002',
      cleanupMeta: {
        ruleApplied: true,
        ollamaAttempted: false,
        ollamaUsed: false,
        fallbackToRuleCleaned: false
      }
    })
    const parseTranscript = vi.fn().mockResolvedValue({
      respMessage: '\u5df2\u8bc6\u522b\u51fa\u51fa\u53d1\u5730\u3002',
      updates: [{ fieldName: 'startAddress', fieldValue: '\u5357\u5c71' }],
      overwriteFields: [],
      confirmRequired: true
    })

    const voiceAgent = useVoiceAgent({
      cleanupTranscript,
      parseTranscript,
      createAsrSocket: () => ({
        connect: vi.fn(),
        sendStart: vi.fn(),
        sendAudio: vi.fn(),
        sendStop: vi.fn(),
        close: vi.fn()
      })
    })

    await voiceAgent.handleFinalTranscript('\u4ece\u5357\u5c71\u51fa\u53d1', { startAddress: '' })
    await voiceAgent.submitCurrentTranscript({ startAddress: '' })

    expect(cleanupTranscript).toHaveBeenCalledTimes(1)
    expect(parseTranscript).toHaveBeenCalledTimes(1)
    expect(voiceAgent.currentTranscript.value).toBe('\u4ece\u5357\u5c71\u51fa\u53d1\u3002')
    expect(voiceAgent.confirmDialogVisible.value).toBe(true)
    expect(voiceAgent.agentResult.value.respMessage).toContain('\u5df2\u8bc6\u522b\u51fa')
  })

  it('merges partial chunks into a cumulative live transcript', async () => {
    const socketHarness = createSocketHarness()
    const voiceAgent = useVoiceAgent({
      parseTranscript: vi.fn(),
      createAsrSocket: socketHarness.createAsrSocket
    })

    await voiceAgent.startVoiceSession()

    socketHarness.getHandlers().onPartial('\u4ece\u5357\u5c71')
    expect(voiceAgent.partialTranscript.value).toBe('\u4ece\u5357\u5c71')

    socketHarness.getHandlers().onPartial('\u4ece\u5357\u5c71\u51fa\u53d1')
    expect(voiceAgent.partialTranscript.value).toBe('\u4ece\u5357\u5c71\u51fa\u53d1')

    socketHarness.getHandlers().onPartial('\u53bb\u673a\u573a')
    expect(voiceAgent.partialTranscript.value).toBe('\u4ece\u5357\u5c71\u51fa\u53d1\u53bb\u673a\u573a')

    socketHarness.getHandlers().onPartial('\u53bb\u673a\u573a')
    expect(voiceAgent.partialTranscript.value).toBe('\u4ece\u5357\u5c71\u51fa\u53d1\u53bb\u673a\u573a')
  })

  it('falls back to the cumulative partial transcript when final transcript is empty before cleanup', async () => {
    const socketHarness = createSocketHarness()
    const cleanupTranscript = vi.fn().mockResolvedValue({
      rawTranscript: '\u6211\u4eca\u5929\u4e0b\u5348\u56db\u70b9\u8981\u5e26\u738b\u4e94\u53bb\u5317\u4eac\u62dc\u8bbf\u5ba2\u6237',
      cleanedTranscript: '\u6211\u4eca\u5929\u4e0b\u5348\u56db\u70b9\u8981\u5e26\u738b\u4e94\u53bb\u5317\u4eac\u62dc\u8bbf\u5ba2\u6237\u3002',
      cleanupMeta: {
        ruleApplied: true,
        ollamaAttempted: false,
        ollamaUsed: false,
        fallbackToRuleCleaned: false
      }
    })
    const voiceAgent = useVoiceAgent({
      cleanupTranscript,
      parseTranscript: vi.fn(),
      createAsrSocket: socketHarness.createAsrSocket,
      getFormData: () => ({ startAddress: '' })
    })

    await voiceAgent.startVoiceSession()
    socketHarness.getHandlers().onPartial('\u6211\u4eca\u5929\u4e0b\u5348\u56db\u70b9\u8981\u5e26\u738b\u4e94\u53bb\u5317\u4eac\u62dc\u8bbf\u5ba2\u6237')
    socketHarness.getHandlers().onFinal('')
    await Promise.resolve()
    await Promise.resolve()

    expect(cleanupTranscript).toHaveBeenCalledTimes(1)
    expect(cleanupTranscript.mock.calls[0][0].transcript).toBe(
      '\u6211\u4eca\u5929\u4e0b\u5348\u56db\u70b9\u8981\u5e26\u738b\u4e94\u53bb\u5317\u4eac\u62dc\u8bbf\u5ba2\u6237'
    )
    expect(voiceAgent.currentTranscript.value).toBe(
      '\u6211\u4eca\u5929\u4e0b\u5348\u56db\u70b9\u8981\u5e26\u738b\u4e94\u53bb\u5317\u4eac\u62dc\u8bbf\u5ba2\u6237\u3002'
    )
    expect(voiceAgent.partialTranscript.value).toBe('')
  })

  it('does not call cleanup when both final and partial transcripts are empty', async () => {
    const socketHarness = createSocketHarness()
    const cleanupTranscript = vi.fn()
    const voiceAgent = useVoiceAgent({
      cleanupTranscript,
      parseTranscript: vi.fn(),
      createAsrSocket: socketHarness.createAsrSocket,
      getFormData: () => ({})
    })

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await voiceAgent.startVoiceSession()
    socketHarness.getHandlers().onFinal('')
    await Promise.resolve()
    await Promise.resolve()

    expect(cleanupTranscript).not.toHaveBeenCalled()
    expect(voiceAgent.confirmDialogVisible.value).toBe(false)
    expect(consoleWarnSpy).toHaveBeenCalled()

    consoleWarnSpy.mockRestore()
  })

  it('runs cleanup after final transcript and only parses when submit is called', async () => {
    const socketHarness = createSocketHarness()
    const cleanupTranscript = vi.fn().mockResolvedValue({
      rawTranscript: '那个 我明天中午十二点返回',
      cleanedTranscript: '我明天中午十二点返回。',
      cleanupMeta: {
        ruleApplied: true,
        ollamaAttempted: true,
        ollamaUsed: true,
        fallbackToRuleCleaned: false
      }
    })
    const parseTranscript = vi.fn().mockResolvedValue({
      respMessage: '已识别出返回时间。',
      updates: [{ fieldName: 'endTime', fieldValue: '2026-04-10 12:00:00' }],
      overwriteFields: [],
      confirmRequired: true
    })

    const voiceAgent = useVoiceAgent({
      cleanupTranscript,
      parseTranscript,
      createAsrSocket: socketHarness.createAsrSocket,
      getFormData: () => ({ endTime: '' })
    })

    await voiceAgent.startVoiceSession()
    socketHarness.getHandlers().onFinal('那个 我明天中午十二点返回')
    await Promise.resolve()
    await Promise.resolve()

    expect(cleanupTranscript).toHaveBeenCalledTimes(1)
    expect(parseTranscript).not.toHaveBeenCalled()
    expect(voiceAgent.currentTranscript.value).toBe('我明天中午十二点返回。')

    await voiceAgent.submitCurrentTranscript({ endTime: '' })

    expect(parseTranscript).toHaveBeenCalledTimes(1)
    expect(parseTranscript.mock.calls[0][0].transcript).toBe('我明天中午十二点返回。')
    expect(voiceAgent.confirmDialogVisible.value).toBe(true)
  })

  it('resets the current transcript without touching history state', () => {
    const voiceAgent = useVoiceAgent({
      cleanupTranscript: vi.fn(),
      parseTranscript: vi.fn(),
      createAsrSocket: () => ({
        connect: vi.fn(),
        sendStart: vi.fn(),
        sendAudio: vi.fn(),
        sendStop: vi.fn(),
        close: vi.fn()
      })
    })

    voiceAgent.currentTranscript.value = '我明天中午十二点返回。'
    voiceAgent.cleanupResult.value = {
      rawTranscript: '那个 我明天中午十二点返回',
      cleanedTranscript: '我明天中午十二点返回。'
    }

    voiceAgent.resetCurrentTranscript()

    expect(voiceAgent.currentTranscript.value).toBe('')
    expect(voiceAgent.cleanupResult.value).toBe(null)
  })
})
