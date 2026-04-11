<template>
  <div :class="{ noAuth }" class="flex column">
    <div
      v-if="isApply"
      class="full-width"
      style="display: flex; justify-content: flex-start; align-items: center; gap: 14px"
    >
      <h1 class="first-title">用车申请</h1>
      <history ref="history" @loadHistory="loadHistory" />
    </div>
    <!--    <div v-if="isApply" class="tip m-b-24">-->
    <!--      <p-->
    <!--        v-for="(text, index) in alertText"-->
    <!--        :key="text"-->
    <!--      >-->
    <!--        {{ text }}-->
    <!--      </p>-->
    <!--    </div>-->
    <div v-if="isApply && formData.remindTitle" class="notify-content" v-html="formData.remindTitle.replace(/\n/g, '<br><br>')" />
    <fks-tabs v-model="currentTab" @tab-click="handleTabClick">
      <fks-tab-pane
        class="tab-title"
        v-for="tab in tabs"
        :key="tab.value"
        :name="tab.value"
        :label="tab.label"
        label-width="210px"
      />
    </fks-tabs>
    <fks-form
      class="flex-grow-1 overflow-y-auto form full-width applyForm"
      ref="formRef"
      :flow-config="flowConfig"
      :model="formData"
      :style="{ margin: '0 auto' }"
      label-position="top"
      :rules="formRules"
      style="overflow-x: hidden"
    >
      <div style="max-width: 665px">
        <fks-row>
          <fks-col :span="24" ref="section-1">
            <common-title title="用车信息" />
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="行程编号" prop="formNum">
              <fks-input
                v-model="formData.formNum"
                disabled
                placeholder="系统自动生成"
                :resize="flowConfig.formNum === 'readonly' ? 'none' : 'vertical'"
                autosize
              />
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="是否补报" prop="flagBb" required>
              <fks-select
                v-model="formData.flagBb"
                :disabled="getDisableFlag('flagBb')"
                class="full-width"
                @change="clickFormRow"
              >
                <fks-option :value="true" label="是" />
                <fks-option :value="false" label="否" />
              </fks-select>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="用车性质" prop="useCarNature">
              <fks-select
                v-model="formData.useCarNature"
                filterable
                :disabled="getDisableFlag('useCarNature')"
                class="full-width"
                placeholder="请选择用车性质"
                @change="clearApprove"
              >
                <fks-option
                  v-for="option in currProjectNature"
                  :key="option.key"
                  :label="option.value"
                  :value="option.key"
                />
              </fks-select>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="用车事由" prop="useCarMatter">
              <fks-select
                v-model="formData.useCarMatter"
                filterable
                :disabled="getDisableFlag('useCarMatter')"
                class="full-width"
                :placeholder="flowConfig.useCarMatter === 'readonly' ? '' : '请选择用车事由'"
                @change="clearApprove"
              >
                <fks-option
                  v-for="option in useCarMatterList"
                  :key="option.key"
                  :label="option.value"
                  :value="option.key"
                />
              </fks-select>
            </fks-form-item>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item prop="remark1" class="position-relative">
              <span slot="label"> 用车事由说明 </span>
              <fks-input
                v-model="formData.remark1"
                :disabled="getDisableFlag('remark1')"
                :placeholder="
                  flowConfig.remark1 === 'readonly'
                    ? ''
                    : '若用车较复杂，如用车需2天及以上，请详细描述。'
                "
                :resize="flowConfig.remark1 === 'readonly' ? 'none' : 'vertical'"
                :show-word-limit="false"
                :autosize="{ minRows: 2, maxRows: 10 }"
                maxlength="500"
                type="textarea"
                @input="clickFormRow"
              />
            </fks-form-item>
            <div
              class="form-item-tip"
              style="margin-left: 120px; color: #ff4d4f; font-size: 12px"
              v-if="!showTipInOneLine && this.isSensitiveRemark && type !== 'view'"
            >
              请注意，用车事由说明包含敏感词汇
            </div>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item
              prop="fyDeptName"
              label="用车费用归属部门"
            >
              <fks-select
                v-model="(noAuth || flowConfig.fyDeptId) ? formData.fyDeptName : formData.fyDeptId"
                :disabled="getDisableFlag('fyDeptName')"
                :placeholder="getDisableFlag('fyDeptName') ? '' : '请选择用车费用归属部门'"
                filterable
                class="full-width"
                @change="handleFyDeptIdChange"
              >
                <fks-option
                  v-for="option in secondLevelUnitList"
                  :key="option.id"
                  :label="option.deptName"
                  :value="option.id"
                />
              </fks-select>
            </fks-form-item>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item label="航班号/车次" prop="otherField2">
              <fks-input
                v-model="formData.otherField2"
                :disabled="getDisableFlag('otherField2')"
                :placeholder="flowConfig.otherField2 === 'readonly' ? '' : '请输入航班号/车次'"
                :resize="flowConfig.otherField2 === 'readonly' ? 'none' : 'vertical'"
                autosize
                type="textarea"
                @input="clickFormRow"
              />
            </fks-form-item>
          </fks-col>
          <fks-col :span="24" style="width: 100%; display: flex; justify-content: flex-start">
            <div ref="leftCol" class="left-col flex-grow-1" style="width: 0">
              <fks-col :span="24" class="addr-item">
                <fks-form-item ref="startFormItem" prop="startAddress">
                  <span slot="label">
                    出发地
                    <span
                      v-if="
                        isSensitiveStartAddress &&
                        flowConfig.startAddress !== 'readonly' &&
                        showTipInOneLine
                      "
                      style="
                        color: #ff4d4f;
                        font-size: 12px;
                        line-height: 16px;
                        display: inline-flex;
                        align-items: center;
                      "
                    >
                      （请注意，出发地包含敏感词汇。{{ sensitiveContent.startNotify }}）
                      <fks-tooltip
                        class="item"
                        effect="light"
                        content="地址包含小区等涉及私用的地址时，会被标记为敏感地址。此标记由AI判定识别，如存在误判，可忽略此提醒，不影响表单提交。"
                        placement="top"
                        popper-class="address-popper"
                      >
                        <img
                          :src="require('@/assets/img/searchbar/red-question.svg')"
                          style="
                            width: 16px;
                            height: 16px;
                            object-fit: contain;
                            transform: translateY(1px);
                          "
                        />
                      </fks-tooltip>
                    </span>
                  </span>
                  <Highlight
                    ref="startAddressHighlightRef"
                    id="startAddress"
                    @click.native="handleAddressHighlightClick('start')"
                  >
                    <fks-input
                      ref="startAddressInputRef"
                      v-model="formData.startAddress"
                      :disabled="getDisableFlag('startAddress')"
                      :placeholder="
                        flowConfig.startAddress === 'readonly' ? '' : '请展开地图搜索出发地'
                      "
                      :type="flowConfig.startAddress === 'readonly' ? 'textarea' : 'input'"
                      autosize
                      resize="none"
                      class="appendButton"
                      style="position: relative; backgorund: none"
                      maxlength="500"
                      clearable
                      @focus="getLocation('start')"
                      @clear="handleAddressClear('start')"
                    >
                      <i
                        v-if="flowConfig.startAddress !== 'readonly'"
                        slot="suffix"
                        style="width: 25px; font-size: 16px"
                        class="fks-icon-location-outline"
                      />
                    </fks-input>
                  </Highlight>
                </fks-form-item>
                <div
                  class="form-item-tip"
                  style="margin-left: 120px; color: #ff4d4f; font-size: 12px"
                  v-if="!showTipInOneLine && this.isSensitiveStartAddress && type !== 'view'"
                >
                  请注意，出发地包含敏感词汇
                </div>
              </fks-col>
              <transition-group
                name="list"
                tag="div"
                ref="draggableContainer"
                class="draggableContainer"
              >
                <fks-col
                  :span="24"
                  v-for="(viaPoint, index) in formData.vdAfWaypointList"
                  :key="viaPoint.uniId"
                  class="addr-item"
                  v-cloak
                >
                  <fks-col :span="showWayPoints ? 23 : 24">
                    <fks-form-item :prop="'vdAfWaypointList.' + index + '.address'">
                      <span slot="label">
                        <!--                    <span class="via-drag-handle" style="cursor: move; margin-right: 8px;">&#x2630;</span>-->
                        途经点{{ index + 1 }}
                        <span
                          v-if="
                            wayPointsSensitive[index].private &&
                            flowConfig.vdAfWaypointList !== 'readonly' &&
                            showTipInOneLine
                          "
                          style="
                            color: #ff4d4f;
                            font-size: 12px;
                            line-height: 16px;
                            display: inline-flex;
                            align-items: center;
                          "
                        >
                          （请注意，途经点{{ index + 1 }}包含敏感词汇。{{
                            wayPointsSensitive[index].notify
                          }}）
                          <fks-tooltip
                            class="item"
                            effect="light"
                            content="地址包含小区等涉及私用的地址时，会被标记为敏感地址。此标记由AI判定识别，如存在误判，可忽略此提醒，不影响表单提交。"
                            placement="top"
                            popper-class="address-popper"
                          >
                            <img
                              :src="require('@/assets/img/searchbar/red-question.svg')"
                              style="
                                width: 16px;
                                height: 16px;
                                object-fit: contain;
                                transform: translateY(1px);
                              "
                            />
                          </fks-tooltip>
                        </span>
                      </span>
                      <Highlight
                        ref="viaPointHighlightRef"
                        :id="'viaPoint' + index"
                        @click.native="getLocation('via', index)"
                      >
                        <fks-input
                          v-model="viaPoint.address"
                          :disabled="getDisableFlag('startAddress')"
                          :placeholder="
                            flowConfig.vdAfWaypointList === 'readonly' ? '' : '请展开地图搜索途经点'
                          "
                          :type="flowConfig.vdAfWaypointList === 'readonly' ? 'textarea' : 'input'"
                          autosize
                          resize="none"
                          class="appendButton"
                          style="position: relative; background: none"
                          maxlength="500"
                          @focus="getLocation('via', index)"
                        >
                          <div v-if="showWayPoints" slot="suffix" class="flex col-center">
                            <i
                              class="fks-icon-circle-close m-r-10 cursor-pointer clear-icon"
                              @click.stop="handleAddressClear('via', index)"
                            />
                            <i
                              style="width: 25px; font-size: 16px; cursor: move"
                              class="via-drag-handle"
                            >
                              <img
                                src="@/assets/img/application/dragger.svg"
                                width="16"
                                height="16"
                              />
                            </i>
                          </div>
                        </fks-input>
                      </Highlight>
                    </fks-form-item>
                  </fks-col>
                  <fks-col :span="1" v-if="showWayPoints">
                    <!-- 删除途经点按钮 -->
                    <div style="margin-left: 8px; margin-top: 45px">
                      <fks-button text size="mini" @click="removeViaPoint(index)">
                        <i
                          class="fks-icon-remove-outline"
                          style="font-size: 16px; width: 16px; height: 16px; color: #ff4143"
                        ></i>
                      </fks-button>
                    </div>
                  </fks-col>
                </fks-col>
              </transition-group>
              <fks-col :span="24" class="addr-item">
                <fks-form-item prop="endAddress">
                  <span slot="label">
                    目的地
                    <span
                      v-if="
                        isSensitiveEndAddress &&
                        flowConfig.endAddress !== 'readonly' &&
                        showTipInOneLine
                      "
                      style="
                        color: #ff4d4f;
                        font-size: 12px;
                        line-height: 16px;
                        display: inline-flex;
                        align-items: center;
                      "
                    >
                      （请注意，目的地包含敏感词汇。{{ sensitiveContent.endNotify }}）
                      <fks-tooltip
                        class="item"
                        effect="light"
                        content="地址包含小区等涉及私用的地址时，会被标记为敏感地址。此标记由AI判定识别，如存在误判，可忽略此提醒，不影响表单提交。"
                        placement="top"
                        popper-class="address-popper"
                      >
                        <img
                          :src="require('@/assets/img/searchbar/red-question.svg')"
                          style="
                            width: 16px;
                            height: 16px;
                            object-fit: contain;
                            transform: translateY(1px);
                          "
                        />
                      </fks-tooltip>
                    </span>
                  </span>
                  <Highlight
                    ref="endAddressHighlightRef"
                    id="endAddress"
                    @click.native="handleAddressHighlightClick('end')"
                  >
                    <fks-input
                      v-model="formData.endAddress"
                      :disabled="getDisableFlag('endAddress')"
                      :placeholder="
                        flowConfig.endAddress === 'readonly' ? '' : '请展开地图搜索目的地'
                      "
                      :type="flowConfig.endAddress === 'readonly' ? 'textarea' : 'input'"
                      autosize
                      resize="none"
                      clearable
                      class="appendButton"
                      maxlength="500"
                      @focus="getLocation('end')"
                      @clear="handleAddressClear('end')"
                    >
                      <i
                        v-if="flowConfig.endAddress !== 'readonly'"
                        slot="suffix"
                        style="width: 25px; font-size: 16px"
                        class="fks-icon-location-outline"
                      />
                    </fks-input>
                  </Highlight>
                </fks-form-item>
                <div
                  class="form-item-tip"
                  style="margin-left: 120px; color: #ff4d4f; font-size: 12px"
                  v-if="!showTipInOneLine && this.isSensitiveEndAddress && type !== 'view'"
                >
                  请注意，目的地包含敏感词汇
                </div>
              </fks-col>
            </div>
            <div
              v-if="getRequiredFlag('startAddress')"
              class="right-col"
              ref="rightCol"
              :style="{ height: addrTotalHeight + 'px' }"
            >
              <!-- 花括号容器（样式由你给定） -->
              <div
                class="bracket-container"
                :style="{ height: bracketHeight + 'px', top: bracketTop + 'px' }"
              >
                <!-- “查看”按钮在花括号中部 -->
                <div class="revers-btn" @click="reversAddr">
                  <img src="@/assets/img/application/revers.svg" width="12" height="16" />
                </div>
              </div>
              <!-- “途经点”按钮放在花括号右侧，并水平居中 -->
              <fks-button
                @click="addViaPoint"
                text
                icon="fks-icon-circle-plus-outline"
                class="plus-btn"
                :style="{ top: bracketTop + 'px' }"
              >
                途经点
              </fks-button>
            </div>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item prop="startTime">
              <span slot="label">
                出车时间
                <span
                  v-if="type !== 'view' && showNotify && notifyTime && showTipInOneLine"
                  v-html="notifyTime"
                />
              </span>
              <fks-date-picker
                v-model="formData.startTime"
                :clearable="false"
                @change="handleChange"
                :disabled="getDisableFlag('startTime')"
                :pickerOptions="startPickerOptions"
                class="full-width"
                :placeholder="flowConfig.startTime === 'readonly' ? '' : '请选择出车时间'"
                type="datetime"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
              >
              </fks-date-picker>
            </fks-form-item>
            <div
              class="form-item-tip"
              style="margin-left: 120px; height: 14px; color: #ff4d4f; font-size: 12px"
              v-if="!showTipInOneLine && type !== 'view' && showNotify && notifyTime && isShowTip"
              v-html="notifyTime"
            ></div>
          </fks-col>
          <fks-col
            :lg="24"
            :md="24"
            :sm="24"
            :xl="24"
            :xs="24"
            style="margin-top: 8px; margin-bottom: 8px"
          >
            <fks-form-item label="出车形式" prop="useCarTripType">
              <div
                style="
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  justify-content: space-between;
                  min-width: 100%;
                  max-width: 100%;
                "
              >
                <div
                  style="display: flex; justify-content: space-between; align-items: center"
                  :style="{
                    minWidth:
                      showJgFormItem && flowConfig.useCarTripType === 'readonly' ? '100%' : 'unset',
                  }"
                >
                  <div>
                    <fks-radio-group
                      :disabled="getDisableFlag('useCarTripType')"
                      v-model="formData.useCarTripType"
                      @change="clickFormRow"
                    >
                      <fks-radio
                        v-for="option in useCarTripTypeOptions"
                        :label="option.key"
                        :key="option.code"
                      >
                        {{ option.value }}
                      </fks-radio>
                    </fks-radio-group>
                  </div>
                  <div
                    v-if="showJgFormItem && flowConfig.useCarTripType === 'readonly'"
                    style="display: flex; align-items: center"
                  >
                    <span class="m-r-20">间隔时长</span>
                    <span
                      >{{ formData.useCarJgTimeHour || '-' }}小时{{
                        formData.useCarJgTimeMinute || '-'
                      }}分</span
                    >
                  </div>
                </div>
                <div
                  v-if="showJgFormItem && flowConfig.useCarTripType !== 'readonly'"
                  style="display: flex; align-items: center"
                >
                  <span class="m-r-20">间隔时长</span>
                  <fks-input-number
                    :disabled="getDisableFlag('useCarTripType')"
                    v-model="formData.useCarJgTimeHour"
                    size="small"
                    controls-position="right"
                    :min="0"
                    @input="clickFormRow"
                  />
                  <span class="m-r-20 m-l-20">小时</span>
                  <fks-input-number
                    :disabled="getDisableFlag('useCarTripType')"
                    v-model="formData.useCarJgTimeMinute"
                    size="small"
                    controls-position="right"
                    :min="0"
                    :max="60"
                    @input="clickFormRow"
                  />
                  <span class="m-l-20">分</span>
                </div>
              </div>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24" class="flex col-center">
            <!--          <fks-form-item-->
            <!--            :rules="[{ required: true, message: '请选择提前量' }]"-->
            <!--            label="允许提前量"-->
            <!--          >-->
            <!--            <fks-select-->
            <!--              v-model="formData.otherField1"-->
            <!--              :disabled="flowConfig.otherField1 === 'readonly'"-->
            <!--            >-->
            <!--              <fks-option-->
            <!--                v-for="item in otherField1List"-->
            <!--                :key="item"-->
            <!--                :label="item + '分钟'"-->
            <!--                :value="item"-->
            <!--              />-->
            <!--            </fks-select>-->
            <!--          </fks-form-item>-->
            <fks-form-item :span="24" label="预计返回时间" prop="endTime">
              <fks-date-picker
                v-model="formData.endTime"
                :clearable="false"
                :disabled="getDisableFlag('endTime')"
                :pickerOptions="endPickerOptions"
                class="full-width"
                :placeholder="flowConfig.endTime === 'readonly' ? '' : '请选择预计返回时间'"
                type="datetime"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
                @change="handleEndTimeChange"
              >
              </fks-date-picker>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="联系人" prop="contacts">
              <new-person-selector
                :initial-value.sync="formData.contacts"
                :read-only="getDisableFlag('contacts')"
                @closePopup="handleSelectContacts"
              />
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="联系电话" prop="contactsPhone">
              <fks-input
                v-model="formData.contactsPhone"
                :disabled="getDisableFlag('contactsPhone')"
                @input="clickFormRow"
              />
            </fks-form-item>
          </fks-col>
          <!--        <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">-->
          <!--          <fks-form-item v-if="timeStr" label="预计时长">-->
          <!--            <fks-input :value="timeStr" disabled />-->
          <!--          </fks-form-item>-->
          <!--        </fks-col>-->
          <!--        <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24" class="distance-col">-->
          <!--          <fks-form-item v-if="distanceStr" label="预计距离">-->
          <!--            <fks-input :value="distanceStr" disabled />-->
          <!--          </fks-form-item>-->
          <!--        </fks-col>-->
          <fks-col class="max-width-1400">
            <fks-collapse v-model="activeNames">
              <fks-collapse-item name="1">
                <template slot="title">
                  <div>
                    <i class="fks-icon-location-outline d-inline-block m-r-10"></i>
                    <span>{{ `${activeNames.length ? '收缩' : '展开'}地图` }}</span>
                    <span v-if="showTrackAlert" style="color: #ff4143"
                      >（由于存在手动输入地址,路径规划功能不可用）</span
                    >
                  </div>
                </template>
                <Track
                  v-if="activeNames.length > 0"
                  id="trackMapContainer"
                  :distance-str="distanceStr"
                  :way-points="formData.vdAfWaypointList"
                  :time-str="timeStr"
                  :end-point="{ x: this.formData.endAddressSmx, y: this.formData.endAddressSmy }"
                  :start-point="{
                    x: this.formData.startAddressSmx,
                    y: this.formData.startAddressSmy,
                  }"
                />
              </fks-collapse-item>
            </fks-collapse>
          </fks-col>
        </fks-row>
        <fks-row>
          <fks-col :span="24" ref="section-2">
            <header>
              <common-title title="乘车人信息" />
            </header>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item label="乘车人数（人）" prop="useCarPersonNum">
              <fks-input
                v-model="formData.useCarPersonNum"
                :disabled="getDisableFlag('useCarPersonNum')"
                :min="0"
                class="appendButton"
                placeholder="请填写乘车人数"
                type="number"
                @input="clickFormRow"
              />
            </fks-form-item>
          </fks-col>
          <fks-col :span="24" class="m-t-20">
            <div class="full-width flex col-center row-between">
              <div style="font-size: 14px; color: #555555">乘车人信息</div>
              <i
                v-if="showAddPassengerButton"
                class="fks-icon-circle-plus-outline cursor-pointer"
                style="color: #ccc; font-size: 16px"
                @click="addPerson"
              />
            </div>
            <div
              v-if="
                flowConfig.useCarMatter !== 'readonly' && formData.vdAfUseCarPersonList.length === 0
              "
              class="passenger-alert"
            >
              <img :src="require('@/assets/img/application/alert.svg')" alt="#" />
              <span>暂无乘车人信息，可点击右上角加号添加</span>
            </div>
            <div
              v-if="!getDisableFlag('contactsPhone') && formData.vdAfUseCarPersonList.length > 0"
              class="p-b-32"
            >
              <template v-for="(item, index) in formData.vdAfUseCarPersonList">
                <div :key="item.key" class="apply-person-card">
                  <fks-row v-if="flowConfig.useCarMatter !== 'readonly'" :gutter="20">
                    <fks-col
                      :span="applierCols.span[0]"
                      :offset="applierCols.offset[0]"
                      class="sort-index"
                      style="text-align: left; line-height: 36px; height: 36px"
                      >乘车人
                      {{ formData.vdAfUseCarPersonList.length - index }}
                    </fks-col>
                    <fks-col :span="applierCols.span[1]" :offset="applierCols.offset[1]">
                      <fks-form-item
                        :prop="`vdAfUseCarPersonList.${index}.ucPersonFullName`"
                        label="姓名"
                        class="vertical-form-item"
                      >
                        <new-person-selector
                          :current-key="item.currentKey"
                          :initial-value.sync="item.ucPersonFullName"
                          :read-only="flowConfig.useCarMatter === 'readonly'"
                          @closePopup="closePopupPerson"
                        />
                      </fks-form-item>
                    </fks-col>
                    <fks-col :span="applierCols.span[2]" :offset="applierCols.offset[2]">
                      <fks-form-item
                        :prop="`vdAfUseCarPersonList.${index}.ucPersonPhone`"
                        label="联系电话"
                        class="vertical-form-item"
                      >
                        <fks-input
                          v-model="item.ucPersonPhone"
                          placeholder="请输入联系电话"
                          type="number"
                          class="full-width"
                          @change="item.ucPersonResource = 3"
                        />
                      </fks-form-item>
                    </fks-col>
                    <fks-col :span="applierCols.span[3]" :offset="applierCols.offset[3]">
                      <fks-button
                        circle
                        icon="fks-icon-minus"
                        plain
                        type="info"
                        size="mini"
                        @click.stop="minusPerson(item, index)"
                      />
                    </fks-col>
                  </fks-row>
                </div>
              </template>
            </div>
            <fks-table
              v-if="formData.vdAfUseCarPersonList.length && !showAddPassengerButton"
              class="m-b-24 max-width-1400 m-t-24"
              :data="formData.vdAfUseCarPersonList"
              :header-cell-style="{
                background: 'transparent',
                color: '#333333aa !important',
                fontWeight: 'unset !important',
              }"
              :cell-style="{ color: '#333333 !important' }"
            >
              <fks-table-column header-align="left" align="left" label="#" type="index" />
              <fks-table-column
                header-align="left"
                align="left"
                label="姓名"
                prop="ucPersonFullName"
              />
              <fks-table-column
                header-align="left"
                align="left"
                label="电话号码"
                prop="ucPersonPhone"
              />
            </fks-table>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item label="留言" prop="remark2">
              <fks-input
                v-model="formData.remark2"
                :disabled="getDisableFlag('remark2')"
                :placeholder="flowConfig.remark2 === 'readonly' ? '' : '请输入需要发送给司机的留言'"
                :resize="flowConfig.remark2 === 'readonly' ? 'none' : 'vertical'"
                autosize
                type="textarea"
                @input="clickFormRow"
              />
            </fks-form-item>
          </fks-col>
        </fks-row>
        <div v-if="getVisibleFlag('carNum')">
          <CarSelector
            ref="section-3"
            :car-num-validator="carNumValidator"
            :change-car="changeCar"
            :choose-car="chooseCar"
            :form-data="formData"
            :is-car-info="true"
            :is-edit-car="getRequiredFlag('carNum')"
            :type="type"
            :show-choose-button="true"
            :vd-car-info="vdCarInfo"
            @selectCar="closePopupCar"
          />
          <DriverSelector
            ref="section-4"
            class="m-t-32"
            :change-driver="changeDriver"
            :choose-car-driver="chooseCarDriver"
            :form-data="formData"
            :format-phone-number="formatPhoneNumber"
            :is-car-info="true"
            :is-edit-car="getRequiredFlag('carNum')"
            :phone-validator="phoneValidator"
            :show-choose-button="true"
            :type="type"
            :vd-driver-info="vdDriverInfo"
            @selectDriver="closePopupDriver"
          />
        </div>
        <fks-row v-if="getVisibleFlag('endTime2')" class="fee m-t-32">
          <fks-col :span="24" ref="section-5">
            <common-title title="行车日志填报" />
          </fks-col>
          <fks-col v-for="item in feeConfigs" :key="item.prop" :span="24">
            <fks-form-item :prop="item.prop" v-if="getVisibleFlag(item.prop)">
              <template slot="label">
                  {{item.label}}
                  <fks-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top-start">
                    <i class="fks-icon-info-outline" style="color: #999999;font-size: 16px" />
                  </fks-tooltip>
              </template>
              <fks-input
                v-if="item.pcType === 'input-number'"
                v-model="formData[item.prop]"
                :disabled="getDisableFlag(item.prop) || item.readonly"
                :placeholder="getPlaceholder(item.unit)"
              >
                <template slot="append">
                  {{ item.unit || '' }}
                </template>
              </fks-input>
              <fks-date-picker
                v-else-if="item.pcType === 'date'"
                v-model="formData[item.prop]"
                :disabled="getDisableFlag(item.prop) || item.readonly"
                :pickerOptions="getPickerOptions(item.prop)"
                :placeholder="`请选择${item.label}`"
                class="full-width"
                clearable
                type="datetime"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
              <input-attachment
                v-else-if="item.pcType === 'input-attachment'"
                :formData="formData"
                :disabled="getDisableFlag(item.prop) || item.readonly"
                :select-options="getSelectOptions(item.prop)"
                :inputName="item.prop"
                :inputUnit="item.unit"
                :selectName="item.selectName"
                :attachmentName="item.attachmentName"
                :accept="getAccept(item.prop)"
                :limit="item.limit"
                :tooltop="item.tooltip"
                @file="handleRecognize($event, item)"
              />
              <fks-select
                v-else-if="item.pcType === 'select'"
                v-model="formData[item.prop]"
                :disabled="getDisableFlag(item.prop) || item.readonly"
                :placeholder="flowConfig[item.prop] === 'readonly' || item.readonly ? '' : '请选择'"
                class="full-width"
                clearable
              >
                <fks-option
                  v-for="option in enums[item.optionsKey]"
                  :key="option.key"
                  :label="option.value"
                  :value="option.key"
                />
              </fks-select>
              <fks-input
                v-else-if="item.computed"
                :value="computeFieldValue(item.prop)"
                :placeholder="getPlaceholder(item.unit)"
                disabled
              >
                <template slot="append">
                  {{ item.unit || '' }}
                </template>
              </fks-input>

            </fks-form-item>
          </fks-col>
          <fks-col :span="24" class="flex m-t-32">
            <div style="font-size: 14px; color: #333333">费用合计（元）</div>
            <div style="margin-left: 12px; color: #3c83ff; font-size: 14px">
              {{ journeyCostTotal || 0 }}元
            </div>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item label="费用备注">
              <fks-input
                v-model="formData.remark3"
                :disabled="getDisableFlag('remark3')"
                :placeholder="
                  flowConfig.remark3 === 'readonly' || type === 'view' ? '' : '请输入备注'
                "
                type="textarea"
                show-word-limit
              />
            </fks-form-item>
          </fks-col>
          <fks-col :span="24">
            <fks-form-item label="其他附件">
              <input-attachment
                :formData="formData"
                :disabled="getDisableFlag('attachment1')"
                attachment-name="attachment1"
              />
            </fks-form-item>
          </fks-col>
        </fks-row>
        <fks-row v-if="showRate">
          <fks-col :span="24" ref="section-11">
            <common-title title="评价" />
          </fks-col>
          <rater type="view" :row="formData" :visible="true" />
        </fks-row>
        <fks-row>
          <fks-col :span="24" ref="section-6" class="m-t-32">
            <header>
              <common-title title="申请信息" />
            </header>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="申请人" prop="task0FullName">
              <fks-input
                :class="{ 'border-style': isApply }"
                :value="formData.task0FullName"
                disabled
              />
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="部门" prop="task0Department">
              <fks-input
                :class="{ 'border-style': isApply }"
                :value="formData.task0Department"
                disabled
              />
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="申请时间" prop="task0Time">
              <fks-input
                v-if="formData.task0Time"
                :class="{ 'border-style': isApply }"
                :value="$dayjs(formData.task0Time).format('YYYY-MM-DD HH:mm')"
                disabled
              />
            </fks-form-item>
          </fks-col>
          <fks-col v-if="showTask100UserFormItem" :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item
              v-if="getDisableFlag('task100UserName')"
              label="审批领导"
              prop="task100FullName"
            >
              <fks-input
                :class="{ 'border-style': isApply }"
                :value="formData.task100FullName"
                disabled
              />
            </fks-form-item>
            <fks-form-item v-else label="审批领导" prop="task100UserName">
              <fks-select
                v-model="
                  noAuth || flowConfig.task100UserName === 'readonly'
                    ? formData.task100FullName
                    : formData.task100UserName
                "
                filterable
                :disabled="getDisableFlag('task100UserName')"
                :placeholder="disableTask100UserFormItem ? '' : '请选择审批领导'"
                class="full-width"
                @change="handleApprove1Change"
              >
                <fks-option
                  v-for="item in approveList1"
                  :key="item.id"
                  :label="item.userFullname"
                  :value="item.userName"
                  >{{ getApproveLabel(item) }}
                </fks-option>
              </fks-select>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item
              v-if="getDisableFlag('task200UserName')"
              label="车辆调度员"
              prop="task200FullName"
            >
              <fks-input
                :class="{ 'border-style': isApply }"
                :value="formData.task200FullName"
                disabled
              />
            </fks-form-item>
            <fks-form-item v-else label="车辆调度员" prop="task200UserName">
              <fks-select
                v-model="
                  noAuth || flowConfig.task200UserName === 'readonly'
                    ? formData.task200FullName
                    : formData.task200UserName
                "
                filterable
                :disabled="getDisableFlag('task200UserName')"
                class="full-width"
                placeholder="请选择车辆调度员"
                @change="handleApprove2Change"
              >
                <fks-option
                  v-for="item in approveList2"
                  :key="item.id"
                  :label="item.userFullname"
                  :value="item.userName"
                >
                  {{ getApproveLabel(item) }}
                </fks-option>
              </fks-select>
            </fks-form-item>
          </fks-col>
        </fks-row>
        <!--  司机确认流程时才显示      -->
        <fks-row v-if="getVisibleFlag('startTime2') && taskKey === taskKey300" class="m-t-32">
          <fks-col :span="24" ref="section-7">
            <common-title title="行程信息" />
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="出车前里程" prop="km1">
              <fks-input v-model="formData.km1" placeholder="请输入出车前里程">
                <template slot="append">公里</template>
              </fks-input>
            </fks-form-item>
          </fks-col>
          <fks-col :lg="24" :md="24" :sm="24" :xl="24" :xs="24">
            <fks-form-item label="实际开始时间" prop="startTime2">
              <fks-date-picker
                :readonly="false"
                :disabled="false"
                v-model="formData.startTime2"
                placeholder="请选择实际开始时间"
                class="full-width"
                clearable
                type="datetime"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
              />
            </fks-form-item>
          </fks-col>
        </fks-row>
        <fks-row v-if="!isApply">
          <fks-col :span="24" ref="section-9" class="m-t-32 m-b-32">
            <common-title title="审批记录" />
          </fks-col>
          <fks-col :span="24">
            <custom-flow-table :biz-id="bizId" />
          </fks-col>
        </fks-row>
        <!-- 变更原因 -->
        <fks-row v-if="isModify">
          <fks-col :span="24" ref="section-8" class="m-t-32 m-b-32">
            <common-title title="变更原因" />
          </fks-col>
          <fks-col :span="24">
            <fks-form-item
              class="hideLabel"
              prop="modifycomment"
              :rules="[{ required: true, validator: modifyCommentValidator }]"
            >
              <fks-input
                id="story"
                style="max-width: 700px"
                v-model="modifycomment"
                :rows="3"
                name="story"
                placeholder="请输入您的变更原因"
                type="textarea"
              >
              </fks-input>
            </fks-form-item>
          </fks-col>
        </fks-row>
<!--        <fks-row v-if="showApprove">-->
<!--          <fks-col :span="24" ref="section-10" class="m-t-32 m-b-32">-->
<!--            <common-title title="审批意见" />-->
<!--          </fks-col>-->
<!--          <fks-col :span="24">-->
<!--            <fks-input-->
<!--              v-model="formData.comment"-->
<!--              style="max-width: 700px"-->
<!--              type="textarea"-->
<!--              :placeholder="approvalAdvice"-->
<!--            />-->
<!--          </fks-col>-->
<!--        </fks-row>-->
      </div>
    </fks-form>
    <popper
      :show.sync="mapShow"
      show-navbar
      title="选择地点"
      @confirm="mapShow = false"
      :btn-name="'确定'"
    >
      <div>
        <a-map
          v-if="mapShow"
          :location-info.sync="locationInfo"
          :address-type="addressType"
          @update="handleMapUpdate"
          @enter="mapShow = false"
        />
        <flow-button v-if="isMobile" :onSubmit="(mapShow = false)" submit-text="确定" />
      </div>
    </popper>
    <popper :show.sync="popupShow" icon="dashboard" title="选择车辆" @confirm="onConfirmCar">
      <car-list
        ref="carList"
        :carCompanyInfoId.sync="formData.vdCarCompanyInfoId"
        @closePopup="closePopupCar"
        @closePopupShow="popupShow = false"
      ></car-list>
    </popper>
    <popper :show.sync="popupDriver" icon="user" title="选择司机" @confirm="onConfirmDriver">
      <driver-list
        v-if="popupDriver"
        ref="driverList"
        :carCompanyInfoId.sync="formData.vdCarCompanyInfoId"
        @closePopup="closePopupDriver"
        @closePopupShow="popupDriver = false"
      ></driver-list>
    </popper>
  </div>
</template>

<script>
import vehicleDispatchFormMixin from '@/mixins/vehicleDispatchFormMixin'
import platform from '@/mixins/platform'
import Popper from '@components/popper/index.vue'
import AMap from '@components/amap/index.vue'
import FlowButton from '@modules/FormCenter/components/FlowButton/index.vue'
import Track from '@components/amap/components/track.vue'
import NewPersonSelector from '@components/PersonSelector/main.vue'
import CarSelector from '@modules/FormCenter/components/CarAndDriverSelector/carSelector.vue'
import CarList from '@modules/FormCenter/CarApply/CarList/index.vue'
import DriverList from '@modules/FormCenter/CarApply/DriverList/index.vue'
import DriverSelector from '@modules/FormCenter/components/CarAndDriverSelector/driverSelector.vue'
import FormUpload from '@modules/FormCenter/components/FormUpload/index.vue'
import history from '@modules/ProjectCar/ProjectPortal/StatsChartOfProject/DrivingLog/history/history.vue'
import Rater from '@modules/ProjectCar/ProjectPortal/CarRecord/components/exclude/rater.vue'
import Highlight from '@components/Highlight/index.vue'
import CustomFlowTable from '@modules/FormCenter/components/CustomFlowTable/index.vue'
import InputAttachment from '@components/InputAttachment/pc-view.vue'
import { recognizePicture, uploadFile } from '@components/Camera/api'
import CardTag from '@components/CardFlow/components/tag.vue'
import { mapState } from 'vuex'
import { getCarListByPost } from '@modules/ProjectCar/ProjectPortal/CarManage/api'
import { getReservationInfo } from '@modules/FormCenter/CarApply/CarList/api'
import { TaskKeys } from '@store/modules/FormController/formFieldConfig'

export default {
  name: 'VehicleDispatchPCView',
  components: {
    CardTag,
    InputAttachment,
    CustomFlowTable,
    Highlight,
    Rater,
    FormUpload,
    DriverSelector,
    DriverList,
    CarList,
    CarSelector,
    NewPersonSelector,
    Track,
    FlowButton,
    AMap,
    Popper,
    history,
  },
  mixins: [vehicleDispatchFormMixin, platform],
  data() {
    return {
      fromHistory: false,
      isShowTip: false,
      carOptions: []
    }
  },
  methods: {
    getCardTag(item) {
      // 当正常情况下
      if (item.carStatus === 100) {
        return {text: item.status, color: item.status === '空闲中' ? '#03BE8A' : '#FF3F4C'}
      } else {
        if (this.carStatus) {
          const result = this.carStatus.find(el => el.key === item.carStatus);
          if (result) {
            return {text: result.value, color: '#cccccc'}
          }
        }
      }
    },
    handleCarChange(id) {
      const item = this.carOptions.find(item => item.id === id);
      this.closePopupCar(item)
    },
    async handleRecognize(file, item) {
      // 只有出车前里程和回车后里程需要进行图片上传识别
      if (item.prop === 'km1' || item.prop === 'km2') {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await uploadFile(formData)
        // 上传图片，然后识别，最后回填到对应的字段中
        if (uploadRes.status) {
          const fileId = uploadRes.data.id
          const m1 = this.$message({
            message: '正在识别里程数，请稍等...',
            duration: 0,
          })
          const res = await recognizePicture(fileId)
          if (res.status) {
            const mileage = res.data.mileage
            if (!Number.isNaN(Number(mileage))) {
              this.formData[item.prop] = Number(mileage)
              this.$message({
                type: 'success',
                message: '识别成功',
              })
              this.$nextTick(() => {
                m1.close()
              })
            } else {
              this.$message({
                type: 'error',
                message: '识别失败，请重新上传',
              })
              m1.close()
            }
          } else {
            m1.close()
          }
        }
      }
    },
    getAccept(prop) {
      // 出车前里程/回车后里程只能上传图片
      switch (prop) {
        case 'km1':
          return 'image/*'
        case 'km2':
          return 'image/*'
        default:
          return 'image/*,application/pdf'
      }
    },
    handleAddressHighlightClick(str) {
      if (this.flowConfig[`${str}Address`] !== 'readonly') {
        this.getLocation(str)
      }
    },
    handleChange(val) {
      this.isShowTip = true
      this.clickFormRow()
    },
    wayPointValidator(rule, value, callback, index) {
      if (this.formData.vdAfWaypointList[index].address) {
        callback()
      } else {
        callback(new Error(`请输入途经点${index + 1}`))
      }
    },
    modifyCommentValidator(rule, value, callback) {
      if (this.modifycomment) {
        callback()
      } else {
        callback(new Error('请填写变更原因'))
      }
    },
    passengerValidator(rule, value, callback, index) {
      setTimeout(() => {
        if (this.formData.vdAfUseCarPersonList[index].ucPersonFullName) {
          callback()
        } else {
          callback(new Error('请输入姓名'))
        }
      }, 1000)
    },
    // 导入历史行程
    importDispatch() {
      this.$refs.history.open()
    },
    loadHistory(currData) {
      this.fromHistory = true
      const fields = [
        'startAddress',
        'startAddressSmx',
        'startAddressSmy',
        'endAddress',
        'endAddressSmx',
        'endAddressSmy',
        'startTime',
        'endTime',
        'useCarMatter',
        'useCarPersonNum',
        'flagBb',
        'remark2',
        'task200FullName',
        'task200UserName',
        'task100FullName',
        'task100UserName',
        'vdAfUseCarPersonList',
        'remark1',
        'otherField2',
        'useCarTripType',
        'useCarJgTimeHour',
        'useCarJgTimeMinute',
        'contacts',
        'contactsPhone',
        'fyDeptName',
        'fyDeptId'
      ]

      fields.forEach((field) => {
        if (currData[field] !== undefined) {
          this.formData[field] = currData[field]
        }
      })
      let bizId = currData.id

      this.searchWayPointList(bizId)
      this.$nextTick(() => {
        if (this.$refs['section-3']) {
          this.$refs['section-3'].chooseCarByNum(currData.carId)
        }
      })
    },
  },
  computed: {
    showTipInOneLine() {
      return this.type === 'add'
    },
    getApproveLabel() {
      return (item) => {
        const content1 = item.userDepName2 || ''
        const content2 = item.userDepName || ''
        return item.userFullname + '  ' + content1 + ' ' + content2
      }
    }
  },
  async mounted() {
    if (this.type === 'add' || this.type === 'view') {
      this.isShowTip = false
    } else {
      this.isShowTip = this.taskKey === 'UserTask_0' ? false : true
    }
  },
  watch: {},
}
</script>

<style lang="less" scoped>
@import '~@/modules/FormCenter/CarApply/index.less';
@import '~@/styles/disabled';
@import '~@/styles/tabs';
@import '~@/styles/input';

.noAuth {
  max-width: 1600px;
  margin: 40px auto 0 auto;
}

.tip {
  font-size: 28px;
  padding: 16px 32px;
  background: rgba(60, 131, 255, 0.1);
  border-radius: 4px;
  border-left: 10px solid #3c83ff;
}

.appendButton {
  /deep/ .fks-input-group__append {
    background-color: rgba(23, 144, 254, 0.1) !important;
    color: #027aff !important;
    border: 1px solid rgba(23, 144, 254, 0.4) !important;
  }

  /deep/ .fks-input__inner {
  }
}

div.fee-item {
  padding-left: 32px;
}

/deep/ .fks-collapse {
  border-top: none !important;
}

/deep/ .fks-collapse .fks-collapse-item .fks-collapse-item__header {
  border-bottom: none !important;
}

/deep/ .fks-textarea__inner {
  margin: 6px 0 !important;
}
[v-cloak] {
  display: none;
}
/* 示例 CSS */
.list-move {
  transition: transform 0.3s ease; /* 仅对位置变化应用过渡 */
}
.list-enter-active,
.list-leave-active {
  transition: opacity 0.3s;
}
.list-enter,
.list-leave-to {
  opacity: 0;
}
</style>

<style>
@import './exclude/popper.css';
@import './exclude/via.css';
@import './exclude/pc-view.css';
</style>
