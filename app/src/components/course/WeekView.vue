<script setup lang="ts">
import { computed, ref } from 'vue'
import CourseCard from '@/components/course/CourseCard.vue'
import CourseDetailModal from '@/components/course/CourseDetailModal.vue'
import CourseForm from '@/components/course/CourseForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useCourses } from '@/composables/useCourses'
import { useWeek } from '@/composables/useWeek'
import { usePeriods } from '@/composables/useSchedule'
import type { DayOfWeek, Course } from '@/types/course'

/** 课程 store 单例（响应式） */
const { getCoursesByDay, updateCourse, removeCourse } = useCourses()

/** 响应式节次表（随设置-单节时长联动） */
const { periods } = usePeriods()

/** 选中待展示详情的课程（null 时不弹窗） */
const selected = ref<Course | null>(null)

/** 编辑中的课程（非空时弹编辑表单） */
const editing = ref<Course | null>(null)

/** 待删除确认的课程（非空时弹确认框） */
const deletePending = ref<Course | null>(null)

/** 点击详情「编辑」：打开编辑表单（保留详情窗） */
function onEdit(course: Course) {
  editing.value = course
}

/** 编辑提交：合并更新后关闭表单 */
function onSubmitEdit(draft: {
  name: string
  teacher?: string
  classroom?: string
  dayOfWeek: DayOfWeek
  startPeriod: number
  endPeriod: number
}) {
  if (editing.value) {
    updateCourse(editing.value.id, draft)
    editing.value = null
  }
}

/** 点击详情「删除」：打开确认框（而非 window.confirm，兼容手机 App） */
function onDelete(course: Course) {
  deletePending.value = course
}

/** 确认删除 */
function onDeleteConfirm() {
  if (deletePending.value) {
    removeCourse(deletePending.value.id)
    selected.value = null
  }
  deletePending.value = null
}

/** 节次总数（随设置变化） */
const periodCount = computed(() => periods.value.length)

/** 列头：1..7 对应 一..日 */
const WEEK_LABELS: readonly string[] = ['一', '二', '三', '四', '五', '六', '日']
const DAYS = [1, 2, 3, 4, 5, 6, 7] as const satisfies readonly DayOfWeek[]

/** 当前周信息（P2：based on 开学日期自动计算） */
const { weekStartDate } = useWeek()

/** 取某天（1..7，1=周一）对应的 月/日 显示文本 */
function formatDayDate(day: DayOfWeek): string {
  const d = new Date(weekStartDate.value)
  d.setDate(d.getDate() + (day - 1))
  return `${d.getMonth() + 1}-${d.getDate()}`
}

/** 计算课程卡在列 body 内的 top/height 百分比（按节次均分） */
function computePos(course: Course): { top: string; height: string } {
  const startIndex = course.startPeriod - 1
  const span = course.endPeriod - course.startPeriod + 1
  const total = periodCount.value
  const top = (startIndex / total) * 100
  const height = (span / total) * 100
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

    <CourseDetailModal
      v-if="selected"
      :course="selected"
      @close="selected = null"
      @edit="onEdit"
      @delete="onDelete"
    />

    <CourseForm
      v-if="editing"
      :initial="editing"
      @submit="onSubmitEdit"
      @close="editing = null"
    />

    <ConfirmDialog
      v-if="deletePending"
      title="删除课程"
      :desc="`确定删除课程「${deletePending.name}」？此操作不可撤销。`"
      confirm-text="删除"
      :confirm-danger="true"
      @confirm="onDeleteConfirm"
      @cancel="deletePending = null"
    />
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
