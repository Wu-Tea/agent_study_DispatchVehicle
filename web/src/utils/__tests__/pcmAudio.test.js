import { describe, expect, it } from 'vitest'

import { createSilentPcmChunk, downsampleFloat32Buffer, encodePcmChunk, uint8ArrayToBase64 } from '../pcmAudio.js'

describe('pcmAudio', () => {
  it('downsamples float32 audio to target sample rate', () => {
    const input = new Float32Array([0, 0.25, 0.5, 0.75, 1, -1])

    const result = downsampleFloat32Buffer(input, 48000, 16000)

    expect(Array.from(result)).toEqual([0.25, 0.25])
  })

  it('encodes float32 samples into 16-bit little-endian pcm bytes', () => {
    const input = new Float32Array([0, 1, -1])

    const result = encodePcmChunk(input, 16000, 16000)

    expect(Array.from(result)).toEqual([0, 0, 255, 127, 0, 128])
  })

  it('converts pcm bytes to base64', () => {
    const bytes = new Uint8Array([1, 2, 3, 4])

    expect(uint8ArrayToBase64(bytes)).toBe('AQIDBA==')
  })

  it('creates a silent pcm chunk for the requested duration', () => {
    const bytes = createSilentPcmChunk(120, 16000)

    expect(bytes).toHaveLength(3840)
    expect(Array.from(bytes.slice(0, 8))).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })
})
