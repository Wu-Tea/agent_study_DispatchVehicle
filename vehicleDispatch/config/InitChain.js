// InitChain.js（使用 vm 模式，保留完整 Vue 实例）

export class InitHandler {
  constructor(context) {
    this.context = context;
    this.nextHandler = null;
  }

  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }

  async exec() {
    await this.handle(); // 调用子类自定义逻辑
    if (this.nextHandler) {
      await this.nextHandler.exec(); // 自动继续下一个
    }
  }
  async handle() {

  }

  get vm() {
    return this.context.vm;
  }
}

class InitBasicEmitHandler extends InitHandler {
  async handle() {
    this.vm.$emit('setModelKey', this.vm.modelKey); // 设置 modelKey
    this.vm.$emit('setFormName', this.vm.formName); // 设置表单左上角弹窗名称
    this.vm.$emit('setModelKey', this.vm.modelKey); // 再次设置 modelKey
    this.vm.$emit('setEntityName', this.vm.entityName); // 设置实体对象名称
    this.vm.$emit('setService', this.vm.service); // 设置接口服务
    this.vm.$emit('setSubmitText', this.vm.submitText); // 设置提交按钮文字
  }
}

class InitEnumHandler extends InitHandler {
  async handle() {
    if (this.vm.noAuth) {
      await this.vm.getEnum();
    }
  }
}

class InitApplyInfoHandler extends InitHandler {
  async handle() {
    if (!this.vm.noAuth && this.vm.isApply) {
      const [titleRes, approveRes, unitRes] = await Promise.all([
        this.context.remindTitle(),
        this.context.getApproveList(this.vm.portal.id, this.vm.portal.name),
        this.context.getProjectUnit({projectId: this.vm.portal.id})
      ]);
      this.vm.formData.remindTitle = titleRes.data;
      this.vm.approveList1 = approveRes.data.VD_ZBCZ;
      this.vm.approveList2 = approveRes.data.VD_CLDDY;
      this.vm.initApproveList1 = approveRes.data.VD_ZBCZ;
      this.vm.initApproveList2 = approveRes.data.VD_CLDDY;
      if (unitRes.data) {
        const {id, deptName} = unitRes.data;
        this.vm.formData.fyDeptId = id;
        this.vm.formData.fyDeptName = deptName;
      }
    }
  }
}

class InitUserInfoHandler extends InitHandler {
  async handle() {
    const user = this.vm.currUser;
    if (!this.vm.noAuth) {
      // 获取全部二级部门
      const { data: deptList } = await this.context.getAllProjectUnit();
      this.vm.secondLevelUnitList = deptList;
      this.vm.filteredSecondLevelUnitList = deptList;
      if (!user || !user.phone || !user.userFullName || !user.userName) {
        const res = await this.vm.getCurrentUser(this.vm.$storage.get('username'));
        if (res.data) {
          this.vm.getApplyUserInfo(res.data);
        } else {
          const user = this.vm.$storage.getObject('user');
          const { userFullname, userName, phone } = user;
          this.vm.getApplyUserInfo({
            userFullName: userFullname,
            userName,
            userPhone: phone,
            userDepName: ' ',
            userDepName2: ' '
          });
        }
      } else {
        this.vm.getApplyUserInfo(user);
      }
    }
  }
}

class InitTipsHandler extends InitHandler {
  async handle() {
    await this.vm.queryTipsContent?.();
  }
}

class InitFormDataHandler extends InitHandler {
  async handle() {
    if (this.vm.type !== 'add') {
      const params = { entityName: this.vm.entityName, id: this.vm.bizId };
      const res = await this.context.getFormData(this.vm.service.initial, params, 'get');
      const { data: approveData } = await this.context.getApproveList(res.data.projectId, res.data.projectName);
      this.vm.approveList1 = approveData.VD_ZBCZ;
      this.vm.approveList2 = approveData.VD_CLDDY;
      this.vm.initApproveList1 = approveData.VD_ZBCZ;
      this.vm.initApproveList2 = approveData.VD_CLDDY;

      const passengerRes = await this.context.getPassengerList(this.vm.bizId);

      if (res.data?.carId && res.data?.driverId) {
        const { projectId, projectName } = res.data;
        const projectParams = projectId && projectName ? { projectId, projectName } : {};
        const [carRes, driverRes] = await Promise.all([
          this.context.getCarInfo({ ids: res.data.carId, ...projectParams }),
          this.context.getDriverInfo({ ids: res.data.driverId, ...projectParams })
        ]);
        this.vm.vdCarInfo = carRes.data?.[res.data.carId] || {};
        this.vm.vdDriverInfo = driverRes.data?.[res.data.driverId] || {};
      }

      const { data: rateRes } = await this.context.getRateList({
        ids: res.data.id,
        userName: this.vm.$storage.get('username')
      });
      this.vm.showRate = rateRes;

      const feeRes = await this.context.getFeeInfo(this.vm.bizId);
      const result = this.vm.beforeInit && await this.vm.beforeInit(res.data, passengerRes.data, feeRes.data);
      const data1 = result || res.data;
      Object.keys(data1).forEach(key => {
        this.vm.$set(this.vm.formData, key, data1[key]);
      });

      this.vm.searchWayPointList(this.vm.bizId);
      this.vm.historyUseCarNature = this.vm.formData.useCarNature;

      if (this.vm.isEditCar && this.vm.vdCarInfo.id) {
        const data2 = {
          carNum: this.vm.vdCarInfo.carNum,
          carName: this.vm.vdCarInfo.carName,
          carType: this.vm.vdCarInfo.carType,
          carAge: this.vm.vdCarInfo.carAge
        };
        Object.keys(data2).forEach(key => {
          this.vm.$set(this.vm.formData, key, data2[key]);
        });
      }
      if (this.vm.isEditCar && this.vm.vdDriverInfo.id) {
        const data3 = {
          driverFullName: this.vm.vdDriverInfo.driverFullName,
          driverUserName: this.vm.vdDriverInfo.driverUserName,
          driverPhone: this.vm.vdDriverInfo.driverPhone,
          driverAge: this.vm.vdDriverInfo.driverAge
        };
        Object.keys(data3).forEach(key => {
          this.vm.$set(this.vm.formData, key, data3[key]);
        })
      }

      this.vm.$emit('setFormData', this.vm.formData);
    }
  }
}

class InitReturnNodeOptionsHandler extends InitHandler{
  async handle() {
    const { formData } = this.vm;

    const nodeDefs = [
      { value: 'UserTask_0', label: '用车申请', nameKey: 'task0FullName' },
      { value: 'UserTask_100', label: '领导审批', nameKey: 'task100FullName' },
      { value: 'UserTask_200', label: '调度员派车', nameKey: 'task200FullName' },
      { value: 'UserTask_300', label: '司机确认', nameKey: 'task300FullName' },
      { value: 'UserTask_400', label: '行车日志填报', nameKey: 'task400FullName' },
      { value: 'UserTask_500', label: '费用审批', nameKey: 'task500FullName' }
    ];

    // 找到“当前节点”索引，这里假设当前为 task400
    const currentIndex = nodeDefs.findIndex(n => n.value === this.vm.taskKey);

    // 前置节点
    let returnableNodes = nodeDefs.slice(0, currentIndex);

    // 补报时跳过指定节点
    if (formData.flagBb === true || formData.flagBb === 'true') {
      const skipKeys = ['UserTask_100', 'UserTask_200', 'UserTask_300'];
      returnableNodes = returnableNodes.filter(n => !skipKeys.includes(n.value));
    }

    // 从 formData 中注入 userName
    const enrichedNodes = returnableNodes.map(n => ({
      value: n.value,
      label: n.label,
      userName: formData[n.nameKey] || ''
    }));
    this.vm.$emit('setReturnNodeList', enrichedNodes);
    // this.vm.returnNodeList = enrichedNodes;
  }
};

class InitDraftHandler extends InitHandler {
  async handle() {
    if (this.vm.isApply) {
      this.vm.initFinish = true;
      await this.vm.loadData();
    }
  }
}

class InitFieldConfigHandler extends InitHandler {
  async handle() {
    this.vm.initFormFieldConfig(this.vm.taskKey, this.vm.currentButtonKey);
  }
}

export function createInitChain(context) {
  const handlers = [
    new InitBasicEmitHandler(context),
    new InitEnumHandler(context),
    new InitFieldConfigHandler(context),
    new InitApplyInfoHandler(context),
    new InitUserInfoHandler(context),
    new InitTipsHandler(context),
    new InitFormDataHandler(context),
    // new InitReturnNodeOptionsHandler(context),
    new InitDraftHandler(context),
  ];

  for (let i = 0; i < handlers.length - 1; i++) {
    handlers[i].setNext(handlers[i + 1]);
  }
  // console.group('[InitChain] 链结构');
  // handlers.forEach((h, idx) => {
  //   console.log(`Step ${idx + 1}: ${h.constructor.name}`);
  // });
  // console.groupEnd();

  return handlers[0]; // ✅ 返回链头（InitEnumHandler）
}

