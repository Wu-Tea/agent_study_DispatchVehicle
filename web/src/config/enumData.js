// enumData.js - 模拟枚举数据（实际项目中由后端返回）

export const UseCarNatureEnums = [
  { key: 100, value: '公务用车', type: [] },
  { key: 200, value: '通勤用车', type: [] },
  { key: 300, value: '接待用车', type: [] },
  { key: 400, value: '应急用车', type: [] }
]

export const UseCarMatterEnums = [
  { key: 5100, value: '会议用车', type: [100, 300] },
  { key: 5200, value: '出差用车', type: [100] },
  { key: 5300, value: '接送站用车', type: [100, 300] },
  { key: 5400, value: '市内办事', type: [100, 200] },
  { key: 700, value: '固定线路', type: [200] },
  { key: 5500, value: '应急保障', type: [400] }
]

export const UseCarTripTypeEnums = [
  { key: 100, value: '间隔出行', code: 'INTERVAL' },
  { key: 200, value: '全程跟随', code: 'FOLLOW' }
]

export const PayTypeEnums = [
  { key: 1, value: '公司支付' },
  { key: 2, value: '个人垫付' },
  { key: 3, value: 'ETC' }
]

export const FuelTypeEnums = [
  { key: 1, value: '92#汽油' },
  { key: 2, value: '95#汽油' },
  { key: 3, value: '98#汽油' },
  { key: 4, value: '0#柴油' },
  { key: 5, value: '充电' }
]

// 模拟审批人列表
export const ApproveLeaderList = [
  { userName: 'leader01', fullName: '张领导' },
  { userName: 'leader02', fullName: '李领导' },
  { userName: 'leader03', fullName: '王领导' }
]

export const DispatcherList = [
  { userName: 'dispatcher01', fullName: '赵调度' },
  { userName: 'dispatcher02', fullName: '钱调度' }
]

// 模拟二级部门列表
export const DeptList = [
  { id: 'dept01', deptName: '综合管理部' },
  { id: 'dept02', deptName: '技术研发部' },
  { id: 'dept03', deptName: '市场营销部' },
  { id: 'dept04', deptName: '财务部' }
]

// 模拟车辆列表
export const CarList = [
  { id: 'car01', carNum: '京A12345', carType: '轿车', carAge: '3年', seatCount: 5 },
  { id: 'car02', carNum: '京B67890', carType: 'SUV', carAge: '2年', seatCount: 7 },
  { id: 'car03', carNum: '京C11111', carType: '商务车', carAge: '1年', seatCount: 7 }
]

// 模拟司机列表
export const DriverList = [
  { id: 'drv01', driverUserName: 'driver01', driverFullName: '孙司机', driverPhone: '13800138001', driverAge: '10年' },
  { id: 'drv02', driverUserName: 'driver02', driverFullName: '周司机', driverPhone: '13800138002', driverAge: '8年' },
  { id: 'drv03', driverUserName: 'driver03', driverFullName: '吴司机', driverPhone: '13800138003', driverAge: '5年' }
]
