const STORAGE_VERSION = 1

function normalizeRound(round) {
  if (!round || typeof round !== 'object') {
    return null
  }

  return {
    id: typeof round.id === 'string' ? round.id : '',
    createdAt: typeof round.createdAt === 'string' ? round.createdAt : '',
    userTranscript: typeof round.userTranscript === 'string' ? round.userTranscript : '',
    respMessage: typeof round.respMessage === 'string' ? round.respMessage : '',
    updates: Array.isArray(round.updates) ? round.updates : [],
    overwriteFields: Array.isArray(round.overwriteFields) ? round.overwriteFields : [],
    missingFields: Array.isArray(round.missingFields) ? round.missingFields : [],
    followUpMessage: typeof round.followUpMessage === 'string' ? round.followUpMessage : '',
    status: typeof round.status === 'string' ? round.status : 'processing',
    rawTranscript: typeof round.rawTranscript === 'string' ? round.rawTranscript : '',
    cleanedTranscript: typeof round.cleanedTranscript === 'string' ? round.cleanedTranscript : '',
    confirmed: round.confirmed === true,
    applied: round.applied === true
  }
}

function normalizeVoiceConversationSession(session) {
  if (!session || typeof session !== 'object') {
    return createEmptyVoiceConversationSession()
  }

  const rounds = Array.isArray(session.rounds)
    ? session.rounds.map(normalizeRound).filter(Boolean)
    : []

  return {
    version: STORAGE_VERSION,
    lastRoundId: typeof session.lastRoundId === 'string' ? session.lastRoundId : '',
    rounds
  }
}

export function createEmptyVoiceConversationSession() {
  return {
    version: STORAGE_VERSION,
    lastRoundId: '',
    rounds: []
  }
}

export function buildVoiceConversationStorageKey({
  taskKey = 'unknown',
  buttonKey = 'unknown',
  formNum = 'draft'
} = {}) {
  return `voice-agent:${taskKey}:${buttonKey}:${formNum || 'draft'}`
}

export function readVoiceConversationSession(storage, key) {
  if (!storage || !key) {
    return createEmptyVoiceConversationSession()
  }

  try {
    const rawValue = storage.getItem(key)
    if (!rawValue) {
      return createEmptyVoiceConversationSession()
    }

    return normalizeVoiceConversationSession(JSON.parse(rawValue))
  } catch (error) {
    console.warn('[voice-history] failed to read session', error)
    return createEmptyVoiceConversationSession()
  }
}

export function writeVoiceConversationSession(storage, key, session) {
  if (!storage || !key) {
    return createEmptyVoiceConversationSession()
  }

  const normalizedSession = normalizeVoiceConversationSession(session)

  try {
    storage.setItem(key, JSON.stringify(normalizedSession))
  } catch (error) {
    console.warn('[voice-history] failed to write session', error)
  }

  return normalizedSession
}
