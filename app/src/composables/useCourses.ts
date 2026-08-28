/**
 * useCourses —— 课程数据组合式函数
 *
 * P0 阶段：课程数据为内置种子数据（内存），不持久化、不增删改。
 * 提供按天分组的读取函数，供 WeekView 使用。
 * 持久化与增删改归 P1。
 *
 * 课程时间为「节次区间」（startPeriod/endPeriod），见 types/course.ts | types/schedule.ts。
 */
import { computed, readonly } from 'vue'
import type { Course, DayOfWeek } from '@/types/course'
import { COURSE_COLORS } from '@/types/course'

/**
 * 内置种子课程（P0 展示用）。
 * 覆盖周一到周五，并在周六安排一门课以验证"7 天都显示、无课列占位"。
 * 全部按全学期处理（不填 weeks/type）。
 * 节次区间：第 1-2 节 ≈ 08:00-09:40，第 3-4 节 ≈ 10:00-11:40，第 5-6 节 ≈ 14:00-15:40。
 */
const seedCourses: Course[] = [
  {
    id: 'c-001',
    name: '高等数学',
    teacher: '王建国',
    classroom: 'A-101',
    dayOfWeek: 1,
    startPeriod: 1,
    endPeriod: 2,
    color: '',
  },
  {
    id: 'c-002',
    name: '大学英语',
    teacher: '李慧敏',
    classroom: 'B-204',
    dayOfWeek: 1,
    startPeriod: 3,
    endPeriod: 4,
    color: '',
  },
  {
    id: 'c-003',
    name: '线性代数',
    teacher: '陈志远',
    classroom: 'A-305',
    dayOfWeek: 2,
    startPeriod: 1,
    endPeriod: 2,
    color: '',
  },
  {
    id: 'c-004',
    name: '数据结构',
    teacher: '刘思彤',
    classroom: 'C-102',
    dayOfWeek: 2,
    startPeriod: 5,
    endPeriod: 6,
    color: '',
  },
  {
    id: 'c-005',
    name: 'Java 程序设计',
    teacher: '赵刚',
    classroom: '计算机楼 501',
    dayOfWeek: 3,
    startPeriod: 1,
    endPeriod: 2,
    color: '',
  },
  {
    id: 'c-006',
    name: '思想政治',
    teacher: '孙丽华',
    classroom: 'D-101',
    dayOfWeek: 4,
    startPeriod: 3,
    endPeriod: 4,
    color: '',
  },
  {
    id: 'c-007',
    name: '体育',
    teacher: '周建军',
    classroom: '田径场',
    dayOfWeek: 5,
    startPeriod: 5,
    endPeriod: 6,
    color: '',
  },
  {
    id: 'c-008',
    name: '选修：摄影技术',
    teacher: '吴敏',
    classroom: 'E-302',
    dayOfWeek: 6,
    startPeriod: 1,
    endPeriod: 2,
    color: '',
  },
]

/**
 * 按课程列表顺序，从内置色卡循环分配颜色。
 * 纯函数，不修改传入数组，返回带颜色副本。
 */
function assignColors(courses: Course[]): Course[] {
  return courses.map((course, index) => ({
    ...course,
    // noUncheckedIndexedAccess 下取模索引必然在色卡长度内，非空断言安全
    color: COURSE_COLORS[index % COURSE_COLORS.length]!,
  }))
}

/** 初始化并缓存颜色分配结果 */
const colorized = assignColors(seedCourses)

/** 全部课程（P0 只读） */
export const courses = readonly(colorized)

/** 按天分组：返回 Map<DayOfWeek, Course[]>，键 1..7 */
export const coursesByDay = computed(() => {
  const map = new Map<DayOfWeek, Course[]>()
  for (let day = 1 as DayOfWeek; day <= 7; day++) {
    map.set(day, [])
  }
  for (const course of courses) {
    const list = map.get(course.dayOfWeek)
    list?.push(course)
  }
  return map
})

/**
 * 取某一天（1..7）的课程，按起始节次升序返回。
 * 无课返回空数组。
 */
export function getCoursesByDay(day: DayOfWeek): Course[] {
  return (coursesByDay.value.get(day) ?? [])
    .slice()
    .sort((a, b) => a.startPeriod - b.startPeriod)
}
