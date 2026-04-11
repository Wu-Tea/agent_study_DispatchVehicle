export function applyAgentUpdatesToDraft(currentForm, updates) {
  const draft = structuredClone(currentForm)
  updates.forEach(({ fieldName, fieldValue }) => {
    draft[fieldName] = fieldValue
  })
  return draft
}

export function buildOverwritePreview(currentForm, updates) {
  return updates
    .filter(({ fieldName, fieldValue }) => {
      const currentValue = currentForm[fieldName]
      return currentValue !== '' && currentValue !== undefined && currentValue !== null && currentValue !== fieldValue
    })
    .map(({ fieldName, fieldValue }) => ({
      fieldName,
      oldValue: currentForm[fieldName],
      newValue: fieldValue
    }))
}
