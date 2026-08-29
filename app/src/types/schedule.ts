/**
 * 节次表（schedule）类型与生成函数
 *
 * 节次表由设置参数生成（P2 起 driver via 设置），支持**早/午/晚三段式**：
 * 各段指定「第 1 节开始时间 + 段内节数」，段内每节 = 单节时长 + 段内课间；段与段之间由各段首节时间自然定位。
 * DEFAULT_PERIODS 保留为基于默认值的常量，供无设置时渲染层兜底。
 * 此模块是唯一节次形状来源，渲染层（WeekView/CourseCard/表单/提醒）只读 periods，无需改。
 */

/** 时段时间，HH:MM 24 小时制，如 "08:00" */
export type TimeString = `${number}:${number}`

/** 单个节次 */
export interface Period {
  /** 节次序号，1-based（全天连续编号） */
  index: number
  /** 本节起始时间 */
  startTime: TimeString
  /** 本节结束时间 */
  endTime: TimeString
}

/** 一段（早/午/晚）的配置 */
export interface ScheduleSection {
  /** 段名（morning/noon/evening） */
  key: string
  /** 该段第 1 节开始时间 */
  start: string
  /** 该段节数 */
  count: number
}

/** 三段式节次表配置 */
export interface DayScheduleConfig {
  /** 单节时长（分钟） */
  classDuration: number
  /** 段内课间（分钟） */
  breakMinutes: number
  /** 三段配置 */
  sections: ScheduleSection[]
}

/** 分钟 → "HH:MM" */
function fmt(min: number): TimeString {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` as TimeString
}

/**
 * 按参数生成单段连续节次（从 firstStart 起，每节 classDuration 分钟、节间 breakMinutes 分钟，共 count 节）。
 * 供 buildDaySchedule 内部使用。
 */
export function buildPeriods(
  firstStart: string,
  classDurationMinutes: number,
  breakMinutes: number,
  count: number,
): Period[] {
  const [fh, fm] = firstStart.split(':').map(Number)
  let cursor = (fh ?? 0) * 60 + (fm ?? 0)
  const out: Period[] = []
  for (let i = 1; i <= count; i++) {
    const start = cursor
    const end = start + classDurationMinutes
    out.push({ index: i, startTime: fmt(start), endTime: fmt(end) })
    cursor = end + breakMinutes
  }
  return out
}

/**
 * 三段式节次表生成器：把早/午/晚三段按各自首节时间铺开，全天节次顺序连续编号。
 * 段内每节 时长+课间；段间由各段 start 时间自然定位（不自动计算）。
 */
export function buildDaySchedule(config: DayScheduleConfig): Period[] {
  const all: Period[] = []
  let globalIndex = 1
  for (const section of config.sections) {
    const seg = buildPeriods(section.start, config.classDuration, config.breakMinutes, section.count)
    for (const p of seg) {
      p.index = globalIndex++
      all.push(p)
    }
  }
  return all
}

/** 默认三段式：早 4 节(08:00)、午 4 节(14:00)、晚 2 节(19:00)，单节 45、课间 10 → 共 10 节 */
export const DEFAULT_PERIODS: readonly Period[] = buildDaySchedule({
  classDuration: 45,
  breakMinutes: 10,
  sections: [
    { key: 'morning', start: '08:00', count: 4 },
    { key: 'noon', start: '14:00', count: 4 },
    { key: 'evening', start: '19:00', count: 2 },
  ],
})
