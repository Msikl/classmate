/**
 * useCourses —— 课程数据组合式函数（P1 起为 store）
 *
 * 持有全局唯一的课程响应式状态，提供增删改查 + localStorage 持久化。
 * 首次使用（localStorage 为空）写入内置种子数据；此后以本地存储为准，刷新保留。
 *
 * 架构：模块级单例——所有调用方 useCourses() 拿到同一状态。
 * 课程时间为「节次区间」（startPeriod/endPeriod），见 types/course.ts | types/schedule.ts。
 */
import { computed, readonly, ref } from 'vue'
import type { Course, DayOfWeek } from '@/types/course'
import { COURSE_COLORS } from '@/types/course'
import { readJSON, writeJSON } from '@/utils/storage'

/** localStorage key（前缀 classmate: 由 storage.ts 统一加） */
const STORAGE_KEY = 'courses'

/** 内置种子课程：仅当本地存储为空时作为初始数据写入 */
const seedCourses: Course[] = [
  { id: 'c-001', name: '高等数学', teacher: '王建国', classroom: 'A-101', dayOfWeek: 1, startPeriod: 1, endPeriod: 2, color: '' },
  { id: 'c-002', name: '大学英语', teacher: '李慧敏', classroom: 'B-204', dayOfWeek: 1, startPeriod: 3, endPeriod: 4, color: '' },
  { id: 'c-003', name: '线性代数', teacher: '陈志远', classroom: 'A-305', dayOfWeek: 2, startPeriod: 1, endPeriod: 2, color: '' },
  { id: 'c-004', name: '数据结构', teacher: '刘思彤', classroom: 'C-102', dayOfWeek: 2, startPeriod: 5, endPeriod: 6, color: '' },
  { id: 'c-005', name: 'Java 程序设计', teacher: '赵刚', classroom: '计算机楼 501', dayOfWeek: 3, startPeriod: 1, endPeriod: 2, color: '' },
  { id: 'c-006', name: '思想政治', teacher: '孙丽华', classroom: 'D-101', dayOfWeek: 4, startPeriod: 3, endPeriod: 4, color: '' },
  { id: 'c-007', name: '体育', teacher: '周建军', classroom: '田径场', dayOfWeek: 5, startPeriod: 5, endPeriod: 6, color: '' },
  { id: 'c-008', name: '选修：摄影技术', teacher: '吴敏', classroom: 'E-302', dayOfWeek: 6, startPeriod: 1, endPeriod: 2, color: '' },
]

/** 颜色分配：新课程按当前总数取色卡余数；返回最新色卡项 */
function pickColor(coursesCount: number): string {
  return COURSE_COLORS[coursesCount % COURSE_COLORS.length]!
}

/** 生成稳定唯一 id；无 crypto 环境下用时间戳+随机兜底 */
function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 初始化课程：localStorage 有则读取，否则用种子数据并首写 */
function loadInitial(): Course[] {
  const saved = readJSON<Course[]>(STORAGE_KEY, [])
  if (saved.length > 0) return saved
  const seeded = assignColors(seedCourses)
  writeJSON(STORAGE_KEY, seeded)
  return seeded
}

function assignColors(courses: Course[]): Course[] {
  return courses.map((course, index) => ({
    ...course,
    color: course.color || COURSE_COLORS[index % COURSE_COLORS.length]!,
  }))
}

type CoursesStore = ReturnType<typeof createStore>

/** 同步状态 storage key（P4） */
const SYNC_STORAGE_KEY = 'course-sync'

interface SyncStateShape {
  lastSyncTime?: string
  syncedCourseIds: string[]
}

function loadSyncState(): SyncStateShape {
  return readJSON<SyncStateShape>(SYNC_STORAGE_KEY, { syncedCourseIds: [] })
}

/** 创建 store 实例（内部使用，外部经 useCourses() 取单例） */
function createStore() {
  const _courses = ref<Course[]>(loadInitial())
  const _sync = ref<SyncStateShape>(loadSyncState())

  /** 全部课程（只读视图，外部不可直接改） */
  const courses = readonly(_courses)

  /** 同步状态（P4：lastSyncTime 为最近一次同步时间，syncedCourseIds 记录来源同步的课程） */
  const syncState = readonly(_sync)

  /** 按天分组，键 1..7 */
  const coursesByDay = computed(() => {
    const map = new Map<DayOfWeek, Course[]>()
    for (let day = 1 as DayOfWeek; day <= 7; day++) map.set(day, [])
    for (const course of _courses.value) {
      map.get(course.dayOfWeek)?.push(course)
    }
    return map
  })

  /** 取某天课程，按起始节次升序 */
  function getCoursesByDay(day: DayOfWeek): Course[] {
    return (coursesByDay.value.get(day) ?? []).slice().sort((a, b) => a.startPeriod - b.startPeriod)
  }

  /** 新增课程；自动生成 id + 分配色卡 + 持久化。返回新课程 id */
  function addCourse(draft: Omit<Course, 'id' | 'color'> & { color?: string }): string {
    const course: Course = {
      ...draft,
      id: makeId(),
      color: draft.color || pickColor(_courses.value.length),
    }
    _courses.value = [..._courses.value, course]
    persist()
    return course.id
  }

  /**
   * 批量导入课程（P4 手动导入 / 未来教务同步落库）。
   * 已存在同名同学期的课程视为重复跳过；其余生成 id + 分配色卡新增。
   * @returns 导入成功的条数
   */
  function importCourses(raw: Omit<Course, 'id' | 'color'>[]): number {
    let added = 0
    const drafts = raw.map((c) => ({
      dayOfWeek: c.dayOfWeek,
      startPeriod: c.startPeriod,
      endPeriod: c.endPeriod,
      name: c.name,
    }))
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i]!
      const dup = _courses.value.some(
        (x) =>
          x.dayOfWeek === d.dayOfWeek &&
          x.startPeriod === d.startPeriod &&
          x.name === d.name,
      )
      if (dup) continue
      addCourse(raw[i]!)
      added++
    }
    return added
  }

  /** 按 id 更新课程字段（不可改 id）；持久化 */
  function updateCourse(id: string, patch: Partial<Omit<Course, 'id'>>): void {
    _courses.value = _courses.value.map((c) => (c.id === id ? { ...c, ...patch } : c))
    persist()
  }

  /** 按 id 删除课程；持久化 */
  function removeCourse(id: string): void {
    _courses.value = _courses.value.filter((c) => c.id !== id)
    _sync.value = {
      ..._sync.value,
      syncedCourseIds: _sync.value.syncedCourseIds.filter((s) => s !== id),
    }
    persist()
    writeJSON(SYNC_STORAGE_KEY, _sync.value)
  }

  /** 标记一批课程为「已从教务同步」（P4），记录时间 */
  function markSynced(ids: string[]): void {
    _sync.value = {
      lastSyncTime: new Date().toISOString(),
      syncedCourseIds: [...new Set([..._sync.value.syncedCourseIds, ...ids])],
    }
    writeJSON(SYNC_STORAGE_KEY, _sync.value)
  }

  function persist(): void {
    writeJSON(STORAGE_KEY, _courses.value)
  }

  return {
    courses,
    coursesByDay,
    getCoursesByDay,
    addCourse,
    importCourses,
    updateCourse,
    removeCourse,
    syncState,
    markSynced,
  }
}

let _instance: CoursesStore | null = null

/** 取全局单例 store */
export function useCourses(): CoursesStore {
  if (!_instance) _instance = createStore()
  return _instance
}
