/**
 * useWeek —— 周次信息组合式函数（P2 起基于开学日期自动计算）
 *
 * - currentWeek: 今天相对开学日期算出的当前周次（clamp 到 [1, totalWeeks]）
 * - totalWeeks: 来自设置
 * - weekStartDate: 今天所在自然周的周一
 * - viewedWeek: 用户当前「查看」的周（默认=currentWeek，可用 setViewedWeek 切换）
 * - viewedWeekStart: 所查看周所在周一（供课表表头日期联动）
 *
 * 学期第 1 周 = 开学日期所在自然周（其周一起）。
 */
import { computed, ref } from 'vue'
import { useSettings } from '@/composables/useSettings'

/** 解析 "YYYY-MM-DD" 为本地 Date（避免时区偏移） */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y as number, (m as number) - 1, d as number)
}

export function useWeek() {
  const { settings } = useSettings()

  /** 开学日期 */
  const startDate = computed(() => parseDate(settings.value.startDate))

  /** 总周数（来自设置） */
  const totalWeeks = computed(() => settings.value.totalWeeks)

  /** 今天 0 点 */
  const today = computed(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), n.getDate())
  })

  /** 某日期所在自然周的周一 */
  function mondayOf(d: Date): Date {
    const day = d.getDay() === 0 ? 7 : d.getDay() // 周日=7
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1))
  }

  /** 开学日期所在周的周一 = 第 1 周起点 */
  const firstMonday = computed(() => mondayOf(startDate.value))

  /** 今天所在周的周一（当前实际周） */
  const weekStartDate = computed(() => mondayOf(today.value))

  /** 当前周次（clamp） */
  const currentWeek = computed(() => {
    const diff = Math.floor(
      (weekStartDate.value.getTime() - firstMonday.value.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const week = diff + 1
    if (week < 1) return 1
    if (week > totalWeeks.value) return totalWeeks.value
    return week
  })

  /** 用户查看的周（默认=当前周），clamp 到 [1,totalWeeks] */
  const viewedWeek = ref(currentWeek.value)

  /** 设置查看周；越界 clamp；可传 undefined 重置为当前周 */
  function setViewedWeek(n?: number) {
    if (n === undefined) {
      viewedWeek.value = currentWeek.value
      return
    }
    const clamped = Math.max(1, Math.min(totalWeeks.value, n))
    viewedWeek.value = clamped
  }

  /** 所查看周所在周一 = 第 1 周起点 + (viewedWeek-1) 周 */
  const viewedWeekStart = computed(
    () =>
      new Date(
        firstMonday.value.getTime() +
          (viewedWeek.value - 1) * 7 * 24 * 60 * 60 * 1000,
      ),
  )

  return { currentWeek, totalWeeks, weekStartDate, viewedWeek, setViewedWeek, viewedWeekStart }
}
