export function downsampleFloat32Buffer(buffer, inputSampleRate, outputSampleRate) {
  if (outputSampleRate >= inputSampleRate) {
    return buffer
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0

  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i += 1) {
      accum += buffer[i]
      count += 1
    }

    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult += 1
    offsetBuffer = nextOffsetBuffer
  }

  return result
}

export function encodePcmChunk(float32Array, inputSampleRate, outputSampleRate = 16000) {
  const downsampled = downsampleFloat32Buffer(float32Array, inputSampleRate, outputSampleRate)
  const pcmBytes = new Uint8Array(downsampled.length * 2)
  const view = new DataView(pcmBytes.buffer)

  for (let i = 0; i < downsampled.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, downsampled[i]))
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    view.setInt16(i * 2, int16, true)
  }

  return pcmBytes
}

export function createSilentPcmChunk(durationMs, sampleRate = 16000) {
  const sampleCount = Math.max(1, Math.round((durationMs / 1000) * sampleRate))
  return new Uint8Array(sampleCount * 2)
}

export function uint8ArrayToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
