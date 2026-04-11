import { deleteDraft, FORM, getDraft, saveDraftDebounced } from '@utils/draftUtil';
import { Dialog, Toast } from 'fawkes-mobile-lib';

export function saveDrafts(ctx) {
  if (!ctx.draftCanSave || !ctx.isApply) return;

  const data = {
    fromData: ctx.formData,
    vdAfWaypointList: ctx.formData.vdAfWaypointList,
  };
  const content = JSON.stringify(data);
  saveDraftDebounced(draftKey(ctx), FORM, content).catch(err => {
    console.error('保存草稿失败:', err);
  });
}

export function removeDraft(ctx) {
  deleteDraft(draftKey(ctx), FORM);
  ctx.$nextTick(() => {
    ctx.isPC ? ctx.$message.success('草稿删除成功') : Toast('草稿删除成功');
  });
}

export function loadDraftData(ctx) {
  ctx.saveDraft = false;
  const currData = ctx.draftCacheData;
  if (!currData) return;

  const fields = [...(ctx._draftFields || defaultFieldList)];

  const data = currData.fromData || {};
  fields.forEach(field => {
    if (data[field] !== undefined) {
      ctx.$set(ctx.formData, field, data[field]);
    }
  });

  if (ctx.isMobile) {
    const natureFind = ctx.enums.UseCarNatureEnums.find(i => i.key === data.useCarNature);
    if (natureFind) {
      ctx.formData.useCarNature = data.useCarNature;
      ctx.formData.useCarNatureStr = natureFind.value;
    }

    const matterFind = ctx.enums.UseCarMatterEnums.find(i => i.key === data.useCarMatter);
    if (matterFind) {
      ctx.$nextTick(() => {
        ctx.formData.useCarMatter = data.useCarMatter;
        ctx.formData.useCarMatterStr = matterFind.value;
      });
    }
  }

  if (Array.isArray(currData.vdAfWaypointList)) {
    ctx.formData.vdAfWaypointList = [...currData.vdAfWaypointList];
    ctx.formData.vdAfWaypointList.forEach(() => {
      ctx.wayPointsSensitive.push({ notify: '', private: false });
    });
  }

  ctx.$nextTick(() => {
    ctx.isPC ? ctx.$message.success('草稿已恢复') : Toast('草稿已恢复');
  });

  ctx.generateFormRules();
}

export function openHTML(ctx) {
  const restore = () => loadDraftData(ctx);
  const remove = () => removeDraft(ctx);

  ctx.$message({
    dangerouslyUseHTMLString: true,
    type: 'warning',
    message: `
      <span>存在草稿，是否恢复？</span>
      <a href="javascript:void(0);" style="color:#027AFF;" id="restoreDraft">恢复</a>
      <a href="javascript:void(0);" style="color:#FF4D4F;" id="removeDraft">删除</a>
    `,
    onClose: () => {
      document.getElementById('restoreDraft')?.removeEventListener('click', restore);
      document.getElementById('removeDraft')?.removeEventListener('click', remove);
    }
  });

  ctx.$nextTick(() => {
    document.getElementById('restoreDraft')?.addEventListener('click', restore);
    document.getElementById('removeDraft')?.addEventListener('click', remove);
  });
}

export async function loadData(ctx) {
  const res = await getDraft(draftKey(ctx), FORM);
  const draftInfo = JSON.parse(res.data);
  ctx.draftCacheData = draftInfo;

  const fields = [...(ctx._draftFields || defaultFieldList)];

  const hasFieldData = fields.some(field => {
    const val = draftInfo?.fromData?.[field];
    return Array.isArray(val) ? val.length > 0 : val !== '' && val !== null && val !== undefined;
  });

  const hasWaypoints = Array.isArray(draftInfo?.vdAfWaypointList) && draftInfo.vdAfWaypointList.length > 0;

  if (hasFieldData || hasWaypoints) {
    ctx.isPC
      ? openHTML(ctx)
      : Dialog.confirm({
        title: '提示',
        message: '检测到草稿，是否还原?'
      }).then(() => {
        loadDraftData(ctx);
      }).catch(() => {
        removeDraft(ctx);
      });
  }
}

export function clickFormRow(ctx) {
  if (ctx.isApply && ctx.initFinish) {
    ctx.draftCanSave = true;
    saveDrafts(ctx);
  }
}

// ✅ 可选字段列表提取
const defaultFieldList = [
  'startAddress', 'startAddressSmx', 'startAddressSmy',
  'endAddress', 'endAddressSmx', 'endAddressSmy',
  'startTime', 'endTime', 'useCarTripType', 'useCarJgTimeHour',
  'useCarJgTimeMinute', 'useCarMatter', 'useCarPersonNum',
  'useCarNature', 'flagBb', 'remark2', 'task200FullName', 'task200UserName',
  'task100FullName', 'task100UserName', 'vdAfUseCarPersonList',
  'remark1', 'otherField2', 'fyDeptName', 'fyDeptId',
  'driverFullName', 'driverUserName', 'driverId', 'driverPhone', 'driverAge',
  'carNum', 'carType', 'carAge', 'carId'
];

function draftKey(ctx) {
  return ctx.vdUserInfo.id + (ctx.$route.params.projectId || ctx.portal.id);
}
