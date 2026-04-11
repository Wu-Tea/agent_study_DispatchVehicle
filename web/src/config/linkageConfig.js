// linkageConfig.js - 字段联动逻辑模块

export const formLinkageRules = [
  // 用车性质 -> 用车事由
  {
    trigger: 'useCarNature',
    effect: ['useCarMatter'],
    handler: ({ newVal, formData, context }) => {
      formData.useCarMatter = ''
      let filtered = []
      if (newVal) {
        filtered = (context.useCarMatterEnums || []).filter(
          item => item.type && item.type.includes(newVal)
        )
      }
      context.useCarMatterList = filtered
    }
  },
  // 用车事由 -> 出车形式
  {
    trigger: 'useCarMatter',
    effect: ['useCarTripType'],
    handler: ({ newVal, formData }) => {
      formData.useCarTripType = (newVal === 5300) ? 100 : 200
    }
  },
  // 出车形式 -> 间隔时长
  {
    trigger: 'useCarTripType',
    effect: ['useCarJgTimeHour', 'useCarJgTimeMinute'],
    handler: ({ newVal, formData }) => {
      if (newVal === 100) {
        formData.useCarJgTimeHour = 3
        formData.useCarJgTimeMinute = 0
      }
    }
  },
  // 间隔时长/出发时间 -> 预计返回时间
  {
    trigger: 'useCarJgTimeHour',
    effect: ['endTime'],
    handler: ({ formData }) => computeEndTime(formData)
  },
  {
    trigger: 'useCarJgTimeMinute',
    effect: ['endTime'],
    handler: ({ formData }) => computeEndTime(formData)
  },
  {
    trigger: 'startTime',
    effect: ['endTime'],
    handler: ({ formData }) => computeEndTime(formData)
  },
  // 是否补报 -> 车辆/司机信息
  {
    trigger: 'flagBb',
    effect: ['carNum', 'driverFullName'],
    handler: ({ newVal, oldVal, formData, context }) => {
      if (newVal === false && oldVal === true) {
        formData.carNum = ''
        formData.carType = ''
        formData.carAge = ''
        formData.driverFullName = ''
        formData.driverPhone = ''
        formData.driverAge = ''
      }
      // 切换补报状态时重新计算字段配置
      if (context.refreshFieldConfig) {
        context.refreshFieldConfig()
      }
    }
  },
  // 出车前里程/回车后里程 -> 行驶里程
  {
    trigger: 'km1',
    effect: ['km3'],
    handler: ({ formData }) => {
      const km1 = Number(formData.km1 || 0)
      const km2 = Number(formData.km2 || 0)
      formData.km3 = km2 - km1 >= 0 ? km2 - km1 : ''
    }
  },
  {
    trigger: 'km2',
    effect: ['km3'],
    handler: ({ formData }) => {
      const km1 = Number(formData.km1 || 0)
      const km2 = Number(formData.km2 || 0)
      formData.km3 = km2 - km1 >= 0 ? km2 - km1 : ''
    }
  }
]

function computeEndTime(formData) {
  if (!formData.startTime || formData.useCarTripType !== 100) return
  const hour = Number(formData.useCarJgTimeHour) || 0
  const minute = Number(formData.useCarJgTimeMinute) || 0
  const start = new Date(formData.startTime)
  if (isNaN(start.getTime())) return
  start.setHours(start.getHours() + hour)
  start.setMinutes(start.getMinutes() + minute)
  const pad = (n) => String(n).padStart(2, '0')
  formData.endTime = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ${pad(start.getHours())}:${pad(start.getMinutes())}:00`
}

// 总入口：根据字段名触发对应的联动规则
export function applyFieldLinkage(fieldName, newVal, context, oldVal) {
  const matchedRules = formLinkageRules.filter(rule => rule.trigger === fieldName)
  for (const rule of matchedRules) {
    rule.handler({
      newVal,
      oldVal,
      formData: context.formData,
      context
    })
  }
}
