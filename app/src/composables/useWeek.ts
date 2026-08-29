/**
 * useWeek —— 周次信息组合式函数（P2 起基于开学日期自动计算）
 *
 * **模块级单例**（与 useCourses/useSettings 一致）：首次调用创建 state，之后共享，
 * 保证顶部选择器（WeekPickerMenu）与课表（WeekView）读到同一份 viewedWeek /
 * today，避免切周脱节（F01）与「今天」不一致（F16）。
 *
 * - currentWeek: 今天相对开学日期算出的当前周次（clamp）
 * - totalWeeks: 来自设置
 * - weekStartDate: 今天所在自然周的周一
 * - viewedWeek: 用户「查看」的周（默认=currentWeek，可 setViewedWeek 切换）
 * - viewedWeekStart: 所查看周所在周一（供表头日期联动）
 *
 * 学期第 1 周 = 开学日期所在自然周（其周一起）。
 */
import { computed, ref, watch } from 'vue'
import { useSettings } from '@/composables/useSettings'

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y as number, (m as number) - 1, d as number)
}

/** 某日期所在自然周的周一 */
function mondayOf(d: Date): Date {
  const day = d.getDay() === 0 ? 7 : d.getDay() // 周日=7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1))
}

let singleton: ReturnType<typeof createWeekState> | null = null

/** 创建并缓存单例 state（依赖变化的 setting 仍响应） */
function createWeekState() {
  const { settings } = useSettings()

  const startDate = computed(() => parseDate(settings.value.startDate))
  const totalWeeks = computed(() => settings.value.totalWeeks)

  /** 今天 0 点（启动时算一次，单例共享保证各组件一致） */
  const now = new Date()
  const today = ref(new Date(now.getFullYear(), now.getMonth(), now.getDate()))

  const firstMonday = computed(() => mondayOf(startDate.value))
  const weekStartDate = computed(() => mondayOf(today.value))

  const currentWeek = computed(() => {
    const diff = Math.floor(
      (weekStartDate.value.getTime() - firstMonday.value.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const week = diff + 1
    if (week < 1) return 1
    if (week > totalWeeks.value) return totalWeeks.value
    return week
  })

  /** 用户查看的周（默认=当前周）。初始跟随 currentWeek。 */
  const viewedWeek = ref(currentWeek.value)

  // 设置变化（开学/总周数）时，保持当前查看周在有效区间内
  watch(
    totalWeeks,
    (n) => {
      if (viewedWeek.value > n) viewedWeek.value = n
    },
    { immediate: false },
  )

  function setViewedWeek(n?: number) {
    if (n === undefined) {
      viewedWeek.value = currentWeek.value
      return
    }
    const clamped = Math.max(1, Math.min(totalWeeks.value, n))
    viewedWeek.value = clamped
  }

  const viewedWeekStart = computed(
    () =>
      new Date(firstMonday.value.getTime() + (viewedWeek.value - 1) * 7 * 24 * 60 * 60 * 1000),
  )

  return { currentWeek, totalWeeks, weekStartDate, viewedWeek, setViewedWeek, viewedWeekStart }
}

export function useWeek() {
  if (!singleton) singleton = createWeekState()
  return singleton
}
