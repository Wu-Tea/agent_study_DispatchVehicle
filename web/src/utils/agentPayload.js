import { UseCarMatterEnums } from '@/config/enumData.js'

import { TASK0_MVP_FIELDS } from './agentFieldMeta.js'

export function buildAgentParsePayload({ transcript, formData }) {
  return {
    taskKey: 'UserTask_0',
    buttonKey: 'HANDLE',
    transcript,
    formData,
    supportedFields: TASK0_MVP_FIELDS,
    fieldOptions: {
      useCarMatter: UseCarMatterEnums.map((item) => ({
        key: item.key,
        label: item.value
      }))
    }
  }
}
