import { describe, expect, it } from 'vitest'

import {
  buildVoiceConversationStorageKey,
  createEmptyVoiceConversationSession,
  readVoiceConversationSession,
  writeVoiceConversationSession
} from '../voiceConversationSession.js'

function createMemoryStorage() {
  const store = new Map()

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, value)
    },
    removeItem(key) {
      store.delete(key)
    }
  }
}

describe('voiceConversationSession', () => {
  it('builds a stable storage key for the current form session', () => {
    expect(buildVoiceConversationStorageKey({
      taskKey: 'UserTask_0',
      buttonKey: 'HANDLE',
      formNum: 'VD-2026-AUTO-001'
    })).toBe('voice-agent:UserTask_0:HANDLE:VD-2026-AUTO-001')
  })

  it('returns an empty session shape when storage is empty or invalid', () => {
    const storage = createMemoryStorage()

    expect(readVoiceConversationSession(storage, 'voice-agent:test')).toEqual({
      version: 1,
      lastRoundId: '',
      rounds: []
    })

    storage.setItem('voice-agent:test', '{"version":1,"rounds":"bad"}')

    expect(readVoiceConversationSession(storage, 'voice-agent:test')).toEqual({
      version: 1,
      lastRoundId: '',
      rounds: []
    })
  })

  it('persists normalized round history into storage', () => {
    const storage = createMemoryStorage()
    const key = 'voice-agent:test'
    const session = createEmptyVoiceConversationSession()

    session.lastRoundId = 'round-2'
    session.rounds.push(
      {
        id: 'round-1',
        createdAt: '2026-04-09T09:00:00.000Z',
        userTranscript: '从南山出发',
        respMessage: '已识别出出发地。',
        updates: [{ fieldName: 'startAddress', fieldValue: '南山' }],
        overwriteFields: [],
        missingFields: ['endAddress'],
        followUpMessage: '还缺目的地，请继续补充。',
        status: 'pending',
        rawTranscript: '从南山出发',
        cleanedTranscript: '从南山出发',
        confirmed: false,
        applied: false
      },
      {
        id: 'round-2',
        createdAt: '2026-04-09T09:05:00.000Z',
        userTranscript: '去宝安机场',
        respMessage: '已识别出目的地。',
        updates: [{ fieldName: 'endAddress', fieldValue: '宝安机场' }],
        overwriteFields: [],
        missingFields: [],
        followUpMessage: '当前 MVP 范围内的必填项已经补齐。',
        status: 'applied',
        rawTranscript: '去宝安机场',
        cleanedTranscript: '去宝安机场',
        confirmed: true,
        applied: true
      }
    )

    writeVoiceConversationSession(storage, key, session)

    expect(readVoiceConversationSession(storage, key)).toEqual(session)
  })
})
