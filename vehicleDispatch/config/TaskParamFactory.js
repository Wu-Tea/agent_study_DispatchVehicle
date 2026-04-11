// TaskParamFactory.js
import { UserTask_200, UserTask_300, UserTask_400 } from '@utils/constants'

import { uuid } from '@utils/util'

export class TaskParamFactory {
  static createHandler(context) {
    const { isApply, isReSubmit, taskKey, isModifyAll } = context;
    if (isApply || isReSubmit) {
      return new ApplyHandler(context);
    }
    if (taskKey === UserTask_200) {
      return new DispatcherHandler(context);
    }
    if (taskKey === UserTask_300) {
      return new DriverConfirmHandler(context);
    }
    if (taskKey === UserTask_400 || isModifyAll) {
      return new TripFinishHandler(context);
    }
    return new DefaultHandler(context);
  }
}

class BaseHandler {
  constructor(context) {
    this.context = context;
  }
  process(formData) {
    return formData;
  }
}

class ApplyHandler extends BaseHandler {
  process(formData) {
    const { formData: rawData } = this.context;
    formData.flagZc = formData.useCarMatter !== 700 && formData.flagBb === false;
    formData.flagGd = formData.useCarMatter === 700;
    if (formData.flagBb) {
      formData.task300UserName = formData.task0UserName;
      formData.task300FullName = formData.task0FullName;
      formData.task400UserName = formData.driverUserName;
      formData.task400FullName = formData.driverFullName;
      formData.task500UserName = formData.task200UserName;
      formData.task500FullName = formData.task200FullName;
    }
    return formData;
  }
}

class DispatcherHandler extends BaseHandler {
  process(formData) {
    formData.task300UserName = formData.driverUserName;
    formData.task300FullName = formData.driverFullName;
    return formData;
  }
}

class DriverConfirmHandler extends BaseHandler {
  process(formData) {
    const { vdDriverInfo, bizId } = this.context;
    const { carId, driverId } = formData;
    formData.task400UserName = vdDriverInfo.driverUserName;
    formData.task400FullName = vdDriverInfo.driverFullName;
    formData.vdAfUcCompleteFormList = [{
      km1: formData.km1,
      attachment2: formData.attachment2 || null,
      starTime2: formData.startTime2,
      vdApplyFormId: bizId,
      vdCarInfoId: carId,
      vdDriverInfoId: driverId
    }];
    return formData;
  }
}

class TripFinishHandler extends BaseHandler {
  process(formData) {
    const { feeForm, journeyCostTotal, bizId } = this.context;
    const { carId, driverId } = formData;

    formData.task500UserName = formData.task200UserName;
    formData.task500FullName = formData.task200FullName;

    let _feeForm = JSON.parse(JSON.stringify(feeForm));
    const fieldList = [
      'attachment1', 'attachment2', 'attachment3', 'cost1Fj', 'cost2Fj', 'cost3Fj',
      'cost4Fj', 'cost5Fj', 'cost6Fj', 'cost7Fj', 'cost8Fj', 'cost9Fj'
    ];
    fieldList.forEach(field => {
      const val = formData[field];
      if (val === 0 || val === '0' || val === undefined || val === null || val === '') {
        formData[field] = uuid(16, 32);
      }
    });

    Object.keys(_feeForm).forEach(key => {
      if (key === 'cost6') {
        _feeForm['cost6'] = journeyCostTotal;
      } else if (key === 'remark3') {
        _feeForm['remark1'] = formData['remark3'];
      } else {
        _feeForm[key] = formData[key];
      }
    });
    if (formData.id) {
      _feeForm.id = formData.id;
    }
    formData.vdAfUcCompleteFormList = [{
      ..._feeForm,
      vdApplyFormId: bizId,
      vdCarInfoId: carId,
      vdDriverInfoId: driverId
    }];
    return formData;
  }
}

class DefaultHandler extends BaseHandler {}
