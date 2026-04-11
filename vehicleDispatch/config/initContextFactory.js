import { getFormData } from '@modules/FormCenter/api'
import {
  getAllProjectUnit,
  getApproveList,
  getCarInfo,
  getDriverInfo,
  getFeeInfo,
  getPassengerList, getProjectUnit, remindTitle
} from '@/api/carApply'
import { getRateList } from '@modules/ProjectCar/ProjectPortal/CarRecord/api'

export function createInitContext(vm) {
  return {
    vm, // 注入组件上下文（this）

    // 注入接口依赖
    getFormData,
    getApproveList,
    getPassengerList,
    getCarInfo,
    getDriverInfo,
    getRateList,
    getFeeInfo,
    remindTitle,
    getProjectUnit,
    getAllProjectUnit
  };
}
