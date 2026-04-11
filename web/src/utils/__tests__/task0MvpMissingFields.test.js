import { describe, expect, it } from 'vitest'

import { getTask0MvpMissingFields, buildTask0FollowUpMessage } from '../task0MvpMissingFields'

describe('task0MvpMissingFields', () => {
  it('only reports missing fields inside the MVP whitelist', () => {
    const formData = {
      flagBb: false,
      startAddress: '南山',
      endAddress: '',
      startTime: '',
      endTime: '',
      useCarMatter: '',
      contacts: '',
      contactsPhone: '',
      useCarPersonNum: 2
    }

    const missing = getTask0MvpMissingFields(formData)

    expect(missing).toEqual(['endAddress', 'startTime', 'endTime', 'useCarMatter', 'contacts'])
    expect(buildTask0FollowUpMessage(missing)).toBe('还缺目的地、出车时间、预计返回时间、用车事由、联系人，请继续补充。')
  })
})
