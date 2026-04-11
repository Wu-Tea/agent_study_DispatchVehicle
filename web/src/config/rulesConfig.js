// rulesConfig.js - Element Plus 校验规则模块

// ================= 辅助函数 ===================
function isDefined(val) {
  return val !== undefined && val !== null && val !== ''
}

function isValidNumber(val) {
  const num = Number(val)
  if (isNaN(num) || num < 0) return false
  const parts = String(num).split('.')
  return !(parts[1] && parts[1].length > 2)
}

function isPositiveInteger(num) {
  const a = Number(num)
  return typeof a === 'number' && a > 0 && Math.floor(a) === a && !isNaN(a) && isFinite(a)
}

const phoneReg = /^1[3-9]\d{9}$/

// ================= 基本信息规则 ===================
const baseInfoRules = {
  flagBb: [
    { required: true, message: '请选择是否补报', trigger: 'change' }
  ],
  useCarNature: [
    { required: true, message: '请选择用车性质', trigger: 'change' }
  ],
  useCarMatter: [
    { required: true, message: '请选择用车事由', trigger: 'change' }
  ],
  remark1: [
    { required: true, message: '请输入用车事由说明', trigger: ['blur', 'change'] }
  ],
  fyDeptName: [
    { required: true, message: '请选择用车费用归属部门', trigger: 'change' }
  ]
}

// ================= 行程信息规则 ===================
const routeInfoRules = {
  startAddress: [
    { required: true, message: '请输入出发地', trigger: ['blur', 'change'] }
  ],
  endAddress: [
    { required: true, message: '请输入目的地', trigger: ['blur', 'change'] }
  ]
}

// ================= 时间信息规则 ===================
const timeInfoRules = {
  startTime: [
    { required: true, message: '请选择出车时间', trigger: 'change' }
  ],
  useCarTripType: [
    { required: true, message: '请选择出车形式', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择预计返回时间', trigger: 'change' },
    {
      validator: (rule, value, callback, source, options) => {
        // 需要通过 options.formData 获取 startTime
        // 在 getFormRules 中会注入 formData
        if (options?.formData?.startTime && value && new Date(value) < new Date(options.formData.startTime)) {
          callback(new Error('返回时间不能早于出发时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// ================= 联系人信息规则 ===================
const contactInfoRules = {
  contacts: [
    { required: true, message: '请选择联系人', trigger: 'change' }
  ],
  contactsPhone: [
    { required: true, message: '请输入联系电话', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (!phoneReg.test(value)) {
          callback(new Error('请输入正确手机格式'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ]
}

// ================= 审批信息规则 ===================
const approvalInfoRules = {
  task100UserName: [
    { required: true, message: '请选择审批领导', trigger: ['blur', 'change'] }
  ],
  task200UserName: [
    { required: true, message: '请选择车辆调度员', trigger: ['blur', 'change'] }
  ]
}

// ================= 乘车人信息规则 ===================
const passengerInfoRules = {
  useCarPersonNum: [
    { required: true, message: '请输入乘车人数', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (value && Number(value) > 0) {
          callback()
        } else {
          callback(new Error('请输入乘车人数'))
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  remark2: []
}

// ================= 车辆调度信息规则 ===================
const dispatchInfoRules = {
  carNum: [
    { required: true, message: '请选择车牌号', trigger: ['blur', 'change'] }
  ],
  driverFullName: [
    { required: true, message: '请选择姓名', trigger: ['blur', 'change'] }
  ],
  driverPhone: [
    { required: true, message: '请选择联系电话', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (!phoneReg.test(value)) {
          callback(new Error('请输入正确手机格式'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  carType: [],
  carAge: [],
  driverAge: []
}

// ================= 费用信息规则 ===================
function createNumberFieldRule(label) {
  return {
    validator: (rule, value, callback) => {
      if (!isDefined(value)) {
        callback(new Error(`请输入${label}`))
      } else if (!isValidNumber(value)) {
        callback(new Error('请输入有效的数字'))
      } else {
        callback()
      }
    },
    trigger: ['blur', 'change']
  }
}

const expenseInfoRules = {
  startTime2: [
    { required: true, message: '请输入实际开始时间', trigger: ['blur', 'change'] }
  ],
  endTime2: [
    { required: true, message: '请输入实际结束时间', trigger: ['blur', 'change'] }
  ],
  km1: [
    { required: true, message: '请输入出车前里程', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (isDefined(value) && isPositiveInteger(value)) {
          callback()
        } else {
          callback(new Error('里程数必须为大于0的整数'))
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  km2: [
    { required: true, message: '请输入回车后里程', trigger: ['blur', 'change'] },
    {
      validator: (rule, value, callback) => {
        if (isDefined(value) && isPositiveInteger(value)) {
          callback()
        } else {
          callback(new Error('里程数必须为大于0的整数'))
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  cost1: [
    createNumberFieldRule('公路通行费'),
    { required: true, message: '请填写公路通行费' }
  ],
  cost7: [
    createNumberFieldRule('桥、闸通行费'),
    { required: true, message: '请填写桥、闸通行费' }
  ],
  cost4: [
    createNumberFieldRule('车辆燃油费'),
    { required: true, message: '请填写车辆燃油费' }
  ],
  cost8: [
    createNumberFieldRule('车辆清洗费'),
    { required: true, message: '请填写车辆清洗费' }
  ],
  cost9: [
    createNumberFieldRule('停车费'),
    { required: true, message: '请填写停车费' }
  ],
  cost5: [
    createNumberFieldRule('其他费用'),
    { required: true, message: '请填写其他费用' }
  ],
  cost1Type: [],
  cost4Type: [],
  cost7Type: [],
  cost9Type: [],
  remark3: []
}

// ================= 合并所有规则 ===================
export const allFieldRules = {
  ...baseInfoRules,
  ...routeInfoRules,
  ...timeInfoRules,
  ...contactInfoRules,
  ...passengerInfoRules,
  ...approvalInfoRules,
  ...dispatchInfoRules,
  ...expenseInfoRules
}

// 根据当前字段配置，获取需要应用校验的规则
export function getFormRules(currentFieldConfig, formData) {
  const formRules = {}
  const requiredFields = currentFieldConfig?.required || []

  requiredFields.forEach((field) => {
    const rules = allFieldRules[field]
    if (rules && rules.length > 0) {
      formRules[field] = rules
    }
  })

  return formRules
}

// 动态数组字段规则生成（途经点、乘车人）
export function generateDynamicFieldRules(formRules, formData, currentFieldConfig) {
  const reqList = currentFieldConfig?.required || []

  if (reqList.includes('vdAfWaypointList')) {
    (formData.vdAfWaypointList || []).forEach((item, index) => {
      formRules[`vdAfWaypointList.${index}.address`] = [
        {
          required: true,
          message: `请输入途经点${index + 1}地址`,
          trigger: ['blur', 'change']
        }
      ]
    })
  }

  if (reqList.includes('vdAfUseCarPersonList')) {
    (formData.vdAfUseCarPersonList || []).forEach((item, index) => {
      formRules[`vdAfUseCarPersonList.${index}.ucPersonFullName`] = [
        { required: true, message: '请输入乘车人姓名', trigger: ['blur', 'change'] }
      ]
      formRules[`vdAfUseCarPersonList.${index}.ucPersonPhone`] = [
        { required: true, message: '请输入乘车人电话', trigger: ['blur', 'change'] },
        {
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入乘车人电话'))
            } else if (!phoneReg.test(value)) {
              callback(new Error('请输入正确手机格式'))
            } else {
              callback()
            }
          },
          trigger: ['blur', 'change']
        }
      ]
    })
  }

  return formRules
}
