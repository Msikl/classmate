/**
 * useSchedule —— 节次表组合式函数
 *
 * 节次表由设置驱动（早/午/晚三段式），usePeriods() 返回响应式 periods。
 * 渲染层通过 usePeriods() 获取，改设置（单节时长/课间/三段节数与首节时间）后续节时间联动更新。
 * 保留 getPeriodTime() 便捷读取（基于默认节次表）。
 */
import { computed } from 'vue'
import { buildDaySchedule, DEFAULT_PERIODS } from '@/types/schedule'
import type { Period } from '@/types/schedule'
import { useSettings } from '@/composables/useSettings'

/**
 * 响应式节次表：由 settings 的三段式配置生成。
 * 各段 count=0 时跳过（该段无课）。
 */
export function usePeriods() {
  const { settings } = useSettings()
  const periods = computed(() =>
    buildDaySchedule({
      classDuration: settings.value.classDurationMinutes,
      breakMinutes: settings.value.breakMinutes,
      sections: [
        { key: 'morning', start: settings.value.morningStart, count: settings.value.morningPeriods },
        { key: 'noon', start: settings.value.noonStart, count: settings.value.noonPeriods },
        { key: 'evening', start: settings.value.eveningStart, count: settings.value.eveningPeriods },
      ],
    }),
  )
  return { periods }
}
