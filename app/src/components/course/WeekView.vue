<script setup lang="ts">
import { ref } from 'vue'
import CourseCard from '@/components/course/CourseCard.vue'
import CourseDetailModal from '@/components/course/CourseDetailModal.vue'
import { getCoursesByDay } from '@/composables/useCourses'
import { periods } from '@/composables/useSchedule'
import type { DayOfWeek, Course } from '@/types/course'

/** 选中待展示详情的课程（null 时不弹窗） */
const selected = ref<Course | null>(null)

/** 节次总数（默认 10） */
const periodCount = periods.length

/** 列头：1..7 对应 一..日 */
const WEEK_LABELS: readonly string[] = ['一', '二', '三', '四', '五', '六', '日']
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const satisfies readonly DayOfWeek[]

/**
 * 本周一日期（占位）。
 * 以 2026-09-07（周一）作为第 1 周的周一，推算各天日期。
 * P2 改为读取「设置」中的开学日期。
 */
const WEEK_START_DATE = new Date(2026, 8, 7) // 2026-09-07

/** 取某天（1..7）对应的 月/日 显示文本 */
function formatDayDate(day: DayOfWeek): string {
  const d = new Date(WEEK_START_DATE)
  d.setDate(d.getDate() + (day - 1))
  return `${d.getMonth() + 1}-${d.getDate()}`
}

/** 计算课程卡在列 body 内的 top/height 百分比（按节次均分） */
function computePos(course: Course): { top: string; height: string } {
  const startIndex = course.startPeriod - 1
  const span = course.endPeriod - course.startPeriod + 1
  const top = (startIndex / periodCount) * 100
  const height = (span / periodCount) * 100
  return { top: `${top.toFixed(3)}%`, height: `${Math.min(height, 100).toFixed(3)}%` }
}
</script>

<template>
  <!-- 课表滚动容器：刻度与课程一体，表头吸顶 -->
  <div class="week-view">
    <!-- sticky 表头行 -->
    <div class="week-view__head-row">
      <div class="week-view__corner" />
      <div v-for="day in DAYS" :key="day" class="week-view__head">
        <span class="week-view__head-day">{{ WEEK_LABELS[day - 1] }}</span>
        <span class="week-view__head-date">{{ formatDayDate(day) }}</span>
      </div>
    </div>

    <!-- 主体行：左侧节次刻度 + 右侧 7 天课程 -->
    <div class="week-view__body-row">
      <div class="week-view__axis">
        <div v-for="p in periods" :key="p.index" class="week-view__period">
          <span class="week-view__period-index">{{ p.index }}</span>
          <span class="week-view__period-start">{{ p.startTime }}</span>
          <span class="week-view__period-end">{{ p.endTime }}</span>
        </div>
      </div>

      <div v-for="day in DAYS" :key="day" class="week-view__col">
        <div
          v-for="course in getCoursesByDay(day)"
          :key="course.id"
          class="week-view__slot"
          :style="computePos(course)"
        >
          <CourseCard :course="course" @select="selected = course" />
        </div>
      </div>
    </div>

    <CourseDetailModal v-if="selected" :course="selected" @close="selected = null" />
  </div>
</template>

<style scoped>
.week-view {
  --period-h: 56px; /* 单个节次行高 */
  --period-count: 10;
  --axis-w: 44px;
  overflow-y: auto;
  border: 1px solid #e5e6eb;
  background-color: #eef0f3;
  max-height: calc(100vh - 76px);
  -webkit-overflow-scrolling: touch;
}

/* sticky 表头行 */
.week-view__head-row {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: var(--axis-w) repeat(7, 1fr);
  background-color: #fafbfc;
  border-bottom: 1px solid #e5e6eb;
}
.week-view__head {
  padding: 8px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1px solid #e5e6eb;
}
.week-view__head-day {
  font-size: 13px;
  font-weight: 600;
  color: #4e5969;
  line-height: 1.2;
}
.week-view__head-date {
  font-size: 11px;
  color: #86909c;
  line-height: 1.2;
}

/* 主体行：刻度与 7 天一体，等高 */
.week-view__body-row {
  display: grid;
  grid-template-columns: var(--axis-w) repeat(7, 1fr);
  align-items: stretch;
}

/* 左侧节次刻度 */
.week-view__axis {
  display: grid;
  grid-auto-rows: var(--period-h);
  grid-template-rows: repeat(var(--period-count), var(--period-h));
  background-color: #fafbfc;
}
.week-view__period {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-bottom: 1px solid #e5e6eb;
  box-sizing: border-box;
}
.week-view__period-index {
  font-size: 12px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1.1;
}
.week-view__period-start,
.week-view__period-end {
  font-size: 10px;
  color: #86909c;
  line-height: 1.2;
  white-space: nowrap;
}

/* 7 天列：与刻度列等高；纵向竖线分隔星期列（与表头周几列对齐） */
.week-view__col {
  position: relative;
  min-width: 0;
  min-height: calc(var(--period-count) * var(--period-h));
  box-sizing: border-box;
  border-left: 1px solid #e5e6eb;
}
.week-view__slot {
  position: absolute;
  left: 5px;
  right: 5px;
  box-sizing: border-box;
}
</style>
