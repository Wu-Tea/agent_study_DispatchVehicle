// rulesConfig.js

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
    { required: true, message: '请选择用车费用所属部门', trigger: 'change' }
  ]
};

// 行程校验规则， 途经点被放置在了generateFormRules中
const routeInfoRules = {
  startAddress: [
    { required: true, message: '请输入出发地', trigger: ['blur', 'change'] }
  ],
  endAddress: [
    { required: true, message: '请输入目的地', trigger: ['blur', 'change'] }
  ]
};

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
      validator(value) {
        // 简单留一个 endTimeValidator 的 placeholder，真正逻辑你可以继续复用之前的
        if (this.formData.startTime && value && new Date(value) < new Date(this.formData.startTime)) {
          return false;
        } else {
          return true;
        }
      },
      message: "返回时间不能早于出发时间",
      trigger: 'change'
    }
  ]
};

const contactInfoRules = {
  contacts: [
    { required: true, message: '请选择联系人', trigger: 'change' }
  ],
  contactsPhone: [
    { required: true, message: '请输入联系电话', trigger: ['blur', 'change'] },
    {
      validator(value) {
        const phoneReg = /^[1][23456789][0-9]{9}$/;
        if (!value) {
          return true;
        } else if (!phoneReg.test(value)) {
          return false;
        } else {
          return true;
        }
      },
      message: "请输入正确手机格式",
      trigger: ['blur', 'change']
    }
  ]
};

const approvalInfoRules = {
  task100UserName: [
    {
      required: true,
      message: "请选择审批领导",
      trigger: ['blur', 'change']
    },
    {
      validator(value) {
        if (!this.formData.flagBb) {
          // flagBb = true 的时候必须填写
          if (value) {
            return true;
          } else {
            return false;
          }
        } else {
          // flagBb = false 的时候，不强制校验
          return true;
        }
      },
      message: "请选择审批领导",
      trigger: ['blur', 'change']
    }
  ],
  task200UserName: [
    {
      required: true,
      message: '请选择车辆调度员',
      trigger: ['blur', 'change']
    }
  ]
};


const passengerInfoRules = {
  useCarPersonNum: [
    {
      required: true,
      message: '请输入乘车人数',
      trigger: ['blur', 'change']
    },
    {
      // required: true,
      validator(value) {
        if (value && value > 0) {
          return true;
        } else {
          return false;
        }
      },
      message: "请输入乘车人数",
      trigger: ['blur', 'change']
    }
  ],
  remark2: [
    // 留言字段暂不强制 required，如果你未来要 required 也可以补
  ]
};

// relu/dispatchInfo.js

export const dispatchInfoRules = {
  carNum: [
    { required: true, message: '请选择车牌号', trigger: ['blur', 'change'] }
  ],
  // carType: [
  //   { required: true, message: '请选择车型', trigger: ['blur', 'change'] }
  // ],
  driverFullName: [
    { required: true, message: '请选择姓名', trigger: ['blur', 'change'] }
  ],
  driverPhone: [
    { required: true, message: '请选择联系电话', trigger: ['blur', 'change'] },
    {
      validator(value) {
        const phoneReg = /^[1][23456789][0-9]{9}$/;
        if (!value) {
          return true;
        } else if (!phoneReg.test(value)) {
          return false;
        } else {
          return true;
        }
      },
      message: "请输入正确手机格式",
      trigger: ['blur', 'change']
    }
  ],
  carType: [

  ],
  carAge: [
    // 车龄显示，无需校验
  ],
  driverAge: [
    // 驾龄显示，无需校验
  ]
};

// relu/expenseInfo.js

export const expenseInfoRules = {
  startTime2: [
    {
      required: true,
      message: '请输入实际开始时间',
      trigger: ['blur', 'change']
    }
  ],
  endTime2: [
    {
      required: true,
      message: '请输入实际结束时间',
      trigger: ['blur', 'change']
    }
  ],
  km1: [
    {
      required: true,
      message: '请输入出车前里程',
      trigger: ['blur', 'change']
    },
    {
      message: '里程数必须为大于0的整数',
      validator(value) {
        if (isDefined(value) && isPositiveInteger(value)) {
          return true;
        } else {
          return false;
        }
      },
      trigger: ['blur', 'change']
    },
  ],
  km2: [
    {
      required: true,
      message: '请输入回车后里程',
      trigger: ['blur', 'change']
    },
    {
      message: '里程数必须为大于0的整数',
      validator(value) {
        if (isDefined(value) && isPositiveInteger(value)) {
          return true;
        } else {
          return false;
        }
      },
      trigger: ['blur', 'change']
    },
    {
      validator(value) {
        if (Number(this.formData.km1) >= Number(value)) {
          return false;
        } else {
          return true;
        }
      },
      message: '回车后里程不能小于出车前里程',
      trigger: ['blur', 'change']
    }
  ],
  cost1: [
    createNumberFieldRule('公路通行费')
  ],
  cost7: [
    createNumberFieldRule('桥、闸通行费')
  ],
  cost4: [
    createNumberFieldRule('车辆燃油费')
  ],
  cost8: [
    createNumberFieldRule('车辆清洗费')
  ],
  cost9: [
    createNumberFieldRule('停车费')
  ],
  cost5: [
    createNumberFieldRule('其他费用')
  ],
  cost1Type: [
    createSelectFieldRule('cost1', '公路通行费')
  ],
  cost7Type: [
    createSelectFieldRule('cost7', '桥、闸通行费')
  ],
  cost4Type: [
    createSelectFieldRule('cost4', '车辆燃油费')
  ],
  cost9Type: [
    createSelectFieldRule('cost9', '停车费')
  ],
  cost4Field1: [
    {
      required: false,
      message: '请选择燃油标号',
      trigger: ['blur', 'change']
    }
  ],
  other2: [
    {
      message: '请输入有效的数字',
      validator(value) {
        if (isDefined(value) && isValidNumber(value)) {
          return true;
        } else {
          return false;
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  remark3: [],
  attachment1: []
};

// ================= 辅助函数 ===================
function createNumberFieldRule(label) {
  return {
    validator(value) {
      if (!isDefined(value)) {
        return false;
      } else if (!isValidNumber(value)) {
        return false;
      } else {
        return true;
      }
    },
    message: `请输入有效的${label}`,
    trigger: ['blur', 'change']
  };
}
// ================= 辅助函数 ===================
function createSelectFieldRule(amountField, label) {
  return {
    validator(value) {
      const amount = Number(this.formData[amountField]);
      if (amount > 0) {
        if (isDefined(value)) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    },
    message: `请选择${label}支付方式`,
    trigger: 'change'
  };
}


function isDefined(val) {
  return val !== undefined && val !== null && val !== '';
}

function isValidNumber(val) {
  try {
    const num = Number(val);
    if (isNaN(num)) return false;
    if (num < 0) return false;
    // 检查最多两位小数
    const parts = String(num).split('.');
    if (parts[1] && parts[1].length > 2) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function isPositiveInteger(num) {
  const a = Number(num)
  // 检查是否为数字、大于0且是整数
  return typeof a === 'number' &&
    a > 0 &&
    Math.floor(a) === a &&
    !isNaN(a) &&
    isFinite(a);
}


// 合并所有模块的规则到一个总对象
export const allFieldRules = {
  ...baseInfoRules,
  ...routeInfoRules,
  ...timeInfoRules,
  ...contactInfoRules,
  ...passengerInfoRules,
  ...approvalInfoRules,
  ...dispatchInfoRules,
  ...expenseInfoRules
};



export function notifyCallbackMobile(errorMsg) {
  console.log("报错", errorMsg)
  const hasError = !!errorMsg && String(errorMsg).trim().length > 0;
  return hasError ? errorMsg : '';
}


// 获取整个表单所有需要校验的 rules

// 动态获取整个表单需要校验的 rules，并绑定 this（组件实例）
export function getFormRules(currentFieldConfig, context) {
  const formRules = {};

  (currentFieldConfig?.required || []).forEach((field) => {
    const rules = allFieldRules[field];

    if (rules) {
      formRules[field] = rules.map(rule => {
        if (typeof rule.validator === 'function') {
          const originalValidator = rule.validator;
          return {
            ...rule,
            validator(value, ruleArg, callback) {
              return originalValidator.call(context, value, ruleArg, callback);
            }
          };
        }
        return rule;
      });
    }
  });

  return formRules;
}


// 在ruleConfig.js内封装动态数组字段规则生成
export function generateDynamicFieldRules(formRules, formData, context, currentFieldConfig) {
  let reqList = currentFieldConfig?.required || [];
  // 途经点地址校验
  if(reqList.includes('vdAfWaypointList')) {
    (formData.vdAfWaypointList || []).forEach((item, index) => {
      formRules[`vdAfWaypointList.${index}.address`] = [
        {
          required: true,
          validator(value) {
            try {
              if (value) {
                return true;
              } else {
                return false;
              }
            } catch (error) {
              console.error('途经点校验异常', error);
              return false;
            }
          },
          message: `请输入途经点${index + 1}地址`,
          trigger: ['blur', 'change']
        }
      ];
    });
  }
  if(reqList.includes('vdAfUseCarPersonList')) {

    // 乘车人姓名与电话校验
    (formData.vdAfUseCarPersonList || []).forEach((item, index) => {
      formRules[`vdAfUseCarPersonList.${index}.ucPersonFullName`] = [
        {
          required: true,
          message: '请输入乘车人姓名',
          trigger: ['blur', 'change']
        }
      ];

      formRules[`vdAfUseCarPersonList.${index}.ucPersonPhone`] = [
        {
          required: true,
          message: '请输入乘车人电话',
          trigger: ['blur', 'change']
        },
        {
          validator(value) {
            const phoneReg = /^[1][23456789][0-9]{9}$/;
            if (!phoneReg.test(value)) {
              console.log("手机格式")
              return false;
            } else {
              return true;
            }
          },
          message: "请输入正确手机格式",
          trigger: ['blur', 'change']
        }
      ];
    });
  }

  return formRules;
}
