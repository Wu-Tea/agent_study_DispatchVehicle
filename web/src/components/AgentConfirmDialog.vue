<script setup>
import { computed } from 'vue'

import { TASK0_MVP_FIELD_LABELS } from '@/utils/agentFieldMeta.js'

const props = defineProps({
  visible: Boolean,
  respMessage: { type: String, default: '' },
  updates: { type: Array, default: () => [] },
  overwriteFields: { type: Array, default: () => [] },
  followUpMessage: { type: String, default: '' }
})

const emit = defineEmits(['confirm', 'cancel'])

const labeledUpdates = computed(() =>
  props.updates.map((item) => ({
    ...item,
    label: TASK0_MVP_FIELD_LABELS[item.fieldName] || item.fieldName
  }))
)

const labeledOverwriteFields = computed(() =>
  props.overwriteFields.map((item) => ({
    ...item,
    label: TASK0_MVP_FIELD_LABELS[item.fieldName] || item.fieldName
  }))
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :teleported="false"
    title="AI 识别结果确认"
    width="640px"
    @close="emit('cancel')"
  >
    <p class="agent-confirm-message">{{ respMessage }}</p>

    <div class="agent-confirm-section">
      <h4>将填写的字段</h4>
      <ul v-if="labeledUpdates.length" class="agent-confirm-list">
        <li v-for="item in labeledUpdates" :key="item.fieldName">
          {{ item.label }}：{{ item.fieldValue }}
        </li>
      </ul>
      <p v-else class="agent-confirm-empty">本轮没有可写入字段。</p>
    </div>

    <div v-if="labeledOverwriteFields.length" class="agent-confirm-section">
      <h4>将覆盖的字段</h4>
      <ul class="agent-confirm-list">
        <li v-for="item in labeledOverwriteFields" :key="item.fieldName">
          {{ item.label }}：{{ item.oldValue }} -> {{ item.newValue }}
        </li>
      </ul>
    </div>

    <el-alert
      v-if="followUpMessage"
      :title="followUpMessage"
      type="info"
      :closable="false"
      class="agent-confirm-alert"
    />

    <template #footer>
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button data-testid="confirm-button" type="primary" @click="emit('confirm')">
        确认写入
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.agent-confirm-message {
  margin: 0 0 12px;
  line-height: 1.6;
}

.agent-confirm-section {
  margin-top: 12px;
}

.agent-confirm-section h4 {
  margin: 0 0 8px;
  font-size: 14px;
}

.agent-confirm-list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
}

.agent-confirm-empty {
  margin: 0;
  color: #909399;
}

.agent-confirm-alert {
  margin-top: 16px;
}
</style>
