<script setup>
import { computed } from 'vue'

import { TASK0_MVP_FIELD_LABELS } from '@/utils/agentFieldMeta.js'

const props = defineProps({
  visible: Boolean,
  rounds: { type: Array, default: () => [] }
})

const emit = defineEmits(['close'])

const statusMap = {
  processing: { label: '处理中', type: 'info' },
  pending: { label: '待确认', type: 'warning' },
  applied: { label: '已写入', type: 'success' },
  cancelled: { label: '已取消', type: 'info' }
}

const orderedRounds = computed(() => [...props.rounds].reverse())

function getFieldLabel(fieldName) {
  return TASK0_MVP_FIELD_LABELS[fieldName] || fieldName
}

function getStatusMeta(status) {
  return statusMap[status] || statusMap.processing
}

function formatRoundTime(createdAt) {
  if (!createdAt) {
    return ''
  }

  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) {
    return createdAt
  }

  const year = parsed.getFullYear()
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  const hour = `${parsed.getHours()}`.padStart(2, '0')
  const minute = `${parsed.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="语音会话记录"
    size="480px"
    @close="emit('close')"
  >
    <div v-if="orderedRounds.length" class="conversation-history">
      <section
        v-for="round in orderedRounds"
        :key="round.id"
        class="conversation-round"
      >
        <div class="conversation-meta">
          <span class="conversation-time">{{ formatRoundTime(round.createdAt) }}</span>
          <el-tag :type="getStatusMeta(round.status).type">
            {{ getStatusMeta(round.status).label }}
          </el-tag>
        </div>

        <div data-testid="user-message" class="conversation-entry conversation-entry-user">
          <div class="conversation-role">用户语音</div>
          <div class="conversation-bubble">
            {{ round.userTranscript || round.rawTranscript || '本轮语音还在处理中。' }}
          </div>
        </div>

        <div data-testid="ai-message" class="conversation-entry conversation-entry-ai">
          <div class="conversation-role">AI 响应</div>
          <div class="conversation-bubble">
            <p class="conversation-ai-text">
              {{ round.respMessage || '正在解析本轮语音，请稍候。' }}
            </p>

            <div
              v-if="round.cleanedTranscript && round.cleanedTranscript !== round.userTranscript"
              class="conversation-section"
            >
              <div class="conversation-section-title">Cleanup 后文本</div>
              <p class="conversation-section-text">{{ round.cleanedTranscript }}</p>
            </div>

            <div v-if="round.updates.length" class="conversation-section">
              <div class="conversation-section-title">识别结果</div>
              <ul class="conversation-list">
                <li v-for="item in round.updates" :key="`${round.id}-${item.fieldName}`">
                  {{ getFieldLabel(item.fieldName) }}：{{ item.fieldValue }}
                </li>
              </ul>
            </div>

            <div v-if="round.overwriteFields.length" class="conversation-section">
              <div class="conversation-section-title">覆盖字段</div>
              <ul class="conversation-list">
                <li v-for="item in round.overwriteFields" :key="`${round.id}-${item.fieldName}`">
                  {{ getFieldLabel(item.fieldName) }}：{{ item.oldValue }} -> {{ item.newValue }}
                </li>
              </ul>
            </div>

            <div v-if="round.followUpMessage || round.missingFields.length" class="conversation-section">
              <div class="conversation-section-title">还缺内容</div>
              <p v-if="round.followUpMessage" class="conversation-section-text">
                {{ round.followUpMessage }}
              </p>
              <ul v-if="round.missingFields.length" class="conversation-list">
                <li v-for="fieldName in round.missingFields" :key="`${round.id}-${fieldName}`">
                  {{ getFieldLabel(fieldName) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>

    <el-empty
      v-else
      description="暂无语音会话记录"
    />
  </el-drawer>
</template>

<style scoped>
.conversation-history {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.conversation-round {
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.conversation-round:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.conversation-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.conversation-time {
  color: #909399;
  font-size: 12px;
}

.conversation-entry {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.conversation-entry-user {
  align-items: flex-end;
}

.conversation-entry-ai {
  align-items: flex-start;
}

.conversation-role {
  margin-bottom: 6px;
  color: #909399;
  font-size: 12px;
}

.conversation-bubble {
  max-width: 90%;
  padding: 12px 14px;
  border-radius: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.conversation-entry-user .conversation-bubble {
  background: #ecf5ff;
  color: #303133;
}

.conversation-entry-ai .conversation-bubble {
  background: #f5f7fa;
  color: #303133;
}

.conversation-ai-text {
  margin: 0;
}

.conversation-section {
  margin-top: 12px;
}

.conversation-section-title {
  margin-bottom: 6px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}

.conversation-section-text {
  margin: 0;
}

.conversation-list {
  margin: 0;
  padding-left: 18px;
}
</style>
