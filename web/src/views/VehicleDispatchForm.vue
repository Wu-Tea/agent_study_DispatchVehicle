<template>
  <div class="vehicle-dispatch-form">
    <!-- 顶部流程状态切换 -->
    <div class="header-bar">
      <h2>派车系统表单 Demo</h2>
      <div class="flow-selector">
        <el-select v-model="currentTaskKey" placeholder="选择流程节点" @change="onTaskChange">
          <el-option
            v-for="item in taskOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="currentButtonKey" placeholder="选择操作" @change="onButtonChange" style="margin-left: 12px">
          <el-option
            v-for="item in buttonOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="currentTab" @tab-click="handleTabClick">
      <el-tab-pane
        v-for="tab in visibleTabs"
        :key="tab.value"
        :name="tab.value"
        :label="tab.label"
      />
    </el-tabs>

    <VoiceRecorderPanel
      v-if="showVoicePanel"
      :recording="voiceRecording"
      :partial-transcript="partialTranscript"
      :current-transcript="currentTranscript"
      :follow-up-message="followUpMessage"
      :history-count="voiceConversationRounds.length"
      @start="handleVoiceStartPcm"
      @stop="handleVoiceStopPcm"
      @open-history="openVoiceConversationHistory"
      @reset-current="handleResetCurrentTranscript"
      @submit-current="handleSubmitCurrentTranscript"
    />

    <!-- 表单主体 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="form-content"
      scroll-to-error
    >
      <!-- ==================== Section 1: 用车信息 ==================== -->
      <div v-show="currentTab === 'section-1'" class="form-section">
        <h3 class="section-title">用车信息</h3>

        <el-form-item label="行程编号" prop="formNum">
          <el-input v-model="formData.formNum" disabled placeholder="系统自动生成" />
        </el-form-item>

        <el-form-item label="是否补报" prop="flagBb">
          <el-select v-model="formData.flagBb" :disabled="getDisabled('flagBb')" class="full-width">
            <el-option :value="true" label="是" />
            <el-option :value="false" label="否" />
          </el-select>
        </el-form-item>

        <el-form-item label="用车性质" prop="useCarNature">
          <el-select
            v-model="formData.useCarNature"
            :disabled="getDisabled('useCarNature')"
            filterable
            placeholder="请选择用车性质"
            class="full-width"
          >
            <el-option
              v-for="opt in useCarNatureEnums"
              :key="opt.key"
              :label="opt.value"
              :value="opt.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="用车事由" prop="useCarMatter">
          <el-select
            v-model="formData.useCarMatter"
            :disabled="getDisabled('useCarMatter')"
            filterable
            placeholder="请选择用车事由"
            class="full-width"
          >
            <el-option
              v-for="opt in useCarMatterList"
              :key="opt.key"
              :label="opt.value"
              :value="opt.key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="用车事由说明" prop="remark1">
          <el-input
            v-model="formData.remark1"
            :disabled="getDisabled('remark1')"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            maxlength="500"
            show-word-limit
            placeholder="若用车较复杂，如用车需2天及以上，请详细描述。"
          />
        </el-form-item>

        <el-form-item label="用车费用归属部门" prop="fyDeptName">
          <el-select
            v-model="formData.fyDeptId"
            :disabled="getDisabled('fyDeptName')"
            filterable
            placeholder="请选择用车费用归属部门"
            class="full-width"
            @change="handleDeptChange"
          >
            <el-option
              v-for="dept in deptList"
              :key="dept.id"
              :label="dept.deptName"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="航班号/车次" prop="otherField2">
          <el-input
            v-model="formData.otherField2"
            :disabled="getDisabled('otherField2')"
            placeholder="请输入航班号/车次"
          />
        </el-form-item>

        <!-- 出发地 -->
        <el-form-item label="出发地" prop="startAddress">
          <el-input
            v-model="formData.startAddress"
            :disabled="getDisabled('startAddress')"
            placeholder="请输入出发地"
            clearable
          >
            <template #suffix>
              <el-icon v-if="!getDisabled('startAddress')"><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 途经点 -->
        <div v-if="getVisible('vdAfWaypointList')" class="waypoints-section">
          <div
            v-for="(wp, index) in formData.vdAfWaypointList"
            :key="wp.uniId"
            class="waypoint-item"
          >
            <el-form-item
              :label="`途经点${index + 1}`"
              :prop="`vdAfWaypointList.${index}.address`"
            >
              <el-input
                v-model="wp.address"
                :disabled="getDisabled('startAddress')"
                placeholder="请输入途经点地址"
                clearable
              />
            </el-form-item>
            <el-button
              v-if="!getDisabled('startAddress')"
              type="danger"
              :icon="Remove"
              circle
              size="small"
              @click="removeWayPoint(index)"
              style="margin-left: 8px; margin-top: 30px"
            />
          </div>
          <el-button
            v-if="!getDisabled('startAddress')"
            type="primary"
            link
            @click="addWayPoint"
          >
            <el-icon><Plus /></el-icon> 添加途经点
          </el-button>
        </div>

        <!-- 目的地 -->
        <el-form-item label="目的地" prop="endAddress">
          <el-input
            v-model="formData.endAddress"
            :disabled="getDisabled('endAddress')"
            placeholder="请输入目的地"
            clearable
          >
            <template #suffix>
              <el-icon v-if="!getDisabled('endAddress')"><Location /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 出车时间 -->
        <el-form-item label="出车时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            :disabled="getDisabled('startTime')"
            type="datetime"
            placeholder="请选择出车时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="full-width"
          />
        </el-form-item>

        <!-- 出车形式 -->
        <el-form-item label="出车形式" prop="useCarTripType">
          <div class="trip-type-row">
            <el-radio-group
              v-model="formData.useCarTripType"
              :disabled="getDisabled('useCarTripType')"
            >
              <el-radio
                v-for="opt in useCarTripTypeEnums"
                :key="opt.key"
                :value="opt.key"
              >
                {{ opt.value }}
              </el-radio>
            </el-radio-group>
            <div v-if="formData.useCarTripType === 100 && !getDisabled('useCarTripType')" class="jg-time">
              <span>间隔时长</span>
              <el-input-number
                v-model="formData.useCarJgTimeHour"
                :min="0"
                size="small"
                controls-position="right"
              />
              <span>小时</span>
              <el-input-number
                v-model="formData.useCarJgTimeMinute"
                :min="0"
                :max="59"
                size="small"
                controls-position="right"
              />
              <span>分</span>
            </div>
            <div v-if="formData.useCarTripType === 100 && getDisabled('useCarTripType')" class="jg-time">
              <span>间隔时长 {{ formData.useCarJgTimeHour || 0 }}小时{{ formData.useCarJgTimeMinute || 0 }}分</span>
            </div>
          </div>
        </el-form-item>

        <!-- 预计返回时间 -->
        <el-form-item label="预计返回时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            :disabled="getDisabled('endTime')"
            type="datetime"
            placeholder="请选择预计返回时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="full-width"
          />
        </el-form-item>

        <!-- 联系人 -->
        <el-form-item label="联系人" prop="contacts">
          <el-input
            v-model="formData.contacts"
            :disabled="getDisabled('contacts')"
            placeholder="请输入联系人"
          />
        </el-form-item>

        <el-form-item label="联系电话" prop="contactsPhone">
          <el-input
            v-model="formData.contactsPhone"
            :disabled="getDisabled('contactsPhone')"
            placeholder="请输入联系电话"
          />
        </el-form-item>
      </div>

      <!-- ==================== Section 2: 乘车人信息 ==================== -->
      <div v-show="currentTab === 'section-2'" class="form-section">
        <h3 class="section-title">乘车人信息</h3>

        <el-form-item label="乘车人数（人）" prop="useCarPersonNum">
          <el-input
            v-model="formData.useCarPersonNum"
            :disabled="getDisabled('useCarPersonNum')"
            type="number"
            :min="0"
            placeholder="请填写乘车人数"
          />
        </el-form-item>

        <div class="passenger-header">
          <span>乘车人信息</span>
          <el-button
            v-if="!getDisabled('useCarPersonNum')"
            type="primary"
            :icon="Plus"
            circle
            size="small"
            @click="addPassenger"
          />
        </div>

        <div v-if="formData.vdAfUseCarPersonList.length === 0 && !getDisabled('useCarPersonNum')" class="passenger-empty">
          暂无乘车人信息，可点击右上角加号添加
        </div>

        <!-- 可编辑乘车人 -->
        <div v-if="!getDisabled('useCarPersonNum')">
          <div
            v-for="(p, index) in formData.vdAfUseCarPersonList"
            :key="p.uniId"
            class="passenger-card"
          >
            <div class="passenger-card-header">
              <span>乘车人 {{ index + 1 }}</span>
              <el-button
                type="danger"
                :icon="Minus"
                circle
                size="small"
                @click="removePassenger(index)"
              />
            </div>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item
                  :prop="`vdAfUseCarPersonList.${index}.ucPersonFullName`"
                  label="姓名"
                >
                  <el-input v-model="p.ucPersonFullName" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  :prop="`vdAfUseCarPersonList.${index}.ucPersonPhone`"
                  label="联系电话"
                >
                  <el-input v-model="p.ucPersonPhone" placeholder="请输入联系电话" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 只读乘车人表格 -->
        <el-table
          v-if="getDisabled('useCarPersonNum') && formData.vdAfUseCarPersonList.length"
          :data="formData.vdAfUseCarPersonList"
          style="margin-top: 12px"
        >
          <el-table-column type="index" label="#" />
          <el-table-column prop="ucPersonFullName" label="姓名" />
          <el-table-column prop="ucPersonPhone" label="电话号码" />
        </el-table>

        <el-form-item label="留言" prop="remark2" style="margin-top: 16px">
          <el-input
            v-model="formData.remark2"
            :disabled="getDisabled('remark2')"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入需要发送给司机的留言"
          />
        </el-form-item>
      </div>

      <!-- ==================== Section 3: 审批信息 ==================== -->
      <div v-show="currentTab === 'section-3'" class="form-section">
        <h3 class="section-title">审批信息</h3>

        <el-form-item label="审批领导" prop="task100UserName">
          <el-select
            v-model="formData.task100UserName"
            :disabled="getDisabled('task100UserName')"
            filterable
            placeholder="请选择审批领导"
            class="full-width"
          >
            <el-option
              v-for="leader in approveLeaderList"
              :key="leader.userName"
              :label="leader.fullName"
              :value="leader.userName"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="车辆调度员" prop="task200UserName">
          <el-select
            v-model="formData.task200UserName"
            :disabled="getDisabled('task200UserName')"
            filterable
            placeholder="请选择车辆调度员"
            class="full-width"
          >
            <el-option
              v-for="d in dispatcherList"
              :key="d.userName"
              :label="d.fullName"
              :value="d.userName"
            />
          </el-select>
        </el-form-item>
      </div>

      <!-- ==================== Section 4: 车辆与司机信息 ==================== -->
      <div v-show="currentTab === 'section-4'" class="form-section">
        <h3 class="section-title">车辆信息</h3>

        <el-form-item label="车牌号" prop="carNum">
          <el-select
            v-model="formData.carId"
            :disabled="getDisabled('carNum')"
            filterable
            placeholder="请选择车辆"
            class="full-width"
            @change="handleCarChange"
          >
            <el-option
              v-for="car in carList"
              :key="car.id"
              :label="car.carNum"
              :value="car.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="车型" prop="carType">
              <el-input v-model="formData.carType" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车龄" prop="carAge">
              <el-input v-model="formData.carAge" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <h3 class="section-title" style="margin-top: 24px">司机信息</h3>

        <el-form-item label="司机姓名" prop="driverFullName">
          <el-select
            v-model="formData.driverId"
            :disabled="getDisabled('driverFullName')"
            filterable
            placeholder="请选择司机"
            class="full-width"
            @change="handleDriverChange"
          >
            <el-option
              v-for="drv in driverList"
              :key="drv.id"
              :label="drv.driverFullName"
              :value="drv.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="driverPhone">
              <el-input v-model="formData.driverPhone" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驾龄" prop="driverAge">
              <el-input v-model="formData.driverAge" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- ==================== Section 5: 行车日志/费用 ==================== -->
      <div v-show="currentTab === 'section-5'" class="form-section">
        <h3 class="section-title">行车日志填报</h3>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="实际开始时间" prop="startTime2">
              <el-date-picker
                v-model="formData.startTime2"
                :disabled="getDisabled('startTime2')"
                type="datetime"
                placeholder="请选择实际开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="full-width"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际结束时间" prop="endTime2">
              <el-date-picker
                v-model="formData.endTime2"
                :disabled="getDisabled('endTime2')"
                type="datetime"
                placeholder="请选择实际结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="full-width"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="出车前里程（km）" prop="km1">
              <el-input
                v-model="formData.km1"
                :disabled="getDisabled('km1')"
                placeholder="请输入"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="回车后里程（km）" prop="km2">
              <el-input
                v-model="formData.km2"
                :disabled="getDisabled('km2')"
                placeholder="请输入"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="行驶里程（km）">
              <el-input :model-value="formData.km3" disabled placeholder="自动计算" />
            </el-form-item>
          </el-col>
        </el-row>

        <h3 class="section-title" style="margin-top: 24px">费用信息</h3>

        <el-row :gutter="16">
          <el-col :span="8" v-for="fee in feeFields" :key="fee.prop">
            <el-form-item :label="fee.label" :prop="fee.prop">
              <el-input
                v-model="formData[fee.prop]"
                :disabled="getDisabled(fee.prop)"
                placeholder="请输入"
              >
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="费用备注" prop="remark3">
          <el-input
            v-model="formData.remark3"
            :disabled="getDisabled('remark3')"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="请输入费用备注"
          />
        </el-form-item>
      </div>
    </el-form>

    <!-- 底部操作 -->
    <div class="form-actions">
      <el-button @click="handleReset">重置</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>

    <!-- 提交结果预览 -->
    <el-dialog v-model="showResult" title="提交数据预览" width="700px">
      <pre class="result-json">{{ submitResult }}</pre>
    </el-dialog>

    <AgentConfirmDialog
      :visible="confirmDialogVisible"
      :resp-message="agentResult?.respMessage || ''"
      :updates="agentResult?.updates || []"
      :overwrite-fields="agentResult?.overwriteFields || []"
      :follow-up-message="pendingFollowUpMessage"
      @confirm="handleAgentConfirm"
      @cancel="handleAgentCancel"
    />

    <VoiceConversationDrawer
      :visible="historyDrawerVisible"
      :rounds="voiceConversationRounds"
      @close="closeVoiceConversationHistory"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Plus, Remove, Minus } from '@element-plus/icons-vue'
import AgentConfirmDialog from '@/components/AgentConfirmDialog.vue'
import VoiceConversationDrawer from '@/components/VoiceConversationDrawer.vue'
import VoiceRecorderPanel from '@/components/VoiceRecorderPanel.vue'

import {
  TaskKeys, ButtonKeys,
  getFieldConfig, isFieldDisabled, isFieldRequired, isFieldVisible
} from '@/config/formFieldConfig.js'
import { getFormRules, generateDynamicFieldRules } from '@/config/rulesConfig.js'
import { applyFieldLinkage } from '@/config/linkageConfig.js'
import { TaskParamFactory } from '@/config/TaskParamFactory.js'
import { useVoiceAgent } from '@/composables/useVoiceAgent.js'
import {
  UseCarNatureEnums, UseCarMatterEnums, UseCarTripTypeEnums,
  PayTypeEnums, ApproveLeaderList, DispatcherList,
  DeptList, CarList, DriverList
} from '@/config/enumData.js'
import { createSilentPcmChunk, encodePcmChunk, uint8ArrayToBase64 } from '@/utils/pcmAudio.js'
import { buildTask0FollowUpMessage, getTask0MvpMissingFields } from '@/utils/task0MvpMissingFields.js'
import {
  buildVoiceConversationStorageKey,
  createEmptyVoiceConversationSession,
  readVoiceConversationSession,
  writeVoiceConversationSession
} from '@/utils/voiceConversationSession.js'

// ==================== 枚举数据 ====================
const useCarNatureEnums = ref(UseCarNatureEnums)
const useCarMatterEnums = ref(UseCarMatterEnums)
const useCarTripTypeEnums = ref(UseCarTripTypeEnums)
const useCarMatterList = ref([...UseCarMatterEnums])
const approveLeaderList = ref(ApproveLeaderList)
const dispatcherList = ref(DispatcherList)
const deptList = ref(DeptList)
const carList = ref(CarList)
const driverList = ref(DriverList)

// ==================== 流程状态 ====================
const taskOptions = [
  { value: TaskKeys.TASK0, label: '用车申请' },
  { value: TaskKeys.TASK100, label: '领导审批' },
  { value: TaskKeys.TASK200, label: '调度员派车' },
  { value: TaskKeys.TASK300, label: '司机确认' },
  { value: TaskKeys.TASK400, label: '行车日志填报' },
  { value: TaskKeys.VIEW, label: '查看（只读）' }
]

const buttonOptionsMap = {
  [TaskKeys.TASK0]: [
    { value: ButtonKeys.HANDLE, label: '提交申请' },
    { value: ButtonKeys.FLAG_BB, label: '补报' }
  ],
  [TaskKeys.TASK100]: [
    { value: ButtonKeys.HANDLE, label: '审批通过' },
    { value: ButtonKeys.RETURN, label: '退回' }
  ],
  [TaskKeys.TASK200]: [
    { value: ButtonKeys.HANDLE, label: '派车' },
    { value: ButtonKeys.RETURN, label: '退回' }
  ],
  [TaskKeys.TASK300]: [
    { value: ButtonKeys.HANDLE, label: '确认接单' }
  ],
  [TaskKeys.TASK400]: [
    { value: ButtonKeys.HANDLE, label: '提交日志' }
  ],
  [TaskKeys.VIEW]: [
    { value: ButtonKeys.VIEW, label: '查看' }
  ]
}

const currentTaskKey = ref(TaskKeys.TASK0)
const currentButtonKey = ref(ButtonKeys.HANDLE)
const currentTab = ref('section-1')
const followUpMessage = ref('')
const pendingFollowUpMessage = ref('')
const historyDrawerVisible = ref(false)
const voiceConversationRounds = ref([])

const buttonOptions = computed(() => buttonOptionsMap[currentTaskKey.value] || [])
const showVoicePanel = computed(() =>
  currentTaskKey.value === TaskKeys.TASK0 &&
  currentButtonKey.value === ButtonKeys.HANDLE &&
  formData.flagBb !== true
)

// ==================== 字段配置 ====================
const currentFieldConfig = ref(getFieldConfig(TaskKeys.TASK0, ButtonKeys.HANDLE))

function refreshFieldConfig() {
  const btnKey = formData.flagBb === true ? ButtonKeys.FLAG_BB : currentButtonKey.value
  currentFieldConfig.value = getFieldConfig(currentTaskKey.value, btnKey)
  regenerateRules()
}

function onTaskChange(val) {
  currentButtonKey.value = buttonOptionsMap[val]?.[0]?.value || ButtonKeys.HANDLE
  currentFieldConfig.value = getFieldConfig(val, currentButtonKey.value)
  regenerateRules()
  // 自动切换到第一个可见 tab
  if (visibleTabs.value.length) {
    currentTab.value = visibleTabs.value[0].value
  }
}

function onButtonChange(val) {
  currentFieldConfig.value = getFieldConfig(currentTaskKey.value, val)
  regenerateRules()
}

// ==================== Tab 配置 ====================
const allTabs = [
  { value: 'section-1', label: '用车信息', fields: ['flagBb', 'useCarNature', 'startAddress'] },
  { value: 'section-2', label: '乘车人信息', fields: ['useCarPersonNum'] },
  { value: 'section-3', label: '审批信息', fields: ['task100UserName', 'task200UserName'] },
  { value: 'section-4', label: '车辆与司机', fields: ['carNum', 'driverFullName'] },
  { value: 'section-5', label: '行车日志/费用', fields: ['startTime2', 'km1', 'cost1'] }
]

const visibleTabs = computed(() => {
  return allTabs.filter(tab =>
    tab.fields.some(f => isFieldVisible(f, currentFieldConfig.value) || isFieldRequired(f, currentFieldConfig.value))
  )
})

// ==================== 表单数据 ====================
const formData = reactive({
  formNum: 'VD-2026-AUTO-001',
  flagBb: false,
  useCarNature: '',
  useCarMatter: '',
  remark1: '',
  fyDeptId: '',
  fyDeptName: '',
  otherField2: '',
  startAddress: '',
  startAddressSmx: '',
  startAddressSmy: '',
  endAddress: '',
  endAddressSmx: '',
  endAddressSmy: '',
  vdAfWaypointList: [],
  startTime: '',
  endTime: '',
  useCarTripType: 200,
  useCarJgTimeHour: 3,
  useCarJgTimeMinute: 0,
  contacts: '',
  contactsPhone: '',
  useCarPersonNum: '',
  vdAfUseCarPersonList: [],
  remark2: '',
  task100UserName: '',
  task100FullName: '',
  task200UserName: '',
  task200FullName: '',
  carId: '',
  carNum: '',
  carType: '',
  carAge: '',
  driverId: '',
  driverUserName: '',
  driverFullName: '',
  driverPhone: '',
  driverAge: '',
  startTime2: '',
  endTime2: '',
  km1: '',
  km2: '',
  km3: '',
  cost1: '',
  cost4: '',
  cost5: '',
  cost7: '',
  cost8: '',
  cost9: '',
  cost1Type: '',
  cost4Type: '',
  cost7Type: '',
  cost9Type: '',
  remark3: ''
})

const voiceAgent = useVoiceAgent({
  getFormData: () => ({ ...formData })
})
const {
  recording: voiceRecording,
  partialTranscript,
  currentTranscript,
  cleanupResult,
  agentResult,
  confirmDialogVisible,
  startVoiceSession,
  sendAudioChunk,
  stopVoiceSession,
  closeVoiceSession,
  submitCurrentTranscript,
  resetCurrentTranscript
} = voiceAgent

let mediaStream = null
let audioContext = null
let mediaSourceNode = null
let scriptProcessorNode = null
let silentGainNode = null
let pendingAudioSend = Promise.resolve()
let voiceRoundSequence = 0
const PCM_OUTPUT_SAMPLE_RATE = 16000
const PCM_PROCESSOR_BUFFER_SIZE = 1024
const MIN_PCM_DRAIN_DELAY_MS = 280
const STOP_SILENCE_PADDING_MS = 320
const voiceConversationStorage = typeof window !== 'undefined' ? window.sessionStorage : null

const voiceConversationStorageKey = computed(() => buildVoiceConversationStorageKey({
  taskKey: currentTaskKey.value,
  buttonKey: currentButtonKey.value,
  formNum: formData.formNum
}))

function getLatestVoiceRound() {
  if (!voiceConversationRounds.value.length) {
    return null
  }

  return voiceConversationRounds.value[voiceConversationRounds.value.length - 1]
}

function persistVoiceConversationRounds() {
  const session = createEmptyVoiceConversationSession()
  const latestRound = getLatestVoiceRound()

  session.lastRoundId = latestRound?.id || ''
  session.rounds = voiceConversationRounds.value
  writeVoiceConversationSession(voiceConversationStorage, voiceConversationStorageKey.value, session)
}

function restoreVoiceConversationRounds() {
  const session = readVoiceConversationSession(
    voiceConversationStorage,
    voiceConversationStorageKey.value
  )

  voiceConversationRounds.value = session.rounds

  const latestAppliedRound = [...session.rounds].reverse().find((round) => round.status === 'applied')
  followUpMessage.value = latestAppliedRound?.followUpMessage || ''
}

function buildVoiceRound(round) {
  voiceRoundSequence += 1

  return {
    id: `voice-round-${Date.now()}-${voiceRoundSequence}`,
    createdAt: new Date().toISOString(),
    userTranscript: round.userTranscript || '',
    respMessage: round.respMessage || '',
    updates: round.updates || [],
    overwriteFields: round.overwriteFields || [],
    missingFields: round.missingFields || [],
    followUpMessage: round.followUpMessage || '',
    status: round.status || 'pending',
    rawTranscript: round.rawTranscript || round.userTranscript || '',
    cleanedTranscript: round.cleanedTranscript || round.userTranscript || '',
    confirmed: round.confirmed === true,
    applied: round.applied === true
  }
}

function appendVoiceRound(round) {
  if (!round?.userTranscript) {
    return
  }

  voiceConversationRounds.value = [
    ...voiceConversationRounds.value,
    buildVoiceRound(round)
  ]
  persistVoiceConversationRounds()
}

function updateLatestVoiceRound(updater) {
  const latestRound = getLatestVoiceRound()
  if (!latestRound) {
    return
  }

  const nextRound = typeof updater === 'function'
    ? updater(latestRound)
    : { ...latestRound, ...updater }

  voiceConversationRounds.value = [
    ...voiceConversationRounds.value.slice(0, -1),
    nextRound
  ]
  persistVoiceConversationRounds()
}

function openVoiceConversationHistory() {
  historyDrawerVisible.value = true
}

function closeVoiceConversationHistory() {
  historyDrawerVisible.value = false
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function getPcmDrainDelayMs() {
  if (!scriptProcessorNode?.bufferSize || !audioContext?.sampleRate) {
    return MIN_PCM_DRAIN_DELAY_MS
  }

  const bufferWindowMs = Math.ceil((scriptProcessorNode.bufferSize / audioContext.sampleRate) * 1000)
  return Math.max(MIN_PCM_DRAIN_DELAY_MS, bufferWindowMs + 100)
}

function queueAudioChunk(base64Chunk) {
  pendingAudioSend = pendingAudioSend
    .then(() => sendAudioChunk(base64Chunk))
    .catch((error) => {
      console.error(error)
    })
}

// ==================== 校验规则 ====================
const formRef = ref(null)
const formRules = ref({})

function regenerateRules() {
  let rules = getFormRules(currentFieldConfig.value, formData)
  rules = generateDynamicFieldRules(rules, formData, currentFieldConfig.value)
  formRules.value = rules
}

regenerateRules()

// ==================== 字段状态工具方法 ====================
function getDisabled(fieldName) {
  return isFieldDisabled(fieldName, currentFieldConfig.value)
}

function getVisible(fieldName) {
  return isFieldVisible(fieldName, currentFieldConfig.value) || isFieldRequired(fieldName, currentFieldConfig.value)
}

// ==================== 字段联动（自动 watch） ====================
const watchedFields = [
  'flagBb', 'useCarNature', 'useCarMatter', 'useCarTripType',
  'useCarJgTimeHour', 'useCarJgTimeMinute', 'startTime',
  'km1', 'km2'
]

const linkageContext = {
  formData,
  useCarMatterEnums: UseCarMatterEnums,
  useCarMatterList,
  refreshFieldConfig
}

watchedFields.forEach(field => {
  watch(() => formData[field], (newVal, oldVal) => {
    applyFieldLinkage(field, newVal, linkageContext, oldVal)
  })
})

// 乘车人列表变化时重新生成规则
watch(() => formData.vdAfUseCarPersonList.length, () => {
  regenerateRules()
})

// ==================== 费用字段配置 ====================
const feeFields = [
  { prop: 'cost1', label: '公路通行费' },
  { prop: 'cost7', label: '桥、闸通行费' },
  { prop: 'cost4', label: '车辆燃油费' },
  { prop: 'cost8', label: '车辆清洗费' },
  { prop: 'cost9', label: '停车费' },
  { prop: 'cost5', label: '其他费用' }
]

// ==================== 操作方法 ====================

// 部门变化
function handleDeptChange(deptId) {
  const dept = deptList.value.find(d => d.id === deptId)
  if (dept) {
    formData.fyDeptName = dept.deptName
  }
}

// 车辆选择
function handleCarChange(carId) {
  const car = carList.value.find(c => c.id === carId)
  if (car) {
    formData.carNum = car.carNum
    formData.carType = car.carType
    formData.carAge = car.carAge
  }
}

// 司机选择
function handleDriverChange(drvId) {
  const drv = driverList.value.find(d => d.id === drvId)
  if (drv) {
    formData.driverUserName = drv.driverUserName
    formData.driverFullName = drv.driverFullName
    formData.driverPhone = drv.driverPhone
    formData.driverAge = drv.driverAge
  }
}

// 途经点
let wpId = 0
function addWayPoint() {
  formData.vdAfWaypointList.push({ uniId: ++wpId, address: '' })
  nextTick(() => regenerateRules())
}

function removeWayPoint(index) {
  formData.vdAfWaypointList.splice(index, 1)
  nextTick(() => regenerateRules())
}

// 乘车人
let passId = 0
function addPassenger() {
  formData.vdAfUseCarPersonList.push({
    uniId: ++passId,
    ucPersonFullName: '',
    ucPersonPhone: '',
    ucPersonResource: 3
  })
}

function removePassenger(index) {
  formData.vdAfUseCarPersonList.splice(index, 1)
}

function cleanupMediaStream() {
  if (scriptProcessorNode) {
    scriptProcessorNode.disconnect()
    scriptProcessorNode.onaudioprocess = null
    scriptProcessorNode = null
  }

  if (mediaSourceNode) {
    mediaSourceNode.disconnect()
    mediaSourceNode = null
  }

  if (silentGainNode) {
    silentGainNode.disconnect()
    silentGainNode = null
  }

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

function createPcmProcessor(stream) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    const unsupportedError = new Error('AudioContext is not available')
    unsupportedError.name = 'AudioCaptureNotSupported'
    throw unsupportedError
  }

  audioContext = new AudioContextClass()
  mediaSourceNode = audioContext.createMediaStreamSource(stream)
  scriptProcessorNode = audioContext.createScriptProcessor(PCM_PROCESSOR_BUFFER_SIZE, 1, 1)
  silentGainNode = audioContext.createGain()
  silentGainNode.gain.value = 0

  scriptProcessorNode.onaudioprocess = (event) => {
    if (!voiceRecording.value) {
      return
    }

    const channelData = event.inputBuffer.getChannelData(0)
    const pcmBytes = encodePcmChunk(channelData, audioContext.sampleRate, PCM_OUTPUT_SAMPLE_RATE)
    if (!pcmBytes.length) {
      return
    }

    queueAudioChunk(uint8ArrayToBase64(pcmBytes))
  }

  mediaSourceNode.connect(scriptProcessorNode)
  scriptProcessorNode.connect(silentGainNode)
  silentGainNode.connect(audioContext.destination)

  return audioContext.resume()
}

function getVoiceStartErrorMessage(error, stage) {
  const errorName = error?.name || ''

  if (stage === 'mic') {
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      return '未获得麦克风权限，请检查浏览器设置'
    }

    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
      return '未检测到可用麦克风，请检查设备连接'
    }

    if (errorName === 'AudioCaptureNotSupported' || errorName === 'MediaRecorderNotSupported') {
      return '当前浏览器不支持语音录制'
    }
  }

  if (stage === 'session') {
    return '语音服务连接失败，请稍后重试'
  }

  return '语音录制启动失败，请稍后重试'
}

async function handleVoiceStartPcm() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      const unsupportedError = new Error('getUserMedia is not available')
      unsupportedError.name = 'AudioCaptureNotSupported'
      throw unsupportedError
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
  } catch (error) {
    cleanupMediaStream()
    closeVoiceSession()
    console.error(error)
    ElMessage.error(getVoiceStartErrorMessage(error, 'mic'))
    return
  }

  try {
    pendingAudioSend = Promise.resolve()
    await startVoiceSession()
    await createPcmProcessor(mediaStream)
  } catch (error) {
    cleanupMediaStream()
    pendingAudioSend = Promise.resolve()
    closeVoiceSession()
    console.error(error)
    const errorStage = error?.name === 'AudioCaptureNotSupported' ? 'mic' : 'session'
    ElMessage.error(getVoiceStartErrorMessage(error, errorStage))
  }
}

async function handleVoiceStopPcm() {
  try {
    await wait(getPcmDrainDelayMs())
    cleanupMediaStream()
    queueAudioChunk(uint8ArrayToBase64(createSilentPcmChunk(STOP_SILENCE_PADDING_MS, PCM_OUTPUT_SAMPLE_RATE)))
    await pendingAudioSend
    pendingAudioSend = Promise.resolve()
    await stopVoiceSession()
  } catch (error) {
    console.error(error)
    ElMessage.error('璇煶缁撴潫澶辫触锛岃閲嶈瘯')
  }
}

async function handleVoiceStart() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      const unsupportedError = new Error('getUserMedia is not available')
      unsupportedError.name = 'AudioCaptureNotSupported'
      throw unsupportedError
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
  } catch (error) {
    cleanupMediaStream()
    closeVoiceSession()
    console.error(error)
    ElMessage.error(getVoiceStartErrorMessage(error, 'mic'))
    return
  }

  try {
    pendingAudioSend = Promise.resolve()
    await startVoiceSession()
    await createPcmProcessor(mediaStream)

        ElMessage.error('结束语音失败，请重试')

  } catch (error) {
    cleanupMediaStream()
    pendingAudioSend = Promise.resolve()
    closeVoiceSession()
    console.error(error)
    ElMessage.error(getVoiceStartErrorMessage(error, 'session'))
  }
}

async function handleVoiceStop() {
  cleanupMediaStream()
  try {
    await pendingAudioSend
    pendingAudioSend = Promise.resolve()
    await stopVoiceSession()
  } catch (error) {
    console.error(error)
    ElMessage.error('语音结束失败，请重试')
  }
}

async function handleAgentConfirm() {
  const updates = agentResult.value?.updates || []
  updates.forEach(({ fieldName, fieldValue }) => {
    formData[fieldName] = fieldValue
  })

  await nextTick()
  regenerateRules()

  const missingFields = getTask0MvpMissingFields(formData)
  followUpMessage.value = buildTask0FollowUpMessage(missingFields)
  updateLatestVoiceRound((round) => ({
    ...round,
    missingFields,
    followUpMessage: followUpMessage.value,
    status: 'applied',
    confirmed: true,
    applied: true
  }))
  pendingFollowUpMessage.value = ''
  confirmDialogVisible.value = false
  ElMessage.success('AI 识别结果已写入表单')
}

function handleAgentCancel() {
  updateLatestVoiceRound((round) => ({
    ...round,
    status: 'cancelled'
  }))
  pendingFollowUpMessage.value = ''
  confirmDialogVisible.value = false
}

function handleResetCurrentTranscript() {
  resetCurrentTranscript()
  pendingFollowUpMessage.value = ''
}

async function handleSubmitCurrentTranscript() {
  if (!currentTranscript.value.trim()) {
    ElMessage.warning('当前没有可提交的语音文字')
    return
  }

  try {
    const result = await submitCurrentTranscript({ ...formData })
    if (!result) {
      return
    }

    const draftFormData = { ...formData }
    result.updates.forEach(({ fieldName, fieldValue }) => {
      draftFormData[fieldName] = fieldValue
    })

    const missingFields = getTask0MvpMissingFields(draftFormData)
    pendingFollowUpMessage.value = buildTask0FollowUpMessage(missingFields)

    appendVoiceRound({
      userTranscript: currentTranscript.value.trim(),
      rawTranscript: cleanupResult.value?.rawTranscript || currentTranscript.value.trim(),
      cleanedTranscript: cleanupResult.value?.cleanedTranscript || currentTranscript.value.trim(),
      respMessage: result.respMessage || '',
      updates: result.updates || [],
      overwriteFields: result.overwriteFields || [],
      missingFields,
      followUpMessage: pendingFollowUpMessage.value,
      status: 'pending',
      confirmed: false,
      applied: false
    })
  } catch (error) {
    console.error(error)
    ElMessage.error('语音文字解析失败，请稍后重试')
  }
}

// Tab 点击
function handleTabClick() {}

// 提交
const showResult = ref(false)
const submitResult = ref('')

async function handleSubmit() {
  try {
    await formRef.value.validate()

    // 使用 TaskParamFactory 构建提交数据
    const context = {
      isApply: currentTaskKey.value === TaskKeys.TASK0,
      isReSubmit: false,
      taskKey: currentTaskKey.value,
      isModifyAll: false,
      bizId: 'demo-biz-001',
      formData
    }
    const handler = TaskParamFactory.createHandler(context)
    const result = handler.process({ ...formData })

    submitResult.value = JSON.stringify(result, null, 2)
    showResult.value = true
    ElMessage.success('表单校验通过，提交成功！')
  } catch (err) {
    ElMessage.error('表单校验未通过，请检查必填项')
  }
}

function handleReset() {
  formRef.value?.resetFields()
  followUpMessage.value = ''
  pendingFollowUpMessage.value = ''
  resetCurrentTranscript()
  closeVoiceSession()
  cleanupMediaStream()
  ElMessage.info('表单已重置')
}

watch(voiceConversationStorageKey, () => {
  restoreVoiceConversationRounds()
}, { immediate: true })
</script>

<style scoped>
.vehicle-dispatch-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-bar h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.flow-selector {
  display: flex;
  align-items: center;
}

.form-content {
  margin-top: 16px;
}

.form-section {
  padding: 16px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.full-width {
  width: 100%;
}

.trip-type-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.jg-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.waypoints-section {
  margin-bottom: 16px;
}

.waypoint-item {
  display: flex;
  align-items: flex-start;
}

.waypoint-item .el-form-item {
  flex: 1;
}

.passenger-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
}

.passenger-empty {
  padding: 24px;
  text-align: center;
  color: #999;
  background: #fafafa;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

.passenger-card {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
}

.passenger-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.result-json {
  max-height: 500px;
  overflow: auto;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
