import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AgentConfirmDialog from '../AgentConfirmDialog.vue'

describe('AgentConfirmDialog', () => {
  it('renders update labels and emits confirm', async () => {
    const wrapper = mount(AgentConfirmDialog, {
      props: {
        visible: true,
        respMessage: '已识别出出发地。',
        updates: [{ fieldName: 'startAddress', fieldValue: '南山' }],
        overwriteFields: [],
        followUpMessage: '还缺目的地，请继续补充。'
      },
      global: {
        stubs: {
          'el-dialog': {
            template: '<div><slot /><slot name="footer" /></div>'
          },
          'el-alert': {
            props: ['title'],
            template: '<div>{{ title }}</div>'
          },
          'el-button': {
            inheritAttrs: false,
            template: '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.text()).toContain('出发地')
    await wrapper.find('[data-testid="confirm-button"]').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
