// 负责根据活动进度、领取期限和领取结果生成互斥的活动状态。
export function getActivityStatus(activity, spentFen, today) {
  const completed = spentFen >= activity.thresholdFen

  if (activity.claimed) return { key: 'claimed', label: '已领取', type: 'success' }
  // 未达标专指活动已结束且消费条件没有完成。
  if (!completed) {
    if (today > activity.endDate) return { key: 'unmet', label: '未达标', type: 'info' }
    return { key: 'ongoing', label: '进行中', type: 'info' }
  }
  // 达标后只关心奖励领取阶段，不再同时标记为进行中或已达标。
  if (today < activity.claimStartDate) return { key: 'waiting', label: '待领取', type: 'warning' }
  if (today <= activity.claimEndDate) return { key: 'claimable', label: '可领取', type: 'danger' }
  return { key: 'expired', label: '已过期', type: 'danger' }
}
