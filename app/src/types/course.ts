/**
 * 课表领域类型定义
 *
 * 对齐「项目说明.md」数据模型（草稿），并已确认改为「节次驱动」：
 * 课程时间用节次区间（startPeriod/endPeriod），具体绝对时间由节次表推导，
 * 节次表 P0 内置默认常量、P2 起由「设置」驱动（每节时长 + 上课起始时间）。
 */

/** 一周中的某一天（7 表示周日，与 JS Date#getDay 对齐：0=周日…6=周六） */
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

/**
 * 课程周规律（预留）。
 * P0–P2 一律按 `all`（全学期）处理，single/double 等后续启用。
 */
export type CourseTypeFilter = 'single' | 'double' | 'all'

/** 时段时间，HH:MM 24 小时制，如 "08:00" */
export type TimeString = `${number}:${number}`

/** 课程 */
export interface Course {
  id: string
  name: string
  /** 预留：教师名 */
  teacher?: string
  classroom?: string
  dayOfWeek: DayOfWeek
  /** 起始节次（第几节，1-based），如第 1 节 */
  startPeriod: number
  /** 结束节次（含），如第 2 节 */
  endPeriod: number
  /** 起始周（第几周起上，1-based；缺省=1 全学期起） */
  startWeek?: number
  /** 结束周（第几周止上，含；缺省=总周数 全学期止） */
  endWeek?: number
  /** 预留：出现的具体周次，全学期暂不参与过滤。只读以避免派发不可变数据时的类型冲突 */
  weeks?: readonly number[]
  /** 预留：周规律过滤器，全学期默认 'all' */
  type?: CourseTypeFilter
  /** 预留：备注 */
  note?: string
  /** 课程卡片主题色，由内置色卡自动分配 */
  color: string
}

/** 应用设置（P1/P2 启用，含三段式节次配置） */
export interface Settings {
  startDate: string
  totalWeeks: number
  /** 单节课时长（分钟）；默认 45 */
  classDurationMinutes: number
  /** 段内课间（分钟）；默认 10 */
  breakMinutes: number
  /** 早段第 1 节开始时间；默认 "08:00" */
  morningStart: string
  /** 早段节数；默认 4 */
  morningPeriods: number
  /** 午段第 1 节开始时间；默认 "14:00" */
  noonStart: string
  /** 午段节数；默认 4 */
  noonPeriods: number
  /** 晚段第 1 节开始时间；默认 "19:00" */
  eveningStart: string
  /** 晚段节数；默认 2 */
  eveningPeriods: number
  notificationEnabled: boolean
  /** 默认提前 30 分钟提醒（已确认） */
  notificationMinutes: number
}

/** 顶层课程表数据（预留，P1 持久化时启用） */
export interface ClassTableState {
  courses: Course[]
  settings: Settings
  /** 教务同步状态（仅 P4 启用，此前保持空置） */
  syncState: {
    lastSyncTime?: string
    syncedCourseIds: string[]
  }
}

/** 课程卡色卡。P0 阶段由 useCourses 按课程顺序循环分配。 */
export const COURSE_COLORS = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
] as const

/**
 * 课程在第 week 周是否上课。
 * - startWeek/endWeek 缺省视为全学期（始终上课）。
 * - 单/双周（type）暂不影响：全按区间判断，后续如需再扩展。
 */
export function isOnWeek(course: Pick<Course, 'startWeek' | 'endWeek'>, week: number): boolean {
  const start = course.startWeek ?? 1
  const end = course.endWeek ?? Number.POSITIVE_INFINITY
  return week >= start && week <= end
}
