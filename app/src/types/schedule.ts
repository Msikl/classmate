/**
 * 节次表（schedule）类型与默认常量
 *
 * P0 使用内置默认节次表；P2 起由「设置」驱动（每节时长 + 第 1 节起始时间 + 节间休息），
 * 届时由设置构建节次表、渲染层无需改动。此模块是唯一节次来源。
 */

/** 时段时间，HH:MM 24 小时制，如 "08:00" */
export type TimeString = `${number}:${number}`

/** 单个节次 */
export interface Period {
  /** 节次序号，1-based */
  index: number
  /** 本节起始时间 */
  startTime: TimeString
  /** 本节结束时间 */
  endTime: TimeString
}

/**
 * 默认节次表（占位）。
 * 两小节一大节，每节 45 分钟，节间休息 10 分钟，大课间 20 分钟。
 * P2 由设置生成对应节次表，替换此默认值。
 */
export const DEFAULT_PERIODS: readonly Period[] = [
  { index: 1, startTime: '08:00', endTime: '08:45' },
  { index: 2, startTime: '08:55', endTime: '09:40' },
  { index: 3, startTime: '10:00', endTime: '10:45' },
  { index: 4, startTime: '10:55', endTime: '11:40' },
  { index: 5, startTime: '14:00', endTime: '14:45' },
  { index: 6, startTime: '14:55', endTime: '15:40' },
  { index: 7, startTime: '16:00', endTime: '16:45' },
  { index: 8, startTime: '16:55', endTime: '17:40' },
  { index: 9, startTime: '19:00', endTime: '19:45' },
  { index: 10, startTime: '19:55', endTime: '20:40' },
]
