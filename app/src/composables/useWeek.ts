/**
 * useWeek —— 周次信息组合式函数
 *
 * P0 阶段：当前周次、总周数为写死占位常量（需求基线确定）。
 * P2 阶段将改为基于「开学日期」自动计算，本函数签名保持不变。
 */
import { ref } from 'vue'

/** 当前周次（P0 写死占位，P2 改为按开学日期自动计算） */
export function useWeek() {
  const currentWeek = ref(1)
  const totalWeeks = ref(16)

  return { currentWeek, totalWeeks }
}
