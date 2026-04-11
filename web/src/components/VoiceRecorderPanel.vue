<script setup>
defineProps({
  recording: Boolean,
  partialTranscript: { type: String, default: '' },
  currentTranscript: { type: String, default: '' },
  followUpMessage: { type: String, default: '' },
  historyCount: { type: Number, default: 0 }
})

const emit = defineEmits(['start', 'stop', 'open-history', 'reset-current', 'submit-current'])
</script>

<template>
  <el-card class="voice-recorder-panel">
    <div class="voice-recorder-header">
      <div>
        <div class="voice-recorder-title">语音填报</div>
        <div class="voice-recorder-subtitle">
          点击开始语音后说出本轮用车信息，结束后确认写入。
        </div>
      </div>
      <div class="voice-recorder-actions">
        <el-button plain @click="emit('open-history')">
          会话记录（{{ historyCount }}）
        </el-button>
        <el-button v-if="!recording" type="primary" @click="emit('start')">开始语音</el-button>
        <el-button v-else type="danger" @click="emit('stop')">结束语音</el-button>
        <el-button plain @click="emit('reset-current')">Reset</el-button>
        <el-button type="primary" @click="emit('submit-current')">Submit</el-button>
        <el-tag :type="recording ? 'danger' : 'info'">
          {{ recording ? '识别中' : '待开始' }}
        </el-tag>
      </div>
    </div>

    <p v-if="partialTranscript" class="voice-recorder-text">实时转写：{{ partialTranscript }}</p>
    <p v-if="currentTranscript" class="voice-recorder-text">当前文本：{{ currentTranscript }}</p>

    <el-alert
      v-if="followUpMessage"
      :title="followUpMessage"
      type="info"
      :closable="false"
      class="voice-recorder-alert"
    />
  </el-card>
</template>

<style scoped>
.voice-recorder-panel {
  margin-bottom: 20px;
}

.voice-recorder-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.voice-recorder-title {
  font-size: 16px;
  font-weight: 600;
}

.voice-recorder-subtitle {
  margin-top: 4px;
  color: #606266;
  font-size: 13px;
}

.voice-recorder-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.voice-recorder-text {
  margin: 12px 0 0;
  line-height: 1.6;
}

.voice-recorder-alert {
  margin-top: 12px;
}
</style>
