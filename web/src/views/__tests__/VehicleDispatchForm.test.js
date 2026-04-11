import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildVoiceConversationStorageKey } from '@/utils/voiceConversationSession.js'

const elementStubs = Object.fromEntries(
  [
    'el-select',
    'el-option',
    'el-tabs',
    'el-tab-pane',
    'el-form',
    'el-form-item',
    'el-input',
    'el-icon',
    'el-button',
    'el-date-picker',
    'el-radio',
    'el-radio-group',
    'el-input-number',
    'el-row',
    'el-col',
    'el-table',
    'el-table-column',
    'el-dialog',
    'el-drawer'
  ].map((name) => [name, true])
)

const voiceAgentState = {
  recording: ref(true),
  partialTranscript: ref('\u5b9e\u65f6\u8f6c\u5199'),
  liveTranscript: ref('\u5b9e\u65f6\u8f6c\u5199'),
  currentTranscript: ref('\u6700\u7ec8\u6587\u672c'),
  cleanupResult: ref(null),
  agentResult: ref({
    respMessage: '\u5df2\u8bc6\u522b\u51fa\u51fa\u53d1\u5730',
    updates: [{ fieldName: 'startAddress', fieldValue: '\u5357\u5c71' }],
    overwriteFields: []
  }),
  confirmDialogVisible: ref(true),
  startVoiceSession: vi.fn(),
  sendAudioChunk: vi.fn(),
  stopVoiceSession: vi.fn(),
  closeVoiceSession: vi.fn(),
  handleFinalTranscript: vi.fn(),
  submitCurrentTranscript: vi.fn(),
  resetCurrentTranscript: vi.fn()
}

vi.mock('@/composables/useVoiceAgent.js', () => ({
  useVoiceAgent: () => voiceAgentState
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

import VehicleDispatchForm from '../VehicleDispatchForm.vue'
import { ElMessage } from 'element-plus'

function mountForm() {
  return mount(VehicleDispatchForm, {
    global: {
      stubs: {
        ...elementStubs,
        Location: true,
        Plus: true,
        Remove: true,
        Minus: true,
        VoiceRecorderPanel: {
          props: ['recording', 'partialTranscript', 'currentTranscript', 'followUpMessage', 'historyCount'],
          template: `
            <div
              data-testid="voice-panel"
              :data-recording="String(recording)"
              :data-partial="partialTranscript"
              :data-current="currentTranscript"
              :data-history-count="String(historyCount || 0)"
            >
              <button data-testid="start-voice" @click="$emit('start')" />
              <button data-testid="stop-voice" @click="$emit('stop')" />
              <button data-testid="open-history" @click="$emit('open-history')" />
              <button data-testid="reset-current" @click="$emit('reset-current')" />
              <button data-testid="submit-current" @click="$emit('submit-current')" />
            </div>
          `
        },
        AgentConfirmDialog: {
          props: ['visible', 'respMessage', 'updates', 'overwriteFields', 'followUpMessage'],
          template: `
            <div
              data-testid="confirm-dialog"
              :data-visible="String(visible)"
              :data-message="respMessage"
              :data-updates="Array.isArray(updates) ? String(updates.length) : 'not-array'"
            >
              <button data-testid="confirm-button" @click="$emit('confirm')" />
              <button data-testid="cancel-button" @click="$emit('cancel')" />
            </div>
          `
        },
        VoiceConversationDrawer: {
          props: ['visible', 'rounds'],
          template: `
            <div
              data-testid="history-drawer"
              :data-visible="String(visible)"
              :data-rounds="Array.isArray(rounds) ? String(rounds.length) : 'not-array'"
              :data-latest-status="rounds?.[rounds.length - 1]?.status || ''"
              :data-latest-follow-up="rounds?.[rounds.length - 1]?.followUpMessage || ''"
            />
          `
        }
      }
    }
  })
}

describe('VehicleDispatchForm', () => {
  beforeEach(() => {
    voiceAgentState.recording.value = true
    voiceAgentState.partialTranscript.value = '\u5b9e\u65f6\u8f6c\u5199'
    voiceAgentState.liveTranscript.value = '\u5b9e\u65f6\u8f6c\u5199'
    voiceAgentState.currentTranscript.value = '\u6700\u7ec8\u6587\u672c'
    voiceAgentState.cleanupResult.value = null
    voiceAgentState.agentResult.value = {
      respMessage: '\u5df2\u8bc6\u522b\u51fa\u51fa\u53d1\u5730',
      updates: [{ fieldName: 'startAddress', fieldValue: '\u5357\u5c71' }],
      overwriteFields: []
    }
    voiceAgentState.confirmDialogVisible.value = true
    voiceAgentState.startVoiceSession.mockReset()
    voiceAgentState.sendAudioChunk.mockReset()
    voiceAgentState.stopVoiceSession.mockReset()
    voiceAgentState.closeVoiceSession.mockReset()
    voiceAgentState.handleFinalTranscript.mockReset()
    voiceAgentState.submitCurrentTranscript.mockReset()
    voiceAgentState.resetCurrentTranscript.mockReset()
    ElMessage.success.mockReset()
    ElMessage.error.mockReset()
    ElMessage.info.mockReset()
    ElMessage.warning.mockReset()
    window.sessionStorage.clear()
  })

  it('passes unwrapped voice agent state into child components', () => {
    const wrapper = mountForm()

    const voicePanel = wrapper.get('[data-testid="voice-panel"]')
    const confirmDialog = wrapper.get('[data-testid="confirm-dialog"]')

    expect(voicePanel.attributes('data-recording')).toBe('true')
    expect(voicePanel.attributes('data-partial')).toBe('\u5b9e\u65f6\u8f6c\u5199')
    expect(voicePanel.attributes('data-current')).toBe('\u6700\u7ec8\u6587\u672c')
    expect(confirmDialog.attributes('data-visible')).toBe('true')
    expect(confirmDialog.attributes('data-message')).toBe('\u5df2\u8bc6\u522b\u51fa\u51fa\u53d1\u5730')
    expect(confirmDialog.attributes('data-updates')).toBe('1')
    expect(voicePanel.attributes('data-history-count')).toBe('0')
  })

  it('shows service error instead of permission error when mic access succeeds but voice session fails', async () => {
    const stopTrack = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia }
    })

    voiceAgentState.startVoiceSession.mockRejectedValueOnce(new Error('ws connect failed'))

    const wrapper = mountForm()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await wrapper.get('[data-testid="start-voice"]').trigger('click')
    await flushPromises()

    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    expect(voiceAgentState.startVoiceSession).toHaveBeenCalled()
    expect(voiceAgentState.closeVoiceSession).toHaveBeenCalled()
    expect(stopTrack).toHaveBeenCalled()
    expect(ElMessage.error).toHaveBeenCalledWith('\u8bed\u97f3\u670d\u52a1\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5')

    consoleErrorSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('shows unsupported capture error when audio context is unavailable after mic access succeeds', async () => {
    const stopTrack = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia }
    })
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: undefined
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined
    })

    const wrapper = mountForm()
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await wrapper.get('[data-testid="start-voice"]').trigger('click')
    await flushPromises()

    expect(voiceAgentState.startVoiceSession).toHaveBeenCalled()
    expect(voiceAgentState.closeVoiceSession).toHaveBeenCalled()
    expect(stopTrack).toHaveBeenCalled()
    expect(ElMessage.error).toHaveBeenCalledWith('\u5f53\u524d\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u8bed\u97f3\u5f55\u5236')

    consoleErrorSpy.mockRestore()
  })

  it('waits briefly before stopping so the final audio chunk can flush', async () => {
    vi.useFakeTimers()

    const stopTrack = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia }
    })

    const mediaSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    }
    const scriptProcessorNode = {
      bufferSize: 4096,
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null
    }
    const silentGainNode = {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
    const createScriptProcessor = vi.fn(() => scriptProcessorNode)

    class FakeAudioContext {
      constructor() {
        this.sampleRate = 48000
        this.destination = {}
      }

      createMediaStreamSource() {
        return mediaSourceNode
      }

      createScriptProcessor(...args) {
        return createScriptProcessor(...args)
      }

      createGain() {
        return silentGainNode
      }

      resume() {
        return Promise.resolve()
      }

      close() {
        return Promise.resolve()
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined
    })

    voiceAgentState.recording.value = false

    const wrapper = mountForm()

    await wrapper.get('[data-testid="start-voice"]').trigger('click')
    await flushPromises()

    expect(voiceAgentState.startVoiceSession).toHaveBeenCalled()
    expect(createScriptProcessor).toHaveBeenCalled()

    await wrapper.get('[data-testid="stop-voice"]').trigger('click')
    await flushPromises()

    expect(stopTrack).not.toHaveBeenCalled()
    expect(voiceAgentState.sendAudioChunk).not.toHaveBeenCalled()
    expect(voiceAgentState.stopVoiceSession).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()

    expect(stopTrack).not.toHaveBeenCalled()
    expect(voiceAgentState.sendAudioChunk).not.toHaveBeenCalled()
    expect(voiceAgentState.stopVoiceSession).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(160)
    await flushPromises()

    expect(voiceAgentState.sendAudioChunk).toHaveBeenCalledTimes(1)
    expect(voiceAgentState.sendAudioChunk.mock.calls[0][0].length).toBeGreaterThan(0)
    expect(stopTrack).toHaveBeenCalled()
    expect(voiceAgentState.stopVoiceSession).toHaveBeenCalled()
    expect(voiceAgentState.sendAudioChunk.mock.invocationCallOrder[0]).toBeLessThan(
      voiceAgentState.stopVoiceSession.mock.invocationCallOrder[0]
    )

    vi.useRealTimers()
  })

  it('uses a smaller audio processor buffer to reduce tail loss', async () => {
    const stopTrack = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia }
    })

    const mediaSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn()
    }
    const scriptProcessorNode = {
      bufferSize: 1024,
      connect: vi.fn(),
      disconnect: vi.fn(),
      onaudioprocess: null
    }
    const silentGainNode = {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn()
    }
    const createScriptProcessor = vi.fn(() => scriptProcessorNode)

    class FakeAudioContext {
      constructor() {
        this.sampleRate = 48000
        this.destination = {}
      }

      createMediaStreamSource() {
        return mediaSourceNode
      }

      createScriptProcessor(...args) {
        return createScriptProcessor(...args)
      }

      createGain() {
        return silentGainNode
      }

      resume() {
        return Promise.resolve()
      }

      close() {
        return Promise.resolve()
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext
    })
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: undefined
    })

    const wrapper = mountForm()

    await wrapper.get('[data-testid="start-voice"]').trigger('click')
    await flushPromises()

    expect(createScriptProcessor).toHaveBeenCalledWith(1024, 1, 1)
  })

  it('creates history only after submit succeeds and updates it after confirm', async () => {
    voiceAgentState.recording.value = false
    voiceAgentState.partialTranscript.value = ''
    voiceAgentState.liveTranscript.value = ''
    voiceAgentState.currentTranscript.value = '明天上午九点从南山出发'
    voiceAgentState.cleanupResult.value = {
      rawTranscript: '那个 明天上午九点从南山出发',
      cleanedTranscript: '明天上午九点从南山出发'
    }
    voiceAgentState.agentResult.value = null
    voiceAgentState.confirmDialogVisible.value = false
    voiceAgentState.submitCurrentTranscript.mockImplementation(async () => {
      voiceAgentState.agentResult.value = {
        respMessage: '已识别出出发地和出车时间。',
        updates: [
          { fieldName: 'startAddress', fieldValue: '南山' },
          { fieldName: 'startTime', fieldValue: '2026-04-10 09:00:00' }
        ],
        overwriteFields: [],
        rawTranscript: '那个 明天上午九点从南山出发',
        cleanedTranscript: '明天上午九点从南山出发'
      }
      return voiceAgentState.agentResult.value
    })

    const wrapper = mountForm()
    const storageKey = buildVoiceConversationStorageKey({
      taskKey: 'UserTask_0',
      buttonKey: 'HANDLE',
      formNum: 'VD-2026-AUTO-001'
    })

    expect(window.sessionStorage.getItem(storageKey)).toBeNull()

    await wrapper.get('[data-testid="submit-current"]').trigger('click')
    await flushPromises()

    let session = JSON.parse(window.sessionStorage.getItem(storageKey))
    expect(session.rounds).toHaveLength(1)
    expect(session.rounds[0].userTranscript).toBe('明天上午九点从南山出发')
    expect(session.rounds[0].respMessage).toBe('已识别出出发地和出车时间。')
    expect(session.rounds[0].status).toBe('pending')
    expect(session.rounds[0].followUpMessage).toContain('还缺')

    await wrapper.get('[data-testid="confirm-button"]').trigger('click')
    await flushPromises()

    session = JSON.parse(window.sessionStorage.getItem(storageKey))
    expect(session.rounds[0].status).toBe('applied')
    expect(session.rounds[0].applied).toBe(true)
    expect(session.rounds[0].followUpMessage).toContain('还缺')
  })

  it('restores persisted history into the drawer and keeps cancelled rounds', async () => {
    const storageKey = buildVoiceConversationStorageKey({
      taskKey: 'UserTask_0',
      buttonKey: 'HANDLE',
      formNum: 'VD-2026-AUTO-001'
    })
    window.sessionStorage.setItem(storageKey, JSON.stringify({
      version: 1,
      lastRoundId: 'round-1',
      rounds: [
        {
          id: 'round-1',
          createdAt: '2026-04-09T09:00:00.000Z',
          userTranscript: '去宝安机场',
          respMessage: '已识别出目的地。',
          updates: [{ fieldName: 'endAddress', fieldValue: '宝安机场' }],
          overwriteFields: [],
          missingFields: ['startAddress'],
          followUpMessage: '还缺出发地，请继续补充。',
          status: 'cancelled',
          rawTranscript: '去宝安机场',
          cleanedTranscript: '去宝安机场',
          confirmed: false,
          applied: false
        }
      ]
    }))

    const wrapper = mountForm()
    await flushPromises()

    expect(wrapper.get('[data-testid="voice-panel"]').attributes('data-history-count')).toBe('1')

    await wrapper.get('[data-testid="open-history"]').trigger('click')
    await flushPromises()

    const drawer = wrapper.get('[data-testid="history-drawer"]')
    expect(drawer.attributes('data-visible')).toBe('true')
    expect(drawer.attributes('data-rounds')).toBe('1')
    expect(drawer.attributes('data-latest-status')).toBe('cancelled')
    expect(drawer.attributes('data-latest-follow-up')).toContain('还缺出发地')
  })

  it('resets current transcript and blocks submit when it is empty', async () => {
    voiceAgentState.currentTranscript.value = '   '
    const wrapper = mountForm()

    await wrapper.get('[data-testid="submit-current"]').trigger('click')
    await flushPromises()

    expect(voiceAgentState.submitCurrentTranscript).not.toHaveBeenCalled()
    expect(ElMessage.warning).toHaveBeenCalledWith('当前没有可提交的语音文字')

    await wrapper.get('[data-testid="reset-current"]').trigger('click')

    expect(voiceAgentState.resetCurrentTranscript).toHaveBeenCalledTimes(1)
  })
})
