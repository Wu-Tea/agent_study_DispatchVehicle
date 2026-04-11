import { describe, expect, it } from 'vitest'

import { applyAgentUpdatesToDraft, buildOverwritePreview } from '../agentDraft'

describe('agentDraft', () => {
  it('applies direct updates and records overwrite preview', () => {
    const currentForm = {
      startAddress: '福田',
      endAddress: '',
      useCarPersonNum: 2
    }

    const updates = [
      { fieldName: 'startAddress', fieldValue: '南山' },
      { fieldName: 'endAddress', fieldValue: '宝安' }
    ]

    const draft = applyAgentUpdatesToDraft(currentForm, updates)
    const overwritePreview = buildOverwritePreview(currentForm, updates)

    expect(draft.startAddress).toBe('南山')
    expect(draft.endAddress).toBe('宝安')
    expect(overwritePreview).toEqual([
      { fieldName: 'startAddress', oldValue: '福田', newValue: '南山' }
    ])
  })
})
