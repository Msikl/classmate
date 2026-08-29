/**
 * useWeek —— 周次信息组合式函数（P2 起基于开学日期自动计算）
 *
 * - currentWeek: 今天相对开学日期算出的当前周次（clamp 到 [1, totalWeeks]）
 * - totalWeeks: 来自设置
 * - weekStartDate: 今天所在自然周的周一（供课表表头日期联动）
 *
 * 学期第 1 周 = 开学日期所在自然周（其周一起）。P0 阶段为写死占位，P2 改为真实计算。
 */
import { computed } from 'vue'
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

  /** 今天所在周的周一（课表表头基准） */
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

  return { currentWeek, totalWeeks, weekStartDate }
}
