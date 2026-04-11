import { ref } from 'vue'

import {
  cleanupTranscript as defaultCleanupTranscript,
  parseTranscript as defaultParseTranscript
} from '@/api/agentApi.js'
import { createAsrSocket as defaultCreateAsrSocket } from '@/api/asrSocket.js'
import { buildAgentParsePayload } from '@/utils/agentPayload.js'

const LOG_PREFIX = '[voice-agent]'

function mergeTranscriptText(previousText, nextText) {
  if (!nextText) {
    return previousText
  }

  if (!previousText) {
    return nextText
  }

  if (nextText.startsWith(previousText)) {
    return nextText
  }

  if (previousText.endsWith(nextText)) {
    return previousText
  }

  const maxOverlap = Math.min(previousText.length, nextText.length)
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (previousText.slice(-overlap) === nextText.slice(0, overlap)) {
      return `${previousText}${nextText.slice(overlap)}`
    }
  }

  return `${previousText}${nextText}`
}

function resolveTranscriptForParse(finalText, partialText) {
  const normalizedFinalText = finalText?.trim() || ''
  if (normalizedFinalText) {
    return normalizedFinalText
  }

  return partialText?.trim() || ''
}

export function useVoiceAgent({
  cleanupTranscript = defaultCleanupTranscript,
  parseTranscript = defaultParseTranscript,
  createAsrSocket = defaultCreateAsrSocket,
  getFormData = () => ({})
} = {}) {
  const recording = ref(false)
  const partialTranscript = ref('')
  const liveTranscript = ref('')
  const currentTranscript = ref('')
  const cleanupResult = ref(null)
  const agentResult = ref(null)
  const confirmDialogVisible = ref(false)
  let asrSocket

  async function startVoiceSession(sampleRate = 16000) {
    console.info(`${LOG_PREFIX} startVoiceSession`, sampleRate)
    recording.value = true
    partialTranscript.value = ''
    liveTranscript.value = ''

    asrSocket = createAsrSocket({
      onPartial(text) {
        console.info(`${LOG_PREFIX} partial transcript`, text)
        partialTranscript.value = mergeTranscriptText(partialTranscript.value, text)
        liveTranscript.value = partialTranscript.value
      },
      onFinal(text) {
        console.info(`${LOG_PREFIX} final transcript`, text)
        void handleFinalTranscript(text, getFormData()).catch(() => {})
      },
      onError(error) {
        console.error(`${LOG_PREFIX} websocket error`, error)
        recording.value = false
      }
    })

    await asrSocket.connect()
    await asrSocket.sendStart(sampleRate)
  }

  async function sendAudioChunk(base64Chunk) {
    console.info(`${LOG_PREFIX} sendAudioChunk`, base64Chunk?.length || 0)
    await asrSocket?.sendAudio(base64Chunk)
  }

  async function stopVoiceSession() {
    console.info(`${LOG_PREFIX} stopVoiceSession`)
    recording.value = false
    await asrSocket?.sendStop()
  }

  async function handleFinalTranscript(transcript, formData) {
    const resolvedTranscript = resolveTranscriptForParse(transcript, partialTranscript.value)

    if (!resolvedTranscript) {
      console.warn(`${LOG_PREFIX} skip cleanup because transcript is empty`)
      currentTranscript.value = ''
      cleanupResult.value = null
      partialTranscript.value = ''
      liveTranscript.value = ''
      confirmDialogVisible.value = false
      return
    }

    console.info(`${LOG_PREFIX} cleanup transcript start`, resolvedTranscript)
    partialTranscript.value = ''
    liveTranscript.value = ''
    try {
      cleanupResult.value = await cleanupTranscript({ transcript: resolvedTranscript, formData })
      currentTranscript.value = cleanupResult.value.cleanedTranscript || resolvedTranscript
      console.info(`${LOG_PREFIX} cleanup transcript success`, cleanupResult.value)
    } catch (error) {
      console.error(`${LOG_PREFIX} cleanup transcript failed`, error)
      throw error
    }
  }

  async function submitCurrentTranscript(formData) {
    const transcript = currentTranscript.value.trim()
    if (!transcript) {
      return null
    }

    console.info(`${LOG_PREFIX} parse transcript start`, transcript)
    const payload = buildAgentParsePayload({ transcript, formData })

    try {
      agentResult.value = await parseTranscript(payload)
      console.info(`${LOG_PREFIX} parse transcript success`, agentResult.value)
      confirmDialogVisible.value = true
      return agentResult.value
    } catch (error) {
      console.error(`${LOG_PREFIX} parse transcript failed`, error)
      throw error
    }
  }

  function resetCurrentTranscript() {
    currentTranscript.value = ''
    cleanupResult.value = null
  }

  function closeVoiceSession() {
    console.info(`${LOG_PREFIX} closeVoiceSession`)
    recording.value = false
    asrSocket?.close()
  }

  return {
    recording,
    partialTranscript,
    liveTranscript,
    currentTranscript,
    cleanupResult,
    agentResult,
    confirmDialogVisible,
    startVoiceSession,
    sendAudioChunk,
    stopVoiceSession,
    closeVoiceSession,
    handleFinalTranscript,
    submitCurrentTranscript,
    resetCurrentTranscript
  }
}
