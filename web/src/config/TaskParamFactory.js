// TaskParamFactory.js - 数据构建模块（工厂/策略模式）

class BaseHandler {
  constructor(context) {
    this.context = context
  }
  process(formData) {
    return formData
  }
}

class ApplyHandler extends BaseHandler {
  process(formData) {
    formData.flagZc = formData.useCarMatter !== 700 && formData.flagBb === false
    formData.flagGd = formData.useCarMatter === 700
    if (formData.flagBb) {
      formData.task300UserName = formData.task0UserName
      formData.task300FullName = formData.task0FullName
      formData.task400UserName = formData.driverUserName
      formData.task400FullName = formData.driverFullName
      formData.task500UserName = formData.task200UserName
      formData.task500FullName = formData.task200FullName
    }
    return formData
  }
}

class DispatcherHandler extends BaseHandler {
  process(formData) {
    formData.task300UserName = formData.driverUserName
    formData.task300FullName = formData.driverFullName
    return formData
  }
}

class DriverConfirmHandler extends BaseHandler {
  process(formData) {
    formData.vdAfUcCompleteFormList = [{
      km1: formData.km1,
      attachment2: formData.attachment2 || null,
      starTime2: formData.startTime2,
      vdApplyFormId: this.context.bizId,
      vdCarInfoId: formData.carId,
      vdDriverInfoId: formData.driverId
    }]
    return formData
  }
}

class TripFinishHandler extends BaseHandler {
  process(formData) {
    formData.task500UserName = formData.task200UserName
    formData.task500FullName = formData.task200FullName
    formData.vdAfUcCompleteFormList = [{
      km1: formData.km1,
      km2: formData.km2,
      km3: formData.km3,
      startTime2: formData.startTime2,
      endTime2: formData.endTime2,
      cost1: formData.cost1,
      cost4: formData.cost4,
      cost5: formData.cost5,
      cost7: formData.cost7,
      cost8: formData.cost8,
      cost9: formData.cost9,
      vdApplyFormId: this.context.bizId,
      vdCarInfoId: formData.carId,
      vdDriverInfoId: formData.driverId
    }]
    return formData
  }
}

class DefaultHandler extends BaseHandler {}

export class TaskParamFactory {
  static createHandler(context) {
    const { isApply, isReSubmit, taskKey, isModifyAll } = context
    if (isApply || isReSubmit) return new ApplyHandler(context)
    if (taskKey === 'UserTask_200') return new DispatcherHandler(context)
    if (taskKey === 'UserTask_300') return new DriverConfirmHandler(context)
    if (taskKey === 'UserTask_400' || isModifyAll) return new TripFinishHandler(context)
    return new DefaultHandler(context)
  }
}
