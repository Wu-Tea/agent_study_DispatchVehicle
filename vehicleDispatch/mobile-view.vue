<template>
  <div class="vehicle-applcation-container">
    <fm-badge v-if="isApply && showTip && !!formData.remindTitle" style="margin-left: 15px; margin-right: 10px;">
      <fm-cell
        v-for="(text, index) in alertText"
        :key="index"
        class="full-width"
        :title="text"
        title-class="prompt-title"
        value=""
        value-class="prompt-value"
      />
      <template #content>
        <fm-icon name="cross" class="badge-icon" @click="showTip = false" />
      </template>
    </fm-badge>

    <fm-form ref="formRef" validate-first>
      <div style="margin-left: 15px; margin-right: 10px;">
        <div class="flex row-between">
          <div class="sty_h">{{'用车信息' }}</div>
<!--          <fm-button size="small">车辆预约情况查看</fm-button>-->
        </div>

        <fm-cell-group>
          <fm-cell class="description-cell" title="所属项目">
            <template #default>
              <span style="color: #191919">
                {{ currProjectName }}
              </span>
            </template>
          </fm-cell>
        </fm-cell-group>

        <fm-cell-group>
          <fm-cell class="description-cell" title="行程编号">
            <template #default>
              <input class="trip-num" disabled style="width: 100%; box-sizing: border-box;border: 0;color: #191919;text-align: right;" type="text" placeholder="系统自动生成" v-model="formData.formNum" />
            </template>
          </fm-cell>
        </fm-cell-group>

        <fm-field
          :class="{'left-cell-title': getRequiredFlag('flagBb')}"
          :value="formData.flagBb ? '是' : '否'"
          :is-link="flowConfig.flagBb !== 'readonly'"
          :rules="getFieldRule('flagBb', this)"
          placeholder="请选择是否补报"
          :show-error="false"
          :show-error-message="false"
          clickable
          error-message-align="right"
          input-align="right"
          label="是否补报"
          name="flagBb"
          readonly
          required
          scroll-to-error
          @click.stop.native="flowConfig.flagBb === 'readonly' ? '' : (showPickerFlagBb = true)"
        />
        <select-picker
          :code.sync="formData.flagBb"
          :show.sync="showPickerFlagBb"
          :is-enum="false"
          :column="flagBbOption"
          @choose="clickFormRow"
        ></select-picker>

        <fm-field
          :class="{'left-cell-title': getRequiredFlag('useCarNature')}"
          v-model="formData.useCarNatureStr"
          :is-link="flowConfig.useCarNature !== 'readonly'"
          :rules="getFieldRule('useCarNature', this)"
          placeholder="请选择用车性质"
          :show-error="false"
          :show-error-message="false"
          clickable
          error-message-align="right"
          input-align="right"
          label="用车性质"
          name="useCarNature"
          readonly
          required
          scroll-to-error
          @click.stop.native="
            flowConfig.useCarNature === 'readonly' ? '' : (useCarNaturePickerShow = true)
          "
        />
        <select-picker
          ref="natureSelect"
          :code.sync="formData.useCarNature"
          :show.sync="useCarNaturePickerShow"
          :text.sync="formData.useCarNatureStr"
          :column="currProjectNature"
          :is-enum="false"
          @choose="handleUseCarNatureChange"
        ></select-picker>

        <fm-field
          :class="{'left-cell-title': getRequiredFlag('useCarMatter')}"
          v-model="formData.useCarMatterStr"
          :is-link="flowConfig.useCarMatter !== 'readonly'"
          :rules="getFieldRule('useCarMatter', this)"
          placeholder="请选择用车事由"
          :show-error="false"
          :show-error-message="false"
          clickable
          error-message-align="right"
          input-align="right"
          label="用车事由"
          name="useCarMatter"
          readonly
          required
          scroll-to-error
          @click.stop.native="
            flowConfig.useCarMatter === 'readonly' ? '' : (showPickerUseCarMatter = true)
          "
        />
        <select-picker
          :code.sync="formData.useCarMatter"
          :show.sync="showPickerUseCarMatter"
          :text.sync="formData.useCarMatterStr"
          :column="useCarMatterList"
          :is-enum="false"
          :is-show-search="true"
          @choose="handleUseCarMatterChange"
          @update:search="handleSearchUpdateUseList"
        ></select-picker>

        <fm-cell-group>
<!--          <fm-cell class="description-cell no-line" title="用车事由说明"-->
<!--                   :class="{'left-cell-title': getRequiredFlag('remark1')}">-->
<!--            &lt;!&ndash; <template #label>-->
<!--              <span :class="{'star': isApply || isReSubmit}">-->
<!--                {{-->
<!--                  flowConfig.remark1 === 'readonly' ? '' : '若用车较复杂，如用车需2天及以上，请详细描述。'-->
<!--                }}-->
<!--              </span>-->
<!--            </template> &ndash;&gt;-->
<!--          </fm-cell>-->
          <div class="flex col-center" style="padding: 14px 0">
            <red-star v-if="isApply || isReSubmit" style="font-size:14px;color: #ff4d4f" />
            <div
              style="font-size: 16px"
              :style="{
                color: flowConfig.remark1 ==='readonly'? '#999999' : '#555555',
                marginLeft: flowConfig.remark1 === 'readonly'? '15px' : '8px'
              }"
            >
              用车事由说明
            </div>
          </div>
          <fm-field
            v-model="formData.remark1"
            :rules="getFieldRule('remark1', this)"
            :readonly="flowConfig.remark1 === 'readonly'"
            :placeholder="
              flowConfig.remark1 === 'readonly'
                ? ''
                : '若用车较复杂，如用车需2天及以上，请详细描述。'
            "
            label=""
            maxlength="500"
            name="remark1"
            class="remark1"
            error-message-align="right"
            :required="false"
            :rows="2"
            autosize
            type="textarea"
            @input="clickFormRow"
          />
        </fm-cell-group>
        <fm-cell-group>
          <div class="flex col-center" style="padding: 14px 0">
            <red-star v-if="isApply || isReSubmit" style="font-size:14px;color: #ff4d4f" />
            <div
              style="font-size: 16px"
              :style="{
                color: flowConfig.fyDeptName ==='readonly'? '#999999' : '#555555',
                marginLeft: flowConfig.fyDeptName === 'readonly'? '15px' : '8px'
              }"
            >
              用车费用归属部门
            </div>
          </div>

          <fm-field
            v-model="formData.fyDeptName"
            :is-link="flowConfig.fyDeptName !== 'readonly'"
            :rules="[{ required: isApply || isReSubmit, message: '请选择用车费用归属部门' }]"
            :placeholder="flowConfig.fyDeptName === 'readonly' ? '' : '请选择用车费用归属部门'"
            :show-error="false"
            :show-error-message="false"
            clickable
            error-message-align="right"
            input-align="right"
            label=""
            name="fyDeptName"
            readonly
            :required="false"
            scroll-to-error
            class="fyDept-field"
            @click.stop.native="
            flowConfig.fyDeptName === 'readonly' ? '' : (fyDeptPickerShow = true)
          "
          />

          <select-picker
            :show.sync="fyDeptPickerShow"
            :is-enum="false"
            :code.sync="formData.fyDeptId"
            :text.sync="formData.fyDeptName"
            :is-show-search="true"
            :column="filteredSecondLevelUnitList"
            value-code="id"
            value-key="deptName"
            @choose="handleFyDeptChange"
            @update:search="handleSearchUpdateFyDeptList"
          />
        </fm-cell-group>

        <fm-cell-group class="otherField2" title="">
          <fm-cell class="description-cell no-line" title="航班号/车次"
                   :class="{'left-cell-title': getRequiredFlag('otherField2')}"></fm-cell>
          <fm-field
            v-model="formData.otherField2"
            :readonly="flowConfig.otherField2 === 'readonly'"
            :placeholder="flowConfig.otherField2 === 'readonly' ? '' : '请输入航班号/车次'"
            label=""
            maxlength="50"
            name="otherField2"
            class="remark1"
            required
            :autosize="{ minRows: 1, maxRows: 1 }"
            type="textarea"
            @input="clickFormRow"
          />
        </fm-cell-group>

        <div v-if="flowConfig.startAddress === 'readonly'">
          <fm-cell-group title="">
            <fm-cell class="description-cell" required title="出发地"> </fm-cell>
            <fm-field
              v-if="flowConfig.startAddress === 'readonly'"
              v-model="formData.startAddress"
              :readonly="true"
              :rules="getFieldRule('startAddress', this)"
              error-message-align="right"
              label=""
              maxlength="500"
              name="startAddress"
              required
              :autosize="{ minRows: 1, maxRows: 2 }"
              type="textarea"
            />
          </fm-cell-group>
          <fm-cell-group v-show="showOther" title="">
            <fm-cell :required="showOther" class="description-cell" title="出发地详情">
              <template #default>
                <fm-button
                  :icon="mapShowStart ? 'fks-icon-arrow-down' : 'fks-icon-arrow-up'"
                  class="ml-2"
                  size="small"
                  @click="getLocation('start')"
                  >选择地点
                </fm-button>
              </template>
            </fm-cell>
            <fm-field
              v-show="formData.startAddressDetail"
              v-model="formData.startAddressDetail"
              :required="showOther"
              maxlength="500"
              readonly
              type="textarea"
            />
          </fm-cell-group>
          <span
            v-if="isSensitiveStartAddress && type !== 'view'"
            style="
              display: inline-block;
              padding: 10px 0 10px 15px;
              color: #ff4d4f;
              font-size: 12px;
            "
          >
            请注意，出发地包含敏感词汇。{{ sensitiveContent.endNotify }}）
          </span>
        </div>
        <div v-else>
          <fm-cell-group title="">
            <fm-cell required class="description-cell" @click="getLocation('start')"
                     :class="{'left-cell-title': getRequiredFlag('startAddress')}" title="出发地">
              <template #default>
                <div class="ml-2" @click="getLocation('start')">
                  <img
                    src="@/assets/img/application/position.svg"
                    alt="选择地点1"
                    style="width: 12px; height: 14px"
                  />
                </div>
              </template>
            </fm-cell>
            <fm-field
              v-show="formData.startAddress"
              v-model="formData.startAddress"
              :required="showOther"
              :rules="getFieldRule('startAddress', this)"
              maxlength="500"
              :autosize="{ minRows: 1, maxRows: 2 }"
              readonly
              type="textarea"
              @click="getLocation('start')"
            />
          </fm-cell-group>
          <span
            v-if="isSensitiveStartAddress && type !== 'view'"
            style="
              display: inline-block;
              padding: 10px 0 10px 15px;
              color: #ff4d4f;
              font-size: 12px;
            "
          >
            请注意，出发地包含敏感词汇。{{ sensitiveContent.startNotify }}）
          </span>
        </div>
        <div style="display: flex; justify-content: flex-start; align-items: stretch">
          <div class="left-container" v-if="formData.vdAfWaypointList.length > 0 && showWayPoints" style="width: 20px; flex: 0 0 20px;">
            <div class="mobile-revers-btn" @click="reversAddr">
              <img src="@/assets/img/application/blue-reveres.svg" width="16" height="16" />
            </div>
          </div>
          <transition-group name="list" tag="div" class="draggableContainer flex-grow-1">
            <div
              v-for="(viaPoint, index) in formData.vdAfWaypointList"
              :key="viaPoint.uniId"
              class="addr-item"
            >
              <!-- 只读状态 -->
              <div v-if="flowConfig.startAddress === 'readonly'">
                <fm-cell-group title="">
                  <fm-cell class="description-cell" required :title="`途经点${index + 1}`">
                  </fm-cell>
                  <fm-field
                    v-if="flowConfig.startAddress === 'readonly'"
                    v-model="viaPoint.address"
                    :readonly="true"
                    error-message-align="right"
                    label=""
                    maxlength="500"
                    :autosize="{ minRows: 1, maxRows: 2 }"
                    required
                    type="textarea"
                  />
                </fm-cell-group>
                <fm-cell-group v-show="showOther" title="">
                  <fm-cell :required="showOther" class="description-cell" title="途经点详情">
                    <template #default>
                      <fm-button
                        :icon="mapShowStart ? 'fks-icon-arrow-down' : 'fks-icon-arrow-up'"
                        class="ml-2"
                        size="small"
                        @click="getLocation('via', index)"
                        >选择地点
                      </fm-button>
                    </template>
                  </fm-cell>
                  <fm-field
                    :rules="getFieldRule('vdAfWaypointList.' + index + '.address', this)"
                    v-show="viaPoint.address"
                    v-model="viaPoint.address"
                    :required="showOther"
                    maxlength="500"
                    :autosize="{ minRows: 1, maxRows: 2 }"
                    readonly
                    type="textarea"
                  />
                </fm-cell-group>
                <span
                  v-if="isSensitiveViaPoint(index) && type !== 'view'"
                  style="
                    display: inline-block;
                    padding: 10px 0 10px 15px;
                    color: #ff4d4f;
                    font-size: 12px;
                  "
                >
                  请注意，途经点{{ index + 1 }}包含敏感词汇。{{ sensitiveContent.viaNotify }}
                </span>
              </div>
              <!-- 非只读状态 -->
              <div v-else>
                <fm-cell-group title="">
                  <fm-cell
                    required
                    class="description-cell"
                    :title="`途经点${index + 1}`"
                    @click="getLocation('via', index)"
                    :class="{'left-cell-title': getRequiredFlag('vdAfWaypointList')}"
                  >
                    <template #default>
                      <div style="display: flex; justify-content: flex-end; gap: 6px">
                        <div class="ml-2" @click="getLocation('via', index)">
                          <img
                            src="@/assets/img/application/position.svg"
                            alt="选择地点1"
                            style="width: 12px; height: 14px"
                          />
                        </div>
                        <i
                          v-if="showWayPoints"
                          slot="suffix"
                          style="width: 12px;font-size: 16px; cursor: move; color: #757575"
                          class="via-drag-handle"
                        >
                          <img src="@/assets/img/application/container.svg" width="20" height="20" />
                        </i>
                        <div @click="removeViaPoint(index)" style="width: 18px; display: flex; align-items: center;margin-left: 5px;">
                          <i
                            v-if="showWayPoints"
                            slot="suffix"
                            style="width: 12px;font-size: 16px; cursor: move; color: #757575"
                            class="via-drag-handle"
                          >
                            <img src="@/assets/img/application/remove.svg" width="20" height="20" />
                          </i>
                        </div>
                      </div>
                    </template>
                  </fm-cell>
                  <fm-field
                    v-show="viaPoint.address"
                    v-model="viaPoint.address"
                    :required="showOther"
                    :rules="getFieldRule('vdAfWaypointList.' + index + '.address', this)"
                    @click="getLocation('via', index)"
                    maxlength="500"
                    :autosize="{ minRows: 1, maxRows: 2 }"
                    readonly
                    type="textarea"
                  />
                </fm-cell-group>
                <span
                  v-if="isSensitiveViaPoint(index) && type !== 'view'"
                  style="
                    display: inline-block;
                    padding: 10px 0 10px 15px;
                    color: #ff4d4f;
                    font-size: 12px;
                  "
                >
                  请注意，途经点{{ index + 1 }}包含敏感词汇。{{ sensitiveContent.viaNotify }}
                </span>
              </div>
            </div>
          </transition-group>
        </div>

        <div v-if="flowConfig.endAddress === 'readonly'">
          <fm-cell-group title="">
            <fm-cell class="description-cell" required title="目的地"> </fm-cell>
            <fm-field
              v-if="flowConfig.endAddress === 'readonly'"
              v-model="formData.endAddress"
              :readonly="true"
              :rules="getFieldRule('endAddress', this)"
              error-message-align="right"
              label=""
              maxlength="500"
              name="endAddress"
              :autosize="{ minRows: 1, maxRows: 2 }"
              required
              type="textarea"
            />
          </fm-cell-group>
          <span
            v-if="isSensitiveEndAddress && type !== 'view'"
            style="
              display: inline-block;
              padding: 10px 0 10px 15px;
              color: #ff4d4f;
              font-size: 12px;
            "
          >
            请注意，目的地包含敏感词汇。{{ sensitiveContent.endNotify }}）
          </span>
        </div>
        <div v-else>
          <fm-cell-group title="">
            <fm-cell class="description-cell" required title="目的地"
                     :class="{'left-cell-title': getRequiredFlag('endAddress')}"@click="getLocation('end')">
              <template #default>
                <div class="ml-2" @click="getLocation('end')">
                  <img src="@/assets/img/application/position.svg"
                       alt="选择地点1" style="width:12px; height:14px;" />
                </div>
              </template>
            </fm-cell>
            <fm-field
              v-show="formData.endAddress"
              v-model="formData.endAddress"
              :rules="getFieldRule('endAddress', this)"
              maxlength="500"
              name="endAddress"
              @click="getLocation('end')"
              :autosize="{ minRows: 1, maxRows: 2 }"
              readonly
              required
              type="textarea"
            />
          </fm-cell-group>
          <span
            v-if="isSensitiveEndAddress && type !== 'view'"
            style="
              display: inline-block;
              padding: 10px 0 10px 15px;
              color: #ff4d4f;
              font-size: 12px;
            "
          >
            请注意，目的地包含敏感词汇。{{ sensitiveContent.endNotify }}）
          </span>
        </div>
        <div v-if="showWayPoints" style="height: 40px;line-height: 40px;">
          <div style="height: 40px;line-height: 40px; display: flex; align-items: center;" @click="addViaPoint">
            <img src="@/assets/img/application/circle-add.svg" alt="添加途径点" style="width:16px; height:16px;margin-right: 3px; vertical-align: middle;" />
            <span style="font-size: 14px; color: #3C83FF;">途经点</span>
          </div>
        </div>

        <fm-field
          :class="{'left-cell-title': getRequiredFlag('startTime')}"
          v-model="formData.startTime"
          :placeholder="flowConfig.startTime === 'readonly' ? '' : '请选择出车时间'"
          :rules="getFieldRule('startTime', this)"
          error-message-align="right"
          clickable
          input-align="right"
          label-width="10em"
          label="出车时间"
          name="startTime"
          readonly
          required
          @click.stop.native="flowConfig.startTime === 'readonly' ? '' : (showCalendarStart = true)"
        >
          <template slot="suffix-icon">
            <div style="text-align: center; height: 20px; line-height: 20px; margin-left: 5px;">
              <img src="@/assets/img/application/time.svg"
                alt="出车时间" style="width:20px; height:20px;" />
            </div>
          </template>
        </fm-field>
        <date-time-picker
          :show.sync="showCalendarStart"
          :time.sync="formData.startTime"
          title="出车时间"
          type="datetime"
          @confirm="clickFormRow"
        />
        <fm-field label="出车形式" readonly required
                  :class="{'left-cell-title': getRequiredFlag('useCarTripType')}">
          <template #button>
            <fm-radio-group
              v-model="formData.useCarTripType"
              :disabled="flowConfig.useCarTripType === 'readonly'"
              direction="horizontal"
            >
              <fm-radio
                v-for="option in useCarTripTypeOptions"
                :key="option.code"
                :name="option.key"
                @change="clickFormRow"
              >
                {{ option.value }}
                <template #icon="props">
                  <img class="img-icon" style="width: 16px;height: 16px" :src="props.checked ? activeIcon : inactiveIcon" />
                </template>
              </fm-radio>
            </fm-radio-group>
          </template>
        </fm-field>
        <fm-field
          :class="{'left-cell-title': getRequiredFlag('useCarTripType')}"
          v-if="showJgFormItem"
          :value="jgTimeStr"
          :placeholder="flowConfig.useCarTripType === 'readonly' ? '' : '请选择间隔时长'"
          error-message-align="right"
          clickable
          input-align="right"
          label-width="10em"
          label="间隔时长"
          readonly
          @click.stop.native="flowConfig.useCarTripType === 'readonly' ? '' : (showJgTime = true)"
        >
          <template slot="suffix-icon">
            <div style="text-align: center; height: 20px; line-height: 20px; margin-left: 5px;">
              <img src="@/assets/img/application/time.svg"
                alt="间隔时长" style="width:20px; height:20px;" />
            </div>
          </template>
        </fm-field>
        <date-time-picker
          :show.sync="showJgTime"
          :time.sync="jgTime"
          :filter="jgFilter"
          title="往返间隔"
          type="time"
          @confirm="clickFormRow"
        />
        <select-picker
          :code.sync="formData.otherField1"
          :show.sync="showPickerOtherField1"
          :text.sync="formData.otherField1Str"
          :is-enum="false"
          :column="otherField1List"
          @confirm="handleOtherField1Change"
        ></select-picker>
        <!-- 提示 -->
        <span
          style="display: inline-block; padding: 10px 0 10px 15px"
          v-if="type !== 'view' && showNotify && notifyTime"
          v-html="notifyTime"
        />
        <fm-field
          :class="{'left-cell-title': getRequiredFlag('endTime')}"
          v-model="formData.endTime"
          :placeholder="flowConfig.endTime === 'readonly' ? '' : '请选择预计返回时间'"
          :rules="getFieldRule('endTime', this)"
          error-message-align="right"
          clickable
          input-align="right"
          label="预计返回时间"
          label-width="10em"
          name="predictEndTime"
          readonly
          required
          @click.stop.native="flowConfig.endTime === 'readonly' ? '' : (showCalendarEnd = true)"
        >
          <template slot="suffix-icon">
            <div style="text-align: center; height: 20px; line-height: 20px; margin-left: 5px;">
              <img src="@/assets/img/application/time.svg"
                alt="预计返回时间" style="width:20px; height:20px;" />
            </div>
          </template>
        </fm-field>
        <date-time-picker
          :show.sync="showCalendarEnd"
          :time.sync="formData.endTime"
          label-width="10em"
          title="预计返回时间"
          type="datetime"
          @confirm="handleEndTimeChange"
        ></date-time-picker>
        <fm-field
          :class="{'left-cell-title': getRequiredFlag('contacts')}"
          v-model="formData.contacts"
          :placeholder="flowConfig.contacts === 'readonly' ? '' : '请选择'"
          :rules="getFieldRule('contacts', this)"
          :readonly="flowConfig.contacts ==='readonly'"
          clickable
          input-align="right"
          label="联系人"
          name="contacts"
          required
          @click-suffix-icon="flowConfig.contacts === 'readonly' ? '' : chooseApplyPerson({ucPersonFullName: formData.contacts})"
        >
          <template slot="suffix-icon">
            <i v-if="flowConfig.contacts !== 'readonly'" class="fm-icon fm-icon-arrow" style="color: #3C83FF" />
          </template>
        </fm-field>
<!--          @click.stop.native="flowConfig.contacts === 'readonly' ? '' : chooseApplyPerson({ucPersonFullName: formData.contacts})"-->

        <fm-field
          :class="{'left-cell-title': getRequiredFlag('contactsPhone')}"
          v-model="formData.contactsPhone"
          :readonly="flowConfig.contactsPhone === 'readonly'"
          :rules="getFieldRule('contactsPhone', this)"
          input-align="right"
          label="联系电话"
          required
          type="tel"
        />

        <!--        <fm-cell-group v-if="distanceStr && showTripInfo" title="" >-->

        <!--          <fm-field v-model="distanceStr" input-align="right" label="预计距离" readonly/>-->
        <!--        </fm-cell-group>-->

        <!--        <fm-cell-group v-if="timeStr && showTripInfo" title="">-->
        <!--          <fm-field v-model="timeStr" input-align="right" label="预计时长" readonly/>-->
        <!--        </fm-cell-group>-->

        <fm-collapse v-show="showTrack" v-model="activeNames">
          <fm-collapse-item
            class="map-box"
            :title="`${activeNames.length ? '收缩' : '展开'}地图`"
            icon="location-o"
            name="1"
          >
            <Track
              v-if="activeNames.length > 0"
              id="trackMapContainer"
              :distance-str="distanceStr"
              :way-points="formData.vdAfWaypointList"
              :time-str="timeStr"
              :end-point="{ x: this.formData.endAddressSmx, y: this.formData.endAddressSmy }"
              :start-point="{ x: this.formData.startAddressSmx, y: this.formData.startAddressSmy }"
            />
          </fm-collapse-item>
        </fm-collapse>
      </div>
      <blank/>
      <div style="margin-left: 15px; margin-right: 10px;">
        <div class="sty_h">乘车人信息</div>
        <fm-field
          :class="{'left-cell-title': getRequiredFlag('useCarPersonNum')}"
          v-model="formData.useCarPersonNum"
          :readonly="flowConfig.useCarPersonNum === 'readonly'"
          :rules="getFieldRule('useCarPersonNum', this)"
          input-align="right"
          label="乘车人数"
          name="useCarPersonNum"
          :required="isUseCarPersonNumRequired"
          :min="0"
          type="number"
        />

<!--        <div v-if="flowConfig.useCarPersonNum === 'readonly'">-->
<!--          <fm-field-->
<!--            v-model="formData.useCarPersonNum"-->
<!--            :readonly="true"-->
<!--            :rules="getFieldRule('useCarPersonNum', this)"-->
<!--            input-align="right"-->
<!--            label="乘车人数(人)"-->
<!--            label-width="10em"-->
<!--            name="useCarPersonNum"-->
<!--            required-->
<!--          />-->
<!--        </div>-->
<!--        <fm-field-->
<!--          v-else-->
<!--          v-model="formData.useCarPersonNum"-->
<!--          class="useCarPersonNum"-->
<!--          :rules="getFieldRule('useCarPersonNum', this)"-->
<!--          error-message-align="right"-->
<!--          input-align="right"-->
<!--          label="乘车人数"-->
<!--          name="useCarPersonNum"-->
<!--          :required="isUseCarPersonNumRequired"-->
<!--          :min="0"-->
<!--          type="number"-->
<!--        />-->
        <div v-if="isUser">
          <fm-field
            label="乘车人信息"
            input-align="right"
          >
            <template #input>
              <i
                v-if="flowConfig.useCarMatter !== 'readonly'"
                class="fks-icon-circle-plus-outline"
                style="color: #3C83FF;font-size: 20px;"
                @click="addPerson"
              />
            </template>
          </fm-field>
          <div class="card-container" v-for="(item, index) in formData.vdAfUseCarPersonList">
            <div :key="index + 'd'" class="apply-person-card">
              <fm-cell-group inset>
                <fm-cell class="p-t-20 use-car">
                  <template #title>
                    <div
                      v-if="flowConfig.useCarMatter !== 'readonly'"
                      class="sort-index full-width flex col-center row-between"
                    >
                      <span>
                        乘车人{{ index + 1 }}
                      </span>
                      <i
                        class="fks-icon-circle-close"
                        style="color: #ff4143;font-size: 20px;"
                        @click="minusPerson(item)"
                      />
                    </div>
                  </template>
                  <!-- <template #default>
                    <fm-button
                      v-if="flowConfig.useCarMatter !== 'readonly' && !isXcModify"
                      icon="minus"
                      plain
                      round
                      size="mini"
                      type="primary"
                      @click.stop="minusPerson(item, index)"
                    ></fm-button>
                  </template> -->
                </fm-cell>
                <fm-cell v-if="flowConfig.useCarMatter !== 'readonly'">
                  <!-- 使用 title 插槽来自定义标题 -->
                  <template #title>
                    <fm-field
                      v-model="item.ucPersonFullName"
                      :maxlength="255"
                      :name="`vdAfUseCarPersonList.${index}.ucPersonFullName`"
                      :placeholder="'请输入姓名'"
                      :rules="getFieldRule('vdAfUseCarPersonList.' + index + '.ucPersonFullName', this)"
                      class="p-10"
                      clearable
                      input-align="left"
                      label=""
                      required
                      @change="item.ucPersonResource = 3"
                    >
                      <template #button>
                        <fm-button
                          v-if="isAdd && !isXcModify"
                          :disabled="!item.ucPersonFullName"
                          style="margin-left: 5px;"
                          size="small"
                          type="primary"
                          @click.stop="chooseApplyPerson(item, index)"
                          >选择
                        </fm-button>
                      </template>
                    </fm-field>
                  </template>
                  <template #label>
                    <fm-field
                      v-model="item.ucPersonPhone"
                      :maxlength="255"
                      :name="`vdAfUseCarPersonList.${index}.ucPersonPhone`"
                      :placeholder="'请输入手机号'"
                      :rules="getFieldRule('vdAfUseCarPersonList.' + index + '.ucPersonPhone', this)"
                      class="p-10 phone-field"
                      clearable
                      error-message=""
                      input-align="left"
                      label=""
                      required
                      type="tel"
                      @change="item.ucPersonResource = 3"
                    >
                    </fm-field>
                  </template>
                </fm-cell>
                <fm-cell v-else class="person-view flex col-center">
                  <template #title>
                    <div class="font-28 color-black font-400">{{ item.ucPersonFullName }}</div>
                    <div class="color-blue font-28 font-400">{{ item.ucPersonPhone }}</div>
                  </template>
                  <template #right-icon>
                    <a
                      :href="`tel:${item.ucPersonPhone}`"
                      class="flex col-center d-block"
                      @click.stop=""
                    >
                      <img class="call-img" src="@/assets/img/car/call.png" />
                    </a>
                  </template>
                </fm-cell>
              </fm-cell-group>
            </div>
          </div>
        </div>

        <fm-cell-group class="remark2" title="">
          <fm-cell class="description-cell" title="留言"
                   :class="{'left-cell-title': getRequiredFlag('remark2')}"></fm-cell>
          <fm-field
            v-model="formData.remark2"
            :readonly="flowConfig.remark2 === 'readonly'"
            :placeholder="flowConfig.remark2 === 'readonly' ? '' : '请输入需要发送给司机的留言'"
            label=""
            maxlength="500"
            rows="2"
            name="remark2"
            required
            autosize
            type="textarea"
            @input="clickFormRow"
          />
        </fm-cell-group>
        <!--        v-if="isUser && !isCarApplyPage"-->
        <div :class="{'part-flow':isEditCar}"  v-if="isCar || noAuth">

          <blank style="margin-left: -5px"/>
          <div id="carInfo" ref="carInfoRef" class="flex col-center row-between m-r-18">
            <div class="sty_h">车辆信息</div>
            <fm-button
              v-if="isEditCar"
              size="small"
              type="primary"
              @click="chooseCar"
            >选择
            </fm-button>
          </div>
          <template v-if="isEditCar">
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('carNum')}"
              v-model="formData.carNum"
              :rules="getFieldRule('carNum', this)"
              input-align="right"
              label="车牌号"
              name="carNum"
              :placeholder="flowConfig.carNum === 'readonly' ? '车牌号' : '请选择'"
              required
              readonly
              @change="changeCar"
            />
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('carType')}"
              v-model="formData.carType"
              :rules="getFieldRule('carType', this)"
              input-align="right"
              label="车型"
              name="carType"
              :placeholder="flowConfig.carType === 'readonly' ? '车型' : '请选择'"
              required
              readonly
              @change="changeCar"
            />
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('carAge')}"
              v-model="formData.carAge"
              input-align="right"
              label="车龄(年)"
              name="carAge"
              :placeholder="flowConfig.carAge === 'readonly' ? '车龄' : '请选择'"
              type="number"
              readonly
              @change="changeCar"
            />
          </template>
          <fm-row v-else class="person-table">
            <fm-col :span="8" class="h-64 p-24">
              <div class="flex-content font-28 line-height-30">车牌号</div>
            </fm-col>
            <fm-col :span="8" class="h-64 p-24 border-left border-right">
              <div class="flex-content font-28 line-height-30">车型</div>
            </fm-col>
            <fm-col :span="8" class="h-64 p-24">
              <div class="flex-content font-28 line-height-30">车龄(年)</div>
            </fm-col>
            <fm-col :span="8" class="border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdCarInfo.carNum }}
              </div>
            </fm-col>
            <fm-col :span="8" class="border-left border-right border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdCarInfo.carType }}
              </div>
            </fm-col>
            <fm-col :span="8" class="border-right border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdCarInfo.carAge }}
              </div>
            </fm-col>
          </fm-row>
          <blank style="margin-left: -5px"/>
          <div id="carInfo" class="flex col-center row-between m-r-18">
            <div class="sty_h">驾驶员信息</div>
            <fm-button
              v-if="isEditCar"
              size="small"
              type="primary"
              @click="chooseCarDriver"
            >选择
            </fm-button>
          </div>
          <template v-if="isEditCar">
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('driverFullName')}"
              v-model="formData.driverFullName"
              :rules="getFieldRule('driverFullName', this)"
              input-align="right"
              label="姓名"
              name="driverFullName"
              :placeholder="flowConfig.driverFullName === 'readonly' ? '姓名' : '请选择'"
              required
              readonly
              @change="changeDriver"
            />
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('driverPhone')}"
              v-model="formData.driverPhone"
              :rules="getFieldRule('driverPhone', this)"
              input-align="right"
              label="联系电话"
              name="carNum"
              :placeholder="flowConfig.driverPhone === 'readonly' ? '联系电话' : '请选择'"
              required
              type="tel"
              readonly
              @change="changeDriver"
            />
            <fm-field
              :class="{'left-cell-title': getRequiredFlag('driverAge')}"
              v-model="formData.driverAge"
              input-align="right"
              label="驾龄(年)"
              name="driverAge"
              :placeholder="flowConfig.driverAge === 'readonly' ? '驾龄' : '请选择'"
              type="number"
              readonly
              @change="$forceUpdate"
            />
          </template>
          <fm-row v-else class="person-table">
            <fm-col :span="8" class="h-64 p-24">
              <div class="flex-content font-28 line-height-30">姓名</div>
            </fm-col>
            <fm-col :span="8" class="h-64 p-24 border-left border-right">
              <div class="flex-content font-28 line-height-30">联系电话</div>
            </fm-col>
            <fm-col :span="8" class="h-64 p-24">
              <div class="flex-content font-28 line-height-30">驾龄(年)</div>
            </fm-col>
            <fm-col :span="8" class="border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdDriverInfo.driverFullName }}
              </div>
            </fm-col>
            <fm-col :span="8" class="border-left border-right border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdDriverInfo.driverPhone }}
              </div>
            </fm-col>
            <fm-col :span="8" class="border-right border-top">
              <div class="flex-content font-28 line-height-40 p-10">
                {{ vdDriverInfo.driverAge }}
              </div>
            </fm-col>
          </fm-row>
<!--          <CarSelector-->
<!--            class="custom-class"-->
<!--            :car-num-validator="carNumValidator"-->
<!--            :flow-config="flowConfig"-->
<!--            :change-car="changeCar"-->
<!--            :choose-car="chooseCar"-->
<!--            :form-data="formData"-->
<!--            :is-car-info="true"-->
<!--            :is-edit-car="isEditCar"-->
<!--            :show-choose-button="true"-->
<!--            :vd-car-info="vdCarInfo"-->
<!--          />-->
<!--          <DriverSelector-->
<!--            class="custom-class"-->
<!--            :change-driver="changeDriver"-->
<!--            :flow-config="flowConfig"-->
<!--            :choose-car-driver="chooseCarDriver"-->
<!--            :form-data="formData"-->
<!--            :format-phone-number="formatPhoneNumber"-->
<!--            :is-car-info="true"-->
<!--            :is-edit-car="isEditCar"-->
<!--            :phone-validator="phoneValidator"-->
<!--            :show-choose-button="true"-->
<!--            :vd-driver-info="vdDriverInfo"-->
<!--          />-->
        </div>
        <div class="driving-log" v-if="isLog || noAuth">
          <blank class="full-vw" style="margin-left: -15px" />
          <div id="cost" ref="cost" class="sty_h">行车日志填报</div>
          <div v-for="item in feeConfigs" class="fee-cell" :key="item.prop">
            <div class="part-flow" v-if="item.type === 'select'">
              <fm-field
                :value="getRyStr(item.prop)"
                :required="item.required"
                :readonly="flowConfig[item.prop] === 'readonly' || item.readonly"
                :placeholder="flowConfig[item.prop] === 'readonly' || item.readonly ? '' : '请选择'"
                :class="{'part-flow': flowConfig[item.prop] != 'readonly' && !item.readonly }"
                label-width="100"
                :label="item.label"
                input-align="right"
                readonly
                error-message-align="right"
                style="margin-bottom: 12px"
                @click="handleFeeSelect(item)"
              >
                <template slot="suffix-icon">
                  <img
                    v-if="!(flowConfig[item.prop] === 'readonly' || item.readonly)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    :style="{ transform: item.showPopup ? 'rotate(0deg)' : 'rotate(-90deg)' }"
                    :src="require('@/assets/img/downArrow-blue.svg')"
                  />
                </template>
              </fm-field>
              <select-picker
                :show.sync="item.showPopup"
                :code.sync="formData[item.prop]"
                :is-enum="true"
                :name="item.optionsKey"
                @cancel="($event) => handleFeeSelectCancel(item)"
              />
            </div>
            <input-attachment
              v-else-if="item.type === 'input-attachment'"
              :label="item.label"
              :required="item.required"
              :formData="formData"
              :disabled="flowConfig[item.prop] === 'readonly' || item.readonly"
              :class="{'part-flow': flowConfig[item.prop] != 'readonly' && !item.readonly }"
              :select-options="getSelectOptions(item.prop)"
              :inputName="item.prop"
              :inputUnit="item.unit"
              :selectName="item.selectName"
              :tooltip="item.tooltip"
              :attachmentName="item.attachmentName"
            />
            <fm-field
              v-else-if="item.type === 'input-number'"
              v-model="formData[item.prop]"
              :readonly="flowConfig[item.prop] === 'readonly' || item.readonly"
              :class="{'part-flow': flowConfig[item.prop] != 'readonly' && !item.readonly }"
              :placeholder="getPlaceholder(item.unit)"
              :rules="getFieldRule(item.prop, this)"
              clearable
              error-message-align="right"
              label-width="160"
              input-align="right"
              required
              type="number"
              @click-suffix-icon="handleCamera(item.prop)"
            >
              <template slot="label">
                <div v-if="item.prop === 'km1' || item.prop === 'km2'" class="flex col-center">
                  <div style="padding-left: 3.12px;">{{ item.label }}</div>
                  <div
                    v-if="formData[item.prop === 'km1' ? 'attachment2' : 'attachment3']"
                    class="d-flex col-center"
                  >
                    <img
                      v-for="({ blob, fileToken }, index) in item.prop === 'km1'
                        ? km1Thumbnails
                        : km2Thumbnails"
                      :key="index"
                      :src="getImgUrl(blob)"
                      style="margin-left: 5px"
                      @click="showImg(fileToken)"
                    />
                  </div>
                </div>
                <div style="padding-left: 3.12px;" v-else>{{ item.label }}</div>
              </template>
              <template slot="suffix-icon">
                <div v-if="showSuffix(item)">
                  <img
                    v-if="handleCameraStatus(item.prop, 0)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    :src="require('@/assets/img/application/shot.svg')"
                  />
                  <img
                    v-else-if="handleCameraStatus(item.prop, 1)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    class="rotate"
                    :src="require('@/assets/img/application/reset.svg')"
                  />
                  <img
                    v-else-if="handleCameraStatus(item.prop, 2)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    :src="require('@/assets/img/application/upload-error.png')"
                  />
                </div>
              </template>
            </fm-field>
            <div v-else-if="item.type === 'date'">
              <fm-field
                v-model="formData[item.prop]"
                :rules="getFieldRule(item.prop, this)"
                :readonly="flowConfig[item.prop] === 'readonly' || item.readonly"
                :class="{'part-flow': flowConfig[item.prop] != 'readonly' && !item.readonly }"
                :label="item.label"
                :placeholder="`请选择${item.label}`"
                :is-link="!(flowConfig[item.prop] === 'readonly' || item.readonly)"
                clearable
                error-message-align="right"
                input-align="right"
                label-width="130"
                required
                readonly
                @click.stop.native="handleDateClick(item)"
              />
              <date-time-picker
                :show.sync="item.show"
                :time.sync="formData[item.prop]"
                :title="item.label"
                type="datetime"
              />
            </div>
            <fm-field
              v-else-if="item.computed"
              v-model="formData[item.prop]"
              :readonly="flowConfig[item.prop] === 'readonly' || item.readonly"
              :class="{'part-flow': flowConfig[item.prop] != 'readonly' && !item.readonly }"
              :placeholder="getPlaceholder(item.unit)"
              :rules="getFieldRule(item.prop, this)"
              clearable
              error-message-align="right"
              label-width="160"
              input-align="right"
              required
              type="number"
              @click-suffix-icon="handleCamera(item.prop)"
            >
              <template slot="label">
                <div style="padding-left: 3.12px;">{{ item.label }}</div>
              </template>
              <template slot="suffix-icon">
                <div v-if="showSuffix(item)">
                  <img
                    v-if="handleCameraStatus(item.prop, 0)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    :src="require('@/assets/img/application/shot.svg')"
                  />
                  <img
                    v-else-if="handleCameraStatus(item.prop, 1)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    class="rotate"
                    :src="require('@/assets/img/application/reset.svg')"
                  />
                  <img
                    v-else-if="handleCameraStatus(item.prop, 2)"
                    width="20px"
                    height="20px"
                    style="vertical-align: text-bottom; margin-left: 10px"
                    :src="require('@/assets/img/application/upload-error.png')"
                  />
                </div>
              </template>
            </fm-field>
<!--            <fm-field-->
<!--              v-else-if="flowConfig[item.prop] === 'readonly' || item.readonly"-->
<!--              v-model="formData[item.prop]"-->
<!--              :readonly="true"-->
<!--              :label-width="item.labelWidth || 160"-->
<!--              :rules="[{ required: true }]"-->
<!--              input-align="right"-->
<!--              :name="item.prop"-->
<!--              required-->
<!--            >-->
<!--              <template slot="label">-->
<!--                <div v-if="item.prop === 'km1' || item.prop === 'km2'" class="flex col-center">-->
<!--                  <div>{{item.label }}</div>-->
<!--                  <div v-if="formData[item.prop === 'km1' ? 'attachment2' : 'attachment3']">-->
<!--                    <img-->
<!--                      v-for="({ blob, fileToken }, index) in item.prop === 'km1'-->
<!--                        ? km1Thumbnails-->
<!--                        : km2Thumbnails"-->
<!--                      :key="index"-->
<!--                      fit="contain"-->
<!--                      :src="getImgUrl(blob)"-->
<!--                      style="margin-left: 5px"-->
<!--                      @click="showImg(fileToken)"-->
<!--                    />-->
<!--                  </div>-->
<!--                </div>-->
<!--                <div v-else>{{ item.label }}</div>-->
<!--              </template>-->
<!--            </fm-field>-->
          </div>
          <fm-field
            v-model="journeyCostTotal"
            :readonly="true"
            label-width="130"
            :rules="getFieldRule('remark3', this)"
            input-align="right"
            :class="{'part-flow':flowConfig['remark3'] != 'readonly'}"
            :label="`费用合计(元)`"
            :name="journeyCostTotal"
            required
          />
          <fm-field
            v-model="formData.remark3"
            :readonly="flowConfig['remark3'] === 'readonly'"
            :placeholder="flowConfig['remark3'] === 'readonly' ? '' : '请输入备注'"
            :class="{'part-flow':flowConfig['remark3'] != 'readonly'}"
            rows="2"
            autosize
            label="费用备注"
            type="textarea"
            show-word-limit
          />
          <form-upload-mobile-new
            style="margin-bottom: 12px"
            v-model="formData.attachment1"
            :disabled="flowConfig['attachment1'] === 'readonly'"
          />
        </div>
        <div class="part-flow" v-if="getVisibleFlag('startTime2') && taskKey === taskKey300">
          <blank />
          <div class="m-l-10">
            <div class="sty_h">行程信息</div>
            <fm-field
              v-model="formData.km1"
              placeholder="0"
              :rules="getFieldRule('km1', this)"
              clearable
              error-message-align="right"
              label-width="180"
              input-align="right"
              required
              type="number"
              @click-suffix-icon="handleCamera('km1')"
            >
              <template slot="label">
                <div class="flex col-center">
                  <div>出车前里程（公里）</div>
                  <div class="d-flex col-center">
                    <img
                      v-for="({ blob, fileToken }, index) in km1Thumbnails"
                      :key="index"
                      :src="getImgUrl(blob)"
                      style="margin-left: 5px"
                      @click="showImg(fileToken)"
                    />
                  </div>
                </div>
              </template>
              <template slot="suffix-icon">
                <img
                  v-if="handleCameraStatus('km1', 0)"
                  width="20px"
                  height="20px"
                  style="vertical-align: text-bottom; margin-left: 10px"
                  :src="require('@/assets/img/application/shot.svg')"
                />
                <img
                  v-else-if="handleCameraStatus('km1', 1)"
                  width="16px"
                  height="16px"
                  style="vertical-align: text-bottom; margin-left: 10px"
                  class="rotate"
                  :src="require('@/assets/img/application/reset.svg')"
                />
                <img
                  v-else-if="handleCameraStatus('km1', 2)"
                  width="20px"
                  height="20px"
                  style="vertical-align: text-bottom; margin-left: 10px"
                  :src="require('@/assets/img/application/upload-error.png')"
                />
              </template>
            </fm-field>
            <div>
              <fm-field
                v-model="formData.startTime2"
                is-link
                :rules="getFieldRule('startTime2', this)"
                clearable
                error-message-align="right"
                input-align="right"
                label="实际开始时间"
                label-width="130"
                :laceholder="`请选择实际开始时间`"
                required
                readonly
                @click.stop.native="driverConfirmShow = true"
              />
              <date-time-picker
                :show.sync="driverConfirmShow"
                :time.sync="formData.startTime2"
                title="实际开始时间"
                type="datetime"
              />
            </div>
          </div>
        </div>
        <div>
          <blank style="margin-left: -15px;"/>
          <div>
            <div class="sty_h">申请信息</div>
            <fm-field
              v-model="formData.task0FullName"
              :readonly="true"
              :rules="getFieldRule('task0FullName', this)"
              input-align="right"
              label="申请人"
              name="task0FullName"
              required
            />
            <fm-field
              v-model="formData.task0Department"
              :readonly="true"
              input-align="right"
              label="部门"
              name="task0Department"
            />
            <fm-field
              v-model="formData.task0Time"
              :readonly="true"
              :rules="getFieldRule('task0Time', this)"
              input-align="right"
              label="申请时间"
              name="task0Time"
              required
            />
            <div v-if="showTask100UserFormItem">
              <fm-field
                :class="{'left-cell-title': getRequiredFlag('task100UserName')}"
                v-model="formData.task100FullName"
                :is-link="!disableTask100UserFormItem && approveList1.length > 0"
                :readonly="true"
                :rules="getFieldRule('task100UserName', this)"
                placeholder="请选择审批领导"
                error-message-align="right"
                input-align="right"
                label="审批领导"
                name="task100UserName"
                :required="!disableTask100UserFormItem"
                @click.stop.native="
                  disableTask100UserFormItem
                    ? ''
                    : (showPickerDutyDirector = approveList1.length > 0)
                "
              />
              <select-picker
                :code.sync="formData.task100UserName"
                :column="approveList1"
                :is-enum="false"
                :show.sync="showPickerDutyDirector"
                :text.sync="formData.task100FullName"
                :value-code="'userName'"
                :value-key="'userFullname'"
                :is-show-search="true"
                @confirm="clickFormRow"
                @update:search="handleSearchUpdateMasterList"
              ></select-picker>
            </div>
            <div>
              <fm-field
                :class="{'left-cell-title': getRequiredFlag('task200UserName')}"
                v-model="formData.task200FullName"
                :is-link="!disableTask200UserFormItem && approveList2.length > 0"
                :readonly="true"
                :rules="getFieldRule('task200UserName', this)"
                placeholder="请选择车辆调度员"
                error-message-align="right"
                input-align="right"
                label="车辆调度员"
                name="task200UserName"
                required
                @click.stop.native="
                  disableTask200UserFormItem
                    ? ''
                    : (showPickerCarDispatchUser = approveList2.length > 0)
                "
              />
              <select-picker
                :code.sync="formData.task200UserName"
                :column="approveList2"
                :is-enum="false"
                :show.sync="showPickerCarDispatchUser"
                :text.sync="formData.task200FullName"
                :value-code="'userName'"
                :value-key="'userFullname'"
                :is-show-search="true"
                @confirm="clickFormRow"
                @update:search="handleSearchUpdateCarList"
              ></select-picker>
            </div>
          </div>
        </div>

        <div v-if="isModify">
          <blank style="margin-left: -5px" />
          <div class="sty_h">变更原因</div>
          <div class="drawer-content">
            <p class="bold">您对本次用车的变更原因</p>
            <textarea
              v-model="modifycomment"
              name="story"
              placeholder="请输入您的变更原因"
              rows="10"
            >
            </textarea>
          </div>
        </div>
      </div>
    </fm-form>
    <!-- 选择地图 -->
    <popper
      :show.sync="mapShow"
      icon="location-outline"
      title="选择地点"
      @confirm="mapShow = false"
    >
      <div class="flex flex-column full-height">
        <fm-nav-bar
          :border="false"
          left-arrow
          title="选择地点"
          @click-left="mapShow = false"
        />
        <a-map class="flex-grow-1" is-full :location-info.sync="locationInfo" @update="handleMapUpdate" />
        <flow-button :onSubmit="closePopupMap" submit-text="确定" />
      </div>
    </popper>
    <!-- 选择联系人-->
    <popper
      :mobile-only="true"
      :show.sync="popupPerson"
      title="选择人员"
      @confirm="onConfirmPerson"
    >
      <apply-person
        ref="applyPerson"
        :currentPerson="currApplyPerson"
        :keywords.sync="currApplyPerson.ucPersonFullName || ''"
        @closePopup="closePopupPerson"
        @closePopupShow="popupPerson = false"
      />
    </popper>
    <!-- 选择车辆-->
    <popper :show.sync="popupShow" icon="dashboard" title="选择车辆" @confirm="onConfirmCar">
      <car-list
        ref="carList"
        :carCompanyInfoId.sync="formData.vdCarCompanyInfoId"
        :formData="formData"
        @closePopup="closePopupCar"
        @closePopupShow="popupShow = false"
      ></car-list>
    </popper>
    <!-- 选择司机-->
    <popper :show.sync="popupDriver" icon="user" title="选择司机" @confirm="onConfirmDriver">
      <driver-list
        ref="driverList"
        :carCompanyInfoId.sync="formData.vdCarCompanyInfoId"
        :formData="formData"
        @closePopup="closePopupDriver"
        @closePopupShow="popupDriver = false"
      ></driver-list>
    </popper>
    <custom-camera
      ref="cameraRef"
      @loading="setCameraStatus"
      @success="setCameraStatus"
      @error="setCameraStatus"
    />
    <custom-alert v-if="showAlert" :type="showAlert" />
    <div
      v-if="showBigPicture"
      v-loading="loadBigPicture"
      class="big-picture"
      @click.stop="closeImg"
    >
      <i
        class="fks-icon-close close"
        style="font-size: 32px; top: 20px; left: 10px"
        @click.stop="closeImg"
      />
      <img :src="bigPictureUrl" fit="contain" />
    </div>
  </div>
</template>

<script>
import vehicleDispatchFormMixin from '@/mixins/vehicleDispatchFormMixin'
import SelectPicker from '@/modules/FormCenter/components/SelectPicker/index.vue'
import AMap from '@components/amap/index.vue'
import Popper from '@components/popper/index.vue'
import FlowButton from '@modules/FormCenter/components/FlowButton/index.vue'
import DateTimePicker from '@modules/FormCenter/components/DateTimePicker/index.vue'
import ApplyPerson from '@modules/FormCenter/CarApply/ApplyPerson/index.vue'
import Track from '@components/amap/components/track.vue'
import Blank from '@components/Blank/index.vue'
import NewPersonSelector from '@components/PersonSelector/main.vue'
import CarList from '@modules/FormCenter/CarApply/CarList/index.vue'
import DriverList from '@modules/FormCenter/CarApply/DriverList/index.vue'
import CarSelector from '@modules/FormCenter/components/CarAndDriverSelector/carSelector.vue'
import DriverSelector from '@modules/FormCenter/components/CarAndDriverSelector/driverSelector.vue'
import FormUpload from '@modules/FormCenter/components/FormUpload/mobile-view.vue'
import CustomCamera from '@components/Camera/index.vue'
import CustomAlert from '@components/Camera/components/custom-alert.vue'
import InputAttachment from '@components/InputAttachment/mobile-view.vue';
import FormUploadMobileNew from '@modules/FormCenter/components/FormUpload/mobile-view-new.vue'
import RedStar from "@components/red-star.vue";
import { downloadImage, getFile, getThumbnail } from '@/api/file'

export default {
  name: 'vehicleDispatchMobile',
  mixins: [vehicleDispatchFormMixin],
  components: {
    CustomAlert,
    CustomCamera,
    DriverSelector,
    CarSelector,
    DriverList,
    CarList,
    NewPersonSelector,
    Blank,
    Track,
    ApplyPerson,
    DateTimePicker,
    FlowButton,
    Popper,
    AMap,
    SelectPicker,
    FormUpload,
    InputAttachment,
    FormUploadMobileNew,
    RedStar
  },
  data() {
    return {
      pictureTable: {},
      loadBigPicture: false,
      showBigPicture: false,
      bigPictureUrl: '',
      km1Thumbnails: [],
      km2Thumbnails: [],
      showAlert: '',
      uploadStatus1: 0, // 0 未上传/上传成功 1 上传中 2 上传失败
      uploadStatus2: 0, // 0 未上传/上传成功 1 上传中 2 上传失败
      driverConfirmShow: false, // 实际开始时间选择框
      showTip: true, // 显示提示文字
      showPickerUseCarMatter: false, // 显示 出车事由
      useCarNaturePickerShow: false, // 显示 用车性质
      fyDeptPickerShow: false, // 显示 用车费用归属部门
      showPickerFlagBb: false, // 显示 是否补报
      flagBbOption: [
        { code: true, value: '是' },
        { code: false, value: '否' },
      ], // 是否补报
      showPickerStartAddress: false, // 显示 出发地
      mapShowStart: false, // 显示 出发地详情
      showCalendarStart: false, // 出车时间
      showCalendarEnd: false, // 预计返回时间
      showPickerOtherField1: false, // 显示 允许提前量
      otherField1List: [
        { code: 0, key: 1, value: '0分钟' },
        { code: 5, key: 2, value: '5分钟' },
        { code: 10, key: 3, value: '10分钟' },
        { code: 60, key: 4, value: '60分钟' },
      ], // 允许提前量
      popupPerson: false, // 显示 联系人
      currApplyPerson: {}, // 选择的联系人信息
      showPickerDutyDirector: false, // 显示 值班处长
      showPickerCarDispatchUser: false, // 显示 车辆调度员
      jgTime: '03:00', // 间隔时间
      showJgTime: false, // 间隔时间选择器开关
      activeIcon: require('@/assets/img/application/select.svg'),
      inactiveIcon: require('@/assets/img/application/select-no.svg'),
    }
  },
  computed: {
    jgTimeStr() {
      if (this.jgTime) {
        const [hour, minute] = this.jgTime.split(':')
        return `${hour || '-'}小时${minute || '-'}分钟`
      }
      return ''
    },
    showOther() {
      return this.formData.startAddress === '其他' || +this.formData.startAddress === 9
    },
    isUser() {
      // return ['UserTask_0', 'UserTask_1', 'UserTask_2', 'UserTask_3', 'UserTask_4', 'UserTask_6', 'UserTask_7'].includes(this.taskKey) || this.type === 'add';
      return true
    },
    isAdd() {
      return this.type === 'add' || (this.taskKey === 'UserTask_0' && this.type === 'execute')
    },
    // 显示预计时长和预计距离
    showTripInfo() {
      // 用车申请，审批，出车任务确认，司机确认，司机确认行程开始这几个流程可以显示
      const taskKeys = ['UserTask_0', 'UserTask_1', 'UserTask_2', 'UserTask_3', 'UserTask_7']
      return taskKeys.findIndex((taskKey) => taskKey === this.taskKey) > -1
    },
    showTrack: {
      get() {
        // return Boolean(this.fromLocation || this.fromFormData || this.fromRow || false)
        return true
      },
      set() {},
    },
    // 行程信息变更
    isXcModify() {
      return this.$route.query.buttonKey === 'XC_FORM_MODIFY'
    },
    // 编辑费用信息
    isEditCost() {
      // return this.type === 'execute' && this.taskKey === 'UserTask_400';
      return false
    },
  },
  methods: {
    getFieldRule(fieldName, context) {
      const rules = this.formRules[fieldName];
      if (!rules) return [];

      // 如果包含自定义 validator，要绑定 this（上下文）
      let list = rules.map(rule => {
        if (typeof rule.validator === 'function') {
          const originalValidator = rule.validator;
          return {
            ...rule,
            validator: originalValidator.bind(context)
          };
        }
        return rule;
      })
      // const logKeys = ['vdAfUseCarPersonList', 'useCarPersonNum', 'vdAfWaypointList'];
      //
      // if (logKeys.some(key => fieldName.startsWith(key))) {
      //   console.log("fieldName", fieldName, list);
      // }
      return list;
    },
    getRyStr(prop) {
      const v = this.formData[prop];
      if (v) {
        // 在字典里寻找对应的中文
        const item = this.enums['ApplyFormFyRyTypeEnums'].find(i => i.key === v);
        return item ? item.value : '';
      }
      return '';
    },
    showSuffix(item) {
      // 只读模式不唤起弹出框
      if (this.flowConfig[item.prop] === 'readonly' || item.readonly) {
        return;
      }
      return item.prop === 'km1' || item.prop === 'km2'
    },
    handleDateClick(item) {
      // 只读模式不唤起弹出框
      if (this.flowConfig[item.prop] === 'readonly' || item.readonly) {
        return;
      }
      item.show = true
    },
    handleFeeSelect(item) {
      // 只读模式不唤起弹出框
      if (this.flowConfig[item.prop] === 'readonly' || item.readonly) {
        return;
      }
      item.showPopup = !item.showPopup;
      this.$forceUpdate();
    },
    handleFeeSelectCancel(item) {
      item.showPopup = false;
      this.$forceUpdate();
    },
    handleSearchUpdateFyDeptList(newVal) {
      if (newVal) {
        this.filteredSecondLevelUnitList = [
        ...this.secondLevelUnitList.filter((item) => item.deptName.includes(newVal)),
        ]
      } else {
        this.filteredSecondLevelUnitList = [...this.secondLevelUnitList]
      }
    },
    handleSearchUpdateUseList(newVal) {
      if (newVal) {
        this.useCarMatterList = [
          ...this.initUseCarMatterList.filter((item) => item.value.includes(newVal)),
        ]
      } else {
        this.useCarMatterList = [...this.initUseCarMatterList]
      }
    },
    handleSearchUpdateMasterList(newVal) {
      if (newVal) {
        this.approveList1 = [
          ...this.initApproveList1.filter((item) => item.userFullname.includes(newVal)),
        ]
      } else {
        this.approveList1 = [...this.initApproveList1]
      }
    },
    handleSearchUpdateCarList(newVal) {
      if (newVal) {
        this.approveList2 = [
          ...this.initApproveList2.filter((item) => item.userFullname.includes(newVal)),
        ]
      } else {
        this.approveList2 = [...this.initApproveList2]
      }
    },
    jgFilter(type, options) {
      if (type === 'minute') {
        return options.filter((option) => option % 5 === 0)
      }
      return options
    },
    confirmFlagBb({ code, value }) {
      this.formData.flagBb = code
      // this.formData.flagBbStr = value
      this.showPickerFlagBb = false
    },
    initFormData() {
      // this.formData.flagBb = '0';
      // this.formData.flagBbStr = '否';
      this.formData.otherField1 = 5
      this.formData.otherField1Str = '5分钟'
    },
    handleStartAddressChange() {},
    handleUseCarNatureChange(key) {
      this.formData.useCarNature = key.key
      this.formData.useCarNatureStr = key.value
      this.clickFormRow();
    },
    // 选择 用车事由
    handleUseCarMatterChange(val) {
      // const item = this.enums.UseCarMatterEnums.find(item => item.key === this.formData.useCarMatter)
      // this.formData.useCarMatterStr = item.value;
      this.formData.useCarMatter = val.key
      this.formData.useCarMatterStr = val.value
      this.clickFormRow();
    },
    // 选择用车费用归属部门
    handleFyDeptChange(val) {
      this.formData.fyDeptId = val.id
      this.formData.fyDeptName = val.deptName
      this.clickFormRow();
    },
    // 选择 是否补报
    handleFlagBbChange() {},
    // 关闭 出发地详情 弹窗
    closePopupMap() {
      this.mapShow = false
    },
    // 选择 允许提前量
    handleOtherField1Change() {},
    // 打开选择申请人
    chooseApplyPerson(item, i) {
      this.popupPerson = true
      this.currApplyPerson = item
    },
    // 选择联系人 确定
    onConfirmPerson() {
      this.$refs.applyPerson && this.$refs.applyPerson.onSubmit()
    },
    // 提交 表单数据处理
    handleFormData(data) {
      // 当填写了开始时间才补充秒数
      data.startTime &&
        data.startTime.split(':').length < 3 &&
        (data.startTime = data.startTime + ':00')
      data.startTime2 &&
        data.startTime2.split(':').length < 3 &&
        (data.startTime2 = data.startTime2 + ':00')
      data.endTime && data.endTime.split(':').length < 3 && (data.endTime = data.endTime + ':00')
      data.endTime2 &&
        data.endTime2.split(':').length < 3 &&
        (data.endTime2 = data.endTime2 + ':00')
      return data
    },
    // 初始化 表单数据处理
    beforeInitFormData(data) {
      // data.flagBbStr = data.flagBb ? '是' : '否';
      data.useCarMatterStr = this.enums.UseCarMatterEnums.find(
        (item) => item.key === data.useCarMatter
      )?.value
      data.useCarNatureStr = this.enums.UseCarNatureEnums.find(
        (item) => item.key === data.useCarNature
      )?.value
      data.otherField1Str = this.otherField1List.find(
        (item) => item.code === +data.otherField1
      )?.value
      return data
    },
    // 表单提交(审批)前
    beforeSubmit() {
      return new Promise((resolve) => {
        resolve(true)
      })
    },
    // 添加费用
    addCost() {},
    handleCamera(prop) {
      if (this.$refs.cameraRef) {
        this.$refs.cameraRef.openCamera(prop)
      }
    },
    setCameraStatus({ key, status, value, groupToken }) {
      if (key === 'km1') {
        this.uploadStatus1 = status
      } else if (key === 'km2') {
        this.uploadStatus2 = status
      }
      if (value) {
        this.$set(this.formData, key, value)
      }
      if (groupToken) {
        const picKey = key === 'km1' ? 'attachment2' : 'attachment3'
        this.$set(this.formData, picKey, groupToken)
      }
      if (status === 0) {
        this.showAlert = 'success'
      } else if (status === 2) {
        this.showAlert = 'error'
        // 清空缩略图
        if (key === 'km1') {
          this.km1Thumbnails = []
        } else if (key === 'km2') {
          this.km2Thumbnails = []
        }
      }
    },
    handleCameraStatus(prop, value) {
      if (prop === 'km1') {
        return this.uploadStatus1 === value
      } else if (prop === 'km2') {
        return this.uploadStatus2 === value
      }
    },
    async handleThumbnail(g9s, prop) {
      const res = await getFile({ g9s: [g9s] })
      if (res.status) {
        for (let i = 0; i < res.data.length; i++) {
          const { fileToken } = res.data[i]
          const thumbnailRes = await getThumbnail({
            f8s: fileToken,
            width: 25,
            height: 25,
            thumbnail: true,
          })
          if (prop === 'km1') {
            this.km1Thumbnails = []
            this.km1Thumbnails.push({ blob: thumbnailRes, fileToken })
          } else if (prop === 'km2') {
            this.km2Thumbnails = []
            this.km2Thumbnails.push({ blob: thumbnailRes, fileToken })
          }
        }
      }
    },
    getImgUrl(blobItem) {
      return URL.createObjectURL(blobItem)
    },
    showImg(fileToken) {
      this.showBigPicture = true
      // 检查缓存是否有图片，有则直接复用
      if (this.pictureTable[fileToken]) {
        this.bigPictureUrl = this.pictureTable[fileToken]
      } else {
        // 没有缓存则向服务器请求，并将结果缓存起来
        this.loadBigPicture = true
        downloadImage(fileToken)
          .then((res) => {
            const url = URL.createObjectURL(res)
            this.bigPictureUrl = url
            this.pictureTable[fileToken] = url
          })
          .finally(() => {
            this.loadBigPicture = false
          })
      }
    },
    closeImg() {
      this.showBigPicture = false
      this.bigPictureUrl = ''
    },
  },
  watch: {
    jgTime(newVal) {
      if (newVal) {
        const [hour, minute] = newVal.split(':')
        this.formData.useCarJgTimeHour = hour
        this.formData.useCarJgTimeMinute = minute
      } else {
        this.formData.useCarJgTimeHour = ''
        this.formData.useCarJgTimeMinute = ''
      }
    },
    showAlert(newVal) {
      if (newVal) {
        // 3s 后消失
        setTimeout(() => {
          this.showAlert = ''
        }, 1000 * 3)
      }
    },
    formData: {
      deep: true,
      handler(newVal) {
        const { useCarJgTimeHour, useCarJgTimeMinute } = newVal
        if (useCarJgTimeHour || useCarJgTimeMinute) {
          this.jgTime = `${useCarJgTimeHour}:${useCarJgTimeMinute}`
        } else {
          this.jgTime = ''
        }
      },
    },
    'formData.attachment2': {
      async handler(newVal) {
        if (newVal) {
          await this.handleThumbnail(newVal, 'km1')
        }
      },
    },
    'formData.attachment3': {
      async handler(newVal) {
        if (newVal) {
          await this.handleThumbnail(newVal, 'km2')
        }
      },
    },
    'formData.useCarTripType': {
      handler(newVal) {
        if (newVal === 100) {
          this.jgTime = ''
        }
      },
    },
  },
}
</script>

<style scoped lang="less">
@import './mobile-view';

.big-picture {
  z-index: 9990;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: #000;

  .close {
    z-index: 9992;
    position: fixed;
    color: #fff;
  }

  img {
    z-index: 9991;
    position: fixed;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    object-fit: contain; /* 保持图片等比缩放，填充父元素 */
    transform: translate(-50%, -50%);
  }
}

.fee-cell {
  position: relative;
}

.fee-cell::after {
  position: absolute;
  box-sizing: border-box;
  content: ' ';
  pointer-events: none;
  right: 32px;
  bottom: 0;
  left: 32px;
  -webkit-transform: scaleY(0.5);
  transform: scaleY(0.5);
}

.rotate {
  animation: spin 2s infinite linear;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.useCarPersonNum {
  //position: relative;

  /deep/ .fm-field__body > input {
    padding-right: 20px;
  }

  ///deep/ .fm-field__suffix-icon {
  //  position: absolute;
  //  right: 0;
  //  top: 5px;
  //  display: flex;
  //  flex-direction: row;
  //}
}

.fyDept-field {
  /deep/ .fm-field__control.fm-field__control--right {
    text-align: left;
  }
}
</style>

<style>
@import './exclude/mobile-via.css';
</style>
