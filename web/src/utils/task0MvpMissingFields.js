import { ButtonKeys, TaskKeys, getFieldConfig } from '@/config/formFieldConfig.js'

import { TASK0_MVP_FIELDS, TASK0_MVP_FIELD_LABELS } from './agentFieldMeta.js'

export function getTask0MvpMissingFields(formData) {
  const fieldConfig = getFieldConfig(TaskKeys.TASK0, ButtonKeys.HANDLE)
  const requiredSet = new Set(fieldConfig.required || [])

  return TASK0_MVP_FIELDS.filter((fieldName) => {
    if (!requiredSet.has(fieldName)) {
      return false
    }

    const value = formData[fieldName]
    return value === '' || value === null || value === undefined
  })
}

export function buildTask0FollowUpMessage(missingFields) {
  if (!missingFields.length) {
    return '当前 MVP 范围内的必填项已经补齐。'
  }

  const labels = missingFields.map((fieldName) => TASK0_MVP_FIELD_LABELS[fieldName] || fieldName)
  return `还缺${labels.join('、')}，请继续补充。`
}
