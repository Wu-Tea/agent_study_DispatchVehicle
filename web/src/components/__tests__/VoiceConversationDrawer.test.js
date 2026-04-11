import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VoiceConversationDrawer from '../VoiceConversationDrawer.vue'

function mountDrawer(props = {}) {
  return mount(VoiceConversationDrawer, {
    props: {
      visible: true,
      rounds: [],
      ...props
    },
    global: {
      stubs: {
        'el-drawer': {
          props: ['modelValue', 'title'],
          template: `
            <section data-testid="drawer" :data-visible="String(modelValue)" :data-title="title">
              <slot />
            </section>
          `
        },
        'el-tag': {
          props: ['type'],
          template: '<span data-testid="tag" :data-type="type"><slot /></span>'
        },
        'el-empty': {
          props: ['description'],
          template: '<div data-testid="empty">{{ description }}</div>'
        }
      }
    }
  })
}

describe('VoiceConversationDrawer', () => {
  it('renders rounds in reverse chronological order with chat-style user and ai sections', () => {
    const wrapper = mountDrawer({
      rounds: [
        {
          id: 'round-1',
          createdAt: '2026-04-09T09:00:00.000Z',
          userTranscript: '先去南山',
          respMessage: '已识别出出发地。',
          updates: [{ fieldName: 'startAddress', fieldValue: '南山' }],
          overwriteFields: [],
          missingFields: ['endAddress'],
          followUpMessage: '还缺目的地，请继续补充。',
          status: 'pending',
          rawTranscript: '先去南山',
          cleanedTranscript: '先去南山',
          confirmed: false,
          applied: false
        },
        {
          id: 'round-2',
          createdAt: '2026-04-09T09:05:00.000Z',
          userTranscript: '再去宝安机场',
          respMessage: '已识别出目的地。',
          updates: [{ fieldName: 'endAddress', fieldValue: '宝安机场' }],
          overwriteFields: [],
          missingFields: [],
          followUpMessage: '当前 MVP 范围内的必填项已经补齐。',
          status: 'applied',
          rawTranscript: '再去宝安机场',
          cleanedTranscript: '再去宝安机场',
          confirmed: true,
          applied: true
        }
      ]
    })

    const userMessages = wrapper.findAll('[data-testid="user-message"]')
    const aiMessages = wrapper.findAll('[data-testid="ai-message"]')

    expect(userMessages).toHaveLength(2)
    expect(aiMessages).toHaveLength(2)
    expect(userMessages[0].text()).toContain('再去宝安机场')
    expect(aiMessages[0].text()).toContain('已识别出目的地。')
    expect(aiMessages[1].text()).toContain('识别结果')
    expect(aiMessages[1].text()).toContain('出发地：南山')
    expect(aiMessages[1].text()).toContain('还缺内容')
    expect(aiMessages[1].text()).toContain('目的地')
  })

  it('renders an empty state when there is no history yet', () => {
    const wrapper = mountDrawer()

    expect(wrapper.get('[data-testid="empty"]').text()).toContain('暂无语音会话记录')
  })
})
