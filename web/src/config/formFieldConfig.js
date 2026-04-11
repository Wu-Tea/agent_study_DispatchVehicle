// ==================== 字段常量 ====================
export const FormFieldConstants = {
  // 基本信息字段
  FLAG_BB: 'flagBb',
  USE_CAR_TYPE: 'useCarNature',
  USE_CAR_REASON: 'useCarMatter',
  REASON_DESCRIPTION: 'remark1',
  FY_DEPT_NAME: 'fyDeptName',
  FLIGHT_NUMBER: 'otherField2',

  // 行程信息字段
  START_ADDRESS: 'startAddress',
  END_ADDRESS: 'endAddress',
  WAY_POINTS: 'vdAfWaypointList',

  // 时间信息字段
  START_TIME: 'startTime',
  END_TIME: 'endTime',
  TRIP_TYPE: 'useCarTripType',

  // 联系人信息字段
  CONTACTS: 'contacts',
  CONTACTS_PHONE: 'contactsPhone',

  // 乘车人信息字段
  PASSENGER_COUNT: 'useCarPersonNum',
  PASSENGER_LIST: 'vdAfUseCarPersonList',
  REMARK2: 'remark2',

  // 审批信息字段
  APPROVE_LEADER: 'task100UserName',
  DISPATCHER: 'task200UserName',

  // 调度信息字段
  CAR_NUM: 'carNum',
  CAR_TYPE: 'carType',
  CAR_AGE: 'carAge',
  DRIVER_NAME: 'driverFullName',
  DRIVER_PHONE: 'driverPhone',
  DRIVER_AGE: 'driverAge',

  // 费用信息字段
  START_TIME2: 'startTime2',
  END_TIME2: 'endTime2',
  KM1: 'km1',
  KM2: 'km2',
  KM3: 'km3',
  COST1: 'cost1',
  COST4: 'cost4',
  COST5: 'cost5',
  COST7: 'cost7',
  COST8: 'cost8',
  COST9: 'cost9',
  COST1_TYPE: 'cost1Type',
  COST4_TYPE: 'cost4Type',
  COST7_TYPE: 'cost7Type',
  COST9_TYPE: 'cost9Type',
  REMARK3: 'remark3',
}

// ==================== 字段分组 ====================
const F = FormFieldConstants

export const BASE_INFO = [
  F.FLAG_BB, F.USE_CAR_TYPE, F.USE_CAR_REASON,
  F.REASON_DESCRIPTION, F.FLIGHT_NUMBER, F.FY_DEPT_NAME
]

export const ROUTE_INFO = [
  F.START_ADDRESS, F.END_ADDRESS, F.WAY_POINTS
]

export const TIME_INFO = [
  F.START_TIME, F.END_TIME, F.TRIP_TYPE
]

export const CONTACT_INFO = [
  F.CONTACTS, F.CONTACTS_PHONE
]

export const PASSENGER_INFO = [
  F.PASSENGER_COUNT, F.PASSENGER_LIST, F.REMARK2
]

export const APPROVAL_INFO = [
  F.APPROVE_LEADER, F.DISPATCHER
]

export const DISPATCH_INFO = [
  F.CAR_NUM, F.CAR_TYPE, F.CAR_AGE,
  F.DRIVER_NAME, F.DRIVER_PHONE, F.DRIVER_AGE
]

export const EXPENSE_INFO = [
  F.START_TIME2, F.END_TIME2,
  F.KM1, F.KM2, F.KM3,
  F.COST1, F.COST7, F.COST4, F.COST8, F.COST9, F.COST5,
  F.COST1_TYPE, F.COST7_TYPE, F.COST4_TYPE, F.COST9_TYPE,
  F.REMARK3
]

function merge(...arrays) {
  return arrays.flat()
}

// ==================== 任务与按钮 Key ====================
export const TaskKeys = {
  TASK0: 'UserTask_0',       // 用车申请
  TASK100: 'UserTask_100',   // 领导审批
  TASK200: 'UserTask_200',   // 调度员派车
  TASK300: 'UserTask_300',   // 司机确认
  TASK400: 'UserTask_400',   // 行车日志填报
  TASK500: 'UserTask_500',   // 费用审批
  VIEW: 'VIEW'
}

export const ButtonKeys = {
  HANDLE: 'HANDLE',
  RETURN: 'RETURN',
  FORM_MODIFY_ADMIN: 'FORM_MODIFY_ADMIN',
  XC_FORM_MODIFY: 'XC_FORM_MODIFY',
  XC_DRIVER_CAR_MODIFY: 'XC_DRIVER_CAR_MODIFY',
  VIEW: 'VIEW',
  FLAG_BB: 'FLAG_BB'
}

// ==================== FormConfigRegistry ====================
const ALL_APPLY_REQUIRED = merge(
  BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO,
  PASSENGER_INFO, APPROVAL_INFO
)

const ALL_APPLY_REQUIRED_BB = merge(
  BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO,
  PASSENGER_INFO, DISPATCH_INFO, [F.DISPATCHER]
)

const CONFIG_MAP = {
  [TaskKeys.TASK0]: {
    [ButtonKeys.HANDLE]: {
      required: ALL_APPLY_REQUIRED,
      disabled: []
    },
    [ButtonKeys.FLAG_BB]: {
      required: ALL_APPLY_REQUIRED_BB,
      disabled: []
    }
  },
  [TaskKeys.TASK100]: {
    [ButtonKeys.HANDLE]: {
      required: [F.APPROVE_LEADER],
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO)
    },
    [ButtonKeys.RETURN]: {
      required: [],
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO, APPROVAL_INFO)
    }
  },
  [TaskKeys.TASK200]: {
    [ButtonKeys.HANDLE]: {
      required: merge(DISPATCH_INFO, [F.DISPATCHER]),
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO, APPROVAL_INFO)
    },
    [ButtonKeys.RETURN]: {
      required: [],
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO, APPROVAL_INFO, DISPATCH_INFO)
    }
  },
  [TaskKeys.TASK300]: {
    [ButtonKeys.HANDLE]: {
      required: [F.KM1, F.START_TIME2],
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO, APPROVAL_INFO, DISPATCH_INFO)
    }
  },
  [TaskKeys.TASK400]: {
    [ButtonKeys.HANDLE]: {
      required: EXPENSE_INFO,
      disabled: merge(BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO, PASSENGER_INFO, APPROVAL_INFO, DISPATCH_INFO)
    }
  },
  [TaskKeys.VIEW]: {
    [ButtonKeys.VIEW]: {
      required: [],
      disabled: merge(
        BASE_INFO, ROUTE_INFO, TIME_INFO, CONTACT_INFO,
        PASSENGER_INFO, APPROVAL_INFO, DISPATCH_INFO, EXPENSE_INFO
      )
    }
  }
}

export function getFieldConfig(taskKey, buttonKey) {
  return CONFIG_MAP[taskKey]?.[buttonKey] || { required: [], disabled: [] }
}

// 获取字段的 disabled 状态
export function isFieldDisabled(fieldName, fieldConfig) {
  return (fieldConfig?.disabled || []).includes(fieldName)
}

// 获取字段的 required 状态
export function isFieldRequired(fieldName, fieldConfig) {
  return (fieldConfig?.required || []).includes(fieldName)
}

// 获取字段的 visible 状态（required 或 disabled 中出现过就可见）
export function isFieldVisible(fieldName, fieldConfig) {
  const all = [...(fieldConfig?.required || []), ...(fieldConfig?.disabled || [])]
  return all.includes(fieldName)
}
