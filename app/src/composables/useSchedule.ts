/**
 * useSchedule —— 节次表组合式函数
 *
 * P0：使用内置默认节次表（DEFAULT_PERIODS）。
 * P2：将由「设置」驱动构建节次表，导出形状保持稳定，渲染层无需改动。
 */
import { readonly } from 'vue'
import { DEFAULT_PERIODS } from '@/types/schedule'
import type { Period } from '@/types/schedule'

/** 节次表（P0 只读，P2 由设置生成替换） */
export const periods: readonly Period[] = readonly(DEFAULT_PERIODS)

/** 按节次序号取单个节次；越界返回 undefined */
export function getPeriod(index: number): Period | undefined {
  return periods[index - 1]
}

/**
 * 取某节次的起始/结束时间（HH:MM）。
 * 越界时返回容错占位。
 */
export function getPeriodTime(index: number): { startTime: string; endTime: string } {
  const p = getPeriod(index)
  return { startTime: p?.startTime ?? '--:--', endTime: p?.endTime ?? '--:--' }
}
