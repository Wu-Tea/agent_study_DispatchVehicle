// linkageConfig.js

import { ButtonKeys } from '@store/modules/FormController/formFieldConfig'

export const formLinkageRules = [
  // useCarNature -> useCarMatter
  {
    trigger: 'useCarNature',
    effect: ['useCarMatter'],
    handler: ({ newVal, formData, enums, context }) => {
      if (context.isApply) formData.useCarMatter = null;

      let filtered = [];
      if (context.showWayPoints) {
        filtered = newVal
          ? enums.UseCarMatterEnums.filter(item => item.type.includes(newVal))
          : [];
      } else {
        filtered = enums.UseCarMatterEnums;
      }

      const found = filtered.find(item => item.key === formData.useCarMatter);
      if (!found && context.isReSubmit) formData.useCarMatter = null;

      context.useCarMatterList = filtered;
      context.initUseCarMatterList = filtered;
    }
  },
  // useCarMatter -> useCarTripType
  {
    trigger: 'useCarMatter',
    effect: ['useCarTripType'],
    handler: ({ newVal, formData, context }) => {
      if (context.isApply) {
        formData.useCarTripType = (newVal === 5300) ? 100 : 200;
      }
    }
  },
  // useCarTripType -> useCarJgTime
  {
    trigger: 'useCarTripType',
    effect: ['useCarJgTimeHour', 'useCarJgTimeMinute'],
    handler: ({ newVal, formData }) => {
      if (newVal === 100) {
        formData.useCarJgTimeHour = 3;
        formData.useCarJgTimeMinute = 0;
      }
    }
  },
  // useCarJgTimeHour, useCarJgTimeMinute, startTime -> endTime
  {
    trigger: 'useCarJgTimeHour',
    effect: ['endTime'],
    handler: ({ formData, context }) => {
      computeEndTime(formData, context);
    }
  },
  {
    trigger: 'useCarJgTimeMinute',
    effect: ['endTime'],
    handler: ({ formData, context }) => {
      computeEndTime(formData, context);
    }
  },
  {
    trigger: 'startTime',
    effect: ['endTime'],
    handler: ({ formData, context }) => {
      computeEndTime(formData, context);
    }
  },
  // startAddress
  {
    trigger: 'startAddress',
    effect: [],
    handler: async ({ newVal, context }) => {
      if (!context.addressDontCheck) {
        context.sensitiveContent.startNotify = '';
        const res = await context.checkSensitive(newVal);
        context.isSensitiveStartAddress = res.is_private;
        if (res.is_private) {
          context.sensitiveContent.startNotify = `${res.reason}：${res.private_part}`;
        }
        context.$refs.startAddressHighlightRef?.clearHighlight(newVal);
        context.$refs.startAddressHighlightRef?.handleHighlight(res.private_part);
      }
    }
  },
  // endAddress
  {
    trigger: 'endAddress',
    effect: [],
    handler: async ({ newVal, context }) => {
      if (!context.addressDontCheck) {
        context.sensitiveContent.endNotify = '';
        const res = await context.checkSensitive(newVal);
        context.isSensitiveEndAddress = res.is_private;
        if (res.is_private) {
          context.sensitiveContent.endNotify = `${res.reason}：${res.private_part}`;
        }
        context.$refs.endAddressHighlightRef?.clearHighlight(newVal);
        context.$refs.endAddressHighlightRef?.handleHighlight(res.private_part);
      }
    }
  },
  // flagBb
  {
    trigger: 'flagBb',
    effect: ['carInfo', 'driverInfo'],
    handler: ({ newVal, context, oldVal }) => {
      const taskKey = context.$store.state.FormController.formTaskKey;
      if (context.isAdd && newVal === false && oldVal === true) {
        context.setCarInfo({ carId: '', carNum: '', carType: '', seatCount: '', carAge: '' });
        context.setDriverInfo({ driverId: '', driverUserName: '', driverFullName: '', driverPhone: '', driverAge: '' });
      }
      if (context.isAdd) {
        let btnKey = context.computeBtnKey(context);
        context.initFormFieldConfig(taskKey, btnKey);
      }
    }
  },
  {
    trigger: 'km1',
    effect: ['km3'],
    handler: ({ newVal, context, oldVal }) => {
      let { formData } = context;
      const km1 = Number(formData.km1 || 0);
      const km2 = Number(formData.km2 || 0);
      const diff = km2 - km1;
      let km3 = diff >= 0 ? diff : '';
      context.$set(context.formData, 'km3', km3);
    }
  },
  {
    trigger: 'km2',
    effect: ['km3'],
    handler: ({ newVal, context, oldVal }) => {
      let { formData } = context;
      const km1 = Number(formData.km1 || 0);
      const km2 = Number(formData.km2 || 0);
      const diff = km2 - km1;
      let km3 = diff >= 0 ? diff : '';
      context.$set(context.formData, 'km3', km3);
      console.log("context.formData.km3 ", context.formData.km3 )
    }
  },
  {
    trigger: 'vdAfWaypointList',
    effect: [],
    handler: ({ newVal, context, oldVal }) => {
      if (context.isPC) {
        context.$nextTick(() => {
          let totalHeight = 0;
          // 获取所有 class 为 addr-item 的元素
          const addrItem = document.querySelectorAll('.addr-item')[0];
          let len = 2 + (newVal ? newVal.length : 0);
          totalHeight = addrItem.offsetHeight * len;
          context.addrTotalHeight = totalHeight
          context.updateBracketPosition(len);
        });
      }
      context.saveDrafts();
    }
  },
];


function computeEndTime(formData, context) {
  if (!formData.startTime || !context.showWayPoints || !context.showJgFormItem) return {};
  const hour = Number(formData.useCarJgTimeHour) || 0;
  const minute = Number(formData.useCarJgTimeMinute) || 0;
  const afterTime = context.getAfterTime(formData.startTime, hour, minute);
  formData.endTime = context.isMobile ?
    context.$dayjs(afterTime).format('YYYY-MM-DD HH:mm') :
    afterTime;
  return { endTime: formData.endTime };
}

// 调用各handle执行对应策略
export function applyFieldLinkage(fieldName, newVal, context, oldVal) {
  const matchedRules = formLinkageRules.filter(rule => rule.trigger === fieldName);

  for (const rule of matchedRules) {
    rule.handler({
      newVal,
      oldVal,
      formData: context.formData,
      enums: context.enums,
      state: context.state,
      context
    });
  }
}
